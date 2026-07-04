import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { FriendWithProfile, Friendship, IncomingRequest, UserProfile } from '../types';

function pairId(a: string, b: string): string {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const q = query(collection(db, 'users'), where('email', '==', email.trim()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as UserProfile;
}

export async function sendFriendRequest(myUid: string, otherUid: string) {
  if (myUid === otherUid) throw new Error("You can't friend yourself.");
  const id = pairId(myUid, otherUid);
  const ref = doc(db, 'friendships', id);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    throw new Error('A friend request already exists with this person.');
  }
  await setDoc(ref, {
    users: [myUid, otherUid].sort(),
    requestedBy: myUid,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function respondToFriendRequest(
  friendshipId: string,
  accept: boolean
) {
  const ref = doc(db, 'friendships', friendshipId);
  await updateDoc(ref, {
    status: accept ? 'accepted' : 'declined',
    updatedAt: serverTimestamp(),
  });
}

export async function unfriend(friendshipId: string) {
  await deleteDoc(doc(db, 'friendships', friendshipId));
}

/** Subscribes to accepted friendships for a user, resolving each friend's profile + last known location. */
export function subscribeToFriends(
  myUid: string,
  onChange: (friends: FriendWithProfile[]) => void
): () => void {
  const q = query(
    collection(db, 'friendships'),
    where('users', 'array-contains', myUid),
    where('status', '==', 'accepted')
  );

  const profileUnsubs = new Map<string, () => void>();
  const locationUnsubs = new Map<string, () => void>();
  const profiles = new Map<string, UserProfile>();
  const locations = new Map<string, FriendWithProfile['location']>();
  const friendshipByUid = new Map<string, string>();

  function emit() {
    const result: FriendWithProfile[] = [];
    for (const [friendUid, friendshipId] of friendshipByUid.entries()) {
      const profile = profiles.get(friendUid);
      if (!profile) continue;
      result.push({
        friendshipId,
        profile,
        location: locations.get(friendUid) ?? null,
      });
    }
    onChange(result);
  }

  const unsubFriendships = onSnapshot(q, (snap) => {
    const activeFriendUids = new Set<string>();

    snap.forEach((d) => {
      const data = d.data() as Friendship;
      const friendUid = data.users.find((u) => u !== myUid);
      if (!friendUid) return;
      activeFriendUids.add(friendUid);
      friendshipByUid.set(friendUid, d.id);

      if (!profileUnsubs.has(friendUid)) {
        const unsub = onSnapshot(doc(db, 'users', friendUid), (userSnap) => {
          if (userSnap.exists()) {
            profiles.set(friendUid, userSnap.data() as UserProfile);
            emit();
          }
        });
        profileUnsubs.set(friendUid, unsub);
      }

      if (!locationUnsubs.has(friendUid)) {
        const unsub = onSnapshot(doc(db, 'locations', friendUid), (locSnap) => {
          locations.set(friendUid, locSnap.exists() ? (locSnap.data() as FriendWithProfile['location']) : null);
          emit();
        });
        locationUnsubs.set(friendUid, unsub);
      }
    });

    // Clean up friends who are no longer in the accepted list (unfriended).
    for (const uid of Array.from(friendshipByUid.keys())) {
      if (!activeFriendUids.has(uid)) {
        friendshipByUid.delete(uid);
        profiles.delete(uid);
        locations.delete(uid);
        profileUnsubs.get(uid)?.();
        profileUnsubs.delete(uid);
        locationUnsubs.get(uid)?.();
        locationUnsubs.delete(uid);
      }
    }

    emit();
  });

  return () => {
    unsubFriendships();
    profileUnsubs.forEach((unsub) => unsub());
    locationUnsubs.forEach((unsub) => unsub());
  };
}

/** Subscribes to pending friend requests sent *to* this user. */
export function subscribeToIncomingRequests(
  myUid: string,
  onChange: (requests: IncomingRequest[]) => void
): () => void {
  const q = query(
    collection(db, 'friendships'),
    where('users', 'array-contains', myUid),
    where('status', '==', 'pending')
  );

  return onSnapshot(q, async (snap) => {
    const requests: IncomingRequest[] = [];
    for (const d of snap.docs) {
      const data = d.data() as Friendship;
      if (data.requestedBy === myUid) continue; // outgoing, not incoming
      const fromUid = data.users.find((u) => u !== myUid);
      if (!fromUid) continue;
      const fromSnap = await getDoc(doc(db, 'users', fromUid));
      if (!fromSnap.exists()) continue;
      requests.push({
        friendshipId: d.id,
        fromProfile: fromSnap.data() as UserProfile,
        createdAt: (data.createdAt as unknown as { toMillis?: () => number })?.toMillis?.() ?? Date.now(),
      });
    }
    onChange(requests);
  });
}

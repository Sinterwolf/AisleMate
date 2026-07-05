import { supabase } from '../supabase/config';
import type { FriendLocation, FriendWithProfile, IncomingRequest, StoreInfo, UserProfile } from '../types';

interface ProfileRow {
  id: string;
  display_name: string;
  email: string;
  phone_number: string;
  created_at: string;
}

interface LocationRow {
  user_id: string;
  lat: number;
  lng: number;
  store: StoreInfo | null;
  sharing: boolean;
  updated_at: string;
}

interface FriendshipRow {
  user_a: string;
  user_b: string;
  requested_by: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

function pairKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function friendshipId(row: Pick<FriendshipRow, 'user_a' | 'user_b'>): string {
  return `${row.user_a}_${row.user_b}`;
}

function toProfile(row: ProfileRow): UserProfile {
  return {
    uid: row.id,
    displayName: row.display_name,
    email: row.email,
    phoneNumber: row.phone_number,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function toLocation(row: LocationRow): FriendLocation {
  return {
    uid: row.user_id,
    lat: row.lat,
    lng: row.lng,
    store: row.store,
    sharing: row.sharing,
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email.trim())
    .maybeSingle();
  if (error) throw error;
  return data ? toProfile(data as ProfileRow) : null;
}

export async function sendFriendRequest(myUid: string, otherUid: string) {
  if (myUid === otherUid) throw new Error("You can't friend yourself.");
  const [userA, userB] = pairKey(myUid, otherUid);

  const { data: existing, error: existingError } = await supabase
    .from('friendships')
    .select('user_a')
    .eq('user_a', userA)
    .eq('user_b', userB)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) throw new Error('A friend request already exists with this person.');

  const { error } = await supabase.from('friendships').insert({
    user_a: userA,
    user_b: userB,
    requested_by: myUid,
    status: 'pending',
  });
  if (error) throw error;
}

export async function respondToFriendRequest(friendshipId: string, accept: boolean) {
  const [userA, userB] = friendshipId.split('_');
  const { error } = await supabase
    .from('friendships')
    .update({ status: accept ? 'accepted' : 'declined', updated_at: new Date().toISOString() })
    .eq('user_a', userA)
    .eq('user_b', userB);
  if (error) throw error;
}

export async function unfriend(friendshipId: string) {
  const [userA, userB] = friendshipId.split('_');
  const { error } = await supabase.from('friendships').delete().eq('user_a', userA).eq('user_b', userB);
  if (error) throw error;
}

/** Subscribes to accepted friendships for a user, resolving each friend's profile + last known location. */
export function subscribeToFriends(
  myUid: string,
  onChange: (friends: FriendWithProfile[]) => void
): () => void {
  let cancelled = false;

  async function refresh() {
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('*')
      .eq('status', 'accepted')
      .or(`user_a.eq.${myUid},user_b.eq.${myUid}`);
    if (error || cancelled) return;

    const rows = (friendships ?? []) as FriendshipRow[];
    const friendUids = rows.map((row) => (row.user_a === myUid ? row.user_b : row.user_a));
    if (friendUids.length === 0) {
      onChange([]);
      return;
    }

    const [{ data: profiles }, { data: locations }] = await Promise.all([
      supabase.from('profiles').select('*').in('id', friendUids),
      supabase.from('locations').select('*').in('user_id', friendUids),
    ]);
    if (cancelled) return;

    const profileByUid = new Map((profiles as ProfileRow[] | null ?? []).map((p) => [p.id, toProfile(p)]));
    const locationByUid = new Map(
      (locations as LocationRow[] | null ?? []).map((l) => [l.user_id, toLocation(l)])
    );

    const result: FriendWithProfile[] = rows
      .map((row) => {
        const friendUid = row.user_a === myUid ? row.user_b : row.user_a;
        const profile = profileByUid.get(friendUid);
        if (!profile) return null;
        return {
          friendshipId: friendshipId(row),
          profile,
          location: locationByUid.get(friendUid) ?? null,
        };
      })
      .filter((f): f is FriendWithProfile => f !== null);

    onChange(result);
  }

  refresh();

  const channel = supabase
    .channel(`friends-of-${myUid}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, refresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, refresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, refresh)
    .subscribe();

  return () => {
    cancelled = true;
    supabase.removeChannel(channel);
  };
}

/** Subscribes to pending friend requests sent *to* this user. */
export function subscribeToIncomingRequests(
  myUid: string,
  onChange: (requests: IncomingRequest[]) => void
): () => void {
  let cancelled = false;

  async function refresh() {
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('*')
      .eq('status', 'pending')
      .or(`user_a.eq.${myUid},user_b.eq.${myUid}`);
    if (error || cancelled) return;

    const rows = (friendships as FriendshipRow[] | null ?? []).filter((row) => row.requested_by !== myUid);
    if (rows.length === 0) {
      onChange([]);
      return;
    }

    const fromUids = rows.map((row) => row.requested_by);
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', fromUids);
    if (cancelled) return;

    const profileByUid = new Map((profiles as ProfileRow[] | null ?? []).map((p) => [p.id, toProfile(p)]));

    const requests: IncomingRequest[] = rows
      .map((row) => {
        const fromProfile = profileByUid.get(row.requested_by);
        if (!fromProfile) return null;
        return {
          friendshipId: friendshipId(row),
          fromProfile,
          createdAt: new Date(row.created_at).getTime(),
        };
      })
      .filter((r): r is IncomingRequest => r !== null);

    onChange(requests);
  }

  refresh();

  const channel = supabase
    .channel(`incoming-requests-for-${myUid}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, refresh)
    .subscribe();

  return () => {
    cancelled = true;
    supabase.removeChannel(channel);
  };
}

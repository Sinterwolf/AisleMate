export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  createdAt: number;
}

export interface StoreInfo {
  name: string;
  address: string;
  placeId: string | null;
}

export interface FriendLocation {
  uid: string;
  lat: number;
  lng: number;
  store: StoreInfo | null;
  updatedAt: number;
  sharing: boolean;
}

export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

export interface Friendship {
  id: string;
  users: [string, string];
  requestedBy: string;
  status: FriendshipStatus;
  createdAt: number;
  updatedAt: number;
}

export interface FriendWithProfile {
  friendshipId: string;
  profile: UserProfile;
  location: FriendLocation | null;
}

export interface IncomingRequest {
  friendshipId: string;
  fromProfile: UserProfile;
  createdAt: number;
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToFriends, subscribeToIncomingRequests } from '../services/friends';
import type { FriendWithProfile, IncomingRequest } from '../types';

interface FriendsContextValue {
  friends: FriendWithProfile[];
  incomingRequests: IncomingRequest[];
}

const FriendsContext = createContext<FriendsContextValue>({
  friends: [],
  incomingRequests: [],
});

export function FriendsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);

  useEffect(() => {
    if (!user) {
      setFriends([]);
      setIncomingRequests([]);
      return;
    }
    const unsubFriends = subscribeToFriends(user.uid, setFriends);
    const unsubRequests = subscribeToIncomingRequests(user.uid, setIncomingRequests);
    return () => {
      unsubFriends();
      unsubRequests();
    };
  }, [user]);

  return (
    <FriendsContext.Provider value={{ friends, incomingRequests }}>
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriends() {
  return useContext(FriendsContext);
}

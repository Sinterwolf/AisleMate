import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { LocationSubscription } from 'expo-location';
import { useAuth } from './AuthContext';
import { requestLocationPermission, stopSharingLocation, watchAndPublishLocation } from '../services/location';

interface LocationContextValue {
  sharing: boolean;
  error: string | null;
  startSharing: () => Promise<void>;
  stopSharing: () => Promise<void>;
}

const LocationContext = createContext<LocationContextValue>({
  sharing: false,
  error: null,
  startSharing: async () => {},
  stopSharing: async () => {},
});

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<LocationSubscription | null>(null);

  const stopSharing = useCallback(async () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setSharing(false);
    if (user) {
      await stopSharingLocation(user.uid);
    }
  }, [user]);

  const startSharing = useCallback(async () => {
    if (!user) return;
    setError(null);

    const granted = await requestLocationPermission();
    if (!granted) {
      setError('Location permission was denied. Enable it in Settings to share your location.');
      return;
    }

    subscriptionRef.current = await watchAndPublishLocation(user.uid, setError);
    setSharing(true);
  }, [user]);

  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      setSharing(false);
    }
  }, [user]);

  return (
    <LocationContext.Provider value={{ sharing, error, startSharing, stopSharing }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationSharing() {
  return useContext(LocationContext);
}

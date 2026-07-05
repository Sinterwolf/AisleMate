import * as Location from 'expo-location';
import { supabase } from '../supabase/config';
import { resolveStoreAtLocation } from './places';
import type { StoreInfo } from '../types';

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

async function fallbackAddress(lat: number, lng: number): Promise<StoreInfo | null> {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (!place) return null;
    const parts = [place.street, place.city].filter(Boolean);
    if (parts.length === 0) return null;
    return { name: parts.join(', '), address: parts.join(', '), placeId: null };
  } catch {
    return null;
  }
}

export async function publishMyLocation(uid: string, lat: number, lng: number) {
  const store = (await resolveStoreAtLocation(lat, lng)) ?? (await fallbackAddress(lat, lng));

  const { error } = await supabase.from('locations').upsert({
    user_id: uid,
    lat,
    lng,
    store,
    sharing: true,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function stopSharingLocation(uid: string) {
  const { error } = await supabase.from('locations').delete().eq('user_id', uid);
  if (error) throw error;
}

/** Starts watching the device's position, publishing an update on every significant move. */
export function watchAndPublishLocation(
  uid: string,
  onError: (message: string) => void
): Promise<Location.LocationSubscription> {
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 60000,
      distanceInterval: 75,
    },
    (position) => {
      publishMyLocation(uid, position.coords.latitude, position.coords.longitude).catch((err) =>
        onError(err instanceof Error ? err.message : 'Failed to update location')
      );
    }
  );
}

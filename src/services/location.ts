import * as Location from 'expo-location';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
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

  await setDoc(doc(db, 'locations', uid), {
    uid,
    lat,
    lng,
    store,
    sharing: true,
    updatedAt: serverTimestamp(),
  });
}

export async function stopSharingLocation(uid: string) {
  await deleteDoc(doc(db, 'locations', uid));
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

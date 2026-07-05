import { googlePlacesApiKey } from '../config/env';
import type { StoreInfo } from '../types';

const NEARBY_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

// Tried in order; the first type that returns a nearby result wins.
const STORE_TYPES = ['supermarket', 'grocery_or_supermarket', 'convenience_store', 'department_store', 'store'];

// Only trust a Places match if it's genuinely close to the reported coordinate,
// otherwise we'd label someone "at Costco" when they're just driving past it.
const MAX_MATCH_METERS = 150;

interface NearbySearchResult {
  status: string;
  results: Array<{
    place_id: string;
    name: string;
    vicinity?: string;
    geometry: { location: { lat: number; lng: number } };
  }>;
}

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function searchByType(lat: number, lng: number, type: string): Promise<StoreInfo | null> {
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    rankby: 'distance',
    type,
    key: googlePlacesApiKey,
  });

  const response = await fetch(`${NEARBY_SEARCH_URL}?${params.toString()}`);
  const data: NearbySearchResult = await response.json();

  if (data.status !== 'OK' || data.results.length === 0) return null;

  const nearest = data.results[0];
  const distance = haversineMeters({ lat, lng }, nearest.geometry.location);
  if (distance > MAX_MATCH_METERS) return null;

  return {
    name: nearest.name,
    address: nearest.vicinity ?? '',
    placeId: nearest.place_id,
  };
}

/** Resolves GPS coordinates to the nearest grocery/store, or null if nothing is close enough. */
export async function resolveStoreAtLocation(lat: number, lng: number): Promise<StoreInfo | null> {
  if (!googlePlacesApiKey) return null;

  for (const type of STORE_TYPES) {
    try {
      const match = await searchByType(lat, lng, type);
      if (match) return match;
    } catch {
      // Try the next type; a single failed lookup shouldn't block the others.
    }
  }
  return null;
}

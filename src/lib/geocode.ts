// src/lib/geocode.ts
export type LatLng = { lat: number; lng: number };

const NOMINATIM = 'https://nominatim.openstreetmap.org';

// Put an identifiable user agent (Nominatim policy)
const UA = 'ViajarApp/1.0 (contact: youremail@example.com)';

export async function geocodeAddress(q: string): Promise<LatLng | null> {
  if (!q.trim()) return null;
  const url = new URL(`${NOMINATIM}/search`);
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!data.length) return null;

  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

export async function reverseGeocode({ lat, lng }: LatLng): Promise<string | null> {
  const url = new URL(`${NOMINATIM}/reverse`);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { display_name?: string };
  return data.display_name ?? null;
}
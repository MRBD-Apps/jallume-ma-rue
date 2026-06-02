import type { LatLng } from '../api/types';

export function parseGeoJsonLimites(raw: string | undefined): LatLng[][] {
  if (!raw) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let geo: any;
  try {
    geo = JSON.parse(raw);
  } catch {
    return [];
  }
  const type = geo.type ?? geo.TYPE;
  const coords = geo.coordinates ?? geo.Coordinates;
  if (!coords) return [];

  const ring = (r: number[][]): LatLng[] => r.map(([lng, lat]) => ({ lat, lng }));

  if (type === 'Polygon') return [ring(coords[0])];
  if (type === 'MultiPolygon') return coords.map((poly: number[][][]) => ring(poly[0]));
  return [];
}

import type { LatLng } from '../api/types';

export function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  let inside = false;
  const x = point.lng;
  const y = point.lat;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isInCityLimits(point: LatLng, limits: LatLng[][]): boolean {
  return limits.some((poly) => pointInPolygon(point, poly));
}

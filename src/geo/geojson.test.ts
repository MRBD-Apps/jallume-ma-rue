import { describe, it, expect } from 'vitest';
import { parseGeoJsonLimites } from './geojson';

describe('parseGeoJsonLimites', () => {
  it('parse un Polygon ([lng,lat] → {lat,lng})', () => {
    const raw = JSON.stringify({ type: 'Polygon', coordinates: [[[1, 49], [2, 49], [2, 50]]] });
    const out = parseGeoJsonLimites(raw);
    expect(out).toHaveLength(1);
    expect(out[0][0]).toEqual({ lat: 49, lng: 1 });
  });

  it('parse un MultiPolygon', () => {
    const raw = JSON.stringify({
      type: 'MultiPolygon',
      coordinates: [[[[1, 49], [2, 49], [2, 50]]], [[[3, 48], [4, 48], [4, 49]]]],
    });
    const out = parseGeoJsonLimites(raw);
    expect(out).toHaveLength(2);
    expect(out[1][0]).toEqual({ lat: 48, lng: 3 });
  });

  it('retourne [] sur entrée invalide', () => {
    expect(parseGeoJsonLimites('pas du json')).toEqual([]);
  });
});

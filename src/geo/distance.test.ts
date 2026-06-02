import { describe, it, expect } from 'vitest';
import { distanceKm } from './distance';

describe('distanceKm', () => {
  it('retourne 0 pour deux points identiques', () => {
    const p = { lat: 49.305, lng: 1.157 };
    expect(distanceKm(p, p)).toBeCloseTo(0, 5);
  });

  it('calcule ~1.11 km pour 0.01° de latitude', () => {
    const a = { lat: 49.0, lng: 1.0 };
    const b = { lat: 49.01, lng: 1.0 };
    expect(distanceKm(a, b)).toBeGreaterThan(1.1);
    expect(distanceKm(a, b)).toBeLessThan(1.12);
  });
});

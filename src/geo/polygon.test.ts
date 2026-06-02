import { describe, it, expect } from 'vitest';
import { pointInPolygon, isInCityLimits } from './polygon';

const square = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 2 },
  { lat: 2, lng: 2 },
  { lat: 2, lng: 0 },
];

describe('pointInPolygon', () => {
  it('détecte un point intérieur', () => {
    expect(pointInPolygon({ lat: 1, lng: 1 }, square)).toBe(true);
  });
  it('détecte un point extérieur', () => {
    expect(pointInPolygon({ lat: 3, lng: 3 }, square)).toBe(false);
  });
});

describe('isInCityLimits', () => {
  it('vrai si dans un des polygones', () => {
    expect(isInCityLimits({ lat: 1, lng: 1 }, [square])).toBe(true);
  });
  it('faux si dans aucun', () => {
    expect(isInCityLimits({ lat: 9, lng: 9 }, [square])).toBe(false);
  });
  it('faux si aucune limite', () => {
    expect(isInCityLimits({ lat: 1, lng: 1 }, [])).toBe(false);
  });
});

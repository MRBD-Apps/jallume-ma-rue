import { describe, it, expect } from 'vitest';
import { isZoneActiveNow } from './schedule';

const at = (h: number, m = 0) => new Date(2026, 0, 1, h, m, 0);

describe('isZoneActiveNow', () => {
  it('actif par défaut si pas d\'horaires', () => {
    expect(isZoneActiveNow(undefined, at(3))).toBe(true);
  });

  it('plage normale 06:00-09:00', () => {
    const h = { heureDebut: 6, minuteDebut: 0, heureFin: 9, minuteFin: 0 };
    expect(isZoneActiveNow(h, at(7))).toBe(true);
    expect(isZoneActiveNow(h, at(10))).toBe(false);
  });

  it('plage à cheval sur minuit 22:00-06:00', () => {
    const h = { heureDebut: 22, minuteDebut: 0, heureFin: 6, minuteFin: 0 };
    expect(isZoneActiveNow(h, at(23))).toBe(true);
    expect(isZoneActiveNow(h, at(3))).toBe(true);
    expect(isZoneActiveNow(h, at(12))).toBe(false);
  });

  it('inactif si active === false', () => {
    const h = { active: false, heureDebut: 22, minuteDebut: 0, heureFin: 6, minuteFin: 0 };
    expect(isZoneActiveNow(h, at(23))).toBe(false);
  });
});

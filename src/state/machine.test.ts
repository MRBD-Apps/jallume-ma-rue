import { describe, it, expect } from 'vitest';
import { computeStatus } from './machine';
import type { JallumeConfig } from '../api/types';

const zonePoly = [
  { lat: 0, lng: 0 }, { lat: 0, lng: 2 }, { lat: 2, lng: 2 }, { lat: 2, lng: 0 },
];
const always = { heureDebut: 0, minuteDebut: 0, heureFin: 23, minuteFin: 59 };
const at = (h: number) => new Date(2026, 0, 1, h, 0, 0);

describe('computeStatus', () => {
  it('positionUnknown sans coords', () => {
    expect(computeStatus(null, null, at(12)).kind).toBe('positionUnknown');
  });

  it('cityNotEquipped si pas de ville.id', () => {
    const cfg: JallumeConfig = { ville: {}, zones: [] };
    expect(computeStatus({ lat: 1, lng: 1 }, cfg, at(12)).kind).toBe('cityNotEquipped');
  });

  it('inActiveZone si dans une zone active', () => {
    const cfg: JallumeConfig = {
      ville: { id: 1, nom: 'V' },
      zones: [{ polygone: zonePoly, horaires: always }],
    };
    expect(computeStatus({ lat: 1, lng: 1 }, cfg, at(12)).kind).toBe('inActiveZone');
  });

  it('outOfZone si hors de toute zone', () => {
    const cfg: JallumeConfig = {
      ville: { id: 1, nom: 'V' },
      zones: [{ polygone: zonePoly, horaires: always }],
    };
    expect(computeStatus({ lat: 9, lng: 9 }, cfg, at(12)).kind).toBe('outOfZone');
  });

  it('outOfHours si dans la zone mais hors horaire', () => {
    const cfg: JallumeConfig = {
      ville: { id: 1, nom: 'V' },
      zones: [{ polygone: zonePoly, horaires: { heureDebut: 22, minuteDebut: 0, heureFin: 23, minuteFin: 0 } }],
    };
    expect(computeStatus({ lat: 1, lng: 1 }, cfg, at(12)).kind).toBe('outOfHours');
  });
});

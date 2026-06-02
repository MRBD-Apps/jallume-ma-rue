import type { JallumeConfig, LatLng } from '../api/types';
import { pointInPolygon } from '../geo/polygon';
import { isZoneActiveNow } from '../geo/schedule';

export type StatusKind =
  | 'positionUnknown'
  | 'cityNotEquipped'
  | 'inActiveZone'
  | 'outOfZone'
  | 'outOfHours';

export interface Status {
  kind: StatusKind;
  cityName?: string;
  idVille?: number;
}

export function computeStatus(
  coords: LatLng | null,
  config: JallumeConfig | null,
  now: Date = new Date(),
): Status {
  if (!coords) return { kind: 'positionUnknown' };
  if (!config?.ville?.id) return { kind: 'cityNotEquipped', cityName: config?.ville?.nom };

  const base = { cityName: config.ville.nom, idVille: config.ville.id };
  const zones = config.zones ?? [];

  const inZone = zones.some((z) => pointInPolygon(coords, z.polygone));
  const inActiveZone = zones.some(
    (z) => pointInPolygon(coords, z.polygone) && isZoneActiveNow(z.horaires, now),
  );

  if (inActiveZone) return { kind: 'inActiveZone', ...base };
  if (inZone) return { kind: 'outOfHours', ...base };
  return { kind: 'outOfZone', ...base };
}

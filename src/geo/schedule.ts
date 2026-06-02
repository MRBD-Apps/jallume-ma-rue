import type { Horaires } from '../api/types';

export function isZoneActiveNow(
  horaires: Horaires | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!horaires) return true;
  if (horaires.active === false) return false;

  const cur = now.getHours() * 60 + now.getMinutes();
  const start = horaires.heureDebut * 60 + horaires.minuteDebut;
  const end = horaires.heureFin * 60 + horaires.minuteFin;

  if (end < start) {
    // plage à cheval sur minuit (ex : 22:00 → 06:00)
    return cur >= start || cur <= end;
  }
  return cur >= start && cur <= end;
}

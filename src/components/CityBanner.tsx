import type { Bandeau } from '../api/types';

const TINT: Record<string, string> = {
  Succès: 'bg-emerald-700',
  Alerte: 'bg-amber-700',
  danger: 'bg-red-700',
};

export function CityBanner({ bandeau }: { bandeau?: Bandeau }) {
  if (!bandeau || !bandeau.actif) return null;
  const tint = TINT[bandeau.type] ?? 'bg-sky-700';
  return (
    <div
      className={`mx-4 mt-2 rounded-lg px-3 py-2 text-center text-base font-bold text-white ${tint}`}
      dangerouslySetInnerHTML={{ __html: bandeau.description }}
    />
  );
}

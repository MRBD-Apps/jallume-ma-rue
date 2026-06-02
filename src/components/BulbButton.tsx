import { Focusable, Text } from 'mrbd-ui-kit';

interface Props {
  active: boolean;
  disabled: boolean;
  timeLeft: number;
  onActivate: () => void;
}

function fmt(t: number): string {
  return `${Math.floor(t / 60)}m ${String(t % 60).padStart(2, '0')}s`;
}

/**
 * Grosse ampoule centrale. On enveloppe un <button> natif dans <Focusable> :
 * le moteur de focus du kit la rend navigable au D-pad et, sur Entrée, clique
 * l'enfant (donc un seul déclenchement, partagé avec la souris). Pas de
 * `onSelect` ici pour éviter un double appel.
 */
export function BulbButton({ active, disabled, timeLeft, onActivate }: Props) {
  return (
    <Focusable
      id="bulb"
      disabled={disabled}
      autoFocus={!disabled}
      className="rounded-full"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={disabled ? undefined : onActivate}
        className={[
          'flex h-40 w-40 flex-col items-center justify-center rounded-full transition-all',
          'outline-none focus-visible:outline-none',
          active
            ? 'bg-mrbd-accent/90 text-black shadow-mrbd-glow'
            : 'bg-mrbd-accent/10 text-mrbd-accent',
          disabled ? 'opacity-40' : 'hover:bg-mrbd-accent/20',
        ].join(' ')}
      >
        <span className="text-5xl leading-none">💡</span>
        {active && (
          <Text weight="bold" className="mt-1 block">
            {fmt(timeLeft)}
          </Text>
        )}
      </button>
    </Focusable>
  );
}

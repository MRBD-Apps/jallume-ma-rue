import { Focusable, Text } from 'mrbd-ui-kit';
import { Lightbulb } from 'lucide-react';

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
          'flex h-40 w-40 flex-col items-center justify-center gap-1 rounded-full border transition-all',
          'outline-none focus-visible:outline-none',
          active
            ? 'border-mrbd-accent bg-mrbd-accent/90 text-black shadow-mrbd-glow'
            : 'border-mrbd-accent/40 bg-mrbd-accent/10 text-mrbd-accent',
          disabled ? 'opacity-40' : 'hover:bg-mrbd-accent/20',
        ].join(' ')}
      >
        <Lightbulb
          className={active ? 'size-16 fill-current' : 'size-16'}
          strokeWidth={1.5}
        />
        {active && (
          <Text weight="bold" className="block">
            {fmt(timeLeft)}
          </Text>
        )}
      </button>
    </Focusable>
  );
}

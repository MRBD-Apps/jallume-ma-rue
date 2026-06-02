import { Focusable } from 'mrbd-ui-kit';

interface Props {
  active: boolean;
  disabled: boolean;
  timeLeft: number;
  onActivate: () => void;
}

function fmt(t: number): string {
  return `${Math.floor(t / 60)}m ${String(t % 60).padStart(2, '0')}s`;
}

export function BulbButton({ active, disabled, timeLeft, onActivate }: Props) {
  return (
    <Focusable
      id="bulb"
      disabled={disabled}
      onSelect={disabled ? undefined : onActivate}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={disabled ? undefined : onActivate}
        className="flex h-32 w-32 flex-col items-center justify-center rounded-full text-4xl"
      >
        💡
        {active && <span className="mt-1 text-sm font-bold">{fmt(timeLeft)}</span>}
      </button>
    </Focusable>
  );
}

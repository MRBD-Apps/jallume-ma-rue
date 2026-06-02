import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DisplayRoot } from 'mrbd-ui-kit';
import { BulbButton } from './BulbButton';

// Kit components (Button, Focusable) require a DisplayRoot ancestor for the focus engine.
// We wrap each render call in DisplayRoot to satisfy that requirement without weakening assertions.
function renderWithRoot(ui: React.ReactElement) {
  return render(<DisplayRoot>{ui}</DisplayRoot>);
}

describe('BulbButton', () => {
  it('affiche le temps restant quand allumé', () => {
    renderWithRoot(<BulbButton active disabled={false} timeLeft={75} onActivate={() => {}} />);
    expect(screen.getByText('1m 15s')).toBeInTheDocument();
  });

  it('déclenche onActivate au clic si non désactivé', async () => {
    const onActivate = vi.fn();
    renderWithRoot(<BulbButton active={false} disabled={false} timeLeft={0} onActivate={onActivate} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onActivate).toHaveBeenCalled();
  });

  it('ne déclenche pas onActivate si désactivé', async () => {
    const onActivate = vi.fn();
    renderWithRoot(<BulbButton active={false} disabled timeLeft={0} onActivate={onActivate} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onActivate).not.toHaveBeenCalled();
  });
});

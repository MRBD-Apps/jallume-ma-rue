import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusHeader } from './StatusHeader';

describe('StatusHeader', () => {
  it('affiche le nom de ville et le libellé de statut', () => {
    render(<StatusHeader cityName="Pont-de-l'Arche" statusLabel="Appuyez pour allumer" />);
    expect(screen.getByRole('heading')).toHaveTextContent("Pont-de-l'Arche");
    expect(screen.getByText('Appuyez pour allumer')).toBeInTheDocument();
  });

  it('affiche un titre par défaut sans ville', () => {
    render(<StatusHeader statusLabel="Position non détectée" />);
    expect(screen.getByRole('heading')).toHaveTextContent("J'allume ma rue");
  });
});

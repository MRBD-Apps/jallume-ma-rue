import { Card, Button } from 'mrbd-ui-kit';
import type { StatusKind } from '../state/machine';

interface Props {
  kind: StatusKind;
  onRequestCity?: () => void;
}

const MESSAGE: Record<StatusKind, string> = {
  positionUnknown: 'Autorisez la géolocalisation pour utiliser le service.',
  cityNotEquipped: "Cette ville n'est pas encore équipée.",
  outOfZone: "Rapprochez-vous d'une zone d'éclairage active.",
  outOfHours: "La période d'allumage n'est pas encore active.",
  inActiveZone: "Appuyez sur l'ampoule pour allumer cette rue.",
};

export function ZoneStatusCard({ kind, onRequestCity }: Props) {
  return (
    <Card className="mx-4 mt-3 p-3 text-center text-base text-neutral-200">
      <p>{MESSAGE[kind]}</p>
      {kind === 'cityNotEquipped' && onRequestCity ? (
        <Button id="request-city" className="mt-2" onClick={onRequestCity}>
          Demander l'équipement
        </Button>
      ) : null}
    </Card>
  );
}

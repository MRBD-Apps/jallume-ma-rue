import { Card, Text } from 'mrbd-ui-kit';
import type { StatusKind } from '../state/machine';

interface Props {
  kind: StatusKind;
}

const MESSAGE: Record<StatusKind, string> = {
  positionUnknown: 'Autorisez la géolocalisation pour utiliser le service.',
  cityNotEquipped: "Cette ville n'est pas équipée pour l'éclairage à la demande.",
  outOfZone: "Rapprochez-vous d'une zone d'éclairage active.",
  outOfHours: "La période d'allumage n'est pas encore active.",
  inActiveZone: "Appuyez sur l'ampoule pour allumer cette rue.",
};

export function ZoneStatusCard({ kind }: Props) {
  return (
    <Card className="mx-4 mt-3 text-center">
      <Text className="text-gray-300">{MESSAGE[kind]}</Text>
    </Card>
  );
}

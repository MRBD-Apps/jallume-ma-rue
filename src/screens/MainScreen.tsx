import { useCallback } from 'react';
import { BulbButton } from '../components/BulbButton';
import { CityBanner } from '../components/CityBanner';
import { StatusHeader } from '../components/StatusHeader';
import { ZoneStatusCard } from '../components/ZoneStatusCard';
import type { JallumeConfig } from '../api/types';
import type { Status } from '../state/machine';

const STATUS_LABEL: Record<Status['kind'], string> = {
  positionUnknown: 'Position non détectée',
  cityNotEquipped: 'Ville non équipée',
  outOfZone: 'Hors zone',
  outOfHours: 'Hors horaire',
  inActiveZone: 'Prêt',
};

interface Props {
  status: Status;
  config: JallumeConfig | null;
  lighting: boolean;
  timeLeft: number;
  onLightUp: () => void;
}

export function MainScreen({ status, config, lighting, timeLeft, onLightUp }: Props) {
  const handleActivate = useCallback(() => {
    if (status.kind !== 'inActiveZone') return;
    onLightUp();
  }, [status.kind, onLightUp]);

  return (
    <div className="flex flex-col gap-3 pb-4">
      <StatusHeader
        cityName={status.cityName}
        statusLabel={STATUS_LABEL[status.kind]}
      />

      <CityBanner bandeau={config?.bandeaux?.[0]} />

      <div className="flex justify-center py-4">
        <BulbButton
          active={lighting}
          disabled={status.kind !== 'inActiveZone'}
          timeLeft={timeLeft}
          onActivate={handleActivate}
        />
      </div>

      <ZoneStatusCard kind={status.kind} />
    </div>
  );
}

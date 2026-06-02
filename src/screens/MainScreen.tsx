import { useCallback, useEffect, useRef, useState } from 'react';
import { Text } from 'mrbd-ui-kit';
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

const CONFIRM_DELAY_MS = 4000;

interface Props {
  status: Status;
  config: JallumeConfig | null;
  lighting: boolean;
  timeLeft: number;
  demoMode: boolean;
  onLightUp: () => void;
}

export function MainScreen({
  status,
  config,
  lighting,
  timeLeft,
  demoMode,
  onLightUp,
}: Props) {
  const [confirmPending, setConfirmPending] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Nettoyage du timer au démontage
  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  const handleActivate = useCallback(() => {
    if (status.kind !== 'inActiveZone') return;

    if (!demoMode && !confirmPending) {
      // Premier appui en mode réel : on demande confirmation
      setConfirmPending(true);
      confirmTimer.current = setTimeout(() => {
        setConfirmPending(false);
      }, CONFIRM_DELAY_MS);
      return;
    }

    // Deuxième appui (ou mode démo) : on allume
    if (confirmTimer.current) {
      clearTimeout(confirmTimer.current);
      confirmTimer.current = null;
    }
    setConfirmPending(false);
    onLightUp();
  }, [status.kind, demoMode, confirmPending, onLightUp]);

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

      {confirmPending ? (
        <Text weight="semibold" className="block text-center text-mrbd-accent">
          Appuyez à nouveau pour allumer réellement
        </Text>
      ) : (
        <ZoneStatusCard kind={status.kind} />
      )}
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { BulbButton } from '../components/BulbButton';
import { CityBanner } from '../components/CityBanner';
import { StatusHeader } from '../components/StatusHeader';
import { ZoneStatusCard } from '../components/ZoneStatusCard';
import { placeRequest } from '../api/client';
import type { JallumeConfig, LatLng } from '../api/types';
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
  coords: LatLng | null;
  userId: string;
  lighting: boolean;
  timeLeft: number;
  demoMode: boolean;
  onLightUp: () => void;
}

export function MainScreen({
  status,
  config,
  coords,
  userId,
  lighting,
  timeLeft,
  demoMode,
  onLightUp,
}: Props) {
  const [confirmPending, setConfirmPending] = useState(false);
  const [placeSent, setPlaceSent] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  const handleActivate = useCallback(() => {
    if (status.kind !== 'inActiveZone') return;

    if (!demoMode && !confirmPending) {
      // First press in real mode: request confirmation
      setConfirmPending(true);
      confirmTimer.current = setTimeout(() => {
        setConfirmPending(false);
      }, CONFIRM_DELAY_MS);
      return;
    }

    // Second press (or demo mode): light up
    if (confirmTimer.current) {
      clearTimeout(confirmTimer.current);
      confirmTimer.current = null;
    }
    setConfirmPending(false);
    onLightUp();
  }, [status.kind, demoMode, confirmPending, onLightUp]);

  const handleRequestCity = useCallback(() => {
    if (placeSent || !coords) return;
    placeRequest(userId, coords.lat, coords.lng).catch(() => {});
    setPlaceSent(true);
  }, [placeSent, coords, userId]);

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
        <p className="text-center text-sm font-semibold text-amber-300">
          Appuyez à nouveau pour allumer réellement
        </p>
      ) : (
        <ZoneStatusCard
          kind={status.kind}
          onRequestCity={placeSent ? undefined : handleRequestCity}
        />
      )}
    </div>
  );
}

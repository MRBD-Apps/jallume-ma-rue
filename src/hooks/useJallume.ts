import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JallumeConfig, LatLng } from '../api/types';
import { CONFIG } from '../config';
import { getConfig, authenticate, lightRequest } from '../api/client';
import { computeStatus, type Status } from '../state/machine';

interface Params {
  coords: LatLng | null;
  userId: string;
  demoMode: boolean;
}

interface UseJallume {
  config: JallumeConfig | null;
  status: Status;
  lighting: boolean;
  timeLeft: number;
  error: string | null;
  lightUp: () => Promise<void>;
}

export function useJallume({ coords, userId, demoMode }: Params): UseJallume {
  const [config, setConfig] = useState<JallumeConfig | null>(null);
  const [lighting, setLighting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const lastFetch = useRef<LatLng | null>(null);
  const tokenRef = useRef<{ token: string; expiresAt: Date } | null>(null);
  const lightInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Recharge la config quand la position bouge significativement (> 50 m)
  useEffect(() => {
    if (!coords) return;
    const moved =
      !lastFetch.current ||
      Math.abs(lastFetch.current.lat - coords.lat) > 0.0005 ||
      Math.abs(lastFetch.current.lng - coords.lng) > 0.0005;
    if (!moved) return;
    lastFetch.current = coords;
    getConfig(coords.lat, coords.lng)
      .then(setConfig)
      .catch(() => setConfig({ ville: {} }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords]);

  // Recalcul du statut à chaque changement de position/config
  const status = useMemo(() => computeStatus(coords, config), [coords, config]);

  const ensureToken = useCallback(async () => {
    const now = new Date();
    if (!tokenRef.current || now >= tokenRef.current.expiresAt) {
      tokenRef.current = await authenticate(userId, config!.ville!.id!);
    }
    return tokenRef.current.token;
  }, [userId, config]);

  const sendLight = useCallback(async () => {
    if (!coords) return;
    if (demoMode) return; // mode démo : pas d'appel réel
    const token = await ensureToken();
    await lightRequest(coords.lat, coords.lng, token);
  }, [coords, demoMode, ensureToken]);

  const lightUp = useCallback(async () => {
    if (!coords || lighting) return;
    try {
      await sendLight();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return;
    }

    const total = (config?.tempsMinuterie ?? CONFIG.DEFAULT_TIMER) - CONFIG.TIMER_VISUAL_OFFSET;
    setLighting(true);
    setTimeLeft(total);

    if (!demoMode) {
      lightInterval.current = setInterval(() => {
        sendLight().catch(() => {});
      }, CONFIG.LIGHT_REQUEST_INTERVAL_MS);
    }

    timerInterval.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (lightInterval.current) clearInterval(lightInterval.current);
          if (timerInterval.current) clearInterval(timerInterval.current);
          setLighting(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [coords, lighting, config, demoMode, sendLight]);

  useEffect(() => () => {
    if (lightInterval.current) clearInterval(lightInterval.current);
    if (timerInterval.current) clearInterval(timerInterval.current);
  }, []);

  return { config, status, lighting, timeLeft, error, lightUp };
}

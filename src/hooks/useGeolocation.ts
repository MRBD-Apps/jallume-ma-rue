import { useEffect, useState } from 'react';
import type { LatLng } from '../api/types';

export interface GeolocationState {
  coords: LatLng | null;
  accuracy: number | null;
  error: string | null;
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    accuracy: null,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'unsupported' }));
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracy: pos.coords.accuracy,
          error: null,
        });
      },
      (err) => setState((s) => ({ ...s, error: err.message || 'denied' })),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return state;
}

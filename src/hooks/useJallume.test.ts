import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useJallume } from './useJallume';
import * as client from '../api/client';

const fakeConfig = {
  ville: { id: 1, nom: 'Demo' },
  tempsMinuterie: 60,
  zones: [{ polygone: [
    { lat: 0, lng: 0 }, { lat: 0, lng: 2 }, { lat: 2, lng: 2 }, { lat: 2, lng: 0 },
  ], horaires: { heureDebut: 0, minuteDebut: 0, heureFin: 23, minuteFin: 59 } }],
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(client, 'getConfig').mockResolvedValue(fakeConfig as any);
  vi.spyOn(client, 'authenticate').mockResolvedValue({ token: 't', expiresAt: new Date(Date.now() + 1e6) });
  vi.spyOn(client, 'lightRequest').mockResolvedValue(undefined);
});

describe('useJallume', () => {
  it('charge la config et calcule inActiveZone', async () => {
    const { result } = renderHook(() =>
      useJallume({ coords: { lat: 1, lng: 1 }, userId: 'u1' }),
    );
    await waitFor(() => expect(result.current.status.kind).toBe('inActiveZone'));
    expect(client.getConfig).toHaveBeenCalled();
  });

  it('lightUp appelle authenticate + lightRequest et démarre la minuterie', async () => {
    const { result } = renderHook(() =>
      useJallume({ coords: { lat: 1, lng: 1 }, userId: 'u1' }),
    );
    await waitFor(() => expect(result.current.status.kind).toBe('inActiveZone'));
    await act(async () => { await result.current.lightUp(); });
    expect(client.authenticate).toHaveBeenCalledWith('u1', 1);
    expect(client.lightRequest).toHaveBeenCalled();
    expect(result.current.lighting).toBe(true);
  });

  it('si lightRequest échoue: lighting reste false et error est renseigné', async () => {
    vi.spyOn(client, 'lightRequest').mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() =>
      useJallume({ coords: { lat: 1, lng: 1 }, userId: 'u1' }),
    );
    await waitFor(() => expect(result.current.status.kind).toBe('inActiveZone'));
    await act(async () => { await result.current.lightUp(); });
    expect(result.current.lighting).toBe(false);
    expect(result.current.error).toBeTruthy();
  });
});

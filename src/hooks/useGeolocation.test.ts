import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGeolocation } from './useGeolocation';

beforeEach(() => {
  const watchPosition = vi.fn((success) => {
    success({ coords: { latitude: 49.3, longitude: 1.15, accuracy: 12 } });
    return 1;
  });
  vi.stubGlobal('navigator', { geolocation: { watchPosition, clearWatch: vi.fn() } });
});

describe('useGeolocation', () => {
  it('expose les coordonnées reçues', async () => {
    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(result.current.coords).not.toBeNull());
    expect(result.current.coords).toEqual({ lat: 49.3, lng: 1.15 });
    expect(result.current.accuracy).toBe(12);
    expect(result.current.error).toBeNull();
  });
});

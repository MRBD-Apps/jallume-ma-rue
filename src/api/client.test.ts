import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getConfig, authenticate, lightRequest, placeRequest } from './client';

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

beforeEach(() => { vi.restoreAllMocks(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('getConfig', () => {
  it('appelle /App/Config/{lat}&{lng} et renvoie le JSON', async () => {
    const cfg = { ville: { id: 1, nom: 'Test' } };
    const f = mockFetch(200, cfg);
    vi.stubGlobal('fetch', f);
    const out = await getConfig(49.3, 1.15);
    expect(f).toHaveBeenCalledWith(
      'https://api.jallume.fr/App/Config/49.3&1.15',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(out).toEqual(cfg);
  });
});

describe('authenticate', () => {
  it('POST /Auth/JallumeToken et renvoie token + expiresAt', async () => {
    const f = mockFetch(200, { jwt: { token: 'abc', expiresAt: '2026-01-01T00:00:00Z' } });
    vi.stubGlobal('fetch', f);
    const out = await authenticate('user-1', 42);
    expect(f).toHaveBeenCalledWith(
      'https://auth.jallume.fr/Auth/JallumeToken',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ id: 'user-1', idVille: '42' }),
      }),
    );
    expect(out.token).toBe('abc');
    expect(out.expiresAt).toBeInstanceOf(Date);
  });
});

describe('lightRequest', () => {
  it('POST /App/lightRequest avec lat/lng/token', async () => {
    const f = mockFetch(200, {});
    vi.stubGlobal('fetch', f);
    await lightRequest(49.3, 1.15, 'tok');
    expect(f).toHaveBeenCalledWith(
      'https://api.jallume.fr/App/lightRequest',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ latitude: 49.3, longitude: 1.15, token: 'tok' }),
      }),
    );
  });

  it('lève une erreur taggée 401 sur 401', async () => {
    const f = mockFetch(401, {});
    vi.stubGlobal('fetch', f);
    await expect(lightRequest(1, 2, 't')).rejects.toThrow('401');
  });
});

describe('placeRequest', () => {
  it('POST /App/PlaceRequest', async () => {
    const f = mockFetch(200, {});
    vi.stubGlobal('fetch', f);
    await placeRequest('user-1', 49.3, 1.15);
    expect(f).toHaveBeenCalledWith(
      'https://api.jallume.fr/App/PlaceRequest',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ idUser: 'user-1', latitude: 49.3, longitude: 1.15 }),
      }),
    );
  });
});

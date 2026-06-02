import { CONFIG } from '../config';
import type { JallumeConfig, JwtResponse, AuthResult } from './types';

const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' };

export async function getConfig(lat: number, lng: number): Promise<JallumeConfig> {
  const resp = await fetch(`${CONFIG.API_BASE_URL}/App/Config/${lat}&${lng}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!resp.ok) throw new Error(`Config error (${resp.status})`);
  return resp.json();
}

export async function authenticate(userId: string, idVille: number | string): Promise<AuthResult> {
  const resp = await fetch(`${CONFIG.AUTH_URL}/Auth/JallumeToken`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ id: userId, idVille: String(idVille) }),
  });
  if (!resp.ok) throw new Error(`Auth error (${resp.status})`);
  const data: JwtResponse = await resp.json();
  return { token: data.jwt.token, expiresAt: new Date(data.jwt.expiresAt) };
}

export async function lightRequest(lat: number, lng: number, token: string): Promise<void> {
  const resp = await fetch(`${CONFIG.API_BASE_URL}/App/lightRequest`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ latitude: lat, longitude: lng, token }),
  });
  if (!resp.ok) throw new Error(`lightRequest error (${resp.status})`);
}

# « J'allume ma rue » pour Meta Ray-Ban Display — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire une webapp React (Meta Ray-Ban Display, 600×600, navigation spatiale) qui reproduit le service jallume.fr — allumage de l'éclairage public à la demande par géolocalisation.

**Architecture:** Modules purs et testables (`geo/`, `api/`) + hooks d'orchestration (`useJallume`) + écrans présentationnels (Main / Map / Settings). La carte suit le pattern Herald (Leaflet plein écran, tuiles sombres, contrôles à l'écran pilotés au D-pad). Un mode démo simule l'allumage réel pour tester sans allumer de vrais lampadaires.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind v4, `mrbd-ui-kit`, `react-leaflet`/Leaflet, Vitest + Testing Library. Déploiement device via les skills `meta-wearables-webapp`.

**Références:**
- Spec : `docs/superpowers/specs/2026-06-02-jallume-ray-ban-display-design.md`
- API rétro-conçue : `docs/research/jallume-api-reverse.md`

---

## File Structure

| Fichier | Responsabilité |
|---|---|
| `src/config.ts` | Constantes (URLs API, timers, seuils) |
| `src/api/types.ts` | Types Config, Ville, Zone, Horaires, Bandeau, Jwt |
| `src/api/client.ts` | `getConfig`, `authenticate`, `lightRequest`, `placeRequest` |
| `src/geo/distance.ts` | `distanceKm` (haversine) |
| `src/geo/polygon.ts` | `pointInPolygon`, `isInCityLimits` |
| `src/geo/schedule.ts` | `isZoneActiveNow` (passage minuit) |
| `src/geo/geojson.ts` | `parseGeoJsonLimites` |
| `src/hooks/useUserId.ts` | userId anonyme (localStorage) |
| `src/hooks/useGeolocation.ts` | `watchPosition` → coords/accuracy/error |
| `src/state/machine.ts` | `computeStatus` (état dérivé position+config) |
| `src/hooks/useJallume.ts` | Orchestrateur : config, zone, auth, boucle d'allumage, minuterie |
| `src/components/*` | BulbButton, StatusHeader, CityBanner, ZoneStatusCard, NavBar |
| `src/screens/*` | MainScreen, MapScreen, SettingsScreen |
| `src/fixtures/pont-de-larche.config.json` | Réponse Config réelle (tests + démo) |
| `src/App.tsx` | DisplayRoot + routing d'écrans + providers |

---

## Task 1: Scaffold du projet

**Files:**
- Create: tout le squelette Vite + configs

- [ ] **Step 1: Créer le projet Vite React TS dans le dossier courant**

Run:
```bash
npm create vite@latest . -- --template react-ts
npm install
```
Expected: arborescence `src/`, `index.html`, `package.json` créés ; `npm install` OK.

- [ ] **Step 2: Installer les dépendances**

Run:
```bash
npm install mrbd-ui-kit leaflet react-leaflet
npm install -D tailwindcss @tailwindcss/vite @types/leaflet vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```
Expected: dépendances ajoutées sans erreur.

- [ ] **Step 3: Configurer Tailwind v4 + Vitest dans `vite.config.ts`**

Create/replace `vite.config.ts`:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 4: Créer le setup de test et les styles globaux**

Create `src/test/setup.ts`:
```ts
import '@testing-library/jest-dom';
```

Replace `src/index.css`:
```css
@import 'tailwindcss';
@import 'mrbd-ui-kit/styles.css';

:root { color-scheme: dark; }
html, body, #root { margin: 0; height: 100%; background: #000; }
```

- [ ] **Step 5: Ajouter les scripts de test dans `package.json`**

Add to `package.json` `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Vérifier que le build et les tests tournent**

Run: `npm run build && npm run test`
Expected: build OK ; vitest affiche « No test files found » (normal à ce stade) sans erreur de config.

- [ ] **Step 7: Commit**

```bash
git init && git add -A && git commit -m "chore: scaffold Vite React TS + Tailwind v4 + mrbd-ui-kit + Vitest"
```

---

## Task 2: Constantes (`config.ts`)

**Files:**
- Create: `src/config.ts`

- [ ] **Step 1: Écrire les constantes**

Create `src/config.ts`:
```ts
export const CONFIG = {
  API_BASE_URL: 'https://api.jallume.fr',
  AUTH_URL: 'https://auth.jallume.fr',
  DEFAULT_TIMER: 300, // secondes
  TIMER_VISUAL_OFFSET: 15, // secondes retirées au décompte affiché
  DISTANCE_THRESHOLD_KM: 0.05, // 50 m : seuil de déplacement significatif
  LIGHT_REQUEST_INTERVAL_MS: 5000,
  STORAGE_KEY_USER_ID: 'idUtilisateur',
  STORAGE_KEY_THEME: 'theme',
  STORAGE_KEY_DEMO: 'jallume_demo_mode',
  DARK_TILES: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  LIGHT_TILES: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add src/config.ts && git commit -m "feat: ajout des constantes de configuration"
```

---

## Task 3: Types API (`api/types.ts`)

**Files:**
- Create: `src/api/types.ts`

- [ ] **Step 1: Écrire les types**

Create `src/api/types.ts`:
```ts
export interface LatLng {
  lat: number;
  lng: number;
}

export interface Horaires {
  active?: boolean;
  heureDebut: number;
  minuteDebut: number;
  heureFin: number;
  minuteFin: number;
}

export interface Zone {
  id?: number;
  nom?: string;
  horaires?: Horaires;
  polygone: LatLng[];
}

export interface Bandeau {
  actif: boolean;
  type: string; // "Succès" | "Alerte" | "danger" | autre → info
  description: string;
}

export interface Ville {
  id?: number;
  nom?: string;
  positionMin?: LatLng;
  positionMax?: LatLng;
  geoJsonLimites?: string; // string JSON à parser
}

export interface JallumeConfig {
  ville?: Ville;
  tempsMinuterie?: number; // secondes
  bandeaux?: Bandeau[];
  zones?: Zone[];
}

export interface JwtResponse {
  jwt: { token: string; expiresAt: string };
}

export interface AuthResult {
  token: string;
  expiresAt: Date;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/types.ts && git commit -m "feat: ajout des types de l'API jallume"
```

---

## Task 4: Distance haversine (`geo/distance.ts`)

**Files:**
- Create: `src/geo/distance.ts`
- Test: `src/geo/distance.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Create `src/geo/distance.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { distanceKm } from './distance';

describe('distanceKm', () => {
  it('retourne 0 pour deux points identiques', () => {
    const p = { lat: 49.305, lng: 1.157 };
    expect(distanceKm(p, p)).toBeCloseTo(0, 5);
  });

  it('calcule ~1.11 km pour 0.01° de latitude', () => {
    const a = { lat: 49.0, lng: 1.0 };
    const b = { lat: 49.01, lng: 1.0 };
    expect(distanceKm(a, b)).toBeGreaterThan(1.1);
    expect(distanceKm(a, b)).toBeLessThan(1.12);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier l'échec**

Run: `npx vitest run src/geo/distance.test.ts`
Expected: FAIL — `distance` introuvable.

- [ ] **Step 3: Implémenter**

Create `src/geo/distance.ts`:
```ts
import type { LatLng } from '../api/types';

const toRad = (deg: number) => (deg * Math.PI) / 180;

export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
```

- [ ] **Step 4: Lancer le test pour vérifier le succès**

Run: `npx vitest run src/geo/distance.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/geo/distance.ts src/geo/distance.test.ts && git commit -m "feat: distance haversine"
```

---

## Task 5: Point dans polygone (`geo/polygon.ts`)

**Files:**
- Create: `src/geo/polygon.ts`
- Test: `src/geo/polygon.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Create `src/geo/polygon.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { pointInPolygon, isInCityLimits } from './polygon';

const square = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 2 },
  { lat: 2, lng: 2 },
  { lat: 2, lng: 0 },
];

describe('pointInPolygon', () => {
  it('détecte un point intérieur', () => {
    expect(pointInPolygon({ lat: 1, lng: 1 }, square)).toBe(true);
  });
  it('détecte un point extérieur', () => {
    expect(pointInPolygon({ lat: 3, lng: 3 }, square)).toBe(false);
  });
});

describe('isInCityLimits', () => {
  it('vrai si dans un des polygones', () => {
    expect(isInCityLimits({ lat: 1, lng: 1 }, [square])).toBe(true);
  });
  it('faux si dans aucun', () => {
    expect(isInCityLimits({ lat: 9, lng: 9 }, [square])).toBe(false);
  });
  it('faux si aucune limite', () => {
    expect(isInCityLimits({ lat: 1, lng: 1 }, [])).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier l'échec**

Run: `npx vitest run src/geo/polygon.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

Create `src/geo/polygon.ts`:
```ts
import type { LatLng } from '../api/types';

export function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  let inside = false;
  const x = point.lng;
  const y = point.lat;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isInCityLimits(point: LatLng, limits: LatLng[][]): boolean {
  return limits.some((poly) => pointInPolygon(point, poly));
}
```

- [ ] **Step 4: Lancer le test pour vérifier le succès**

Run: `npx vitest run src/geo/polygon.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/geo/polygon.ts src/geo/polygon.test.ts && git commit -m "feat: point-in-polygon + limites ville"
```

---

## Task 6: Horaires de zone (`geo/schedule.ts`)

**Files:**
- Create: `src/geo/schedule.ts`
- Test: `src/geo/schedule.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Create `src/geo/schedule.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { isZoneActiveNow } from './schedule';

const at = (h: number, m = 0) => new Date(2026, 0, 1, h, m, 0);

describe('isZoneActiveNow', () => {
  it('actif par défaut si pas d’horaires', () => {
    expect(isZoneActiveNow(undefined, at(3))).toBe(true);
  });

  it('plage normale 06:00-09:00', () => {
    const h = { heureDebut: 6, minuteDebut: 0, heureFin: 9, minuteFin: 0 };
    expect(isZoneActiveNow(h, at(7))).toBe(true);
    expect(isZoneActiveNow(h, at(10))).toBe(false);
  });

  it('plage à cheval sur minuit 22:00-06:00', () => {
    const h = { heureDebut: 22, minuteDebut: 0, heureFin: 6, minuteFin: 0 };
    expect(isZoneActiveNow(h, at(23))).toBe(true);
    expect(isZoneActiveNow(h, at(3))).toBe(true);
    expect(isZoneActiveNow(h, at(12))).toBe(false);
  });

  it('inactif si active === false', () => {
    const h = { active: false, heureDebut: 22, minuteDebut: 0, heureFin: 6, minuteFin: 0 };
    expect(isZoneActiveNow(h, at(23))).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier l'échec**

Run: `npx vitest run src/geo/schedule.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

Create `src/geo/schedule.ts`:
```ts
import type { Horaires } from '../api/types';

export function isZoneActiveNow(
  horaires: Horaires | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!horaires) return true;
  if (horaires.active === false) return false;

  const cur = now.getHours() * 60 + now.getMinutes();
  const start = horaires.heureDebut * 60 + horaires.minuteDebut;
  const end = horaires.heureFin * 60 + horaires.minuteFin;

  if (end < start) {
    // plage à cheval sur minuit (ex : 22:00 → 06:00)
    return cur >= start || cur <= end;
  }
  return cur >= start && cur <= end;
}
```

- [ ] **Step 4: Lancer le test pour vérifier le succès**

Run: `npx vitest run src/geo/schedule.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/geo/schedule.ts src/geo/schedule.test.ts && git commit -m "feat: activité de zone selon horaires (passage minuit)"
```

---

## Task 7: Parsing GeoJSON des limites (`geo/geojson.ts`)

**Files:**
- Create: `src/geo/geojson.ts`
- Test: `src/geo/geojson.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Create `src/geo/geojson.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseGeoJsonLimites } from './geojson';

describe('parseGeoJsonLimites', () => {
  it('parse un Polygon ([lng,lat] → {lat,lng})', () => {
    const raw = JSON.stringify({ type: 'Polygon', coordinates: [[[1, 49], [2, 49], [2, 50]]] });
    const out = parseGeoJsonLimites(raw);
    expect(out).toHaveLength(1);
    expect(out[0][0]).toEqual({ lat: 49, lng: 1 });
  });

  it('parse un MultiPolygon', () => {
    const raw = JSON.stringify({
      type: 'MultiPolygon',
      coordinates: [[[[1, 49], [2, 49], [2, 50]]], [[[3, 48], [4, 48], [4, 49]]]],
    });
    const out = parseGeoJsonLimites(raw);
    expect(out).toHaveLength(2);
    expect(out[1][0]).toEqual({ lat: 48, lng: 3 });
  });

  it('retourne [] sur entrée invalide', () => {
    expect(parseGeoJsonLimites('pas du json')).toEqual([]);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier l'échec**

Run: `npx vitest run src/geo/geojson.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

Create `src/geo/geojson.ts`:
```ts
import type { LatLng } from '../api/types';

export function parseGeoJsonLimites(raw: string | undefined): LatLng[][] {
  if (!raw) return [];
  let geo: any;
  try {
    geo = JSON.parse(raw);
  } catch {
    return [];
  }
  const type = geo.type ?? geo.TYPE;
  const coords = geo.coordinates ?? geo.Coordinates;
  if (!coords) return [];

  const ring = (r: number[][]): LatLng[] => r.map(([lng, lat]) => ({ lat, lng }));

  if (type === 'Polygon') return [ring(coords[0])];
  if (type === 'MultiPolygon') return coords.map((poly: number[][][]) => ring(poly[0]));
  return [];
}
```

- [ ] **Step 4: Lancer le test pour vérifier le succès**

Run: `npx vitest run src/geo/geojson.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/geo/geojson.ts src/geo/geojson.test.ts && git commit -m "feat: parsing GeoJSON des limites de ville"
```

---

## Task 8: Client API (`api/client.ts`)

**Files:**
- Create: `src/api/client.ts`
- Test: `src/api/client.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Create `src/api/client.test.ts`:
```ts
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
```

- [ ] **Step 2: Lancer le test pour vérifier l'échec**

Run: `npx vitest run src/api/client.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

Create `src/api/client.ts`:
```ts
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

export async function placeRequest(userId: string, lat: number, lng: number): Promise<void> {
  const resp = await fetch(`${CONFIG.API_BASE_URL}/App/PlaceRequest`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ idUser: userId, latitude: lat, longitude: lng }),
  });
  if (!resp.ok) throw new Error(`placeRequest error (${resp.status})`);
}
```

- [ ] **Step 4: Lancer le test pour vérifier le succès**

Run: `npx vitest run src/api/client.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/client.ts src/api/client.test.ts && git commit -m "feat: client API jallume (config/auth/light/place)"
```

---

## Task 9: Fixture Config réelle

**Files:**
- Create: `src/fixtures/pont-de-larche.config.json`

- [ ] **Step 1: Capturer la config réelle**

Run:
```bash
curl -s "https://api.jallume.fr/App/Config/49.305&1.157" -H "Accept: application/json" -o src/fixtures/pont-de-larche.config.json
```
Expected: fichier JSON contenant `ville.id`, `tempsMinuterie`, `zones[]`, `geoJsonLimites`.

- [ ] **Step 2: Vérifier le contenu**

Run: `node -e "const c=require('./src/fixtures/pont-de-larche.config.json'); console.log(c.ville.nom, c.tempsMinuterie, c.zones.length)"`
Expected: `Pont-de-l'Arche 900 <n>` (n ≥ 1).

- [ ] **Step 3: Commit**

```bash
git add src/fixtures/pont-de-larche.config.json && git commit -m "test: fixture Config réelle (Pont-de-l'Arche)"
```

---

## Task 10: Hook userId (`hooks/useUserId.ts`)

**Files:**
- Create: `src/hooks/useUserId.ts`
- Test: `src/hooks/useUserId.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Create `src/hooks/useUserId.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUserId } from './useUserId';
import { CONFIG } from '../config';

beforeEach(() => localStorage.clear());

describe('useUserId', () => {
  it('génère et persiste un id si absent', () => {
    const { result } = renderHook(() => useUserId());
    expect(result.current).toBeTruthy();
    expect(localStorage.getItem(CONFIG.STORAGE_KEY_USER_ID)).toBe(result.current);
  });

  it('réutilise l’id existant', () => {
    localStorage.setItem(CONFIG.STORAGE_KEY_USER_ID, 'fixe-123');
    const { result } = renderHook(() => useUserId());
    expect(result.current).toBe('fixe-123');
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier l'échec**

Run: `npx vitest run src/hooks/useUserId.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

Create `src/hooks/useUserId.ts`:
```ts
import { useState } from 'react';
import { CONFIG } from '../config';

export function useUserId(): string {
  const [id] = useState(() => {
    const existing = localStorage.getItem(CONFIG.STORAGE_KEY_USER_ID);
    if (existing) return existing;
    const generated = String(Date.now() + Math.floor(Math.random() * 1000 + 1));
    localStorage.setItem(CONFIG.STORAGE_KEY_USER_ID, generated);
    return generated;
  });
  return id;
}
```

- [ ] **Step 4: Lancer le test pour vérifier le succès**

Run: `npx vitest run src/hooks/useUserId.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useUserId.ts src/hooks/useUserId.test.ts && git commit -m "feat: hook userId anonyme persistant"
```

---

## Task 11: Hook géolocalisation (`hooks/useGeolocation.ts`)

**Files:**
- Create: `src/hooks/useGeolocation.ts`
- Test: `src/hooks/useGeolocation.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Create `src/hooks/useGeolocation.test.ts`:
```ts
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
```

- [ ] **Step 2: Lancer le test pour vérifier l'échec**

Run: `npx vitest run src/hooks/useGeolocation.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

Create `src/hooks/useGeolocation.ts`:
```ts
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
```

- [ ] **Step 4: Lancer le test pour vérifier le succès**

Run: `npx vitest run src/hooks/useGeolocation.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGeolocation.ts src/hooks/useGeolocation.test.ts && git commit -m "feat: hook géolocalisation (watchPosition)"
```

---

## Task 12: Calcul de statut (`state/machine.ts`)

**Files:**
- Create: `src/state/machine.ts`
- Test: `src/state/machine.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Create `src/state/machine.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { computeStatus } from './machine';
import type { JallumeConfig } from '../api/types';

const zonePoly = [
  { lat: 0, lng: 0 }, { lat: 0, lng: 2 }, { lat: 2, lng: 2 }, { lat: 2, lng: 0 },
];
const always = { heureDebut: 0, minuteDebut: 0, heureFin: 23, minuteFin: 59 };
const at = (h: number) => new Date(2026, 0, 1, h, 0, 0);

describe('computeStatus', () => {
  it('positionUnknown sans coords', () => {
    expect(computeStatus(null, null, at(12)).kind).toBe('positionUnknown');
  });

  it('cityNotEquipped si pas de ville.id', () => {
    const cfg: JallumeConfig = { ville: {}, zones: [] };
    expect(computeStatus({ lat: 1, lng: 1 }, cfg, at(12)).kind).toBe('cityNotEquipped');
  });

  it('inActiveZone si dans une zone active', () => {
    const cfg: JallumeConfig = {
      ville: { id: 1, nom: 'V' },
      zones: [{ polygone: zonePoly, horaires: always }],
    };
    expect(computeStatus({ lat: 1, lng: 1 }, cfg, at(12)).kind).toBe('inActiveZone');
  });

  it('outOfZone si hors de toute zone', () => {
    const cfg: JallumeConfig = {
      ville: { id: 1, nom: 'V' },
      zones: [{ polygone: zonePoly, horaires: always }],
    };
    expect(computeStatus({ lat: 9, lng: 9 }, cfg, at(12)).kind).toBe('outOfZone');
  });

  it('outOfHours si dans la zone mais hors horaire', () => {
    const cfg: JallumeConfig = {
      ville: { id: 1, nom: 'V' },
      zones: [{ polygone: zonePoly, horaires: { heureDebut: 22, minuteDebut: 0, heureFin: 23, minuteFin: 0 } }],
    };
    expect(computeStatus({ lat: 1, lng: 1 }, cfg, at(12)).kind).toBe('outOfHours');
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier l'échec**

Run: `npx vitest run src/state/machine.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

Create `src/state/machine.ts`:
```ts
import type { JallumeConfig, LatLng } from '../api/types';
import { pointInPolygon } from '../geo/polygon';
import { isZoneActiveNow } from '../geo/schedule';

export type StatusKind =
  | 'positionUnknown'
  | 'cityNotEquipped'
  | 'inActiveZone'
  | 'outOfZone'
  | 'outOfHours';

export interface Status {
  kind: StatusKind;
  cityName?: string;
  idVille?: number;
}

export function computeStatus(
  coords: LatLng | null,
  config: JallumeConfig | null,
  now: Date = new Date(),
): Status {
  if (!coords) return { kind: 'positionUnknown' };
  if (!config?.ville?.id) return { kind: 'cityNotEquipped', cityName: config?.ville?.nom };

  const base = { cityName: config.ville.nom, idVille: config.ville.id };
  const zones = config.zones ?? [];

  const inZone = zones.some((z) => pointInPolygon(coords, z.polygone));
  const inActiveZone = zones.some(
    (z) => pointInPolygon(coords, z.polygone) && isZoneActiveNow(z.horaires, now),
  );

  if (inActiveZone) return { kind: 'inActiveZone', ...base };
  if (inZone) return { kind: 'outOfHours', ...base };
  return { kind: 'outOfZone', ...base };
}
```

- [ ] **Step 4: Lancer le test pour vérifier le succès**

Run: `npx vitest run src/state/machine.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/machine.ts src/state/machine.test.ts && git commit -m "feat: calcul du statut (zone/horaire/ville)"
```

---

## Task 13: Hook orchestrateur (`hooks/useJallume.ts`)

**Files:**
- Create: `src/hooks/useJallume.ts`
- Test: `src/hooks/useJallume.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Create `src/hooks/useJallume.test.ts`:
```ts
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
      useJallume({ coords: { lat: 1, lng: 1 }, userId: 'u1', demoMode: true }),
    );
    await waitFor(() => expect(result.current.status.kind).toBe('inActiveZone'));
    expect(client.getConfig).toHaveBeenCalled();
  });

  it('en mode démo, lightUp n’appelle PAS l’API réelle mais démarre la minuterie', async () => {
    const { result } = renderHook(() =>
      useJallume({ coords: { lat: 1, lng: 1 }, userId: 'u1', demoMode: true }),
    );
    await waitFor(() => expect(result.current.status.kind).toBe('inActiveZone'));
    await act(async () => { await result.current.lightUp(); });
    expect(client.lightRequest).not.toHaveBeenCalled();
    expect(result.current.lighting).toBe(true);
  });

  it('hors mode démo, lightUp appelle authenticate + lightRequest', async () => {
    const { result } = renderHook(() =>
      useJallume({ coords: { lat: 1, lng: 1 }, userId: 'u1', demoMode: false }),
    );
    await waitFor(() => expect(result.current.status.kind).toBe('inActiveZone'));
    await act(async () => { await result.current.lightUp(); });
    expect(client.authenticate).toHaveBeenCalledWith('u1', 1);
    expect(client.lightRequest).toHaveBeenCalled();
    expect(result.current.lighting).toBe(true);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier l'échec**

Run: `npx vitest run src/hooks/useJallume.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

Create `src/hooks/useJallume.ts`:
```ts
import { useCallback, useEffect, useRef, useState } from 'react';
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
  lightUp: () => Promise<void>;
}

export function useJallume({ coords, userId, demoMode }: Params): UseJallume {
  const [config, setConfig] = useState<JallumeConfig | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'positionUnknown' });
  const [lighting, setLighting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

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
    if (!moved && config) return;
    lastFetch.current = coords;
    getConfig(coords.lat, coords.lng)
      .then(setConfig)
      .catch(() => setConfig({ ville: {} }));
  }, [coords, config]);

  // Recalcul du statut à chaque changement de position/config
  useEffect(() => {
    setStatus(computeStatus(coords, config));
  }, [coords, config]);

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
    await sendLight();

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

  return { config, status, lighting, timeLeft, lightUp };
}
```

- [ ] **Step 4: Lancer le test pour vérifier le succès**

Run: `npx vitest run src/hooks/useJallume.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useJallume.ts src/hooks/useJallume.test.ts && git commit -m "feat: orchestrateur useJallume (config/auth/allumage/minuterie/démo)"
```

---

## Task 14: Composant BulbButton

**Files:**
- Create: `src/components/BulbButton.tsx`
- Test: `src/components/BulbButton.test.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

Create `src/components/BulbButton.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulbButton } from './BulbButton';

describe('BulbButton', () => {
  it('affiche le temps restant quand allumé', () => {
    render(<BulbButton active disabled={false} timeLeft={75} onActivate={() => {}} />);
    expect(screen.getByText('1m 15s')).toBeInTheDocument();
  });

  it('déclenche onActivate au clic si non désactivé', async () => {
    const onActivate = vi.fn();
    render(<BulbButton active={false} disabled={false} timeLeft={0} onActivate={onActivate} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onActivate).toHaveBeenCalled();
  });

  it('ne déclenche pas onActivate si désactivé', async () => {
    const onActivate = vi.fn();
    render(<BulbButton active={false} disabled timeLeft={0} onActivate={onActivate} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onActivate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier l'échec**

Run: `npx vitest run src/components/BulbButton.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

Create `src/components/BulbButton.tsx`:
```tsx
import { Focusable } from 'mrbd-ui-kit';

interface Props {
  active: boolean;
  disabled: boolean;
  timeLeft: number;
  onActivate: () => void;
}

function fmt(t: number): string {
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export function BulbButton({ active, disabled, timeLeft, onActivate }: Props) {
  return (
    <Focusable
      as="button"
      disabled={disabled}
      onClick={() => { if (!disabled) onActivate(); }}
      className={[
        'flex h-48 w-48 flex-col items-center justify-center rounded-full font-bold transition-colors',
        active ? 'bg-amber-300 text-black' : 'bg-neutral-800 text-amber-200',
        disabled ? 'opacity-40' : '',
      ].join(' ')}
    >
      <span className="text-6xl" aria-hidden>💡</span>
      {active ? <span className="mt-2 text-2xl">{fmt(timeLeft)}</span> : null}
    </Focusable>
  );
}
```

> Note : si l'API de `Focusable` du `mrbd-ui-kit` diffère (prop `as`/`disabled`), adapter à la signature réelle du kit — vérifier `node_modules/mrbd-ui-kit` ou sa doc. Le test cible le rôle `button` et le texte, indépendamment du détail d'API.

- [ ] **Step 4: Lancer le test pour vérifier le succès**

Run: `npx vitest run src/components/BulbButton.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/BulbButton.tsx src/components/BulbButton.test.tsx && git commit -m "feat: composant BulbButton avec minuterie"
```

---

## Task 15: Composants StatusHeader, CityBanner, ZoneStatusCard

**Files:**
- Create: `src/components/StatusHeader.tsx`, `src/components/CityBanner.tsx`, `src/components/ZoneStatusCard.tsx`
- Test: `src/components/StatusHeader.test.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

Create `src/components/StatusHeader.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusHeader } from './StatusHeader';

describe('StatusHeader', () => {
  it('affiche le nom de ville et le libellé de statut', () => {
    render(<StatusHeader cityName="Pont-de-l'Arche" statusLabel="Appuyez pour allumer" />);
    expect(screen.getByRole('heading')).toHaveTextContent("Pont-de-l'Arche");
    expect(screen.getByText('Appuyez pour allumer')).toBeInTheDocument();
  });

  it('affiche un titre par défaut sans ville', () => {
    render(<StatusHeader statusLabel="Position non détectée" />);
    expect(screen.getByRole('heading')).toHaveTextContent("J'allume ma rue");
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier l'échec**

Run: `npx vitest run src/components/StatusHeader.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implémenter les trois composants**

Create `src/components/StatusHeader.tsx`:
```tsx
interface Props {
  cityName?: string;
  statusLabel: string;
}

export function StatusHeader({ cityName, statusLabel }: Props) {
  return (
    <header className="px-4 pt-4 text-center">
      <h1 className="text-3xl font-bold text-white">{cityName || "J'allume ma rue"}</h1>
      <p className="mt-1 text-lg text-neutral-300">{statusLabel}</p>
    </header>
  );
}
```

Create `src/components/CityBanner.tsx`:
```tsx
import type { Bandeau } from '../api/types';

const TINT: Record<string, string> = {
  Succès: 'bg-emerald-700',
  Alerte: 'bg-amber-700',
  danger: 'bg-red-700',
};

export function CityBanner({ bandeau }: { bandeau?: Bandeau }) {
  if (!bandeau || !bandeau.actif) return null;
  const tint = TINT[bandeau.type] ?? 'bg-sky-700';
  return (
    <div
      className={`mx-4 mt-2 rounded-lg px-3 py-2 text-center text-base font-bold text-white ${tint}`}
      dangerouslySetInnerHTML={{ __html: bandeau.description }}
    />
  );
}
```

Create `src/components/ZoneStatusCard.tsx`:
```tsx
import { Card, Button } from 'mrbd-ui-kit';
import type { StatusKind } from '../state/machine';

interface Props {
  kind: StatusKind;
  onRequestCity?: () => void;
}

const MESSAGE: Record<StatusKind, string> = {
  positionUnknown: "Autorisez la géolocalisation pour utiliser le service.",
  cityNotEquipped: "Cette ville n'est pas encore équipée.",
  outOfZone: "Rapprochez-vous d'une zone d'éclairage active.",
  outOfHours: "La période d'allumage n'est pas encore active.",
  inActiveZone: "Appuyez sur l'ampoule pour allumer cette rue.",
};

export function ZoneStatusCard({ kind, onRequestCity }: Props) {
  return (
    <Card className="mx-4 mt-3 p-3 text-center text-base text-neutral-200">
      <p>{MESSAGE[kind]}</p>
      {kind === 'cityNotEquipped' && onRequestCity ? (
        <Button className="mt-2" onClick={onRequestCity}>Demander l'équipement</Button>
      ) : null}
    </Card>
  );
}
```

- [ ] **Step 4: Lancer le test pour vérifier le succès**

Run: `npx vitest run src/components/StatusHeader.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/StatusHeader.tsx src/components/CityBanner.tsx src/components/ZoneStatusCard.tsx src/components/StatusHeader.test.tsx && git commit -m "feat: StatusHeader, CityBanner, ZoneStatusCard"
```

---

## Task 16: Écran principal (`screens/MainScreen.tsx`)

**Files:**
- Create: `src/screens/MainScreen.tsx`

- [ ] **Step 1: Implémenter (composition, pas de logique nouvelle)**

Create `src/screens/MainScreen.tsx`:
```tsx
import { useState } from 'react';
import { BulbButton } from '../components/BulbButton';
import { StatusHeader } from '../components/StatusHeader';
import { CityBanner } from '../components/CityBanner';
import { ZoneStatusCard } from '../components/ZoneStatusCard';
import type { JallumeConfig, LatLng } from '../api/types';
import type { Status } from '../state/machine';
import { placeRequest } from '../api/client';

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

const STATUS_LABEL: Record<string, string> = {
  positionUnknown: 'Position non détectée',
  cityNotEquipped: 'Ville non équipée',
  outOfZone: 'Hors zone',
  outOfHours: 'Hors horaire',
  inActiveZone: 'Prêt',
};

export function MainScreen(props: Props) {
  const { status, config, coords, userId, lighting, timeLeft, demoMode, onLightUp } = props;
  const [confirmPending, setConfirmPending] = useState(false);
  const [placeSent, setPlaceSent] = useState(false);

  const disabled = status.kind !== 'inActiveZone';

  const handleActivate = () => {
    if (disabled) return;
    if (!demoMode && !confirmPending) {
      setConfirmPending(true);
      setTimeout(() => setConfirmPending(false), 4000);
      return;
    }
    setConfirmPending(false);
    onLightUp();
  };

  const handleRequestCity = () => {
    if (placeSent || !coords) return;
    placeRequest(userId, coords.lat, coords.lng).catch(() => {});
    setPlaceSent(true);
  };

  return (
    <div className="flex h-full flex-col">
      <StatusHeader cityName={status.cityName} statusLabel={STATUS_LABEL[status.kind]} />
      <CityBanner bandeau={config?.bandeaux?.[0]} />
      <div className="flex flex-1 items-center justify-center">
        <BulbButton active={lighting} disabled={disabled} timeLeft={timeLeft} onActivate={handleActivate} />
      </div>
      {confirmPending ? (
        <p className="pb-2 text-center text-amber-300">Appuyez à nouveau pour allumer réellement</p>
      ) : (
        <ZoneStatusCard kind={status.kind} onRequestCity={placeSent ? undefined : handleRequestCity} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: pas d'erreur de type.

- [ ] **Step 3: Commit**

```bash
git add src/screens/MainScreen.tsx && git commit -m "feat: écran principal (ampoule, statut, confirmation, demande d'équipement)"
```

---

## Task 17: Écran carte (`screens/MapScreen.tsx`) — pattern Herald

**Files:**
- Create: `src/screens/MapScreen.tsx`

- [ ] **Step 1: Implémenter la carte Leaflet plein écran**

Create `src/screens/MapScreen.tsx`:
```tsx
import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polygon, useMap } from 'react-leaflet';
import { Focusable } from 'mrbd-ui-kit';
import 'leaflet/dist/leaflet.css';
import { CONFIG } from '../config';
import type { JallumeConfig, LatLng } from '../api/types';
import { isZoneActiveNow } from '../geo/schedule';

interface Props {
  coords: LatLng | null;
  accuracy: number | null;
  config: JallumeConfig | null;
  dark: boolean;
}

// Recentre + invalide la taille quand on (ré)entre sur l'écran (piège Herald).
function MapController({ coords }: { coords: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (coords) map.setView([coords.lat, coords.lng], 18);
  }, [coords, map]);
  return null;
}

export function MapScreen({ coords, accuracy, config, dark }: Props) {
  const center: [number, number] = coords ? [coords.lat, coords.lng] : [46.83, 2.4];
  const tiles = dark ? CONFIG.DARK_TILES : CONFIG.LIGHT_TILES;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={16}
        zoomControl={false}
        attributionControl={false}
        style={{ height: '100%', width: '100%', background: '#000' }}
      >
        <TileLayer url={tiles} subdomains="abcd" maxZoom={20} />
        <MapController coords={coords} />
        {coords ? (
          <>
            <CircleMarker
              center={[coords.lat, coords.lng]}
              radius={16}
              pathOptions={{ color: '#52d9ff', weight: 1, opacity: 0.4, fillColor: '#52d9ff', fillOpacity: 0.08 }}
            />
            <CircleMarker
              center={[coords.lat, coords.lng]}
              radius={6}
              pathOptions={{ color: '#fff', weight: 2, fillColor: '#52d9ff', fillOpacity: 1 }}
            />
          </>
        ) : null}
        {(config?.zones ?? []).map((z, i) => {
          const active = isZoneActiveNow(z.horaires);
          return (
            <Polygon
              key={i}
              positions={z.polygone.map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{
                color: active ? '#4a8bfd' : '#888',
                fillColor: active ? '#4a8bfd' : '#555',
                weight: active ? 3 : 2,
                opacity: active ? 1 : 0.7,
                fillOpacity: active ? 0.3 : 0.15,
                dashArray: active ? undefined : '5,5',
              }}
            />
          );
        })}
      </MapContainer>
      <div className="absolute right-2 top-1/2 z-[1000] flex -translate-y-1/2 flex-col gap-2">
        <Focusable as="button" className="rounded-full bg-black/70 px-3 py-2 text-2xl font-bold text-white" data-action="zoom-in">+</Focusable>
        <Focusable as="button" className="rounded-full bg-black/70 px-3 py-2 text-2xl font-bold text-white" data-action="zoom-out">−</Focusable>
      </div>
    </div>
  );
}
```

> Note : les actions zoom/recentrer passent par les boutons `Focusable`. Brancher leur `onClick` sur l'instance Leaflet via un `ref`/contexte si le kit ne propage pas `data-action` ; sinon utiliser `useMap` dans un sous-composant exposant `zoomIn/zoomOut`. Adapter à l'API réelle de `Focusable`.

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: pas d'erreur de type.

- [ ] **Step 3: Commit**

```bash
git add src/screens/MapScreen.tsx && git commit -m "feat: écran carte Leaflet (pattern Herald) avec zones"
```

---

## Task 18: Écran réglages + thème + mode démo (`screens/SettingsScreen.tsx`, `hooks/useSettings.ts`)

**Files:**
- Create: `src/hooks/useSettings.ts`, `src/screens/SettingsScreen.tsx`
- Test: `src/hooks/useSettings.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Create `src/hooks/useSettings.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from './useSettings';

beforeEach(() => localStorage.clear());

describe('useSettings', () => {
  it('démo ON et thème sombre par défaut', () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.demoMode).toBe(true);
    expect(result.current.dark).toBe(true);
  });

  it('toggle démo persiste', () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.setDemoMode(false));
    expect(localStorage.getItem('jallume_demo_mode')).toBe('0');
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier l'échec**

Run: `npx vitest run src/hooks/useSettings.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter le hook puis l'écran**

Create `src/hooks/useSettings.ts`:
```ts
import { useEffect, useState } from 'react';
import { CONFIG } from '../config';

export function useSettings() {
  const [demoMode, setDemoModeState] = useState(
    () => localStorage.getItem(CONFIG.STORAGE_KEY_DEMO) !== '0',
  );
  const [dark, setDarkState] = useState(
    () => localStorage.getItem(CONFIG.STORAGE_KEY_THEME) !== 'light',
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const setDemoMode = (v: boolean) => {
    localStorage.setItem(CONFIG.STORAGE_KEY_DEMO, v ? '1' : '0');
    setDemoModeState(v);
  };
  const setDark = (v: boolean) => {
    localStorage.setItem(CONFIG.STORAGE_KEY_THEME, v ? 'dark' : 'light');
    setDarkState(v);
  };

  return { demoMode, setDemoMode, dark, setDark };
}
```

Create `src/screens/SettingsScreen.tsx`:
```tsx
import { Card, Button } from 'mrbd-ui-kit';

interface Props {
  demoMode: boolean;
  dark: boolean;
  onToggleDemo: () => void;
  onToggleTheme: () => void;
}

export function SettingsScreen({ demoMode, dark, onToggleDemo, onToggleTheme }: Props) {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <h1 className="text-2xl font-bold text-white">Réglages</h1>
      <Card className="flex items-center justify-between p-3">
        <span className="text-white">Mode démo (n'allume pas réellement)</span>
        <Button onClick={onToggleDemo}>{demoMode ? 'ON' : 'OFF'}</Button>
      </Card>
      <Card className="flex items-center justify-between p-3">
        <span className="text-white">Thème</span>
        <Button onClick={onToggleTheme}>{dark ? 'Sombre' : 'Clair'}</Button>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Lancer le test pour vérifier le succès**

Run: `npx vitest run src/hooks/useSettings.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useSettings.ts src/screens/SettingsScreen.tsx src/hooks/useSettings.test.ts && git commit -m "feat: réglages (mode démo + thème) persistés"
```

---

## Task 19: Assemblage (`App.tsx`)

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`

- [ ] **Step 1: Implémenter l'app avec navigation entre écrans**

Replace `src/App.tsx`:
```tsx
import { useState } from 'react';
import { DisplayRoot } from 'mrbd-ui-kit';
import { useUserId } from './hooks/useUserId';
import { useGeolocation } from './hooks/useGeolocation';
import { useSettings } from './hooks/useSettings';
import { useJallume } from './hooks/useJallume';
import { MainScreen } from './screens/MainScreen';
import { MapScreen } from './screens/MapScreen';
import { SettingsScreen } from './screens/SettingsScreen';

type ScreenId = 'main' | 'map' | 'settings';

export default function App() {
  const [screen, setScreen] = useState<ScreenId>('main');
  const userId = useUserId();
  const { coords, accuracy } = useGeolocation();
  const { demoMode, setDemoMode, dark, setDark } = useSettings();
  const { config, status, lighting, timeLeft, lightUp } = useJallume({ coords, userId, demoMode });

  return (
    <DisplayRoot>
      <div className="flex h-full w-full flex-col bg-black text-white">
        <div className="flex-1 overflow-hidden">
          {screen === 'main' && (
            <MainScreen
              status={status}
              config={config}
              coords={coords}
              userId={userId}
              lighting={lighting}
              timeLeft={timeLeft}
              demoMode={demoMode}
              onLightUp={lightUp}
            />
          )}
          {screen === 'map' && (
            <MapScreen coords={coords} accuracy={accuracy} config={config} dark={dark} />
          )}
          {screen === 'settings' && (
            <SettingsScreen
              demoMode={demoMode}
              dark={dark}
              onToggleDemo={() => setDemoMode(!demoMode)}
              onToggleTheme={() => setDark(!dark)}
            />
          )}
        </div>
        <nav className="flex justify-around border-t border-neutral-800 py-2">
          <button onClick={() => setScreen('main')} className="font-bold text-white">Accueil</button>
          <button onClick={() => setScreen('map')} className="font-bold text-white">Carte</button>
          <button onClick={() => setScreen('settings')} className="font-bold text-white">Réglages</button>
        </nav>
      </div>
    </DisplayRoot>
  );
}
```

- [ ] **Step 2: Vérifier build, types et tests complets**

Run: `npx tsc --noEmit && npm run build && npm run test`
Expected: build OK, types OK, tous les tests PASS.

- [ ] **Step 3: Lancer en dev et vérifier visuellement**

Run: `npm run dev`
Expected: l'app se charge ; en mode démo, appuyer sur l'ampoule (avec une position en zone active, ex. via fixture/devtools) démarre la minuterie sans appel réseau réel vers `lightRequest`.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/main.tsx && git commit -m "feat: assemblage de l'app (navigation Accueil/Carte/Réglages)"
```

---

## Task 20: Déploiement & test sur device

**Files:** aucun fichier source ; utilise les skills `meta-wearables-webapp`.

- [ ] **Step 1: Test sur les lunettes (staging)**

Invoquer le skill `meta-wearables-webapp:test-on-device` pour déployer un build de staging HTTPS et valider sur les lunettes :
- géolocalisation accessible dans le navigateur des lunettes ;
- navigation D-pad entre Accueil / Carte / Réglages ;
- lisibilité 600×600 (typo grasse, contrastes).

- [ ] **Step 2: Valider le flux d'allumage en mode démo**

Sur device, en mode démo, vérifier le cycle ampoule → minuterie → extinction, **sans** allumage réel.

- [ ] **Step 3: Publication (optionnelle)**

Quand validé, invoquer `meta-wearables-webapp:publish-to-vercel` pour une URL de production stable.

- [ ] **Step 4: Commit (config de déploiement éventuelle)**

```bash
git add -A && git commit -m "chore: configuration de déploiement device"
```

---

## Self-Review (effectuée)

**Couverture spec :** stack ✓ (Task 1), API ✓ (Tasks 3,8), géo/horaires/geojson ✓ (Tasks 4–7), userId/géoloc ✓ (Tasks 10–11), machine d'états ✓ (Task 12), orchestrateur + minuterie + ré-auth + mode démo ✓ (Task 13), MainScreen + sous-états + PlaceRequest + confirmation ✓ (Tasks 14–16), MapScreen pattern Herald ✓ (Task 17), réglages thème/démo ✓ (Task 18), assemblage/nav ✓ (Task 19), tests device ✓ (Task 20), fixtures ✓ (Task 9).

**Placeholders :** aucun TODO/TBD ; chaque étape de code montre le code. Les deux notes sur l'API exacte de `Focusable` (Tasks 14, 17) sont des points d'adaptation au kit, pas des placeholders de logique.

**Cohérence de types :** `LatLng`, `JallumeConfig`, `Status`/`StatusKind`, `AuthResult` réutilisés de façon cohérente entre `api/types.ts`, `state/machine.ts`, `hooks/useJallume.ts`, et les écrans. `getConfig/authenticate/lightRequest/placeRequest` ont des signatures stables entre Task 8 et leurs appelants.

**Risques à lever tôt (Task 20) :** géoloc dans le navigateur des lunettes ; CORS sur `api/auth.jallume.fr` depuis l'origine Vercel ; API exacte des composants `mrbd-ui-kit` (`Focusable`, `DisplayRoot`, `Card`, `Button`) — à confirmer contre la version installée.

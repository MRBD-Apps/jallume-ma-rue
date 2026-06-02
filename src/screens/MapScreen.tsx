import 'leaflet/dist/leaflet.css';

import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polygon,
  useMap,
} from 'react-leaflet';
import type { PathOptions } from 'leaflet';
import { Button } from 'mrbd-ui-kit';
import { Plus, Minus, LocateFixed } from 'lucide-react';

import { CONFIG } from '../config';
import type { JallumeConfig, LatLng } from '../api/types';
import { isZoneActiveNow } from '../geo/schedule';

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

interface Props {
  coords: LatLng | null;
  accuracy: number | null;
  config: JallumeConfig | null;
  dark: boolean;
}

// -------------------------------------------------------------------
// MapSync — keep the view centred and size valid when coords change
// -------------------------------------------------------------------

interface MapSyncProps {
  coords: LatLng | null;
}

function MapSync({ coords }: MapSyncProps) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    if (coords) {
      map.setView([coords.lat, coords.lng], 18);
    }
  }, [map, coords]);

  return null;
}

// -------------------------------------------------------------------
// MapControls — zoom-in / zoom-out / recenter overlay
// Rendered INSIDE MapContainer so useMap() works
// -------------------------------------------------------------------

interface MapControlsProps {
  coords: LatLng | null;
}

function MapControls({ coords }: MapControlsProps) {
  const map = useMap();

  return (
    <div
      style={{ zIndex: 1000 }}
      className="absolute right-3 top-3 flex flex-col gap-2"
    >
      <Button id="zoom-in" variant="secondary" size="sm" onClick={() => map.zoomIn()}>
        <Plus className="size-5" aria-label="Zoom avant" />
      </Button>
      <Button id="zoom-out" variant="secondary" size="sm" onClick={() => map.zoomOut()}>
        <Minus className="size-5" aria-label="Zoom arrière" />
      </Button>
      <Button
        id="recenter"
        variant="secondary"
        size="sm"
        onClick={() => {
          if (coords) map.setView([coords.lat, coords.lng], 18);
        }}
      >
        <LocateFixed className="size-5" aria-label="Recentrer" />
      </Button>
    </div>
  );
}

// -------------------------------------------------------------------
// PathOptions for zones
// -------------------------------------------------------------------

const ACTIVE_STYLE: PathOptions = {
  color: '#4a8bfd',
  weight: 3,
  fillColor: '#4a8bfd',
  fillOpacity: 0.3,
  opacity: 1,
};

const INACTIVE_STYLE: PathOptions = {
  color: '#888888',
  weight: 1,
  fillColor: '#888888',
  fillOpacity: 0.15,
  opacity: 0.6,
  dashArray: '5,5',
};

// -------------------------------------------------------------------
// MapScreen
// -------------------------------------------------------------------

const DEFAULT_CENTER: [number, number] = [46.83, 2.4];
const DEFAULT_ZOOM = 13;

export function MapScreen({ coords, accuracy, config, dark }: Props) {
  const center: [number, number] = coords
    ? [coords.lat, coords.lng]
    : DEFAULT_CENTER;

  const tileUrl = dark ? CONFIG.DARK_TILES : CONFIG.LIGHT_TILES;

  // Precision ring radius: use accuracy (in metres) converted roughly to
  // pixels at zoom 18 — capped to a sensible range.
  const precisionRadius =
    accuracy != null ? Math.max(8, Math.min(60, accuracy * 0.5)) : 16;

  return (
    <div
      style={{ position: 'relative', height: '100%', width: '100%', background: '#000' }}
    >
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        attributionControl={false}
        style={{ height: '100%', width: '100%', background: '#000' }}
      >
        {/* Tile layer */}
        <TileLayer
          url={tileUrl}
          subdomains="abcd"
          maxZoom={20}
        />

        {/* Sync map view whenever coords change */}
        <MapSync coords={coords} />

        {/* Zone polygons */}
        {config?.zones?.map((zone, idx) => {
          const positions: [number, number][] = zone.polygone.map((p) => [
            p.lat,
            p.lng,
          ]);
          const active = isZoneActiveNow(zone.horaires);
          return (
            <Polygon
              key={zone.id ?? idx}
              positions={positions}
              pathOptions={active ? ACTIVE_STYLE : INACTIVE_STYLE}
            />
          );
        })}

        {/* User position markers */}
        {coords && (
          <>
            {/* Outer precision ring */}
            <CircleMarker
              center={[coords.lat, coords.lng]}
              radius={precisionRadius}
              pathOptions={{
                color: '#52d9ff',
                weight: 1.5,
                fillColor: '#52d9ff',
                fillOpacity: 0.08,
                opacity: 0.5,
              }}
            />
            {/* Inner dot */}
            <CircleMarker
              center={[coords.lat, coords.lng]}
              radius={7}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: '#52d9ff',
                fillOpacity: 1,
                opacity: 1,
              }}
            />
          </>
        )}

        {/* On-screen controls — inside MapContainer to access useMap() */}
        <MapControls coords={coords} />
      </MapContainer>
    </div>
  );
}

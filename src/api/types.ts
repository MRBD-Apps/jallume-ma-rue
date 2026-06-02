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

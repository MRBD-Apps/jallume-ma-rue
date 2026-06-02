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

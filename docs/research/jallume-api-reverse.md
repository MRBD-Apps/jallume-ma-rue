# API jallume.fr — rétro-ingénierie

Source : analyse réseau + lecture de `https://jallume.fr/js/app.js` (1er juin 2026).
Site front : Leaflet + MicroModal, JS vanilla. Aucune clé d'API publique requise pour démarrer (auth basée sur un userId généré côté client).

## Bases d'URL

| Constante | Valeur |
|---|---|
| `API_BASE_URL` | `https://api.jallume.fr` |
| `AUTH_URL` | `https://auth.jallume.fr` |

## Identité utilisateur

- `userId` généré côté client : `Date.now() + random(1..1000)`, stocké dans `localStorage["idUtilisateur"]`.
- Pas de compte / pas de mot de passe. L'identité est anonyme et locale.

## Constantes clés (du front)

| Constante | Valeur | Sens |
|---|---|---|
| `DEFAULT_TIMER` | 300 s | minuterie par défaut (5 min) si l'API n'en donne pas |
| `DISTANCE_THRESHOLD` | 0.05 km | seuil de déplacement « significatif » (50 m) |
| intervalle `lightRequest` | 5000 ms | renvoi périodique de la requête d'allumage |
| décalage timer visuel | `tempsMinuterie - 15 s` | marge de sécurité affichée |

## Endpoints

### 1. `GET /App/Config/{lat}&{lng}`  (api)
> Note : séparateur `&` entre lat et lng dans le **path** (pas un query string).

Headers : `Accept: application/json`

Réponse 200 (`configData`) :
```jsonc
{
  "ville": {
    "id": 27469,
    "nom": "Pont-de-l'Arche",
    "positionMin": { "lat": 49.296863, "lng": 1.123968 },
    "positionMax": { "lat": 49.309568, "lng": 1.162334 },
    "geoJsonLimites": "{\"type\":\"Polygon\",\"coordinates\":[[[lng,lat],...]]}" // STRING à JSON.parse
  },
  "tempsMinuterie": 900,        // secondes
  "bandeaux": [                 // bannières d'info, souvent []
    { "actif": true, "type": "Succès|Alerte|danger|info", "description": "html" }
  ],
  "zones": [
    {
      "id": 123,
      "nom": "Centre",
      "horaires": {             // OBJET dans l'API réelle
        "active": true,
        "heureDebut": 22, "minuteDebut": 0,
        "heureFin": 6,   "minuteFin": 0   // fin < début => plage à cheval sur minuit
      },
      "polygone": [ { "lat": 49.3063, "lng": 1.1512 }, ... ]  // >= 3 points
    }
  ]
}
```
- Ville **non équipée** : pas de `ville.id` (ou réponse non-ok) → ampoule désactivée.
- `geoJsonLimites` : `Polygon` ou `MultiPolygon`, coords en `[lng, lat]`.

### 2. `POST /Auth/JallumeToken`  (auth)
Headers : `Content-Type: application/json`, `Accept: application/json`
Body :
```json
{ "id": "<userId>", "idVille": "<String(ville.id)>" }
```
Réponse :
```json
{ "jwt": { "token": "<JWT>", "expiresAt": "<ISO date>" } }
```
Le front retire 10 s à `expiresAt` pour rafraîchir en avance.

### 3. `POST /App/lightRequest`  (api) — **EFFET RÉEL : allume l'éclairage public**
Headers : `Content-Type: application/json`, `Accept: application/json`
Body :
```json
{ "latitude": 49.305, "longitude": 1.157, "token": "<JWT>" }
```
- Renvoyé immédiatement puis **toutes les 5 s** tant que la minuterie tourne.
- `401` → ré-authentifier puis réessayer une fois.

### 4. `POST /App/PlaceRequest`  (api) — demande d'équipement d'une ville non couverte
Body :
```json
{ "idUser": "<userId>", "latitude": 49.3, "longitude": 1.1 }
```

## Flux nominal (allumage)

1. `getAppConfig(lat,lng)` → ville + zones + minuterie.
2. Tester l'appartenance à une zone **active** (point-in-polygon + horaires courants).
3. Clic ampoule (si dans zone active) → `authenticate()` → `sendLightRequest()`.
4. Répéter `lightRequest` toutes les 5 s ; minuterie visuelle = `tempsMinuterie - 15`.
5. Ré-auth automatique sur 401 / expiration JWT.

## Logique géométrique côté client (à reproduire)

- `distance()` : Haversine (km).
- `isPointInPolygon()` : ray casting.
- `isZoneActiveNow()` : compare l'heure courante aux plages, gère le passage minuit.
- `isInCityLimits()` : point-in-polygon sur `geoJsonLimites`.

## Implications pour les lunettes (Meta Ray-Ban Display)

- Pas de carte Leaflet interactive lourde : l'écran 600×600 et la nav spatiale invitent à une UI minimaliste (état ville + grosse ampoule + minuterie).
- Géoloc : `navigator.geolocation.watchPosition` (à valider sur le navigateur des lunettes).
- Tout le reste (auth anonyme, lightRequest périodique) est reproductible tel quel via `fetch`.

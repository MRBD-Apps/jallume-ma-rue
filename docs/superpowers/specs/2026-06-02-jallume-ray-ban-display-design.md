# « J'allume ma rue » pour Meta Ray-Ban Display — Design

Date : 2026-06-02
Statut : validé (design), en attente de revue de la spec

## Contexte

Adapter le service [jallume.fr](https://jallume.fr/) (« J'allume ma rue » — allumage de
l'éclairage public à la demande par géolocalisation) en une application web pour
**Meta Ray-Ban Display** (écran 600×600, navigation spatiale au temple tactile).

L'API du service a été rétro-conçue et documentée dans
[`docs/research/jallume-api-reverse.md`](../../research/jallume-api-reverse.md). Le pattern
de carte s'inspire de l'app glasses **Herald · Maps** (Leaflet plein écran, tuiles sombres,
contrôles à l'écran pilotés au D-pad).

## Décisions cadre

| Sujet | Décision |
|---|---|
| Stack | React 19 + Vite + TypeScript + Tailwind v4 + `mrbd-ui-kit` |
| Carte | `react-leaflet` + tuiles CartoDB `dark_all`, pattern Herald |
| Géolocalisation | GPS réel du navigateur (`navigator.geolocation.watchPosition`) |
| Périmètre | Complet : cœur + carte + bannières + demande d'équipement + thèmes |
| Déploiement / test device | Skills `meta-wearables-webapp` (Vercel, HTTPS requis pour la géoloc) |
| Mode démo | ON par défaut ; simule `lightRequest` sans allumer de vrais lampadaires |
| Thème | Toggle clair/sombre conservé, défaut **sombre** (écran additif) |
| Allumage réel | Confirmation par 2ᵉ appui quand le mode démo est OFF |

## Objectifs / non-objectifs

**Objectifs**
- Reproduire fidèlement le flux d'allumage de jallume.fr, mains-libres, sur les lunettes.
- UI lisible sur 600×600, entièrement navigable au D-pad (Flèches / Enter / Échap).
- Intégration réelle avec l'API jallume (auth anonyme, config, lightRequest périodique).

**Non-objectifs**
- Pas de compte / pas de profil (l'identité reste un `userId` anonyme local).
- Pas de réécriture de l'API jallume ; on consomme l'existant.
- Pas de support hors-ligne complet (la géoloc et l'allumage nécessitent le réseau).

## Architecture & modules

```
src/
  api/
    types.ts        # Config, Ville, Zone, Horaires, Bandeau, JwtResponse…
    client.ts       # getConfig, authenticate, lightRequest, placeRequest
  geo/
    distance.ts     # haversine (km)
    polygon.ts      # pointInPolygon (ray casting), isInCityLimits
    schedule.ts     # isZoneActiveNow (gère plage à cheval sur minuit)
    geojson.ts      # parseGeoJsonLimites (Polygon / MultiPolygon, [lng,lat])
  hooks/
    useUserId.ts        # localStorage "idUtilisateur", génération si absent
    useGeolocation.ts   # watchPosition → { coords, accuracy, error }
    useJallume.ts       # orchestrateur : config, zone, auth, boucle d'allumage, minuterie
  state/
    machine.ts      # états : locating → cityLoaded → (outOfZone|outOfHours|inActiveZone)
                    #         → lighting → expired ; + cityNotEquipped, positionUnknown
  screens/
    MainScreen.tsx
    MapScreen.tsx
    SettingsScreen.tsx
  components/
    BulbButton.tsx      # Focusable + anneau de progression minuterie
    StatusHeader.tsx    # nom ville + libellé de statut
    CityBanner.tsx      # config.bandeaux[0]
    ZoneStatusCard.tsx  # messages hors zone / hors horaire / ville non équipée
    NavBar.tsx          # navigation entre écrans (spatiale)
  fixtures/
    pont-de-larche.config.json   # réponse Config réelle capturée (tests + mode démo)
  config.ts         # constantes (URLs, timers, seuils)
  App.tsx           # DisplayRoot + routing d'écrans + providers
```

**Principes d'isolation** : chaque module a une responsabilité unique et testable. `geo/` et
`api/` sont des fonctions pures / clients sans état (faciles à tester en isolation).
`useJallume` est le seul point qui orchestre l'état complexe ; les écrans sont présentationnels.

## API consommée (rappel)

Détails complets : `docs/research/jallume-api-reverse.md`.

| Endpoint | Méthode | Corps / params | Rôle |
|---|---|---|---|
| `https://api.jallume.fr/App/Config/{lat}&{lng}` | GET | path `lat&lng` | ville, zones, minuterie, bannières |
| `https://auth.jallume.fr/Auth/JallumeToken` | POST | `{id, idVille}` | JWT anonyme |
| `https://api.jallume.fr/App/lightRequest` | POST | `{latitude, longitude, token}` | **allume réellement** |
| `https://api.jallume.fr/App/PlaceRequest` | POST | `{idUser, latitude, longitude}` | demande d'équipement |

Constantes : minuterie par défaut 300 s (l'API fournit `tempsMinuterie`, ex. 900 s),
seuil de déplacement 50 m, renvoi `lightRequest` toutes les 5 s, décompte visuel
`tempsMinuterie − 15`.

## Machine d'états (cœur)

```
positionUnknown ─(GPS ok)→ locating ─(config)→ cityLoaded
cityLoaded ─(ville sans id)→ cityNotEquipped
cityLoaded ─(dans zone active)→ inActiveZone
cityLoaded ─(dans zone, hors horaire)→ outOfHours
cityLoaded ─(hors zone)→ outOfZone
inActiveZone ─(appui ampoule)→ lighting ─(timer→0)→ expired ─(reste en zone)→ inActiveZone
```
- La position est ré-évaluée à chaque update GPS significatif (> 50 m) ; un changement de
  ville/zone recharge la config et réinitialise l'état d'allumage.
- En `lighting`, `lightRequest` est renvoyé toutes les 5 s ; ré-auth automatique sur 401 ou
  expiration du JWT, avec un seul retry.

## Écrans

### MainScreen (focus par défaut)
- `StatusHeader` : nom de ville + libellé de statut.
- `BulbButton` central (`Focusable`) : grande ampoule avec anneau de progression ; états
  allumé / éteint / désactivé. En `lighting`, affiche le temps restant (`Xm YYs`).
- `CityBanner` si `bandeaux[0].actif`.
- `ZoneStatusCard` selon le sous-état (hors zone, hors horaire, ville non équipée).
- Ville non équipée : `BulbButton` désactivé → action *Demander l'équipement* (`PlaceRequest`,
  une seule fois par session).

### MapScreen (pattern Herald)
- Leaflet plein écran : `L.map(el, { zoomControl:false, attributionControl:false })`,
  tuiles `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`.
- Contrôles à l'écran `Focusable` : **zoom +**, **zoom −**, **recentrer** (re-locate).
- Position : `circleMarker` central + anneau de précision (rayon = `accuracy`).
- Zones : polygones (actives = trait vif / inactives = pointillés) ; limites de ville en
  pointillés. Recalcul de l'activité des zones à chaque minute.
- `map.invalidateSize()` à l'entrée de l'écran (piège Leaflet : taille périmée sinon).

### SettingsScreen
- Toggle **thème** clair/sombre (défaut sombre).
- Toggle **Mode démo** (ON par défaut).
- Lien d'aide / à propos.

## Mode démo (garde-fou)

`lightRequest` a un effet réel (allume des lampadaires). En **mode démo** (ON par défaut) :
- `authenticate` et `lightRequest` ne touchent pas l'API : ils sont simulés (log + minuterie),
  on peut donc valider toute la chaîne d'UI sans allumer la rue.
- `getConfig` reste réel (lecture seule) — ou peut utiliser la fixture si le GPS est hors zone.

Quand le mode démo est **OFF** :
- Premier appui sur l'ampoule en zone active → demande de **confirmation** (2ᵉ appui dans un
  court délai) avant d'émettre le vrai `lightRequest`.

## Gestion d'erreurs

| Cas | Comportement |
|---|---|
| Géoloc non supportée / refusée | Écran *Position non détectée* + instructions ; pas de crash |
| `getConfig` échoue | Repli *Ville non équipée* (comme l'original), ampoule désactivée |
| `lightRequest` 401 | Ré-auth puis un seul retry ; échec persistant → toast d'erreur |
| Erreur réseau générique | Toast/message, conservation du dernier état connu |
| Ville non équipée, appui | `PlaceRequest` une fois + message d'information |

## Navigation spatiale

- Modèle D-pad : Flèches (déplacement de focus / pagination), Enter (activer), Échap (retour).
- Focus par défaut : `BulbButton` sur MainScreen.
- `NavBar` permet de passer Main ↔ Map ↔ Settings via la navigation spatiale.
- Contraintes matérielles (du `mrbd-ui-kit`) : typo grasse, pas de drop-shadow, contrastes
  forts, `text-box-trim` pour l'alignement pixel-perfect.

## Tests (TDD)

**Unitaires (purs, prioritaires)**
- `geo/distance` : haversine sur points connus.
- `geo/polygon` : point-in-polygon (dedans/dehors/bord), `isInCityLimits`.
- `geo/schedule` : `isZoneActiveNow` — plage normale, plage à cheval sur minuit, sans horaires.
- `geo/geojson` : parse `Polygon` et `MultiPolygon`, ordre `[lng,lat]`.
- `api/client` : `fetch` mocké, formats de corps/headers, gestion 401 → retry.

**Fixtures** : `pont-de-larche.config.json` (réponse réelle capturée) pour les tests de zone
et le mode démo.

**Intégration / device** : test sur les lunettes via le skill `test-on-device` (HTTPS requis).
Le mode démo permet de dérouler tout le flux d'allumage **sans allumer la rue**.

## Risques & points à valider sur device

- Le navigateur des lunettes expose-t-il bien `navigator.geolocation` ? (à valider tôt ;
  repli : message d'instruction, et le mode démo + fixture permettent d'avancer sans GPS).
- Poids de `react-leaflet` sur le navigateur des lunettes — surveiller la fluidité ; sinon,
  repli possible vers une carte plus légère.
- CORS sur `api.jallume.fr` / `auth.jallume.fr` depuis l'origine Vercel — à vérifier (le site
  original appelle ces mêmes endpoints depuis le navigateur, donc *a priori* permissif).

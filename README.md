# J'allume ma rue · Meta Ray-Ban Display

Allumez l'éclairage public **à la demande**, **mains-libres**, depuis vos **Meta Ray-Ban Display**.

Cette application est un client **non officiel** et indépendant du service français
[« J'allume ma rue »](https://jallume.fr/) (édité par Photon Group). Elle reprend le geste
essentiel — détecter votre commune, vérifier si vous êtes dans une zone d'éclairage active,
et déclencher l'allumage qui vous suit dans vos déplacements — dans une interface pensée pour
l'écran 600×600 et la navigation spatiale des lunettes.

> ⚠️ Le bouton d'allumage déclenche l'**éclairage public réel** via l'API publique de
> jallume.fr, et uniquement dans les communes équipées et pendant les plages horaires
> définies par chaque zone. Projet communautaire, **non affilié** à Photon Group / « J'allume ma rue ».

## 📲 Installer sur les lunettes

Ouvrez ce lien pour ajouter l'app à vos Meta Ray-Ban Display :

```
fb-viewapp://web_app_deep_link?appName=J%27allume%20ma%20rue&appUrl=https%3A%2F%2Fjallume-rbmd.vercel.app%2F
```

Ou directement dans le navigateur des lunettes : **https://jallume-rbmd.vercel.app**

## ✨ Fonctionnalités

- **Détection automatique** de la commune et des zones d'éclairage (API jallume.fr).
- **Ampoule** centrale : un appui authentifie et envoie la requête d'allumage, renvoyée
  toutes les 5 s pour que la lumière vous suive (comme le service officiel).
- **Statuts clairs** : position non détectée, ville non équipée, hors zone, hors horaire, prêt.
- **Carte** façon HUD : tuiles sombres, **zones compatibles** (actives/inactives selon les
  horaires) et **contour de la commune**, contrôles zoom/recentrage pilotables au D-pad.
- 100 % **navigation spatiale** (flèches / temple tactile + Entrée), aucune interaction souris requise.

## 🛠️ Stack technique

- [React 19](https://react.dev/) + [Vite](https://vite.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [`mrbd-ui-kit`](https://github.com/michaelcummings12/mrbd-ui-kit) — composants & moteur de
  focus dédiés au Meta Ray-Ban Display (`DisplayRoot`, `Button`, `Text`, `Card`, `Focusable`)
- [Leaflet](https://leafletjs.com/) / [react-leaflet](https://react-leaflet.js.org/) + tuiles CartoDB
- [Vitest](https://vitest.dev/) + Testing Library

## 🚀 Développement

```bash
npm install
npm run dev        # serveur de dev (http://localhost:5173)
npm run test       # tests unitaires (Vitest)
npm run build      # build de production (dist/)
```

> La géolocalisation nécessite un contexte **HTTPS** (ou localhost). Pour tester une commune
> équipée, vous pouvez simuler une position dans les DevTools du navigateur
> (ex. Cergy : `49.0364, 2.0582`).

## 🔍 Comment ça marche

1. `navigator.geolocation.watchPosition` fournit la position.
2. `GET https://api.jallume.fr/App/Config/{lat}&{lng}` renvoie la commune, les zones
   (polygones + horaires) et la minuterie.
3. Le statut est calculé côté client (point-in-polygon + plage horaire, gestion du passage de minuit).
4. En zone active, l'appui sur l'ampoule : `POST /Auth/JallumeToken` (JWT anonyme) puis
   `POST /App/lightRequest` (immédiat, répété toutes les 5 s) — l'éclairage suit l'utilisateur.

Aucun compte n'est requis : l'identité est un identifiant anonyme stocké localement.

## 🙏 Crédits

- Service & API : [J'allume ma rue](https://jallume.fr/) (Photon Group)
- UI kit : [`mrbd-ui-kit`](https://github.com/michaelcummings12/mrbd-ui-kit) de Michael Cummings
- Inspiration carte glasses : [Herald](https://herald.ascents.gg/)

## 📄 Licence

[MIT](./LICENSE)

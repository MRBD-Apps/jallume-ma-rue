# J'allume ma rue · Meta Ray-Ban Display

Turn on public street lighting **on demand**, **hands-free**, from your **Meta Ray-Ban Display**.

This is an **unofficial**, independent client for the French service
[« J'allume ma rue »](https://jallume.fr/) (operated by Photon Group). It reproduces the core
gesture — detect your town, check whether you stand in an active lighting zone, and trigger the
lighting that follows you as you move — in an interface built for the 600×600 display and the
glasses' spatial navigation.

> The app UI is in **French** on purpose: the underlying service only covers **French towns**.

> ⚠️ The light button triggers **real public street lighting** through jallume.fr's public API,
> only in equipped towns and during each zone's configured time window. Community project,
> **not affiliated** with Photon Group / « J'allume ma rue ».

## 📲 Install on the glasses

Open this link to add the app to your Meta Ray-Ban Display:

```
fb-viewapp://web_app_deep_link?appName=J%27allume%20ma%20rue&appUrl=https%3A%2F%2Fjallume-rbmd.vercel.app%2F
```

Or open it directly in the glasses' browser: **https://jallume-rbmd.vercel.app**

## ✨ Features

- **Automatic detection** of the town and lighting zones (jallume.fr API).
- **Central bulb**: one press authenticates and sends the lighting request, re-sent every 5 s so
  the light follows you (same behaviour as the official service).
- **Clear states**: location unknown, town not equipped, out of zone, out of hours, ready.
- **HUD-style map**: dark tiles, **compatible zones** (active/inactive by schedule) and the
  **town boundary**, with zoom/recenter controls driven by the D-pad.
- Fully **spatial navigation** (arrows / temple touchpad + Enter), no mouse interaction required.

## 🛠️ Tech stack

- [React 19](https://react.dev/) + [Vite](https://vite.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [`mrbd-ui-kit`](https://github.com/michaelcummings12/mrbd-ui-kit) — components & focus engine
  built for the Meta Ray-Ban Display (`DisplayRoot`, `Button`, `Text`, `Card`, `Focusable`)
- [Leaflet](https://leafletjs.com/) / [react-leaflet](https://react-leaflet.js.org/) with CartoDB tiles
- [Vitest](https://vitest.dev/) + Testing Library

## 🚀 Development

```bash
npm install
npm run dev        # dev server (http://localhost:5173)
npm run test       # unit tests (Vitest)
npm run build      # production build (dist/)
```

> Geolocation requires an **HTTPS** context (or localhost). To test an equipped town, you can
> simulate a position in your browser DevTools (e.g. Cergy: `49.0364, 2.0582`).

## 🔍 How it works

1. `navigator.geolocation.watchPosition` provides the position.
2. `GET https://api.jallume.fr/App/Config/{lat}&{lng}` returns the town, the zones
   (polygons + schedules) and the timer.
3. The status is computed client-side (point-in-polygon + time window, with midnight wrap-around).
4. In an active zone, pressing the bulb runs `POST /Auth/JallumeToken` (anonymous JWT) then
   `POST /App/lightRequest` (immediately, repeated every 5 s) — the lighting follows the user.

No account is required: identity is an anonymous id stored locally.

## 🙏 Credits

- Service & API: [J'allume ma rue](https://jallume.fr/) (Photon Group)
- UI kit: [`mrbd-ui-kit`](https://github.com/michaelcummings12/mrbd-ui-kit) by Michael Cummings
- Glasses map inspiration: [Herald](https://herald.ascents.gg/)

## 📄 License

[MIT](./LICENSE)

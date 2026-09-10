# LU Links Frontend

Vanilla HTML, CSS, and JavaScript UI for LU Links. The Go server serves these files (or `dist/` after a Vite build).

## Structure

- `index.html` — main SPA shell (`data-i18n*` attributes for static copy)
- `main.js` — bootstrap and event wiring
- `js/` — feature modules (`data.js`, `home.js`, `mobile-home.js`, `admin.js`, `i18n.js`, `prefs.js`, …)
- `styles/` — CSS (`app.css` imports the rest: `variables`, `layout`, `components`, `admin`, `responsive`, `skeleton`)
- `public/` — static assets copied as-is into the build (favicon, PWA icons, webmanifest)

## Features

- Faculty → campus → specialisation browse (desktop filters + mobile pick cards)
- Course search, favorites, report / contribute, feedback / suggestion
- Tips (incl. [Telegram contributing guide](https://t.me/LU_Links_Contributing_Guide)) and extra resources
- Admin panel (structure, courses, analytics, students, inbox) — always English / LTR
- **i18n:** English, French, Arabic catalogs in `js/i18n.js`; Arabic sets `dir="rtl"` on `<html>`
- Theme: system / light / dark (`js/prefs.js`)
- PWA manifest + service worker in production builds

## Internationalization

- Student-facing strings live in `js/i18n.js` (`eng` / `fr` / `ar`).
- Static HTML uses `data-i18n`, `data-i18n-html`, `data-i18n-placeholder`, `data-i18n-title`, `data-i18n-aria`.
- Dynamic UI calls `t("key")` (and `tf` for placeholders).
- `applyLanguagePreference` / `refreshLocalizedUI` re-paint after a language change.
- Navbar keeps logo left even in Arabic (`nav { direction: ltr }`); the mobile drawer right-aligns labels and prefs under `html[dir="rtl"]`.
- Admin views (`#view-admin`, `#view-admin-gate`) force `direction: ltr` so the dashboard does not mirror.

## Development

**Recommended daily loop** (from repo root) — Air + Vite, CSS/JS update instantly:

```bash
make dev
# API http://localhost:8080  ·  UI http://localhost:5173
```

**Vite only** (from `frontend/`, proxies `/api` and SEO routes to the Go server on `:8080`):

```bash
npm ci && npm run dev
# → http://localhost:5173
```

**Docker watch** rebuilds the full image when `frontend/` changes (~30–40s). Prefer `make dev` for UI work; after a Docker rebuild, hard-refresh (PWA may cache hashed CSS).

**Served by Go** (no frontend build; uses source files when `dist/` is absent):

```bash
# from repo root
go run ./cmd/server
# → http://localhost:8080
```

**Checks:**

```bash
npm run lint
npm test
npm run build
```

API calls use relative paths (`/api/...`).

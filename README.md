# LU Links

Course materials hub for **Lebanese University** — faculties, campuses, and specialisations — served by a **production Go API**.

[![CI](https://github.com/MohamadObeid9/LU_Links/actions/workflows/ci.yml/badge.svg)](https://github.com/MohamadObeid9/LU_Links/actions/workflows/ci.yml)
![Go](https://img.shields.io/badge/Go-1.25-00ADD8?logo=go&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/mohamadobeid9/lu_links)

**[LU Links](https://lu-links.onrender.com/)** · [User guide](docs/user-guide.md) · [ADRs](docs/adr/) · [Contributing](CONTRIBUTING.md)

## Quick start

```bash
git clone https://github.com/MohamadObeid9/LU_Links.git && cd LU_Links
cp .env.example .env   # fill DATABASE_URL, JWT_SECRET, Supabase keys
make dev               # API :8080 + Vite UI :5173 (recommended)
# or: go run ./cmd/server   → http://localhost:8080
```

## Overview

LU Links centralizes course materials (Google Drive, Classroom, Telegram, and more) by **faculty → campus → specialisation**, then year and semester. The UI is available in **English, French, and Arabic** (Arabic uses RTL; the admin dashboard stays English / LTR). The backend is Go (`net/http`, layered architecture); the frontend is vanilla JS with Vite. Production runs as Docker on Render with CI-gated deploys.

Using the app? See the [user guide](docs/user-guide.md). Hierarchy design: [ADR 011](docs/adr/011-lu-academic-hierarchy.md).

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript, Vite |
| **Backend** | Go 1.25 (`net/http`, no web framework) |
| **Database** | PostgreSQL via Supabase |
| **Auth** | Supabase Auth at login → app-issued JWT for admin routes |
| **Observability** | `slog`, Prometheus `/metrics`, Grafana, `/healthz`, `/readyz` |
| **CDN** | Cloudflare (static assets + `/api/content`) |
| **Deployment** | Render (Docker) + Supabase |
| **CI** | GitHub Actions — test, lint, govulncheck, frontend build, `docker build` |

---

## Architecture

Layered backend: HTTP handlers stay thin; business rules live in services; SQL lives in repositories.

```text
HTTP request
  → middleware (CORS, request ID, metrics, rate limit, recovery, security headers)
  → handler (internal/api)
  → service (internal/service)
  → repository (internal/repository)
  → PostgreSQL (Supabase)
```

The Go server also:

- Serves the built frontend from `frontend/dist` (or `frontend/` source in local dev when `dist/` is absent)
- Renders SSR SEO pages for `/course/{code}`, `/program/{slug}` (faculty/offering pages), `/courses`, sitemap, and robots.txt
- Exposes a JSON API under `/api/*` — see `GET /api` for a live endpoint directory
- Go module path is `lu-links` (`go.mod`)
- Shuts down gracefully on `SIGTERM`/`SIGINT` (waits for in-flight requests, then closes the DB pool)

Production traffic hits **Cloudflare** first: hashed static files and `GET /api/content` are cached at the edge. A 10-minute cron ping keeps `/api/content` warm. Origin also keeps a 60s in-memory copy (`singleflight` on miss) so a flood that skips the CDN does not run the JSON aggregation once per request. k6 against that origin (2026-09-01): 50-VU normal load p95 **1.53 ms** (100% 200); burst **~17k req/s** with 99.93% 429s and p95 of allowed 200s **8.91 ms**. Same-day uncached normal p95 was **4.91 s**. Details: [`docs/load-test.md`](docs/load-test.md).

**Deploy pipeline:**

```text
PR → GitHub Actions (test, lint, govulncheck, docker build) → merge main → Render (checksPass) → production (LU Links)
```

Deep dives: [`docs/adr/`](docs/adr/) · [`docs/learnings/`](docs/learnings/)

---

## Project structure

```text
LU_Links/
├── cmd/server/           # Entry point (HTTP timeouts + graceful shutdown)
├── cmd/seed/             # Load an admin backup JSON into local Postgres
├── internal/
│   ├── api/              # Router, handlers, JSON helpers
│   ├── service/          # Validation and business logic
│   ├── repository/       # Postgres queries behind interfaces
│   ├── middleware/       # Auth, rate limit, metrics, logging, recovery
│   ├── seo/              # Server-side SEO page rendering
│   ├── config/           # Environment configuration
│   ├── database/         # DB client (pgx)
│   ├── models/           # Shared domain types
│   ├── device/           # User-Agent → phone/laptop classification
│   ├── webbotauth/       # Web Bot Auth JWKS + HTTP Message Signatures
│   └── errs/             # Sentinel errors
├── frontend/             # Vanilla JS SPA (Vite for dev/build; i18n eng/fr/ar)
├── db/
│   ├── migrations/       # Versioned Postgres schema (golang-migrate + schema.sql snapshot)
│   └── README.md         # How to apply migrations locally and in CI
├── docs/
│   ├── adr/              # Architecture Decision Records
│   ├── learnings/        # Per-package engineering notes
│   ├── load-test.md      # k6 results for GET /api/content
│   └── user-guide.md     # Student and admin walkthrough
├── Dockerfile            # Multi-stage: Node build → Go build → distroless
├── docker-compose.yml    # Local Postgres + migrate + seed + app
├── Makefile              # make dev | watch | up | down | rebuild
├── .air.toml             # Go hot-reload config
└── .env.example          # Required environment variables
```

---

## Getting started

### Prerequisites

- **Git**
- **Go 1.25+** ([go.mod](go.mod))
- **Node.js 20+** (frontend build and Vite dev server)
- **Supabase project** with a Postgres connection string
- **Docker & Docker Compose v2.22+** (optional, for containerized dev)
- **[Air](https://github.com/air-verse/air)** (optional, for Go hot reload — used by `make dev`)

### Environment

Copy [`.env.example`](.env.example) to `.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase Postgres connection string |
| `JWT_SECRET` | Yes | Secret for signing admin JWTs |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon/public key (admin login) |
| `PORT` | No | Default `8080` |
| `APP_ENV` | No | `development` or `production` |
| `SITE_BASE_URL` | No | Canonical URL for SEO/sitemap |
| `CORS_ALLOWED_ORIGINS` | No | Comma-separated origins for local Vite dev |
| `METRICS_BASIC_AUTH_*` | Prod only | Required when `APP_ENV=production` |

### Run locally

**Recommended** — API + Vite (instant HTML/CSS/JS):

```bash
make dev
# → API http://localhost:8080  ·  UI http://localhost:5173
```

**Single port** — no frontend build needed (serves `frontend/` source when `dist/` is absent):

```bash
go run ./cmd/server
# → http://localhost:8080
```

**Production-like assets** — includes PWA manifest and service worker:

```bash
cd frontend && npm ci && npm run build && cd ..
go run ./cmd/server
```

---

## Development

Pick the workflow that matches what you're changing.

| Goal | Command |
|------|---------|
| Daily UI / API coding | `make dev` (Air + Vite on :5173) |
| API work, single port | `go run ./cmd/server` |
| Full stack in Docker, auto-rebuild | `make watch` |
| First run / Dockerfile changed | `make rebuild` |
| Verify container builds once | `make build` |
| Match CI image build | `docker build -t lu-links:local .` |
| Stop Docker stack | `make down` |

### Native (recommended for daily coding)

```bash
make dev
```

Or two terminals: `air` (or `go run ./cmd/server`) on **8080**, and `npm --prefix frontend run dev` on **5173**. Use **5173** while editing HTML/CSS/JS.

### Docker (local app + local Postgres)

Requires Docker Compose v2.22+ (for `watch`). Starts Postgres, applies `db/migrations`, seeds `db/test-data.json` if the DB is empty, then the app.

```bash
make up
# or: COMPOSE_DISABLE_ENV_FILE=1 docker compose up
# → http://localhost:8080
```

Seeding uses `-if-empty` so later `up` does not wipe local edits. Wipe and re-seed with `docker compose down -v` then `up` again.

`COMPOSE_DISABLE_ENV_FILE=1` stops Compose from treating `$` in `.env` (for example a Supabase password) as a variable. The app still loads `.env` with `format: raw`. Or run `make up` / `make watch` (Makefile sets this).

`APP_ENV=development` uses `LOCAL_DATABASE_URL` pointing at the `db` service. `.env` still supplies JWT and Supabase Auth keys. Postgres is published on host `5432` as well (`postgres://postgres:postgres@localhost:5432/lu_links?sslmode=disable`) for `air` / `go run` against the same local database.

**Watch (rebuild app image on Go/frontend changes):**

```bash
make watch
```

Frontend changes trigger a **full image rebuild** (~30–40s). Prefer `make dev` for CSS/JS iteration. After a Docker rebuild, hard-refresh the browser (PWA may cache hashed assets).

Restart cleanly:

```bash
make down
make watch   # or: make rebuild
```

**Build image only (same as CI):**

```bash
docker build -t lu-links:local .
docker run --rm -p 8080:8080 --env-file .env lu-links:local
```

---

## Testing & CI

```bash
go test -race ./cmd/... ./internal/...
golangci-lint run ./cmd/... ./internal/...
cd frontend && npm ci && npm run lint && npm test && npm run build
docker build -t lu-links:local .
```

**Integration tests** (real Postgres — repo + HTTP flows):

```bash
# Start Postgres and apply migrations (see db/README.md)
export INTEGRATION_DATABASE_URL="postgres://postgres:postgres@localhost:5432/lu_links?sslmode=disable"
migrate -path db/migrations -database "$INTEGRATION_DATABASE_URL" up
go test -tags=integration -race ./internal/integration/...
```

CI runs on every push/PR: Go build, unit tests with coverage, Postgres migrations, integration tests, golangci-lint, govulncheck, frontend lint/test/build, and `docker build`. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

`main` is branch-protected — all CI jobs must pass before merge. Render deploys only after those checks pass.

---

## Deployment

Single Docker web service on [Render](https://render.com):

| Setting | Value |
|---------|-------|
| **Runtime** | Docker (`dockerfilePath: ./Dockerfile`) |
| **Start** | `ENTRYPOINT ["/server"]` |
| **Health check** | `GET /readyz` |
| **Auto-deploy** | On merge to `main`, only when CI checks pass |
| **Site** | [LU Links](https://lu-links.onrender.com/) (production hostname via `SITE_BASE_URL`) |
| **CDN** | Cloudflare in front of Render |

The [Dockerfile](Dockerfile) is multi-stage: Node builds `frontend/dist`, Go compiles the server, final image runs on distroless as non-root. CI runs the same `docker build` before Render deploys — what is tested is what ships.

On deploy, Render sends `SIGTERM`. The server stops accepting new connections, drains in-flight requests (10s budget), then closes the database pool.

`GET /api/content` is publicly cacheable (`max-age=60`, `stale-while-revalidate=600`). Cloudflare serves most student hits; a cron request every 10 minutes keeps that cache warm. Grafana showed p95/p99 drop from multi-second spikes to a stable sub-500ms band after this went live (21 Aug 2026). Origin also caches the same JSON in process (60s TTL). Origin-only k6 after that change: normal p95 **1.53 ms**, burst ~**17,009 req/s** ([`docs/load-test.md`](docs/load-test.md)).

Set environment variables in the Render dashboard (see [`.env.example`](.env.example)). In production, `APP_ENV=production` and metrics basic auth are required for `/metrics`.

---

## Documentation

| Resource | Description |
|----------|-------------|
| [`docs/adr/`](docs/adr/) | Architecture Decision Records |
| [`docs/learnings/`](docs/learnings/) | Engineering notes per package |
| [`docs/load-test.md`](docs/load-test.md) | k6 load test results |
| [`docs/user-guide.md`](docs/user-guide.md) | Student and admin walkthrough |
| [`docs/roadmap.md`](docs/roadmap.md) | Milestones and planned work |
| [`frontend/README.md`](frontend/README.md) | Frontend layout |
| [DEV — origin story](https://dev.to/mohamadobeid9/i-built-a-free-course-resource-platform-for-my-university-heres-the-real-story-1645) | How the project started |
| [DEV — Go rebuild](https://dev.to/mohamadobeid9/from-supabase-only-to-production-go-month-1-of-rebuilding-info-links-3a4p) | Backend migration write-up |

---

## Contributing

Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Security issues: [SECURITY.md](SECURITY.md).

---

## Connect

- **Live site** — [LU Links](https://lu-links.onrender.com/)
- **GitHub** — [MohamadObeid9/LU_Links](https://github.com/MohamadObeid9/LU_Links)
- **Telegram channel** — [@LU_Links9](https://t.me/LU_Links9)
- **Contributing guide** — [Telegram](https://t.me/LU_Links_Contributing_Guide)
- **LinkedIn** — [MohamadObeid9](https://www.linkedin.com/in/mohamadobeid9/)

---

## License

MIT — see [LICENSE](LICENSE).

Built by students, for students.

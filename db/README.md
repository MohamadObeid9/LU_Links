# Database schema

The LU Links Postgres schema is **versioned in this repo** instead of living only in the Supabase dashboard. That makes schema changes reviewable in PRs, reproducible across environments, and ready for CI integration tests against real Postgres.

See [ADR 007: Versioned schema migrations](../docs/adr/007-versioned-schema-migrations.md) for the rationale. Hierarchy: [ADR 011](../docs/adr/011-lu-academic-hierarchy.md).

## Layout

```text
db/
└── migrations/
    ├── schema.sql                      # Reference snapshot (read-only diff)
    ├── 000001_initial_schema.up.sql    # Executable bootstrap (golang-migrate)
    ├── 000002_link_clicks_support_extra_links.up.sql
    ├── 000003_normalize_schema_style.up.sql
    ├── 000004_add_user_system.up.sql
    ├── 000005_add_cascade_deletes_to_foreign_keys.up.sql
    ├── 000006_add_page_views_device_type.up.sql
    ├── 000007_add_rejected_feedback_status.up.sql
    ├── 000008_add_search_and_browse_events.up.sql
    ├── 000009_canonical_courses_and_placements.up.sql
    ├── 000010_lu_hierarchy.up.sql
    ├── 000011_suggestions.up.sql
    └── 000012_hierarchy_name_ar.up.sql
```

- **`schema.sql`** — human-readable export for review and diffs; not meant to be executed directly.
- **`000001_*.sql` …** — ordered migrations applied by [golang-migrate](https://github.com/golang-migrate/migrate) on fresh databases (local Docker, CI).

**Current content model** (from `000010` + `000011`):

- Faculties → Branches (campuses) → Specialisations → **Branch×Specialisation offerings** → Years → Semesters → Courses → Links
- Hierarchy labels (`faculties`, `branches`, `specialisations`) may include optional `name_ar`; empty falls back to English `name` in the UI
- Links carry a `languages` JSON array (`ar` / `fr` / `en`)
- `suggestions` table for student improvement ideas (status `new` / `read` / `rejected`)

Older migrations still mention `programs` / `course_placements`; those shapes are replaced by `000010`. `name_ar` columns are added in `000012`.

## Prerequisites

Install the migrate CLI:

```bash
# macOS
brew install golang-migrate

# Linux (curl)
curl -L https://github.com/golang-migrate/migrate/releases/download/v4.18.3/migrate.linux-amd64.tar.gz | tar xvz
sudo mv migrate /usr/local/bin/
```

## Apply migrations

```bash
export DATABASE_URL="postgres://user:pass@host:5432/dbname?sslmode=disable"

migrate -path db/migrations -database "$DATABASE_URL" up
```

Check version:

```bash
migrate -path db/migrations -database "$DATABASE_URL" version
```

Rollback one step (dev/CI only):

```bash
migrate -path db/migrations -database "$DATABASE_URL" down 1
```

**Production (Supabase):** existing databases already have this schema. Do not run `000001` against prod unless bootstrapping a new empty database. Future changes use the next numbered migration.

## Tables

Application-owned tables (post–LU hierarchy):

| Table | Purpose |
|-------|---------|
| `faculties` | Top-level faculties |
| `branches` | Campuses / branches |
| `faculty_branches` | Which campuses teach a faculty |
| `specialisations` | Specialisations belonging to a faculty |
| `branch_specialisations` | Offering root (campus × specialisation) |
| `years` | Academic years under an offering |
| `semesters` | Semesters within a year |
| `courses` | Courses under a semester (codes may repeat across offerings) |
| `links` | Resource links on a course (`languages` JSON) |
| `extra_sections` | Non-course link groupings |
| `extra_links` | Links inside extra sections |
| `reports` | User-submitted broken-link reports |
| `contributions` | User-submitted new link proposals |
| `feedback` | User feedback and ratings |
| `suggestions` | User improvement suggestions |
| `page_views` | Page visit analytics |
| `link_clicks` | Link click analytics |
| `search_events` | Search query analytics |
| `browse_events` | Browse-depth funnel events |
| `users` | Student identities (name + number, no password) and their current favorites |
| `favorite_events` | Append-only history of favorite add/remove actions |

**Admin** users are managed by **Supabase Auth** (ADR 002), not in this schema. The `users` table holds **students only** — a separate, password-less identity system (ADR 008).

### Student identity tables

Added in `000004_add_user_system` (see [ADR 008](../docs/adr/008-student-identity-without-passwords.md)).

`users`:

| Column | Notes |
|--------|-------|
| `id` | Primary key; survives the guest-to-student claim |
| `first_name`, `last_name` | Stored trimmed and lowercased so the unique index catches `Ali` vs `ali`; null for guests |
| `number` | 1-100, enforced by `users_number_range_chk`; null for guests |
| `is_guest` | `true` until the visitor registers and claims the row |
| `favorite_course_ids` | Current favorites set, kept for one-read "My Courses" |
| `prefered_lang` | Preference, default `eng`; CHECK allows `eng`, `fr`, `ar`. Updatable via `PATCH /api/users/me/preferences` |
| `prefered_theme` | Preference, default `system`; CHECK allows `system`, `dark`, `light`. Same PATCH endpoint |
| `created_at`, `last_seen_at` | First seen and last activity |

Uniqueness is a **partial index** — `users_unique_username` on `(first_name, last_name, number) WHERE is_guest = false`. Guests are exempt, so unnamed guest rows never collide. A duplicate registration raises `23505`, which the API returns as `409`.

`favorite_events` is append-only: `user_id`, `course_id`, `action` (`added` or `removed`), `created_at`, indexed on `(user_id, created_at DESC)`. It exists so the admin timeline can show favorites history; `users.favorite_course_ids` remains the live set. Both are written in the same transaction.

### `user_id` on activity tables

The same migration adds a **nullable** `user_id` FK to `users(id)` on `page_views`, `link_clicks`, `reports`, `contributions`, and `feedback`, each with a `(user_id, <timestamp> DESC)` index for admin per-user queries. `suggestions.user_id` follows the same pattern (`000011`).

Nullable is intentional: rows written before this migration are anonymous legacy data with no owner to assign. New rows always carry the id from the student JWT. Aggregate queries that count people should use `COUNT(DISTINCT user_id)` and ignore nulls; queries that count students should filter `is_guest = false`.

## Changing the schema (policy)

1. **Do not** change production schema only in the Supabase dashboard without a matching repo update.
2. Create a new numbered migration:

   ```bash
   migrate create -ext sql -dir db/migrations -seq add_some_column
   ```

3. Edit the generated `.up.sql` and `.down.sql` files.
4. Apply locally, run tests, open a PR.
5. Apply to Supabase prod, then refresh `schema.sql` so the snapshot stays in sync.

For destructive changes (drop column, rename), coordinate with a deploy that stops reading the old shape first.

**Never edit** a migration file that has already been applied to production — add a new one instead.

## Refreshing `schema.sql` from Supabase

After prod schema changes, re-export for easy diffing:

```bash
pg_dump "$DATABASE_URL" \
  --schema-only \
  --schema=public \
  --no-owner \
  --no-privileges \
  > db/migrations/schema.sql
```

Add the Supabase warning comment at the top if missing. Open a PR with the diff.

## Local development

Most contributors use a **hosted Supabase** instance via `DATABASE_URL` in `.env` (see root [README](../README.md)) for `go run` against prod-like data.

For **local Postgres** with the app in Docker (does not use `DATABASE_URL`):

```bash
make watch
# or: docker compose up --build
# schema: migrate; content: seed from db/test-data.json (skipped if already seeded)
```

Or a **Postgres-only** container (then `go run ./cmd/server` with `APP_ENV=development`):

```bash
docker run --rm -d --name lu-links-pg \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=lu_links \
  -p 5432:5432 postgres:16-alpine

export DATABASE_URL="postgres://postgres:postgres@localhost:5432/lu_links?sslmode=disable"
migrate -path db/migrations -database "$DATABASE_URL" up
```

### Integration tests

The [`internal/integration/`](../internal/integration/) package runs against real Postgres (`//go:build integration`). CI starts Postgres, applies migrations, then runs:

```bash
INTEGRATION_DATABASE_URL="$DATABASE_URL" go test -tags=integration -race ./internal/integration/...
```

Coverage includes guest/register HTTP flows, `/readyz`, user claim SQL, and `/api/content` JSON shape.

## Seed course content

A fresh local database has the schema (after `migrate up`) but no faculties, courses, or links. Load them from an **admin backup JSON** — the same shape as **Admin → Export** (`faculties`, `branches`, `specialisations`, `branch_specialisations`, `years`, `semesters`, `courses`, `links`, `extra_sections`, `extra_links`).

Do **not** use `GET /api`. That is the welcome payload, not the course tree. `GET /api/content` or the admin Export button is the right source.

```bash
# 1. Schema (once, or after wiping the container)
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/lu_links?sslmode=disable"
migrate -path db/migrations -database "$DATABASE_URL" up

# 2. Content (re-runnable; truncates the course tree first)
go run ./cmd/seed -file db/test-data.json
```

Defaults:

- `-file` → `db/test-data.json`
- `-dsn` → `postgres://postgres:postgres@localhost:5432/lu_links?sslmode=disable`

The command refuses a non-localhost DSN unless you pass `-allow-remote`. It does **not** read `DATABASE_URL` from `.env`, so a production Supabase URL cannot be seeded by accident.

What it does:

1. Truncates `faculties`, `branches`, and `extra_sections` (`CASCADE` clears offerings, years, semesters, courses, links, extra links, clicks, and favorite events).
2. Inserts rows with their original ids so foreign keys still line up.
3. Resets identity sequences so new admin-created rows get the next id.
4. Skips `link_clicks` — older dumps may have rows that fail current checks. Student `users` and submissions are left alone.

Replace `db/test-data.json` whenever you want fresher content: download a new backup from Admin → Export and pass `-file` to that path. Those files are gitignored when named as dated backups; the committed `test-data.json` is the LU-shaped sample for Docker seed.

## Related docs

- [ADR 001: Postgres as primary database](../docs/adr/001-postgres-as-primary-database.md)
- [ADR 002: Supabase for auth and hosted Postgres](../docs/adr/002-supabase-for-auth-and-hosted-postgres.md)
- [ADR 007: Versioned schema migrations](../docs/adr/007-versioned-schema-migrations.md)
- [ADR 008: Student identity without passwords](../docs/adr/008-student-identity-without-passwords.md)
- [ADR 011: LU academic hierarchy](../docs/adr/011-lu-academic-hierarchy.md)

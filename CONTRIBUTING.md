# Contributing

Thanks for helping improve LU Links — whether you contribute course resources, bug fixes, or backend improvements.

## Contribute resources (no code)

Use **Report / Contribute** or **Feedback / Suggestion** in the live app at [LU Links](https://lu-links.onrender.com/), or read the [Telegram contributing guide](https://t.me/LU_Links_Contributing_Guide).

## Contribute code

1. **Fork** the repository and create a branch:
   ```bash
   git checkout -b fix/your-change
   ```
2. **Set up** locally — see [README — Getting started](README.md#getting-started). Prefer `make dev` for UI work.
3. **Make your changes** and run checks:
   ```bash
   go test -race ./cmd/... ./internal/...
   golangci-lint run ./cmd/... ./internal/...   # if installed locally
   INTEGRATION_DATABASE_URL=... go test -tags=integration -race ./internal/integration/...  # needs migrated Postgres
   cd frontend && npm ci && npm run lint && npm test && npm run build
   ```
4. **Open a pull request** with:
   - What changed and why
   - How you tested it
   - Screenshots for UI changes (include Arabic RTL if you touch layout)

## Guidelines

- Match existing code style and layering (`api` → `service` → `repository`)
- Add or update tests for backend logic changes
- Student-facing strings go through `frontend/js/i18n.js` (`eng` / `fr` / `ar`); do not hard-code copy in UI modules when a key already exists
- Keep the admin dashboard English / LTR
- For architectural choices, add or update an ADR in [`docs/adr/`](docs/adr/)
- Keep PRs focused — one concern per PR when possible
- Do not commit `.env` or secrets

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

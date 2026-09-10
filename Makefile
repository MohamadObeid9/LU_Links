# Docker Compose always loads project `.env` for YAML interpolation.
# DATABASE_URL may contain `$` (e.g. `$hAf` in a password); that is not a
# Compose variable. Disable the default `.env` for interpolation — the app
# still gets secrets via env_file format: raw.
export COMPOSE_DISABLE_ENV_FILE := 1

.PHONY: up down watch build rebuild dev

# Native hot reload: Air (API :8080) + Vite (UI :5173). Open http://localhost:5173 —
# leave this running; Vite picks up HTML/CSS/JS saves without restarting.
dev:
	@echo "API http://localhost:8080  ·  UI http://localhost:5173 (use this one)"
	@trap 'kill 0' INT TERM EXIT; \
	air & \
	npm --prefix frontend run dev & \
	wait

up:
	docker compose up

watch:
	docker compose up --watch

build:
	docker compose build

rebuild:
	docker compose up --build

down:
	docker compose down

# Roadmap

Project history and planned work. 

---

## Milestones

| Phase | Achievement |
|-------|-------------|
| **Phase 1** | Started with 4 courses covering basics |
| **Phase 2** | Expanded to 25+ courses |
| **Phase 3** | Reached 50+ courses with multiple resources per course |
| **Phase 4** | Serving 300+ students in under a year |
| **Phase 5** | Launched new website for better UX |
| **Phase 6** | Open-sourced project for community contributions |
| **Phase 7** | Favorites, content types, analytics, and PWA support |
| **Phase 8** | Go backend with layered architecture, observability, CI, and SEO |
| **Phase 9** | Student identity without passwords, synced favorites, and unique-user analytics |
| **Phase 10** | Agent/API discovery, graceful shutdown, integration tests, Cloudflare cache |
| **Phase 11** | Origin in-memory `/api/content` cache (`singleflight`); k6 origin p95 1.53 ms (was 4.91 s) |
| **Phase 12** | LU academic hierarchy, suggestions inbox, student UI i18n (eng / fr / ar + RTL) |

---

## Future

- [x] Advanced filtering and categorization
- [x] Personalized bookmarks (My Courses / Favorites)
- [x] Multi-language support (UI prefs: eng / fr / ar; theme: system / light / dark; Arabic RTL)
- [x] Lebanese University hierarchy (faculty → campus → specialisation offerings)
- [x] Suggestions inbox (alongside feedback)
- [x] Community rating system for resources (Feedback)
- [x] Offline mode support (PWA / Service Worker)
- [x] Production Go backend with tests and observability
- [x] Student accounts without email or password (name + number 1-100)
- [x] Guest sessions claimed at signup so pre-signup activity is kept
- [x] Favorites synced to the account instead of one browser
- [x] Unique-user analytics aggregated in SQL (active students per range, top students)
- [x] Admin Students directory with per-student activity timeline
- [x] HTTP server timeouts and graceful shutdown on SIGTERM
- [x] Postgres integration tests (repo + HTTP, CI-gated)
- [x] Cloudflare CDN cache for static assets and `GET /api/content` (kept warm with a 10-minute ping)
- [x] Origin in-memory cache for `GET /api/content` (60s TTL, `singleflight`; k6 2026-09-01: normal p95 1.53 ms, burst ~17k req/s)
- [ ] Mobile app (iOS/Android)
- [ ] Push notifications for new resources
- [ ] Course schedule integration

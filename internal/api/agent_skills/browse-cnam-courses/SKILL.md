---
name: browse-cnam-courses
description: Find Lebanese University course materials on LU Links via content API or SEO pages. Use when a student needs TD, exams, sessions, or Drive/Telegram links for a course code.
---

# Browse LU Courses

## Prefer machine-readable content

```http
GET /api/content
Accept: application/json
```

Walk `faculties` → branches / specialisations → years → semesters → `courses` → `links`. Match by `code` or course name. Each campus×specialisation offering has its own course rows.

## SEO / markdown pages

Agents that prefer stripped text:

```http
GET /courses
Accept: text/markdown

GET /course/{code}
Accept: text/markdown
```

HTML is the default without that Accept header. Course markdown includes YAML frontmatter and link lists.

## Open a link (registered student)

1. Ensure a registered student JWT (`/auth.md`).
2. `POST /api/link_clicks` with `{ "link_id": <id> }` (or `extra_link_id`).
3. Open the link URL from `/api/content` in a browser or fetch client.

## Contribute

Registered students can `POST /api/reports`, `/api/feedback`, `/api/suggestions`, or `/api/contributions` when a link is wrong or missing, or when suggesting a product improvement.

---
name: use-lu-links-api
description: Call the LU Links JSON API as a student agent — guest session, register/claim, browse content, and record analytics. Use when integrating with LU Links programmatically.
---

# Use LU Links API

LU Links is the Lebanese University course materials hub. Agents authenticate with a student JWT (not admin OAuth).

## Discover

1. Read `/auth.md` and `/.well-known/oauth-protected-resource`.
2. OpenAPI: `/openapi.json`. API docs: `/api/docs`.

## Register (anonymous)

```http
POST /api/users/guest
Accept: application/json
```

Response: `{ "token": "<guest_jwt>" }`. Send `Authorization: Bearer <guest_jwt>` on subsequent calls.

## Claim (registered student)

```http
POST /api/users/register
Authorization: Bearer <guest_jwt>
Content-Type: application/json

{"first_name":"ziad","last_name":"baroudi","number":65}
```

On `409`, pick another `number` (1–100). Guests cannot open gated links or submit reports — claim first.

## Browse content

```http
GET /api/content
```

Returns the faculty → branch → specialisation → year → semester → course → link tree. SEO/markdown pages also exist at `/courses` and `/course/{code}` (`Accept: text/markdown`).

## Analytics

With a student Bearer: `POST /api/page_views`, `/api/link_clicks` (registered only), `/api/search_events`, `/api/browse_events`.

## Do not

- Do not use admin login (`POST /api/auth/login`) for agent registration.
- Do not invent `user_id` in request bodies — the server takes identity from the JWT.

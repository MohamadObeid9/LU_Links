# User Guide

How to use [LU Links](https://lu-links.onrender.com/) — for students and admins. For developers, see the [README](../README.md).

---

## Overview

**LU Links** is the course materials hub for **Lebanese University** students — faculties, campuses, and specialisations, with curated Drive / Classroom / Telegram links in one place.

- **Telegram updates:** [@LU_Links9](https://t.me/LU_Links9)
- **How to contribute:** [Telegram guide](https://t.me/LU_Links_Contributing_Guide) · **Report / Contribute** or **Feedback / Suggestion** in the app nav

---

## Language & theme

Use the **language** button (EN / FR / ع) and **theme** button in the nav (system / light / dark). Preferences are saved on your device and, when signed in, on your account.

| Language | UI |
|----------|-----|
| English (`eng`) | Default LTR |
| French (`fr`) | LTR |
| Arabic (`ar`) | RTL for student pages (nav drawer labels, titles, pick cards, etc.) |

The **Admin dashboard** stays **English and LTR** even when the rest of the site is Arabic.

---

## For students

1. Open the site. On mobile, start from **Faculties** (or search if you know a course code).
2. Browse **Faculty → Campus → Specialisation**, then filter by year / semester if needed.
3. Expand a course and open a link — badge color is the link type; label text is the content type (see legends below).
4. **Star** courses you revisit often. Use **Report / Contribute** when a link is broken or you have a new resource. Use **Feedback / Suggestion** to rate the site or propose an improvement.

Install from the browser menu as a **PWA** for a home-screen shortcut (service worker enabled in production builds).

### Signing up

There is **no email and no password**. You identify yourself with three things:

- your **first name**
- your **last name**
- a **number between 1 and 100** you pick yourself

That becomes your handle — for example `mohamad_hassan_55` — and the home page greets you with it once you are signed in.

- **Sign up** the first time. If someone with your exact name already picked your number, the app asks you to choose a different one (55 becomes 65).
- **Sign in** on any other device with the same three values. If we cannot find them, the app points you to sign up instead.
- Your session lasts a **year** on that device, so you normally type this once.

Keep your number in mind — name plus number is how the app recognizes you, and there is no password to reset if you forget which number you chose.

### What needs an account

Browsing never does. Search, filter, and look through courses without signing up at all.

| Action | Account needed |
|--------|----------------|
| Browse, search, and filter courses | No |
| Open a course link | Yes |
| Star a course (favorites) | Yes |
| Report a broken link | Yes |
| Contribute a new resource | Yes |
| Send feedback | Yes |
| Send a suggestion | Yes |

When you try one of these without an account, a short signup form appears and the action continues right after you finish.

### Student features

- **Faculty → campus → specialisation** browse (plus year / semester filters)
- **Smart search** — find courses by name or code (`/` or `Ctrl+K`)
- **UI in English, French, or Arabic** (Arabic uses RTL layout)
- **Account without a password** — first name, last name, and a number 1–100
- **Favorites that follow you** — starred courses are saved to your account and appear on every device you sign in on
- **Content type labels** — TD, Cours, Videos, Sessions, Exams at a glance
- **Link type badges** — Google Drive, Classroom, Telegram, and more
- **Light / dark / system theme**
- **Report / Contribute** — broken links or new resources (pick the course via the hierarchy)
- **Feedback / Suggestion** — rate the platform (1–5 stars) or suggest an improvement
- **Tips** — link-type badges, starring courses, and contributing via the [Telegram guide](https://t.me/LU_Links_Contributing_Guide)
- **PWA** — installable with offline service worker support
- **SEO pages** — server-rendered course and faculty pages for search engines

---

## For admins

1. **Admin** → log in with your Supabase credentials (the API issues a JWT for the session). The panel UI is always English / LTR.
2. **Structure** — CRUD faculties, campuses (branches), specialisations, and offerings.
3. **Courses & Links** — manage courses under an offering. Filter by faculty / campus / specialisation. Links may list languages (`ar` / `fr` / `en`).
4. **Extra Resources**, **Feedbacks**, **Suggestions**, **Reports**, **Contributions** — review inbox items. Contributions can be **approved** (adds the link) or **rejected**. Each row shows the **sender's handle** when available.
5. **Analytics** — unique students per range alongside visit counts and top clicked links; export JSON when needed.
6. **Students** — browse every registered student, search by name, and open one to see their full history.

Admin login is unchanged and stays separate from student accounts: admins sign in with Supabase credentials, students never do.

### Students tab

- Alphabetical list of registered students with first seen and last seen dates
- Search by handle
- Detail view with a single activity timeline — visits (e.g. “visited home from phone”), links opened, reports, contributions, feedback, suggestions, and favorites added or removed, newest first. The profile card shows the device from their most recent classified visit.

Activity from before a student signed up is kept and appears in their timeline, because the visitor record is claimed at signup rather than replaced. If they already have an account and sign in instead, that first guest visit is moved onto their student row so it shows their handle, not `guest_<id>`.

### Unique-user analytics

The Analytics tab counts **people**, not just page loads:

- **Overview cards** — registered students, active/clicks/device **in the selected 7/30/90 range** (with vs-prior deltas), unique phone/laptop students, returning vs new, signup funnel, browse depth, and open inbox counts
- **Growth chart** — toggle between unique visitors per day and cumulative registered roster over the selected range
- **Today's visitors** — paged handle chips (sort by clicks or name)
- **Demand** — top links, top courses, zero-click courses/links, most-favorited courses, top students
- **Search terms** and separate hour×weekday heatmaps for **page visits** and **link clicks**

New visits store a coarse `device_type` (`phone` or `laptop`) derived from the User-Agent on the server; the client never sends device data. Search and browse-depth events are recorded separately so demand and funnel metrics stay actionable.

Counting is done in the database rather than in the browser, so the dashboard stays fast as history grows. Two caveats when reading the numbers: visitors who never sign up are still counted as visits but cannot be attributed to a person, and admin browsing is excluded from analytics entirely.

### Admin features

- Structure CRUD for faculties, campuses, specialisations, and offerings
- Course and link CRUD scoped to a branch×specialisation offering
- Optional vs. mandatory course labeling
- Multi-content link management (TD, Cours, Videos, Sessions, Exams) and link languages
- Analytics dashboard — overview cards, growth chart, paged today's visitors, top links/students, JSON export
- Students directory with per-student activity timeline
- Sender handle on contributions, reports, feedback, and suggestions
- Contribution, report, feedback, and suggestion review workflows
- JWT-secured admin panel via the Go API
- Extra resources sections beyond regular courses

---

## Content type legend

| Badge | Meaning |
|-------|---------|
| TD | Travaux Dirigés (exercises/tutorials) |
| Cours | Course materials/lectures |
| Videos | Video recordings |
| Exams | Exam papers and solutions |
| Other | Other types of content |

---

## Link type legend

| Badge | Meaning |
|-------|---------|
| **TG** | Telegram |
| **GD** | Google Drive |
| **GC** | Google Classroom |
| **OT** | Other / External |

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `/` or `Ctrl+K` | Focus search |
| `Esc` | Close modals |

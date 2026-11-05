# Zetora — Learn. Practice. Achieve.

A learning platform for **Grade 12 remedial students in Ethiopia**: organised subjects and units, professionally
formatted summaries, private PDF materials with an in-app viewer, interactive quizzes, timed exams, and honest
progress tracking — plus a full administrator console so a non-technical person can run all the content.

> Sample content in this repository is **demonstration material only**. It is not an official or verified Ethiopian
> syllabus. Every sample row is flagged `is_demo` and can be removed in one click from **Admin → Settings**.

---

## What's inside

| Area | Highlights |
| --- | --- |
| **Public site** | Landing page (hero, features, how it works, database-driven subject cards, CTA), About, Contact, Privacy, Terms, 404, SEO metadata, sitemap, robots, light / dark / system themes, **English and አማርኛ** |
| **Auth** | Register, sign in/out, password reset, e-mail verification (when enabled in Supabase), persistent sessions, protected student and admin routes, role-based access enforced **in the database** |
| **Student app** | Dashboard (greeting, progress ring, continue learning, subjects, today's goals, recent activity, charts, recommendations, quick actions), subject library with search/filter, subject pages, unit pages with Overview · Summary · Learning materials · Practice quiz · Unit test, bookmarks, notifications, global search (⌘/Ctrl-K), settings with avatar upload |
| **Summary reader** | Headings, lists, tables, images, KaTeX formulas, definition/note/key-concept/example/warning boxes, table of contents, reading progress (saved), mark as completed, previous/next unit |
| **Materials** | Private Supabase Storage bucket, short-lived signed URLs, mobile-friendly pdf.js viewer (zoom, page counter), optional download control per file |
| **Quizzes** | Multiple choice, true/false, multiple select, short answer; practice mode with instant feedback + explanations; exam mode with answers revealed only after submit; autosave; resume after refresh; results with full review; retry |
| **Exams** | Unit / subject / mixed-unit / mock exams, random questions & order, server-side deadline (refresh can't reset it), auto-submit on expiry, history |
| **Progress** | Unit & subject completion, quiz/exam scores, trends, study-activity history, weak/strong topics — all computed from real activity |
| **Admin console** | Overview, Students (search, suspend, promote), Subjects, Units (reorder, publish), **rich-text Summary editor** (headings, formatting, lists, tables, images, formulas, highlight and definition/note boxes, draft/publish), Learning materials (validated uploads, replace, delete), Question bank, Quiz builder, Exams, Analytics, Settings (announcements, remove demo content) |
| **Languages & themes** | Full **English and Amharic (አማርኛ)** interface — public site, sign-in, student app and admin console — with a language switcher in every header and in Settings; **Light / Dark / System** themes. Choices are remembered per device and on the account. See [`docs/i18n.md`](docs/i18n.md) |
| **PWA** | Web app manifest + icons, small service worker (static-asset caching + offline page). *Push notifications are not implemented.* |

## Screenshots

Captured from the real app by the end-to-end suite (sample/demo data).

| Landing | Student dashboard |
| --- | --- |
| ![Landing page](docs/screenshots/landing-desktop.png) | ![Dashboard](docs/screenshots/dashboard-active-desktop.png) |

| Summary reader | Quiz on a phone |
| --- | --- |
| ![Summary reader](docs/screenshots/summary-desktop.png) | ![Quiz on mobile](docs/screenshots/quiz-mobile.png) |

| In-app PDF viewer | Admin: summary editor |
| --- | --- |
| ![PDF viewer](docs/screenshots/pdf-viewer-desktop.png) | ![Summary editor](docs/screenshots/admin-editor.png) |

**Amharic and dark mode** (course content stays in the language it was written in):

| Dashboard · dark · አማርኛ | Summary reader · dark · አማርኛ | Quiz · አማርኛ |
| --- | --- | --- |
| ![Dashboard in Amharic, dark](docs/screenshots/dashboard-dark-am.png) | ![Summary in Amharic, dark](docs/screenshots/summary-dark-am.png) | ![Quiz in Amharic](docs/screenshots/quiz-am.png) |

## Tech stack

Next.js 16 (App Router, Server Components & Actions) · TypeScript · Tailwind CSS v4 · shadcn-style components on Radix ·
Lucide icons · Recharts · React Hook Form + Zod · Tiptap (editor) · KaTeX · pdf.js · Supabase (Postgres, Auth, Storage, RLS).

## Getting started

### 1. Create a Supabase project

1. Create a project at <https://supabase.com>.
2. **Run the database migrations** in order (SQL editor, or `supabase db push` if you use the Supabase CLI):
   1. `supabase/migrations/20260101000001_schema.sql`
   2. `supabase/migrations/20260101000002_security.sql` (RLS, triggers, storage buckets + policies)
   3. `supabase/migrations/20260101000003_functions.sql` (RPCs: quiz engine, search, stats, admin helpers)
   4. `supabase/migrations/20260102000001_i18n.sql` (languages: `profiles.locale` check, sign-up language, `notifications.params`)
3. *(Optional, recommended for development)* load demo content: run `supabase/seed.sql`.
4. **Auth settings** (Authentication → URL configuration):
   - Site URL: your site URL (e.g. `http://localhost:3000`)
   - Redirect URLs: `http://localhost:3000/auth/callback` (and your production URL + `/auth/callback`)
   - Authentication → Providers → Email: enable **Confirm email** if you want e-mail verification. Zetora handles both modes.
5. The two storage buckets are created by the migration: `resources` (**private**, 25 MB, PDF/PNG/JPEG/WebP/TXT) and
   `media` (public, 5 MB images — avatars, subject covers, images inside summaries).

### 2. Configure the app

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API).
**Zetora never needs the service-role key — do not add it.** Optional: `NEXT_PUBLIC_CONTACT_EMAIL`,
`NEXT_PUBLIC_SOCIAL_*` (unset social links render as disabled placeholders).

### 3. Install and run

```bash
npm install          # also copies the pdf.js worker/fonts into public/pdfjs
npm run dev          # http://localhost:3000
```

### 4. Create your first administrator

Register normally in the app, then promote yourself once in the Supabase SQL editor (the database blocks anyone
from promoting themselves through the API):

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

From then on, additional administrators can be promoted from **Admin → Students**.

### 5. Replace the demo content with yours

Go to **Admin → Settings → Remove demo content**, then create your own subjects, units, summaries, PDFs, questions
and quizzes from the admin console. Nothing in the curriculum is hardcoded in the frontend.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Standard Next.js scripts |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm run check:i18n` | Verifies the Amharic translation: same keys, matching `{placeholders}`/`<tags>`, no empty or untranslated strings, every server message translated |
| `npm run i18n:untranslated` | Scans the source for hard-coded English (JSX text, `aria-label`, `placeholder`, toasts, error strings) |
| `npm run db:test` | Applies every migration + the seed to a throw-away Postgres database and runs 119 checks on RLS, grading, timers, storage policies and admin functions |
| `npm run e2e` | Production build + ~310 real-browser checks (public site 28 · full student journey 100 · Amharic UI, language & theme switching 82 · full admin content pipeline 104) against a local Postgres. `E2E_FLOWS=flow-student.mjs` runs one flow. See **Testing** |
| `node supabase/seed/generate.mjs` | Regenerates `supabase/seed.sql` from `supabase/seed/demo-content.mjs` |
| `node scripts/generate-icons.mjs` | Regenerates the PWA icons |

## Security model

The browser is untrusted. The anon key is public, so **Row Level Security is the real authorisation layer**; server
actions add a second check (`assertAdmin()`), and no service-role key exists anywhere in the app.

- Roles live in `profiles.role`. A trigger blocks non-admins from changing `role`, `is_active` or `email`; sign-up
  metadata can never grant a role. The last active administrator cannot be demoted.
- Students can **read** published content only and **cannot write** any learning content (RLS + grants).
- **Correct answers never reach the browser early.** `question_options.is_correct`, explanations and accepted answers sit
  in admin-only tables. Students take quizzes through `SECURITY DEFINER` functions that start, autosave, grade
  (server-side) and review attempts. Practice mode reveals feedback per question *after* it is checked; exam mode only
  after submit. Students have **no INSERT/UPDATE privilege** on `attempts` — scores can't be forged.
- **Exam timers are authoritative on the server.** Each attempt stores `expires_at`. Reloading never extends it, saving
  after the deadline (+15 s network grace) is rejected, and loading or listing an expired attempt auto-submits it.
- **Private files.** PDFs live in a private bucket. The app issues 120-second signed URLs only after RLS confirms the
  file (and its unit/subject) is published; downloads additionally require `allow_download`. Storage policies mirror this.
- Summary HTML is sanitised on save **and** on render (no scripts, event handlers, `javascript:` links or iframes).
- Uploads are validated client-side (type, size, PDF signature) and enforced by the bucket (MIME allow-list, 25 MB).
- Open-redirect protection on `next=` parameters; suspended accounts are signed out.

Full schema and policy notes: [`docs/schema.md`](docs/schema.md).

## Project structure

```
src/
  app/
    (marketing)/   landing, about, contact, privacy, terms
    (auth)/        login, register, forgot/reset password
    (app)/         student app (dashboard, subjects, units, attempts, exams, progress, …)
    admin/         administrator console
    api/           signed-URL + search route handlers
    auth/          callback, sign-out, suspended
  components/      ui/ (design system), layout/, dashboard/, learn/, quiz/, charts/, admin/, viewer/
  i18n/            translator, formatters, English + Amharic messages (see docs/i18n.md)
  lib/             supabase clients, auth guards, actions/ (server actions), queries/, validators/, html sanitiser
supabase/
  migrations/      schema · security · functions
  seed/            demo-content.mjs + generator;  seed.sql (generated)
  tests/           database test suite (npm run db:test)
e2e/               real-browser test harness (npm run e2e)
docs/              schema documentation
```

## Testing

- **`npm run db:test`** needs a PostgreSQL server you can create databases on (default
  `postgres://zetora_test:zetora@127.0.0.1:5432/postgres`, override with `TEST_DATABASE_URL`). It stubs the few
  Supabase platform objects, applies all migrations and the seed, then acts as real `anon` / `authenticated` roles with JWT
  claims — the same way PostgREST does.
- **`npm run e2e`** builds the app and drives it in Chromium (set `CHROMIUM_PATH` if it isn't at
  `/opt/pw-browsers/chromium`). Because the real Supabase stack (Docker) isn't always available, `e2e/gateway.mjs` is a
  small **test-only** gateway that speaks the Supabase REST/Auth/Storage protocols on top of the same Postgres, running every
  request under the real RLS roles. It is not shipped and not a PostgREST replacement; verify against a real Supabase project
  before launch.

## Languages, themes, time zone, performance

- **Languages**: English and አማርኛ across the whole product. The language is chosen from the header menu or
  **Settings → Language**, stored in a cookie and on the profile, and defaults to the browser language on the first
  visit. Dates, relative times, numbers and plurals follow the language; digits stay 0-9. Adding or changing text,
  adding a language and the checks that keep both languages complete are described in [`docs/i18n.md`](docs/i18n.md).
- **Themes**: Light, Dark and System (follows the device), from the header toggle, the profile menu or
  **Settings → Appearance**. Charts, the summary reader (callout boxes, formulas, tables) and the PDF viewer are
  designed for both themes.
- **Fonts**: Inter plus Noto Sans Ethiopic. The Ethiopic file is fetched only on pages that contain Ethiopic text.
- Default time zone is **Africa/Addis_Ababa** (`src/lib/constants.ts`); dates and "today" boundaries use it.
- Built for slow connections: server-rendered pages, self-hosted fonts, no CDN requests, only the message groups a page
  needs are sent to the browser, lazy KaTeX/pdf.js, client-side image downscaling before upload, only the active
  unit tab's payload is fetched, and cacheable static assets via the service worker.

## Known limitations (honest list)

- No push notifications — notifications are in-app only.
- The PDF viewer renders pages to canvas: text can't be selected or searched inside it.
- Reordering uses up/down buttons (no drag-and-drop).
- **The Amharic translation has not been reviewed by a native speaker.** It was written by an AI assistant; have a teacher
  or translator proof-read it (terminology and wording are in `src/i18n/messages/am`) before launch.
- Course content (subjects, units, summaries, questions, notifications written by administrators) is **not**
  translated automatically; it appears in the language the administrator typed it in. Demo content is English.
- The Ethiopian calendar is not offered; dates use the Gregorian calendar (in Amharic month names).
- Subject "URL names" must be Latin letters, numbers and dashes, so administrators type one by hand for Amharic titles.
- Privacy policy / Terms are plain-language starting points that match what the app does — have them reviewed before launch.
- No rate limiting beyond what Supabase Auth provides; add one at your edge/CDN for production.
- Exam integrity is "reasonable", not proctored: the timer and grading are server-side, but nothing stops a student from
  looking things up on another device.

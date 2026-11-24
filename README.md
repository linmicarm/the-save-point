# The Save Point

A quiet, private place to track the seasons of your life.

Most of the internet asks you to perform. The Save Point doesn't. It is built for you, not to consume, not to compare, not to covet. You write, you check in with how you actually feel, you plant a few small intentions, and you watch a garden grow. Nothing here ranks you, scores you, or punishes you for missing a day. The garden only grows.

Built for the **Good Soil Fall Code Jam** (theme: *navigating change*) on top of an existing full-stack app.

---

## The idea: seasons

Everything in the app hangs off one concept, a **season**: a chapter of your life with a name, an intention, and a color ("a new city", "starting over", "healing era"). Journal entries, check-ins, seeds, photos and places can all belong to the season you are in. When a season ends, you close it with a short ceremony and it stays in your history.

## What you can do

**Today (the season home)**
- See the season you are in, which day of it you are on, and its intention
- **Weather check-in:** pick sunny, cloudy, rainy or stormy for how it feels inside. You get a gentle, rule-based suggestion (no AI, no scoring), and the card collapses once you have checked in
- **Seeds and the garden:** plant up to five small intentions. Tend them when you act on them. A seed grows through stages as you tend it, and the illustrated garden's sky follows your weather. If a seed goes quiet it can be **replanted** into a new season, never failed
- A journal prompt, your latest entries, and quick links to the week, month, year and milestones for this season

**Seasons**
- Start from a template (new city, new job, starting over, healing era) or write your own
- Open any season to see its dates, intention, reflection, and everything you wrote during it
- **Closing ceremony:** write what you carry forward and what you let go
- Delete a season without losing what was inside it (entries, check-ins and seeds are un-linked, never deleted)

**Everything else**
Journal, week rhythm, habits, month and year in review, traditions, milestones, letters, time capsules, photos, blog, commonplace book, places, wishlist, meal plan, recipes, media log, bookmarks, and an optional public profile page. Your data can be downloaded in one file from Settings.

**Navigation that stays calm**
The menu opens as a few "rooms" instead of twenty links. Pin up to five pages, see your recent ones, and let related pages share a tab switch (habits and week, month and year, letters and time capsule). Social pages live in their own room, out of the daily path.

---

## Tech stack

```
the-save-point/
├── client/          React 19 + Vite 8 + Tailwind v4
└── server/          Node + Express 5 + Prisma 5 + PostgreSQL (Supabase)
```

| Layer | Choices |
|---|---|
| Frontend | React 19, Vite 8, Tailwind v4 (via `@tailwindcss/vite`, no config file), React Router 7, axios, @dnd-kit |
| Backend | Express 5, Prisma 5, PostgreSQL on Supabase |
| Auth | JWT + bcrypt; the token is kept in `localStorage` |
| Images | Cloudinary through `/api/upload` (falls back to base64 in dev) |
| Observability | pino structured logging, Sentry (front and back, enabled only when a DSN is set), `/api/health` |
| Deploy | Vercel (client) and Render (server) |

---

## Running locally

### Prerequisites
- Node 20+
- A PostgreSQL database (a free Supabase project works)
- A Cloudinary account (optional)

### Server
```bash
cd server
cp .env.example .env        # DATABASE_URL, JWT_SECRET, CLOUDINARY_*, SMTP_* (optional)
npm install
npx prisma migrate deploy   # applies the migrations in server/prisma/migrations
npx prisma generate
node index.js               # http://localhost:5000
```

Changing the schema? Use `npx prisma migrate dev --name what_changed`. **If Prisma ever asks to reset the schema, answer no**: that drops every table and all your data. On Windows, stop the dev server before `npx prisma generate`, or the engine file is locked.

### Client
```bash
cd client
npm install --legacy-peer-deps
npm run dev                 # proxies /api to http://localhost:5000
```

### Tests
```bash
cd client
npm run test:run            # single run
npm test                    # watch mode
```

---

## Design decisions

| Decision | Why |
|---|---|
| Season is the central model | Every content model has an optional `seasonId` with `onDelete: SetNull`, so removing a season never deletes what you wrote |
| Nothing punishes | No streaks, no scores, no "you missed a day". A stormy check-in gets a gentler nudge, a quiet seed can be replanted |
| Private by default | The home, check-ins, seeds and gardens are only for you. Public pages are opt-in |
| Dark mode through CSS variables | `--sp-bg`, `--sp-surface`, `--sp-text` and friends flip on the `.dark` class on `<html>`; new code uses the tokens instead of hard-coded colors |
| One shared `Button` | Three tiers (primary, secondary, quiet) used across the app so actions are easy to see, with readable text on any accent color |
| One shared Prisma client | `server/db.js` replaced a separate connection pool in every route file |
| Menu as rooms | Pages are grouped in one config (`client/src/utils/navSections.js`) that drives both the desktop and mobile menus and is tested against the real routes |
| Scroll memory | Back and forward restore your scroll position, and "back" links step back instead of pushing a new page |
| Code splitting with `React.lazy()` | Each page loads only when you open it |
| Prisma migrations, not `db push` | The schema history is versioned and applies cleanly to a fresh database |

---

## CI/CD

`.github/workflows/ci.yml` runs on every push and pull request:

1. **Client:** `npm ci`, ESLint, Vitest, `vite build`
2. **Server:** `npm ci`, `prisma generate` (validates the schema, no database needed)

### Branch protection (set up on GitHub)

In **Settings → Branches → Add rule** for `main`: require a pull request, require the checks `Client (lint · test · build)` and `Server (install · type-check)`, and require branches to be up to date.

### Deploying

- **Client (Vercel):** import the repo, set Root Directory to `client`, add `VITE_API_URL` (your server URL)
- **Server (Render):** `server/render.yaml` defines the service. Set `DATABASE_URL`, `JWT_SECRET` and `CLIENT_URL`

---

## Status

- [x] Testing: Vitest and React Testing Library
- [x] CI/CD: GitHub Actions
- [x] Observability: pino, Sentry, health endpoint
- [x] Jam features: weather check-in, season templates, seeds and replanting, illustrated garden, closing ceremony
- [ ] Server-side tests (the routes are not covered by automated tests yet)
- [ ] Object storage on AWS S3 in place of Cloudinary

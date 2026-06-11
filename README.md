# The Save Point

A cozy personal web platform — a digital home for people who miss when the internet felt like a place. Inspired by Gaia Online, Neopets, MySpace, Xanga, Animal Crossing, and Stardew Valley.

## Architecture

```
save-point/
├── client/          React 19 + Vite 8 + Tailwind v4
└── server/          Node/Express + Prisma 5 + PostgreSQL (Supabase)
```

**Frontend:** React 19, Vite 8, Tailwind v4 (`@tailwindcss/vite`, no config file), React Router 7, axios, @dnd-kit  
**Backend:** Node/Express, Prisma 5 (PostgreSQL via Supabase)  
**Storage:** Cloudinary (image uploads via `/api/upload`)  
**Auth:** JWT + bcrypt, stored in `localStorage`  
**Deploy:** Vercel (client) + Render (server)

---

## Running locally

### Prerequisites
- Node 20+
- A PostgreSQL database (Supabase free tier works)
- A Cloudinary account (optional — falls back to base64 in dev)

### Server
```bash
cd server
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET, CLOUDINARY_*, SENTRY_DSN (optional)
npm install
npx prisma db push          # sync schema (non-interactive, safe for dev)
node index.js
```

### Client
```bash
cd client
npm install --legacy-peer-deps
npm run dev                 # proxies /api → http://localhost:5000
```

### Tests
```bash
cd client
npm run test:run            # single run, exits with code
npm test                    # watch mode
```

---

## Key design decisions

| Decision | Rationale |
|---|---|
| `npx prisma db push` not `migrate dev` | Non-interactive environments (CI, Render) don't support interactive prompts |
| Tailwind v4 with no `tailwind.config.js` | Configured entirely via `@tailwindcss/vite` plugin + CSS `@variant` directives |
| Dark mode via CSS custom properties | `--sp-bg`, `--sp-surface`, etc. toggled by `.dark` class on `<html>` — no Tailwind dark variants needed |
| Code splitting with `React.lazy()` | ~35 separate chunks; each page loads only when navigated to |
| `uploadImage()` utility | Resize via canvas → POST to `/api/upload` → Cloudinary; falls back to base64 on 503 |
| Season as central concept | Every content model (`JournalEntry`, `MediaLog`, `Photo`, `Place`, `WishItem`, `Habit`) has an optional `seasonId` |
| Section registry on UserPage | `sectionRegistry` map + `sectionsOrder`/`sectionsVisible` from `UserPageSettings` — zero special-casing, trivially extensible |

---

## CI/CD

### GitHub Actions

The workflow at `.github/workflows/ci.yml` runs on every push and PR:

1. **Client job** — `npm ci` → `eslint` → `vitest run` → `vite build`
2. **Server job** — `npm ci` → `prisma generate` (validates schema, no DB needed)

### Branch protection (set this up on GitHub)

Go to **Settings → Branches → Add rule** for `main`:

- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
  - Add required checks: `Client (lint · test · build)` and `Server (install · type-check)`
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings

This ensures no code lands on `main` unless CI is green.

### Vercel auto-deploy

1. Import the repo in [vercel.com/new](https://vercel.com/new)
2. Set **Root Directory** to `client`
3. Add environment variables: `VITE_API_URL` (your Render server URL)
4. Vercel will auto-deploy on every push to `main` — the CI check runs first via GitHub's merge queue or branch protection, so broken builds can't reach production

---

## Production checklist progress

- [x] **P1 — Testing** · Vitest + RTL · 40 tests green (`npm run test:run`)
- [x] **P2 — CI/CD** · GitHub Actions workflow · Branch protection docs · Vercel instructions
- [ ] **P3 — AWS** · S3 + Lambda signed upload URLs (replaces Cloudinary)
- [x] **P4 — Observability** · `pino` structured logging · Sentry (front + back, DSN-gated) · `/api/health` with uptime, request count, error rate

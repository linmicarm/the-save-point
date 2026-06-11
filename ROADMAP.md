# The Save Point — Full Roadmap

See VISION.md for product philosophy. This roadmap has two tracks running in parallel:
**Feature Track** (the app itself) and **Production Track** (making it portfolio-grade).

---

## Feature Track

### Phase 1 — Core Auth + Profile ✅
- User registration, login, JWT auth, password reset
- Profile page (`/u/:username`) with avatar, header, bio, accent color, pronouns, location, website
- Dark mode (CSS custom properties, persisted to localStorage)
- Navbar (logo, search, notifications, dark toggle) + MobileNav

### Phase 2 — Seasons ✅
The central concept. All content belongs to a life chapter.
- Create / end seasons (name, emoji, color, intention, reflection, cover photo)
- Active season shown on profile
- Journal entries linked to active season automatically
- `GET /api/seasons/active` used across the app

### Phase 3 — Journal ✅
- Daily journal with mood picker + optional daily prompt
- Public/private toggle per entry (🔒/🌐)
- Entries grouped by season on public profile

### Phase 4 — Collections ✅
Personal inventory pages, all private by default with optional public sharing:
- **Wishlist** — categorized wanting list (cook, eat, watch, read, play, visit, learn, buy)
- **Commonplace** — quotes, passages, ideas with tags
- **Places** — lived / visited / want-to-go map of the world
- **Milestones** — life events with date, emoji, category

### Phase 5 — Time Pages ✅
Reflective time containers:
- **Month** — mood, theme, highlight, focus, foods, self-care, activities, media, photo
- **Year** — theme, quote, resolutions with why/notes/tags/completion
- **Traditions** — recurring holiday entries year over year

### Phase 6 — Memory ✅
- **Letters** — time-locked letters to future self or others, optional open date
- **Capsule** — time capsule entries with unlock date
- **Now** — `/now` page (what you're focused on right now, public)

### Phase 7 — Media + Creative ✅
- **Photos** — masonry gallery with Cloudinary upload, season badge, public page
- **Media Log** — books, movies, shows, music, games with status shelves + ratings
- **Blog** — rich text editor, slugs, cover photos, tags, mood, music, public posts + comments
- **Recipes** — ingredients, steps, cover photo, tags, ratings, send-to-meal-plan

### Phase 8 — Habits + Rhythm ✅
- **Habits** — daily/weekly habit tracker with 7-day dot grid, streaks, custom colors
- **Week Rhythm** — drag-and-drop weekly routine blocks (morning, afternoon, evening, etc.)
- **Meals** — weekly meal planner grid (breakfast → drinks/desserts) + shopping list

### Phase 9 — Social Layer ✅
Intimate, not algorithmic:
- **Posts / Updates Feed** — short posts with images, likes, comments, bookmarks on profile
- **Feed** — chronological posts from people you follow only
- **Follow system** — follow/unfollow, follower/following counts on profile
- **Notifications** — likes, comments, follows; bell in navbar with unread count
- **Discover** — opt-in discoverable profiles + public content search
- **Bookmarks** — saved posts

### Phase 10 — Season Context Everywhere ✅
Every piece of content is tied to a life chapter:
- `seasonId` added to: MediaLog, Photo, Place, WishItem, Habit
- Active season auto-attached on create (no manual selection needed)
- `SeasonBadge` component shown on all item cards
- Season back-relations on `Season` model for future season-scoped views

### Phase 11 — Settings + Export ✅
- **Settings** — change password, delete account
- **Export** — full data export as JSON (auth-gated, blob download)
- **Onboarding** — 5-step welcome modal on first registration

---

## Production Track

See `save-point-production-checklist.md` for detailed tasks. Summary:

### Phase P1 — Testing (weeks 1–4)
- Vitest + React Testing Library
- Pure function tests, component behavior tests, error path tests
- Target: ~10–15 meaningful tests, `npm test` green

### Phase P2 — CI/CD (weeks 5–6)
- GitHub Actions: lint → test → build on every push/PR
- Branch protection rules (failing CI blocks merge)
- Vercel auto-deploy on merge to main

### Phase P3 — Cloud (weeks 7–9)
- Move image handling from Cloudinary to AWS S3 + Lambda
- Lambda generates signed upload URLs
- Document the tradeoffs

### Phase P4 — Observability (weeks 10–12)
- Structured backend logging (replace scattered `console.log`)
- Sentry error tracking (frontend + backend)
- `/health` endpoint with basic metrics
- README as new-engineer onboarding doc (architecture diagram, tech choices, how to run)

---

## Tech Stack
- **Frontend:** React 19, Vite 8, Tailwind v4, React Router 7, axios
- **Backend:** Node/Express, Prisma 5, PostgreSQL (Supabase)
- **Storage:** Cloudinary (images) → moving to S3
- **Deploy:** Vercel (frontend) + Render (backend)
- **Auth:** JWT, bcrypt, localStorage

## Key Design Decisions
- No `tailwind.config.js` — Tailwind v4 configured via `@tailwindcss/vite` plugin and `@variant dark` in CSS
- Dark mode via CSS custom properties (`--sp-bg`, `--sp-surface`, etc.) + `.dark` class on `<html>`
- Code splitting: all pages lazy-loaded via `React.lazy()` — ~35 separate chunks
- Cursor-based pagination on feed/posts (not offset-based)
- `uploadImage()` utility handles resize → Cloudinary upload with base64 fallback in dev
- Season is the central organizing concept — every model has an optional `seasonId`

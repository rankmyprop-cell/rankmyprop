# Application Architecture

> **STATUS:** LOCKED BASELINE  
> **SCOPE:** Systems Architecture, Data Flow, Routing Mechanisms, and Multi-Cloud Topology

---

## 1. High-Level Architectural Pattern

Rank My Prop utilizes a **Multi-Cloud Hybrid Architecture** combining:
1. **Edge-First Static Delivery & Reverse Proxy:** Cloudflare Pages with an integrated edge Worker (`public/_worker.js`) provides global CDN caching, instant first-paint delivery, and edge route rewrites.
2. **Dynamic React Single Page Application:** Powers the high-converting homepage (`/`) and core interactive discovery layers (`src/`).
3. **Preserved Multi-Page Application (MPA):** Directly serves 60+ static and client-hydrated HTML pages (`public/*.html`) containing complex dashboards, admin controls, reviews, and calculators without framework bloat.
4. **Edge API Layer:** Cloudflare Worker (`cloudflare/src/index.js`) deployed to `rankmyprop-api.theforexclue.workers.dev` backed by Cloudflare D1 (SQLite) and Cloudflare R2 object storage.
5. **Primary Production Data & Auth:** Google Firebase (Authentication & Cloud Firestore) storing user accounts, firm listings, live reviews, and promotional offers.
6. **Governance & Internal Ops Layer:** Supabase (PostgreSQL with strict Row Level Security) powering support team identities, change approval queues, and transactional email triggers.

```
                    ┌────────────────────────────────────────┐
                    │               CLIENT                   │
                    │   (Browser / Mobile Browser)           │
                    └──────────────────┬─────────────────────┘
                                       │
                    ┌──────────────────▼─────────────────────┐
                    │        Cloudflare Edge Router          │
                    │         (public/_worker.js)            │
                    └───────┬──────────────────────┬─────────┘
                            │                      │
             ┌──────────────▼──────────┐           │ Proxy /api/* & /v1/*
             │  Cloudflare Pages Assets│           │
             │  • React SPA (index.html)          │
             │  • Preserved MPA HTML   │           │
             │  • Static CSS / JS / XML│           │
             └─────────────────────────┘           │
                                                   │
                        ┌──────────────────────────▼───────────────┐
                        │          Edge API Worker                 │
                        │      (cloudflare/src/index.js)           │
                        └─────┬───────────────────────────────┬────┘
                              │                               │
             ┌────────────────▼────────┐      ┌───────────────▼────────┐
             │   Cloudflare D1 (SQLite)│      │  Cloudflare R2 Bucket  │
             │   • Documents / Revisions│     │  • Media Assets        │
             │   • Push Subscriptions  │      │  • Payout Proof Files  │
             │   • Referrals & Games   │      └────────────────────────┘
             └─────────────────────────┘
                              │
             ┌────────────────▼────────────────────────────────────┐
             │               External Services                     │
             │  • Firebase Auth & Firestore (Client & Master Source│
             │  • Supabase PostgreSQL (Support Approval Queue)    │
             │  • Supabase Edge Functions (Resend Email Dispatcher)│
             └─────────────────────────────────────────────────────┘
```

---

## 2. Request Routing & URL Rewriting Lifecycle

### A. Production Routing (`public/_worker.js`)
When a request hits `rankmyprop.in`:
1. **Direct Redirects:** Evaluated via static map:
   - `/discount` -> `/offers`
   - `/privacypolicy` -> `/privacy-policy`
   - `/termsofservice` -> `/terms`
   - Canonical trailing slash and apex domain normalization (`rankmyprop.in` -> `www.rankmyprop.in`).
2. **Consolidated SEO Redirects:** 35+ duplicate historical blog/article routes are permanently redirected to their retained category or rule destinations (`/news/best-prop-firms-for-beginners-2026` -> `/beginner-friendly-firms`).
3. **Legacy Blog Redirects:** Preserved `/blog-post-XX` and `/blog/blog-post-XX` mappings redirecting to descriptive `/news/...` routes.
4. **API Reverse Proxy:** Requests matching `/api/*` or `/v1/*` are reverse-proxied to `https://rankmyprop-api.theforexclue.workers.dev`, preserving request headers and CORS semantics.
5. **Dynamic Route Rewrites:**
   - `/compare/:firm` -> rewrites to `/compare.html`
   - `/offers/:firm` -> rewrites to `/discount-offer.html?firm=:firm`
   - `/prop-firm-rules/:firm/:program?` -> rewrites to `/firm-rules.html?firm=:firm&program=:program`
   - `/prop-firms/:slug/reviews` -> rewrites to `/firm-reviews.html?slug=:slug`
   - `/prop-firms/:slug/:view?` -> rewrites to `/firm-detail.html?slug=:slug&view=:view`
   - `/news/:slug` or `/:category/:slug` -> rewrites to `/content-post.html?type=:category&slug=:slug`
6. **Static File Fallback:** If no rewrite matches, falls back to `env.ASSETS.fetch(request)` to serve static assets or preserved `.html` pages.

### B. Local Development Routing (`vite.config.ts`)
The custom `dashboardRoutes()` Vite plugin reproduces the edge routing rules locally:
- Catches preserved dashboard routes (`/login`, `/dashboard`, `/admin-*`) and rewrites to `/login.html`, `/dashboard.html`, `/admin-*.html`.
- Rewrites dynamic slugs for comparisons, offers, rules, and firm details.
- Proxies `/api` requests to `http://localhost:4000` (the Express dev server).

### C. Local Express Compatibility Server (`server/index.ts`)
- Runs on port 4000 (configurable via `PORT`).
- Boots all `api/support-*.js` handlers for local support workflow testing.
- Serves mock firm data from `server/data.ts`.
- Maps `/api/public-page-content` and `/api/reviews` to `api/public-page-content.js`.

---

## 3. Data Storage & Multi-Cloud Synchronization

### A. Firebase Firestore (Primary Application Data)
- Houses primary collections: `firms`, `offers`, `reviews`, `firmReviews`, `firmReviewProfiles`, `firmRatingStats`, `giveaways`, `upcomingEvents`, `purchases`, `bonusOffers`, `pageHeadingsParagraphs`, `pageCopy`, `pageSeoContent`, `pageFaqs`.
- Direct client SDK access via `src/firebase.ts` and `public/*.js`.
- Security governed by `firestore.rules`.

### B. Cloudflare D1 (Edge Relational Store)
- High-speed SQLite database replicated at the edge.
- Backs `/v1/collections/:collection` for fast cached document retrieval.
- Tables: `documents`, `document_revisions`, `auth_users`, `push_subscriptions`, `push_queue`, `referrals`, `game_hints`, `game_plays`.

### C. Supabase (Support Governance & Transactional Queue)
- Decoupled from public user traffic.
- Only support personnel authenticate against Supabase (`auth.users`).
- Support team cannot directly write to Firestore or D1. All proposed changes are saved to `public.support_submissions`.
- CEO reviews proposals in `support-dashboard.html`. When marked `approved`, backend sync routines push verified payloads to Firestore.
- Stores transactional email notifications in `public.email_notifications`, processed by the `rmp-email-notifier` Edge Function.

---

## 4. Build & Pre-Rendering Pipeline

The production build (`npm run build`) executes an automated multi-stage pipeline:
1. `npm run env:runtime`: Parses `.env` / `.env.local` and generates browser-safe `public/rmp-runtime-env.json`.
2. `npm run seo:evidence`: Fetches approved CMS evidence, statistics, and reviews to generate `public/seo-evidence.json`.
3. `npm run seo:market-report`: Calculates aggregate market metrics (average drawdown, profit split distributions, platform market share) and writes `public/prop-firm-market-report.html`.
4. `npm run sitemap:generate`: Analyzes published firms, offers, rules, and articles to produce indexable XML sitemaps (`sitemap-pages.xml`, `sitemap-firms.xml`, etc.).
5. `tsc -b`: Executes TypeScript type checking across root and app projects.
6. `vite build`: Bundles React assets with Rolldown code-splitting chunks into `dist/`.
7. `node scripts/generate-seo-pages.cjs`: Statically pre-renders HTML shells for canonical routes.
8. `node scripts/generate-static-first-paint.cjs`: Injects inline JSON first-paint payloads to prevent hydration layout shifts.
9. `node scripts/generate-route-bootstrap.cjs`: Injects `__RMP_SSR_BOOTSTRAP` metadata.
10. `node scripts/verify-seo-output.cjs`: Verifies that built pages contain valid canonical tags, non-empty titles, and schema markup.

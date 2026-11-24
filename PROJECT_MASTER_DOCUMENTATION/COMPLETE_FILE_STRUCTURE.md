# Complete File Structure Map

> **STATUS:** LOCKED BASELINE  
> **SCOPE:** Entire Repository File and Folder Structure  
> **EXCLUSIONS:** `node_modules/`, `.git/`  

---

## 1. High-Level Folder Tree

```text
rankmyprop/
├── .firebaserc                          # Firebase project alias configuration
├── .gitignore                           # Git ignore definitions
├── dashboard-routes.ts                  # Central route constants (preserved & public static routes)
├── firebase.json                        # Firebase hosting and emulator configuration
├── firestore.rules                      # Production security rules for Firestore collections
├── index.html                           # Root Vite HTML template for React application
├── package.json                         # Project manifests, dependencies, and build scripts
├── package-lock.json                    # Deterministic lockfile
├── SECURITY-REVIEW.md                   # Static security audit report (dated 2026-11-19)
├── tsconfig.json                        # Root TypeScript project reference
├── tsconfig.app.json                    # Client-side TypeScript configuration
├── tsconfig.node.json                   # Node/Vite build TypeScript configuration
├── vite.config.ts                       # Vite bundler configuration & custom routing plugin
│
├── api/                                 # Local compatibility serverless API handlers
│   ├── _lib/                            # Shared server libraries (database, reviews, pii, auth)
│   ├── admin-stats.js                   # Admin dashboard statistics API
│   ├── newsletter-subscribe.js          # Newsletter subscription handler
│   ├── public-page-content.js           # Public CMS content and reviews proxy
│   ├── support-accounts.js              # Support team account administration
│   ├── support-actions.js               # Support workflow action handler
│   ├── support-approvals.js             # Support proposal approval workflow
│   ├── support-login.js                 # Support staff authentication
│   ├── support-overview.js              # Support queue dashboard statistics
│   ├── support-session.js               # Support session verification & token refresh
│   ├── support-submissions.js          # Support change proposal submission queue
│   ├── support-workspace.js            # Support workspace configuration
│   └── youtube-latest.js                # Latest YouTube channel video scraper / proxy
│
├── backups/                             # Pre-change rollback JSON snapshots of prop firm records
│   ├── atlas-funded-rules-*.json
│   ├── equity-edge-*.json
│   ├── finotive-funding-*.json
│   ├── funded-trader-markets-*.json
│   ├── funding-pips-*.json
│   ├── funding-traders-*.json
│   ├── gft-trial-*.json
│   └── xpips-*.json
│
├── cloudflare/                          # Cloudflare Worker API & Edge configuration
│   ├── migrations/                      # Cloudflare D1 SQL schema migrations (0001 to 0006)
│   ├── src/                             # Worker application code (index.js, legacy.js, lib.js)
│   ├── test/                            # Worker unit and integration tests
│   ├── package.json                     # Cloudflare worker package manifest
│   └── wrangler.jsonc                   # Cloudflare Wrangler deployment configuration
│
├── design-previews/                     # Design reference mockups and preview assets
│   ├── rmp-footer-live-integrated.png
│   ├── rmp-footer-preview.html
│   ├── rmp-footer-preview.png
│   └── rmp-footer-social-logos.png
│
├── docs/                                # Technical documentation, integration notes & preservation hashes
│   ├── dashboard-preservation.sha256    # SHA256 integrity checksums for preserved dashboard files
│   ├── firm-pages-preservation.sha256   # SHA256 integrity checksums for firm detail pages
│   ├── GSC_CONTENT_CONSOLIDATION_2026-09-20.md
│   ├── INTEGRATION_NOTES.md
│   ├── INTEGRATION_README.md
│   ├── PROP_FIRM_PDF_LISTING_WORKFLOW.md
│   ├── SEO_CANNIBALIZATION_AUDIT_2026-09-20.md
│   └── SEO_QUALITY_IMPLEMENTATION_2026-09-20.md
│
├── public/                              # Static assets, preserved HTML pages, styles & client scripts
│   ├── _headers                         # Cloudflare Pages HTTP security and cache headers
│   ├── _redirects                       # Cloudflare Pages 301/308 redirects map
│   ├── _worker.js                       # Cloudflare Pages edge routing and API proxy script
│   ├── assets/                          # Static branding, logos, icons, team, and firm graphics
│   │   ├── dashboard/                   # Dashboard icons and badges
│   │   ├── editorial/                   # Editorial team and author avatars
│   │   ├── email/                       # Email notification header assets
│   │   ├── firms/                       # Firm logos (PNG & WebP formats)
│   │   ├── platforms/                   # Trading platform logos (MT4, MT5, cTrader, DXtrade, etc.)
│   │   └── team/                        # Staff photos
│   ├── rmp-runtime-env.json             # Generated browser runtime configuration
│   ├── robots.txt                       # Search engine crawler instructions
│   ├── sitemap*.xml                     # XML sitemaps for pages, firms, articles, compare, rules
│   ├── *.html                           # 60+ Preserved HTML pages (dashboards, admin, calculators)
│   ├── *.js                             # Preserved frontend runtime scripts (home-shell.js, etc.)
│   └── *.css                            # Preserved stylesheets (site-shell.css, dashboard-layout.css)
│
├── scripts/                             # Node.js build, SEO generation, migration & verification scripts
│   ├── content-consolidation-redirects.cjs
│   ├── fix-firm-route-identities.cjs
│   ├── generate-dashboard-manifest.cjs
│   ├── generate-market-report.cjs
│   ├── generate-route-bootstrap.cjs
│   ├── generate-runtime-env.cjs
│   ├── generate-seo-evidence.cjs
│   ├── generate-seo-pages.cjs
│   ├── generate-sitemaps.cjs
│   ├── generate-static-first-paint.cjs
│   ├── legacy-blog-redirects.cjs
│   ├── migrate-firebase-auth-to-cloudflare.cjs
│   ├── migrate-firestore-to-cloudflare.cjs
│   ├── seo-quality-gates.cjs
│   ├── test-public-reviews-api.cjs
│   ├── test-route-content.cjs
│   ├── upsert-upcomers.cjs
│   ├── verify-cloudflare-preview.cjs
│   ├── verify-dashboard-source.cjs
│   ├── verify-integration.cjs
│   └── verify-seo-output.cjs
│
├── server/                              # Node.js Express server for local development and API testing
│   ├── data.ts                          # Seed / mockup data for local development
│   └── index.ts                         # Express server bootstrapping, middleware, and route registration
│
├── src/                                 # React application source code
│   ├── assets/                          # React bundled image assets (WebP logos, backgrounds)
│   ├── App.tsx                          # Root React component (Header, Navigation, Deferred Sections)
│   ├── cloudflareData.ts                # Client library for fetching from Cloudflare collections
│   ├── FaqSection.tsx                   # Expandable FAQ accordion component with CMS sync
│   ├── firebase.ts                      # Client Firebase initialization (Auth & Firestore)
│   ├── Footer.tsx                       # Global footer component with disclosure and legal links
│   ├── FundingOffersBanner.tsx          # Promo voucher banner with clipboard copy
│   ├── HomeCampaignPopup.tsx            # Modal promotion popup
│   ├── HomeHero.tsx                     # Hero section with animated titles and offer wall
│   ├── main.tsx                         # React DOM application mount point
│   ├── PlatformLogo.tsx                 # SVG logo components for trading platforms
│   ├── RankingsSection.tsx              # Dynamic prop firm ranking table with multi-filter tabs
│   ├── rankingsData.ts                  # Ranking data loader and transformer
│   ├── TradersLoveRankMyProp.tsx        # Value proposition and social proof cards
│   ├── TrustAndNewsletter.tsx           # Trust badge indicators and email newsletter subscription
│   ├── types.ts                         # Core TypeScript interfaces for firms, reviews, etc.
│   ├── VideoShowcase.tsx                # Video showcase component with YouTube oEmbed integration
│   ├── WhyRankMyProp.tsx                # Trust orbit circular visual component
│   ├── vite-env.d.ts                    # Vite client types declaration
│   └── *.css                            # Component-scoped and global stylesheets
│
├── supabase/                            # Supabase PostgreSQL database configurations and edge functions
│   ├── functions/                       # Supabase Edge Functions
│   │   └── rmp-email-notifier/          # Transactional email notification processor
│   └── sql/                             # PostgreSQL schema migrations and RLS policies
│       ├── 001_email_notifications.sql  # Email notification table, indexes, and RLS
│       └── 002_support_dashboard.sql    # Support profiles, submissions queue, and audit logs
│
└── tools/                               # Standalone tool integrations
    └── gsc-mcp/                         # Google Search Console Model Context Protocol server
        ├── package.json
        ├── README.md
        └── server.mjs
```

---

## 2. Directory Breakdown & Detailed File Roles

### A. Root Files
- `package.json`: Contains application metadata, scripts (`build`, `dev`, `test`, `test:integration`, `sitemap:generate`, etc.), dependencies, and overrides (`jose: 5.10.0`).
- `dashboard-routes.ts`: Master registry exporting `DASHBOARD_ROUTES` (38 preserved routes), `PUBLIC_STATIC_ROUTES` (64 static routes), and `PUBLIC_ROUTE_REDIRECTS` (5 URL aliases).
- `vite.config.ts`: Configures the Vite development server with the custom `dashboardRoutes()` plugin for URL rewrites and rolldown code-splitting chunks (`firebase`, `react`).
- `server/index.ts`: Express application running on port 4000. Provides parity with Cloudflare Worker routing in local development.
- `firestore.rules`: 434 lines defining collection-level read/write permissions for Firestore.

### B. `src/` (React Frontend)
- `App.tsx`: Manages root layout, sticky navigation bar, search overlay, ESC key handling, market toggle, and lazy loading of sections via `DeferredSection`.
- `HomeHero.tsx`: Features rotating dynamic headings (`#rotateWord`), promotional badge, and mounts `/home-hero.js` to populate live carousels.
- `RankingsSection.tsx`: Features client-side state for active tab filter, firm comparison selection (max 3), pagination (10 per page), and data hydration from `loadRankedFirms()`.
- `rankingsData.ts`: Queries Cloudflare Worker collection `/v1/collections/firms` and falls back gracefully. Normalizes logos, key metrics, and challenge parameters.
- `cloudflareData.ts`: Generic paginated fetch helper for Cloudflare Worker collection endpoints.
- `firebase.ts`: Initializes Firebase client app with environment variables from `import.meta.env`.
- `PlatformLogo.tsx`: Renders SVG logos for `cTrader`, `dxTrade`, `matchTrader`, `mt4`, `mt5`, `tradeLocker`, and `tradingView`.

### C. `public/` (Preserved HTML & Asset System)
- **Dashboard Interfaces**:
  - `dashboard.html` (408 KB): Main user dashboard (account balance, onboarding, challenge tracker, trade journal, notifications).
  - `dashboard-admin.html`: Master admin portal entry point.
  - `support-dashboard.html` (70 KB): Two-man approval workflow interface for support agents.
  - `operations-console.html`: System monitoring and synchronization operations console.
- **Admin Management Surfaces (22 screens)**:
  - `admin-firms.html`, `admin-firm-details.html`, `admin-reviews.html`, `admin-moderation.html`, `admin-offers.html`, `admin-content-cms.html`, `admin-propnews.html`, `admin-faqs.html`, `admin-giveaways.html`, `admin-announcements.html`, `admin-push.html`, `admin-support-access.html`, etc.
- **Calculator Pages (8 tools)**:
  - `lotsizecalculator.html`, `risk-to-reward-calculator.html`, `drawdown-calculator.html`, `profit-split-calculator.html`, `consistency-rule-calculator.html`, `lossrecoveryplanner.html`, `ruletranslator.html`, `calculators.html`.
- **Public Directory & Firm Templates**:
  - `listedprop.html`, `bestprop.html`, `compare.html`, `offers.html`, `reviews.html`, `firm-reviews.html`, `firm-rules.html`, `prop-firm-market-report.html`.
- **Edge Routing & Headers**:
  - `public/_worker.js`: Cloudflare Pages edge router handling legacy redirects, consolidation redirects, and API reverse proxying.
  - `public/_redirects`: Static 301/308 redirect rules for Pages.
  - `public/_headers`: Security headers (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`).

### D. `cloudflare/` (Edge Compute & Storage)
- `cloudflare/src/index.js` (38 KB): Core API router handling JWT authentication (`/v1/auth/*`), collection CRUD (`/v1/collections/*`), WebPush notifications (`/v1/push/*`), and legacy backward compatibility routes.
- `cloudflare/src/legacy.js`: Legacy compatibility handlers for reviews, admin stats, and page content.
- `cloudflare/src/lib.js`: Shared cryptographic functions (SHA-256), CORS headers, and collection whitelists (`PUBLIC_COLLECTIONS`).
- `cloudflare/migrations/`:
  - `0001_initial.sql`: Core tables (`documents`, `document_revisions`, `auth_users`, `push_subscriptions`).
  - `0002_push_queue_status.sql`: Queue job status extensions.
  - `0003_auth_metadata.sql`: User metadata and session tracking.
  - `0004_referrals.sql`: Referral tracking system.
  - `0005_game_hints.sql`: Interactive game hints.
  - `0006_game_play_limits.sql`: Game play limit constraints.

### E. `api/` & `api/_lib/` (Local / Serverless Compatibility)
- `api/_lib/clients.js`: Firebase Admin and Supabase Client singleton initializations.
- `api/_lib/public-reviews.js`: Public review sanitization, aspect rating extraction, and pagination logic.
- `api/_lib/support-store.js`: Supabase integration for support profiles, submissions, and audit logging.
- `api/support-*.js`: Endpoints backing `support-dashboard.html`.

### F. `supabase/` (PostgreSQL & Edge Functions)
- `supabase/sql/001_email_notifications.sql`: Creates `email_notifications` table with RLS denying direct client access.
- `supabase/sql/002_support_dashboard.sql`: Creates `support_profiles`, `support_submissions`, and `support_audit_logs` tables with strict foreign keys and RLS policies.
- `supabase/functions/rmp-email-notifier/index.ts`: Edge function listening for email trigger events and dispatching messages via Resend.

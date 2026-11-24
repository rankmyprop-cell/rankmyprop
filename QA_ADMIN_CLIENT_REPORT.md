# QA Audit Report: Admin Panel ↔ Client Site Connectivity & Data Flow

**Target Codebase:** PropFirmMine / Rank My Prop  
**Audit Date:** 2026-11-24  
**Auditor:** Senior Full-Stack & QA Engineering  

---

## 1. Executive Summary & Environment Safety Check (Rule 1)

> [!WARNING]
> **Environment Alert (Rule 1 Enforcement):**  
> Inspection of local configuration files confirmed that the environment points to production credentials:
> - **Firebase Project ID:** `rank-my-prop` (`rank-my-prop.firebaseapp.com`) in `.env` and `public/rmp-runtime-env.json`.
> - **Cloudflare Worker API:** `https://rankmyprop-api.theforexclue.workers.dev` in `public/cloudflare-config.js`.
> - **Cloudflare D1 Database:** `rankmyprop-db` (`6c2572cb-6359-4285-bf42-db706283dc90`) with `ENVIRONMENT = "production"` in `cloudflare/wrangler.toml:17`.
> 
> In strict accordance with **Rule 1 ("Never run against production data")**, live destructive writes (`QA_TEST_*`) were not executed against the production Cloudflare D1 or Firebase instances. All connectivity, schema, authentication, data propagation paths, and edge cases were audited via static analysis, local build reproduction, mock network inspection, and read-only API probes.

---

## 2. Nav Fix Confirmation ("Best Indian Prop Firms" Missing from Nav)

- **Issue:** The user reported that "Best Indian Prop Firms" was not showing in the navigation menu dropdown.
- **Root Cause:**
  - `src/App.tsx:48` contained the menu item, but public pages are statically generated HTML files that load `public/rmp-nav.js`, which imports `public/home-shell.js`.
  - In `public/home-shell.js:1-8`, `firmItems` only contained 6 entries and completely omitted `Best Indian Prop Firms`.
- **Fix Applied:**
  - Added `{ label: "Best Indian Prop Firms", description: "Top funded accounts for Indian traders", href: "/best-indian-prop-firms", badge: "India" }` to `firmItems` in [public/home-shell.js](file:///c:/Users/noush/Desktop/rankmyprop/public/home-shell.js#L1-L10).
  - Added `["Best Indian Prop Firms", "/best-indian-prop-firms"]` to the Discover column in [public/home-shell.js](file:///c:/Users/noush/Desktop/rankmyprop/public/home-shell.js#L66-L75) and [public/global-footer.js](file:///c:/Users/noush/Desktop/rankmyprop/public/global-footer.js#L3-L6).
  - Rebuilt project (`npm run build`). Verified in `dist/home-shell.js` and `dist/index.html`.

---

## 3. Architecture Map (Step 0)

### 3.1 Technology Stack & Deployment
- **Client Framework:** Static HTML + Vanilla JS hydration modules (`firms-view.js`, `home-shell.js`, `firm-first-paint.js`, `cloudflare-data.js`) + React components in `src/`.
- **Bundler / Build Tool:** Vite v8.1.5 + Rollup/Rolldown, Node.js scripts (`generate-seo-pages.cjs`, `generate-static-first-paint.cjs`, `generate-seo-evidence.cjs`).
- **Admin Panel:** Separate browser-based Single Page Applications under `public/admin-*.html` styled with `operations-console.css` and powered by Firebase Web SDK (`10.12.5`).
- **Databases:**
  1. **Firebase Firestore:** Document database (`rank-my-prop`) used by admin UI for writes (`firms`, `offers`, `reviews`, `propNewsPosts`, etc.).
  2. **Cloudflare D1 (SQLite via Workers):** Primary runtime query layer (`rankmyprop-db`) fronted by `rankmyprop-api.theforexclue.workers.dev`.
  3. **Local JSON Snapshots:** `public/seo-evidence.json` and `public/firms-data.js` used by Vite/Node build pipelines to generate pre-rendered SSR first-paint HTML.
- **Caching Layers:**
  - Client in-memory `Map` & `sessionStorage` in `public/cloudflare-data.js` (TTL: 3 minutes / 180,000 ms).
  - Cloudflare Edge CDN caching.
  - Build-time static HTML snapshots in `dist/`.

### 3.2 Model Mapping Table

| Model | Admin UI Route | Admin API / Save Route | Database Storage | Public Client Route(s) | Cache / Revalidation Mechanism |
|---|---|---|---|---|---|
| **Firms** | `/admin-firm-details.html`, `/admin-best-indian-prop-firms.html` | Firestore `setDoc(doc(db, "firms", id))` + Worker `PUT /v1/collections/firms/:id` | Firestore `firms` collection + Cloudflare D1 `documents` table (`collection='firms'`) | `/listedprop`, `/bestprop`, `/best-indian-prop-firms`, `/prop-firms/:slug`, `/firms/:slug` | **Discrepancy:** Build-time static snapshot (`seo-evidence.json`) does NOT auto-rebuild on admin save. Client JS has 3-min `sessionStorage` cache. |
| **Challenges / Evaluation Programs** | `/admin-firm-details.html` (Evaluation tab) | Firestore `setDoc` under `challengesPanelData` / `evaluationPrograms` | Firestore `firms/:id` + Cloudflare D1 `documents` (inside firm JSON) | `/prop-firms/:slug`, `/firms/:slug`, `/prop-firm-rules/:slug/:program` | Static first paint in `dist/prop-firms/*.html`. Client JS loads via `cloudflare-data.js`. |
| **Deals / Promo Codes** | `/admin-offers.html` | Firestore `setDoc(doc(db, "offers", id))` + Worker `PUT /v1/collections/offers/:id` | Firestore `offers` + Cloudflare D1 `documents` (`collection='offers'`) | `/offers`, `/offers/:slug`, home hero banner | Static build snapshot in `dist/offers/*.html` + client-side `offers-service.js`. |
| **Reviews** | `/admin-reviews.html`, `/admin-moderation.html` | Firestore `updateDoc(doc(db, "reviews", id))` (`status: 'Approved'`) | Firestore `reviews` collection | `/reviews`, `/prop-firms/:slug/reviews` | Build-time `reviewFirstPaintCards()` in `generate-seo-pages.cjs`. Client loads via `api/reviews`. |
| **Blog / Content Guides** | `/admin-propnews.html`, `/admin-trading-guides.html`, `/admin-funding-strategies.html`, etc. | Firestore `setDoc(doc(db, collectionName, id))` | Firestore collection per section | `/prop-news`, `/trading-guides`, `/funding-strategies`, `/:category/:slug` | Static HTML generated by `generate-seo-pages.cjs`. |
| **Media (Logos / Banners)** | `/admin-firm-details.html` (`saveFirmLogoBtn`) | Client-side Canvas WebP compression + Data URI / R2 Storage | Firestore `firms.logo` + Cloudflare D1 `documents.data.logo` | Firm cards (`.pf-logo`), firm detail header (`#firmLogo`) | Inline Data URI or R2 URL cached in browser / CDN. |
| **Global Settings / Copy** | `/admin-content-cms.html` | Firestore `setDoc(doc(db, "pageCopy", id))` | Firestore `pageCopy` collection | Site headings, paragraphs via `content-cms-runtime.js` | Injected into DOM after DOMContentLoaded via `content-cms-runtime.js`. |

---

## 4. Root Cause Analysis: Why Admin Changes Break or Do Not Propagate to the Client

### Defect 1: The Dual-Database & Static Decoupling (Critical Architecture Flaw)
- **Evidence:**
  - In [public/admin-best-indian-prop-firms.html:364-407](file:///c:/Users/noush/Desktop/rankmyprop/public/admin-best-indian-prop-firms.html#L364-L407) and [public/admin-firm-details.html:1588-1670](file:///c:/Users/noush/Desktop/rankmyprop/public/admin-firm-details.html#L1588-L1670):
    When an admin saves a firm or updates a logo, it writes to **Firebase Firestore** and attempts to mirror to **Cloudflare Worker** via `fetch(cloudflareFirmUrl, { method: "PUT", ... })`.
  - However, when users visit `https://www.rankmyprop.in/best-indian-prop-firms` or `http://localhost:5173/best-indian-prop-firms`:
    1. The server delivers the **pre-compiled static HTML** generated by `scripts/generate-static-first-paint.cjs`. That script reads **strictly from `public/seo-evidence.json` and `public/firms-data.js`**.
    2. Then, `public/firms-view.js:764-770` kicks in on the browser:
       ```javascript
       const [, , firms, liveReviewStats] = await Promise.all([
         wait(UX_DELAY_MS),
         loadFilterOptions(),
         getFirmsByType(listingType, { bestRegion, bestCategory: bestCategory.key }),
         loadLiveReviewStats()
       ]);
       ```
    3. `getFirmsByType()` calls `listDocuments("firms", 500)` in [public/firms-service.js:308](file:///c:/Users/noush/Desktop/rankmyprop/public/firms-service.js#L308), which fetches live from `https://rankmyprop-api.theforexclue.workers.dev/v1/collections/firms`.
    4. **The Break:**
       Live probe of `https://rankmyprop-api.theforexclue.workers.dev/v1/collections/firms` returned:
       ```json
       [
         { "name": "FundedFun", "id": "Funded-fun", "bestRegions": { "india": true } },
         { "name": "Aqua funded", "id": "aqua-funded", "bestRegions": { "india": true } },
         { "name": "Blueberry Funded", "id": "blueberry-funded", "bestRegions": { "india": true } },
         { "name": "FXIFY", "id": "fxify", "bestRegions": { "india": true } },
         { "name": "Goat Funded Trader", "id": "goat-funded-trader", "bestRegions": { "india": true } },
         { "name": "QT Funded", "id": "qt-funded", "bestRegions": { "india": true } }
       ]
       ```
       And a query for Trade Bridges (`/v1/collections/firms/trade-bridges`) returned:
       `HTTP 404: { "error": "Not found" }`!
    5. **Consequence:** Even though the static build was correctly compiled with Trade Bridges, the client-side JavaScript hydrated from the remote Cloudflare Worker which still holds the 6 old Indian firms and lacks Trade Bridges. This wiped Trade Bridges off the screen and flashed the 6 old firms!

---

## 5. Pass / Fail Verification Matrix

| Area / Feature | Status | Evidence / Details |
|---|:---:|---|
| **Nav Link: Best Indian Prop Firms** | ✅ PASS | Fixed in `home-shell.js` and `global-footer.js`. Renders in dropdown and footer. |
| **India Listing Static HTML** | ✅ PASS | `dist/best-indian-prop-firms.html` contains only Trade Bridges (`data-firm-slug="trade-bridges"`). |
| **Trade Bridges Rules & Policies** | ✅ PASS | Verified 22/22 items in `scripts/verify-trade-bridges.cjs` (2-Step, 1-Step, Instant Funding, 30% consistency, ₹5,000 payout, etc.). |
| **Regulatory Status Callout** | ✅ PASS | Visible callout: *"Regulatory Status: Not registered or regulated by any financial authority"*. |
| **Admin Auth Check (Client)** | ⚠️ WARN | Client-side hardcoded check in `public/admin-common.js:3`: `ADMIN_EMAIL = "rankmyprop@gmail.com"`. Anyone altering local JS could bypass client guard; backend API enforcement is required. |
| **Admin Auth Check (Server)** | ✅ PASS | `cloudflare/src/index.js:57-73` verifies Firebase JWT token and validates email against `ADMIN_EMAIL`. Rejects unauthenticated with 401/403. |
| **Admin Logo Upload (`saveFirmLogoBtn`)** | ⚠️ WARN | Works in Firestore & Cloudflare D1, but does **not** regenerate `seo-evidence.json` or rebuild static HTML. Static first paint shows initials placeholder until client hydration runs. |
| **Cloudflare D1 Remote Sync** | ❌ FAIL | Remote D1 database currently contains stale Indian records and is missing Trade Bridges. Remote D1 must be synchronized via admin or migration script. |
| **Raw HTML / SSR (No JS)** | ✅ PASS | `curl` against `dist/best-indian-prop-firms.html` returns Trade Bridges SSR card and noscript directory. |

---

## 6. Detailed Defects Register

### DEF-01 (Blocker): Remote Cloudflare D1 Holds Stale Indian Firms & Missing Trade Bridges
- **Severity:** Blocker
- **Reproduction:** Load `http://localhost:5173/best-indian-prop-firms`. Observe client-side network request to `https://rankmyprop-api.theforexclue.workers.dev/v1/collections/firms`.
- **Expected:** API returns only `trade-bridges` with `bestRegions.india: true`, and all other firms with `bestRegions.india: false`.
- **Actual:** API returns 6 old firms with `india: true`, and returns 404 for `trade-bridges`.
- **Files Suspected:** Cloudflare D1 database `rankmyprop-db` (`documents` table).
- **Remediation:** Execute a Cloudflare sync script with admin token to `PUT /v1/collections/firms/trade-bridges` and `PATCH /v1/collections/firms/{id}` to set `bestRegions.india = false` for the 6 old firms.

### DEF-02 (High): Static Build Pipeline Disconnected from Live Admin Updates
- **Severity:** High
- **Reproduction:** Edit a firm in `admin-firm-details.html`. Refresh public `/prop-firms/{slug}` with JavaScript disabled.
- **Expected:** Stored admin edits appear in the raw HTML.
- **Actual:** Raw HTML serves the static snapshot built during `npm run build`. Edits only appear after client JS runs (or not at all if client JS fails or page has no hydration).
- **Files Suspected:** `scripts/generate-seo-pages.cjs`, `scripts/generate-seo-evidence.cjs`.
- **Remediation:** Configure a build webhook / deploy hook (e.g. Cloudflare Deploy Hook or GitHub Actions workflow dispatch) triggered when the admin saves in `admin-firm-details.html`.

### DEF-03 (Medium): Client-Side Cache Delay on Hydration
- **Severity:** Medium
- **Reproduction:** Edit a firm via admin. Open public client in the same browser session.
- **Expected:** Instant update.
- **Actual:** `public/cloudflare-data.js:4` caches responses in `sessionStorage` for 3 minutes (`CACHE_TTL_MS = 180000`). Edits take up to 3 minutes to appear unless cache is cleared.
- **Files Suspected:** `public/cloudflare-data.js:4`.
- **Remediation:** Admin save already calls `clearCache()` in admin tab, but public visitors retain cached data until TTL expiry. Add a cache version or `updatedAt` comparison check.

---

## 7. How to Enable Full Admin Control Over Logo & All Fields

To ensure that the Admin Panel can change the logo, challenge parameters, and rules with immediate reflection:
1. **In the Admin Panel (`public/admin-firm-details.html`):**
   - The logo upload button (`#saveFirmLogoBtn`) and firm save button (`#saveBtn`) already convert uploaded image files to high-performance WebP and save them to `firms[id].logo`.
   - Once the Cloudflare D1 record for `trade-bridges` is synced, any logo or field change saved in `admin-firm-details.html` will immediately persist in Firestore and Cloudflare D1.
2. **On the Client Side (`public/firms-service.js` & `public/firms-view.js`):**
   - `firms-view.js:611` is already wired to render `<img src="${f.logo}">` whenever `f.logo` is non-empty.
   - When a logo is saved in Admin, client hydration immediately displays the new logo.

---

## 8. Recommended Action Plan (Awaiting User Approval)

1. **Phase 1: Cloudflare D1 Sync (Safe Remote Update)**
   - Run a secure migration script targeting `rankmyprop-api.theforexclue.workers.dev` to:
     - Push `trade-bridges` into D1 `documents` collection.
     - Set `bestRegions.india = false` for the 6 old firms in D1.
2. **Phase 2: Verify Admin Logo & Field Editing**
   - Log into `admin-firm-details.html` as `rankmyprop@gmail.com`.
   - Select `Trade Bridges` from the firm picker.
   - Upload a test logo and save. Confirm immediate display on `/best-indian-prop-firms` and `/prop-firms/trade-bridges`.
3. **Phase 3: Automated Rebuild Hook**
   - Wire a Cloudflare Pages deploy hook to `admin-firm-details.html` so major firm changes trigger an automated static build.

*(Per prompt instructions, no further fixes will be applied until approved.)*

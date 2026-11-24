# Dependency and Configuration Map

> **STATUS:** LOCKED BASELINE  
> **SCOPE:** Packages, Compilers, Build Tools, Environment Variables, and Cloud Configurations

---

## 1. Root Dependencies (`package.json`)

### A. Runtime Dependencies
```json
{
  "@supabase/supabase-js": "^2.110.0",
  "@vitejs/plugin-react": "latest",
  "cors": "latest",
  "express": "latest",
  "firebase": "^10.12.5",
  "firebase-admin": "^14.2.0",
  "react": "latest",
  "react-dom": "latest",
  "vite": "latest"
}
```

### B. Development Dependencies
```json
{
  "@types/cors": "latest",
  "@types/express": "latest",
  "@types/node": "latest",
  "@types/react": "latest",
  "@types/react-dom": "latest",
  "concurrently": "latest",
  "tsx": "latest",
  "typescript": "latest"
}
```

### C. Dependency Overrides & Engines
- **Node Engine:** `"node": "22.x"`
- **Overrides:** `"jose": "5.10.0"` (Enforced to ensure compatible JWT verification in edge and serverless environments)

---

## 2. Cloudflare Worker Dependencies (`cloudflare/package.json`)

```json
{
  "dependencies": {
    "@block65/webcrypto-web-push": "^0.1.7",
    "jose": "^5.10.0"
  },
  "devDependencies": {
    "wrangler": "^3.114.0"
  }
}
```

---

## 3. Configuration Files Breakdown

### 1. `vite.config.ts`
- **Plugins:** `dashboardRoutes()`, `react()`
- **Build Settings:**
  - Rolldown output code-splitting:
    - `firebase` chunk (`@firebase`, `firebase`), max size `240,000` bytes, priority `20`.
    - `react` chunk (`react`, `react-dom`), priority `10`.
- **Server:** Port `5173`, proxy `/api` requests to `http://localhost:4000`.

### 2. `dashboard-routes.ts`
- Central routing manifest exporting:
  - `DASHBOARD_ROUTES`: 38 preserved routes (`login`, `dashboard`, `tradejournal`, `admin-*`, `support-dashboard`, etc.).
  - `PUBLIC_STATIC_ROUTES`: 64 public static routes (`prop-news`, `trading-guides`, `compare`, `firm-rules`, `calculators`, etc.).
  - `PUBLIC_ROUTE_REDIRECTS`: Legacy redirects (`/discount` -> `/offers`, `/privacypolicy` -> `/privacy-policy`, etc.).

### 3. `cloudflare/wrangler.jsonc`
- **Worker Name:** `rankmyprop-api`
- **Main Entry:** `src/index.js`
- **Compatibility Date:** `2026-09-18`
- **Routes:** `rankmyprop.in/*` (Zone ID: `7e4a484758b4a367fe2a2fb6419e9e0f`)
- **D1 Databases:** Binding `DB` -> `rankmyprop-db` (`6c2572cb-6359-4285-bf42-db706283dc90`)
- **R2 Buckets:** Binding `MEDIA` -> `rankmyprop-media`
- **Queues:**
  - Producer: Binding `JOBS` -> `rankmyprop-jobs`
  - Consumer: Queue `rankmyprop-jobs` (`max_batch_size: 100`, `max_batch_timeout: 5`, `max_retries: 3`)
- **Environment Variables:**
  - `ENVIRONMENT`: `"production"`
  - `FIREBASE_PROJECT_ID`: `"rank-my-prop"`
  - `ALLOWED_ORIGINS`: `"https://www.rankmyprop.in,https://rankmyprop.in,https://rankmyprop-web.pages.dev,http://127.0.0.1:5173,http://localhost:5173"`
  - `ADMIN_EMAIL`: `"rankmyprop@gmail.com"`
  - `VAPID_SUBJECT`: `"mailto:rankmyprop@gmail.com"`
  - `VAPID_PUBLIC_KEY`: `"BF9HlG7St6-z7GobSF8TnO9to1FE5ufJwkCr5pZegQzI2r_okgnOX7YKXYadWaRmSzmNsGveJ8IPR9leqbbdVxY"`

### 4. `firebase.json` & `.firebaserc`
- Default Firebase project: `rank-my-prop`.
- Configured for Cloud Firestore security rules (`firestore.rules`).

---

## 4. Environment Variables Map

### A. Browser-Safe Variables (`public/rmp-runtime-env.json`)
Generated automatically via `scripts/generate-runtime-env.cjs`. Only keys prefixed with `VITE_` are exposed:
- `VITE_FIREBASE_VAPID_KEY`
- `VITE_SUPABASE_PROJECT_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_NOTIFY_FUNCTION_NAME` (Default: `rmp-email-notifier`)
- `VITE_EMAIL_NOTIFICATIONS_ENABLED` (Default: `true`)
- `VITE_EMAIL_NOTIFICATIONS_DEBUG`

### B. Server-Only Secrets (Hosting Provider / `.env.local` ONLY)
**CRITICAL:** Must NEVER be committed, exposed in client assets, or added to `public/rmp-runtime-env.json`:
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `FIREBASE_WEB_API_KEY`
- `CEO_ADMIN_EMAIL`
- `SUPABASE_PROJECT_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `INTERNAL_NOTIFY_TOKEN`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `SITE_URL`
- `SESSION_SECRET` (For Cloudflare edge session signing)
- `MIGRATION_SECRET`

---

## 5. Build & Test Scripts Reference

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `npm run env:runtime && concurrently ... "vite" "tsx watch server/index.ts"` | Boots both Vite client and Express server concurrently |
| `npm run test` | `npm run test:route-content && npm run test:reviews-api && npm run test:integration` | Runs full regression test suite |
| `npm run test:route-content` | `node scripts/test-route-content.cjs` | Validates route content rendering and static fallback data |
| `npm run test:reviews-api` | `node scripts/test-public-reviews-api.cjs` | Tests approved review filtering, privacy redaction, and summaries |
| `npm run test:integration` | `npm run env:runtime && node scripts/verify-integration.cjs && npm run preserve:verify && npm run build` | Full integration pipeline verification |
| `npm run build` | Multi-step pipeline | Builds runtime env, evidence, market report, sitemaps, compiles TS, runs Vite build, and pre-renders static SEO pages |
| `npm run preserve:verify` | `shasum -a 256 -c docs/dashboard-preservation.sha256` | Checks SHA-256 hashes of preserved dashboard files |
| `npm run preserve:firms` | `shasum -a 256 -c docs/firm-pages-preservation.sha256` | Checks SHA-256 hashes of preserved firm detail files |

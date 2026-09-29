# RMP dashboard integration notes

## Preserved boundary

- The public website is the React application in `src/`.
- `public/*.html` contains only the preserved client, admin, support, and authentication surfaces.
- The old public website pages were not imported.
- `api/support-*` remains the local compatibility source while the production API runs on Cloudflare Workers.
- Firebase/Firestore remains the client and admin source of truth.
- Supabase remains the support identity, approvals, submissions, and audit store.

## Intentional preservation delta

`public/dashboard.html` has one behavior-only fix: mobile sidebar variables use function-scoped declarations so the initial page selection cannot access them in the temporal dead zone. This removes a startup console error without changing layout, content, routes, or user-visible behavior.

Run the preservation checks with:

```bash
npm run preserve:verify
node scripts/verify-dashboard-source.cjs "/path/to/RMP_Dashboard_Preservation_2026-07-19"
```

## Environment requirements

The supplied private environment file contains browser Firebase and Supabase values. Server-only values belong in Cloudflare Worker secrets or the retained upstream service configuration, never in Pages assets:

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

Never place server-only values in `public/rmp-runtime-env.json`.

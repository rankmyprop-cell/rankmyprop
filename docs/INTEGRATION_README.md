# Rank My Prop Dashboard Preservation Bundle

Snapshot date: 2026-07-19

This bundle preserves the existing dashboard system so it can be integrated into a fresh Rank My Prop public frontend without redesigning or rewriting dashboard behavior.

## Preserved surfaces

- Client dashboard and its login, onboarding, profile, rewards, review, challenge, announcement, rule, and trade-journal flows
- Complete admin dashboard and all `admin-*.html` management screens
- Support dashboard, support-access administration, Vercel support APIs, and their shared server libraries
- Shared Firebase authentication/Firestore configuration and rules
- Supabase support-dashboard schema, email-notification schema, and notification Edge Function
- Dashboard CSS, JavaScript services, fallback data, icons, email assets, and other referenced assets

## Main entry files

- `dashboard.html` — client dashboard
- `dashboard-admin.html` — admin dashboard
- `support-dashboard.html` — support dashboard
- `login.html` — shared client/admin authentication entry
- `admin-support-access.html` — support staff access management

## Integration rules

1. Keep the preserved files and relative paths together when moving them into the new website.
2. Do not rename the dashboard entry files or `/api/support-*` routes unless all internal references are updated.
3. Keep `assets/`, `api/`, and `supabase/` directory structures unchanged.
4. The preserved `.env.local` contains the current environment values. Keep it private and reconnect those values securely in the new hosting environment. Use `.env.example` as the variable checklist.
5. Apply `firestore.rules`, `supabase/sql/001_email_notifications.sql`, and `supabase/sql/002_support_dashboard.sql` to the matching existing projects when required.
6. Deploy `supabase/functions/rmp-email-notifier` separately when setting up email notifications.
7. After integration, test client, admin, and support roles separately before publishing the new frontend.

## Security note

This private archive includes `.env.local` because it was explicitly requested for full preservation. It may contain live credentials and must not be committed to public source control, shared publicly, or placed in public web assets. Public Firebase configuration remains in `firebase-config.js`, as required by the browser client. Server-only keys should be configured through the hosting provider when the preserved dashboards are integrated.

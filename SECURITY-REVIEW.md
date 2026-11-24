# Security and Code Audit

**Audit date:** 2026-11-19  
**Scope:** Read-only review of authentication, authorization, API handlers, Firebase rules, secrets, CORS, data exposure, migrations, and build/runtime configuration.  
**Repository state:** No files were modified and nothing was pushed.

## Security findings

| # | Severity | File | Lines | Vulnerability | Confidence |
|---|----------|------|-------|---------------|------------|
| 1 | 🟠 HIGH | [firestore.rules](/c:\Users\noush\Desktop\rankmyprop\firestore.rules) | 60-62 | A broad catch-all rule grants unrestricted read/write access to every document for users with `team_review` or `moderator` claims, bypassing collection-specific restrictions. | 10/10 |
| 2 | 🟠 HIGH | [cloudflare/src/index.js](/c:\Users\noush\Desktop\rankmyprop\cloudflare\src\index.js) | 329-336 | `saveDocument` can fall back to migration or administrative behavior when `MIGRATION_SECRET` is absent, allowing broader document-write access than intended. | 9/10 |
| 3 | 🟡 MEDIUM | [supabase/functions/rmp-email-notifier/index.ts](/c:\Users\noush\Desktop\rankmyprop\supabase\functions\rmp-email-notifier\index.ts) | 117-125, 712-716, 778-785 | The email endpoint accepts public Supabase publishable keys and trusts caller-supplied recipient/event data, creating a risk of unauthorized or unsolicited notifications. | 9/10 |
| 4 | 🟡 MEDIUM | [firestore.rules](/c:\Users\noush\Desktop\rankmyprop\firestore.rules) | 365-366 | Every authenticated user can create or overwrite `reviewReactionStats`, allowing public reaction counts to be fabricated. | 8/10 |

## Finding details

### 1. Broad privileged catch-all Firestore rule — HIGH

The global catch-all in [firestore.rules](/c:\Users\noush\Desktop\rankmyprop\firestore.rules) grants document-wide access to `team_review` and `moderator` claims. It can override the narrower collection rules and expose sensitive records such as users, purchases, claims, and submissions.

**Recommendation:** Remove the broad catch-all role rule. Use explicit collection match rules and verify privileged roles server-side or through narrowly scoped custom-claims management.

### 2. Migration-secret fallback in Cloudflare document writes — HIGH

In [cloudflare/src/index.js](/c:\Users\noush\Desktop\rankmyprop\cloudflare\src\index.js), `saveDocument` changes authorization behavior when `MIGRATION_SECRET` is missing. The route can write arbitrary collection/document payloads through document upsert and migration endpoints.

**Recommendation:** Fail closed when `MIGRATION_SECRET` is not configured. Never allow migration routes to become active due only to missing server configuration.

### 3. Public-key authorization and caller-controlled email recipients — MEDIUM

In [supabase/functions/rmp-email-notifier/index.ts](/c:\Users\noush\Desktop\rankmyprop\supabase\functions\rmp-email-notifier\index.ts), `isAllowedRequest` accepts public Supabase publishable keys. Publishable keys are intended for browser use and are not a strong caller-authentication mechanism. The payload may specify notification recipients or event data.

**Recommendation:** Require a private server-to-server notification token, or authenticate the caller and derive recipients server-side. Do not accept notification recipients supplied solely by public clients.

### 4. Unrestricted review reaction statistics — MEDIUM

The `reviewReactionStats` rule in [firestore.rules](/c:\Users\noush\Desktop\rankmyprop\firestore.rules) permits any authenticated user to read and write public reaction count documents.

**Recommendation:** Make reaction statistics client-read-only and aggregate reactions with a privileged server transaction or trusted backend function. Persist one reaction identity per user/review and update counts atomically.

## Important non-security engineering issues

1. **Production dependency mismatch:** [package.json](/c:\Users\noush\Desktop\rankmyprop\package.json) starts Express with `tsx server/index.ts`, but `tsx` is listed only as a dev dependency. Production installs that omit dev dependencies may fail to start.

2. **Unstable dependency resolution:** [package.json](/c:\Users\noush\Desktop\rankmyprop\package.json) uses `latest` for core runtime dependencies such as React, Vite, Express, CORS, and the Vite React plugin. Lockfile regeneration or a non-locking install could introduce breaking or incompatible versions.

3. **Silent migration truncation:** [cloudflare/src/index.js](/c:\Users\noush\Desktop\rankmyprop\cloudflare\src\index.js) caps document and auth-user migration imports at 100 records. The response reports only records actually inserted and does not indicate that a source payload was truncated.

**Recommendation:** Remove silent slicing or add explicit pagination/continuation behavior and accurate truncated-import warnings.

## Verification status

No patch was made, no tests were run, and no commit or push was created. The findings are based on direct source review and should be validated again after configuration and authorization changes.
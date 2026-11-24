# Authentication and Authorization Map

> **STATUS:** LOCKED BASELINE  
> **SCOPE:** Authentication Providers, Token Lifecycles, Role-Based Access Control (RBAC), and Security Rules

---

## 1. Authentication Systems Overview

Rank My Prop utilizes three distinct identity and session layers:

1. **Google Firebase Authentication (Public & User Layer):**
   - **Audience:** Public visitors, registered traders, reviewers, and traditional platform administrators.
   - **Provider:** Email/Password, Google OAuth.
   - **Configuration:** Project `rank-my-prop`, Auth Domain `rank-my-prop.firebaseapp.com`.
   - **Client Implementation:** Initialized in `src/firebase.ts` and referenced across `public/*.html`.
   - **Token Verification:** Server-side verification via Google JWKS (`https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`).

2. **Supabase Authentication (Support Operations Layer):**
   - **Audience:** Internal support team members and operators.
   - **Provider:** Email/Password with isolated user records in Supabase `auth.users`.
   - **Isolation:** Completely detached from public trader accounts. Support staff have zero direct access to production Firebase credentials.

3. **Cloudflare Session Engine (Edge Layer):**
   - **Mechanism:** JWT cookie named `rmp_session` signed using HMAC-SHA256 with `SESSION_SECRET`.
   - **Issuer:** `rankmyprop-cloudflare`, Audience: `rankmyprop-web`.
   - **Exchange Route:** `/v1/auth/exchange` validates a Firebase ID token and issues the `rmp_session` cookie.

---

## 2. Roles and Permissions Matrix

| Role | Identity Store | Permissions | Primary Surfaces |
|---|---|---|---|
| **Anonymous / Public** | None | Read approved firms, offers, calculators, guides, and approved reviews. Cannot post reviews or modify data. | Public pages, calculators, directory |
| **Authenticated Trader (`user`)** | Firebase Auth (Standard) | Read/write own user profile (`users/{userId}`), trade journal, challenge tracker, submit reviews for moderation. | `dashboard.html`, `tradejournal.html`, `my-profile.html` |
| **Review Moderator (`team_review` / `moderator`)** | Firebase Auth (Custom Claims) | Read review moderation queue, approve/reject community reviews, update firm review profiles. | `admin-reviews.html`, `admin-moderation.html` |
| **Platform Administrator (`admin` / CEO)** | Firebase Auth (`admin: true` or email `rankmyprop@gmail.com`) | Full unrestricted read/write access across all Firestore collections, Cloudflare API admin routes, D1 database. | `dashboard-admin.html`, all `admin-*.html` screens |
| **Support Agent (`support`)** | Supabase Auth (`support_profiles.role = 'support'`) | Read support dashboard. Cannot directly edit Firestore. Must submit proposed changes to `support_submissions` queue. | `support-dashboard.html` |
| **Support Super Admin (CEO Reviewer)** | Supabase Auth (`support_profiles.role = 'ceo'`) | Reviews, approves, or rejects support team submissions. On approval, automated handlers commit changes to live Firestore. | `support-dashboard.html`, `admin-support-access.html` |

---

## 3. Firestore Security Rules Enforcement (`firestore.rules`)

The production Firestore configuration defines 434 lines of access control:

### A. Core Helper Functions
```javascript
function isPrivileged() {
  return request.auth != null &&
    (request.auth.token.admin == true ||
     request.auth.token.email == "rankmyprop@gmail.com" ||
     request.auth.token.team_review == true ||
     request.auth.token.moderator == true);
}

function isOwnUserDoc(userId) {
  return request.auth != null && request.auth.uid == userId;
}
```

### B. Access Restrictions by Collection
- **User Documents (`{userId}/{document=**}`):** Read/write allowed ONLY if `request.auth.uid == userId`. Name modifications are locked if `nameLocked == true`.
- **Public Directory Collections (`firms`, `offers`, `giveaways`, `upcomingEvents`, `bonusOffers`):**
  - Read: Public (`true`).
  - Write: Restricted strictly to `isPrivileged()`.
- **Public CMS Content (`pageHeadingsParagraphs`, `pageCopy`, `pageSeoContent`, `pageFaqs`, `propNewsPosts`, `tradingGuidesPosts`, etc.):**
  - Read: Public (`true`).
  - Write: Restricted strictly to `isPrivileged()`.
- **Reviews Collection (`reviews`, `firmReviews`):**
  - Read: Public for approved reviews (`resource.data.status in ['Approved', 'approved', 'Published', 'published']`).
  - Create: Authenticated users can submit reviews with initial `status: 'Pending'`.
  - Update/Delete: Restricted to review author (prior to approval) or `isPrivileged()`.
- **Likes & Follows (`firmLikes`):**
  - Create/Delete: Enforces atomic 1-like-per-user constraint (`likeId == firmId + "_" + request.auth.uid`).

---

## 4. Supabase Row Level Security (RLS) Policies

All internal support tables in Supabase have strict Row Level Security enabled:

1. **`public.support_profiles`:**
   - Client policy: `for all using (false) with check (false)`. Direct client API access is completely revoked. Access is restricted to trusted serverless handlers using the Supabase Service Role Key.
2. **`public.support_submissions`:**
   - Direct client access revoked (`using (false)`). Managed exclusively through `api/support-submissions.js` and `api/support-approvals.js`.
3. **`public.support_audit_logs`:**
   - Append-only audit trail logging every proposal, approval, and rejection. Direct client access revoked.
4. **`public.email_notifications`:**
   - Client access revoked. Read/write strictly managed by backend functions.

---

## 5. Security Audit Baseline & Known Caveats

As recorded in `SECURITY-REVIEW.md`:
1. **Catch-All Admin Rule (Lines 60–62 in `firestore.rules`):** A catch-all grants document-wide access to `team_review` and `moderator` custom claims. Must not be modified without explicit user authorization.
2. **Migration Key Fallback in Cloudflare:** `saveDocument` in `cloudflare/src/index.js` handles migration keys. Preserved as-is until authorized.
3. **Internal Notification Tokens:** `INTERNAL_NOTIFY_TOKEN` is required to authenticate server-to-server notifications and protect the email dispatcher.

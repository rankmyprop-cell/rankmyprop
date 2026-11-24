# API and Database Map

> **STATUS:** LOCKED BASELINE  
> **SCOPE:** Complete Catalog of API Endpoints, HTTP Methods, Schemas, and Storage Bindings

---

## 1. Cloudflare Worker API Endpoints (`cloudflare/src/index.js`)

**Base URL:** `https://rankmyprop-api.theforexclue.workers.dev` (Proxied in production via `/v1/*` and `/api/*`)

### A. Authentication & User Session
| Route | Method | Access | Description |
|---|---|---|---|
| `/v1/auth/exchange` | `POST` | Authenticated (Bearer) | Exchanges a Firebase ID token for a Cloudflare session JWT (`rmp_session`). Upserts user into D1 `auth_users`. |
| `/v1/auth/session` | `GET` | Session Cookie | Validates `rmp_session` cookie and returns user identity, email, and role. |
| `/v1/auth/logout` | `POST` | Public | Clears `rmp_session` HTTP-only cookie. |
| `/v1/auth/user` | `GET` | Session Cookie | Returns complete user profile from D1 `auth_users`. |

### B. Dynamic Collection Document Store
| Route | Method | Access | Description |
|---|---|---|---|
| `/v1/collections/:collection` | `GET` | Public (Whitelisted) | Lists documents from D1 `documents` table. Supports `limit`, `cursor`, `prefix`. Whitelist defined in `PUBLIC_COLLECTIONS`. |
| `/v1/collections/:collection` | `POST` | Admin / Migration Key | Creates a new document record with revision tracking in `document_revisions`. |
| `/v1/collections/:collection/:id` | `GET` | Public (Whitelisted) | Fetches single document record by collection name and document ID. |
| `/v1/collections/:collection/:id` | `PUT` | Admin / Migration Key | Full upsert/replacement of document. Creates a point-in-time snapshot in `document_revisions`. |
| `/v1/collections/:collection/:id` | `PATCH` | Admin / Migration Key | Partial update of document fields. |
| `/v1/collections/:collection/:id` | `DELETE` | Admin / Migration Key | Deletes document and archives status. |

### C. Web Push Notifications
| Route | Method | Access | Description |
|---|---|---|---|
| `/v1/push/subscribe` | `POST` | Public / User | Registers a browser Web Push subscription endpoint and keys in D1 `push_subscriptions`. |
| `/v1/push/unsubscribe` | `POST` | Public / User | Deactivates push subscription. |
| `/v1/push/send` | `POST` | Admin | Broadcasts push notification to subscribers via VAPID keys and `@block65/webcrypto-web-push`. |

### D. Legacy Compatibility Routes
| Route | Method | Access | Description |
|---|---|---|---|
| `/api/admin/stats` | `GET` | Admin | Returns aggregate platform statistics. |
| `/api/newsletter/subscribe` | `POST` | Public | Subscribes an email to the newsletter list in D1. |
| `/api/public-page-content` | `GET` | Public | Serves aggregated CMS page text, FAQs, and SEO copy. |
| `/api/reviews` | `GET` | Public | Serves approved public reviews with aspect ratings, summaries, and pagination. |
| `/api/reviews/:firm` | `GET` | Public | Serves approved reviews filtered by specific prop firm slug. |
| `/api/youtube/latest` | `GET` | Public | Scrapes / fetches latest video uploads from `@RankMyProp` YouTube channel. |

---

## 2. Local / Serverless Support Endpoints (`api/` & `server/index.ts`)

| Endpoint | Method | Source File | Description |
|---|---|---|---|
| `/api/support-login` | `POST` | `api/support-login.js` | Authenticates support agents against Supabase `auth.signInWithPassword`. |
| `/api/support-session` | `GET` | `api/support-session.js` | Validates active support JWT and returns profile role (`support` / `ceo`). |
| `/api/support-refresh` | `POST` | `api/support-session.js` | Refreshes expired Supabase session tokens. |
| `/api/support-overview` | `GET` | `api/support-overview.js` | Aggregates support queue counts (`pending`, `approved`, `rejected`). |
| `/api/support-workspace` | `GET` | `api/support-workspace.js` | Returns operational settings and permission flags. |
| `/api/support-actions` | `POST` | `api/support-actions.js` | Triggers support actions (e.g., resync requests). |
| `/api/support-accounts` | `GET`, `POST` | `api/support-accounts.js` | Lists and provisions support user profiles in Supabase. |
| `/api/support-submissions` | `GET`, `POST` | `api/support-submissions.js` | Lists pending change proposals or submits a new change proposal. |
| `/api/support-approvals` | `POST` | `api/support-approvals.js` | CEO endpoint to approve or reject a pending submission. Approvals push data to Firestore. |
| `/api/health` | `GET` | `server/index.ts` | Local health check returning `{ ok: true, service: "rank-my-prop-api" }`. |
| `/api/firms` | `GET` | `server/index.ts` | Returns mock firm list from `server/data.ts`. |
| `/api/firms/:id` | `GET` | `server/index.ts` | Returns single mock firm by ID. |

---

## 3. Database Schemas

### A. Cloudflare D1 (SQLite)
Migrations located in `cloudflare/migrations/`:

#### 1. `documents` Table
- `collection` (TEXT NOT NULL)
- `id` (TEXT NOT NULL)
- `data` (TEXT NOT NULL - JSON string)
- `created_at` (TEXT NOT NULL - ISO8601)
- `updated_at` (TEXT NOT NULL - ISO8601)
- *Primary Key:* `(collection, id)`

#### 2. `document_revisions` Table
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `collection` (TEXT NOT NULL)
- `document_id` (TEXT NOT NULL)
- `data` (TEXT NOT NULL - JSON snapshot)
- `revision_hash` (TEXT NOT NULL - SHA-256)
- `created_at` (TEXT NOT NULL - ISO8601)

#### 3. `auth_users` Table
- `uid` (TEXT PRIMARY KEY)
- `email` (TEXT)
- `display_name` (TEXT)
- `photo_url` (TEXT)
- `role` (TEXT DEFAULT 'user')
- `last_seen_at` (TEXT)
- `created_at` (TEXT)

#### 4. `push_subscriptions` Table
- `id` (TEXT PRIMARY KEY)
- `endpoint` (TEXT UNIQUE NOT NULL)
- `p256dh` (TEXT NOT NULL)
- `auth` (TEXT NOT NULL)
- `categories` (TEXT NOT NULL - JSON array)
- `active` (INTEGER DEFAULT 1)
- `created_at` (TEXT)

#### 5. `referrals` Table
- `id` (TEXT PRIMARY KEY)
- `referrer_uid` (TEXT NOT NULL)
- `referred_uid` (TEXT NOT NULL)
- `code` (TEXT NOT NULL)
- `status` (TEXT DEFAULT 'pending')
- `created_at` (TEXT)

---

### B. Supabase (PostgreSQL)
Migrations located in `supabase/sql/`:

#### 1. `public.support_profiles`
- `user_id` (UUID PRIMARY KEY REFERENCES `auth.users(id)` ON DELETE CASCADE)
- `display_name` (TEXT NOT NULL)
- `role` (TEXT NOT NULL DEFAULT 'support' CHECK (role = 'support'))
- `status` (TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')))
- `created_by_uid` (TEXT NOT NULL)
- `created_at` (TIMESTAMPTZ NOT NULL DEFAULT now())
- `updated_at` (TIMESTAMPTZ NOT NULL DEFAULT now())

#### 2. `public.support_submissions`
- `id` (UUID PRIMARY KEY DEFAULT gen_random_uuid())
- `submission_type` (TEXT NOT NULL CHECK (submission_type IN ('firm_create', 'firm_update', 'brand_assets', 'offer', 'content', 'cms_update')))
- `target_collection` (TEXT NOT NULL CHECK (target_collection IN ('firms', 'offers', 'reviews', 'firmReviews', 'firmReviewProfiles', 'firmRatingStats', 'giveaways', 'upcomingEvents', 'purchases', 'bonusOffers', 'propNewsPosts', 'propNewsVideos', 'tradingGuidesPosts', 'tradingGuidesVideos', 'fundingStrategiesPosts', 'fundingStrategiesVideos', 'tradingPsychologyPosts', 'tradingPsychologyVideos', 'beginnerTutorialsPosts', 'beginnerTutorialsVideos', 'pageHeadingsParagraphs', 'pageCopy', 'pageSeoContent', 'pageFaqs')))
- `target_id` (TEXT NOT NULL)
- `status` (TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'rejected')))
- `submitted_by_role` (TEXT NOT NULL DEFAULT 'support' CHECK (submitted_by_role = 'support'))
- `created_by_uid` (UUID NOT NULL REFERENCES `auth.users(id)`)
- `created_by_name` (TEXT NOT NULL)
- `proposed_changes` (JSONB NOT NULL DEFAULT '{}'::jsonb)
- `rejection_reason` (TEXT)
- `reviewed_by_uid` (TEXT)
- `reviewed_by_name` (TEXT)
- `reviewed_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ NOT NULL DEFAULT now())

#### 3. `public.support_audit_logs`
- `id` (UUID PRIMARY KEY DEFAULT gen_random_uuid())
- `actor_uid` (TEXT NOT NULL)
- `actor_role` (TEXT NOT NULL CHECK (actor_role IN ('support', 'ceo')))
- `actor_name` (TEXT)
- `action` (TEXT NOT NULL)
- `target_type` (TEXT NOT NULL)
- `target_id` (TEXT)
- `metadata` (JSONB NOT NULL DEFAULT '{}'::jsonb)
- `created_at` (TIMESTAMPTZ NOT NULL DEFAULT now())

#### 4. `public.email_notifications`
- `id` (UUID PRIMARY KEY DEFAULT gen_random_uuid())
- `event_type` (TEXT NOT NULL)
- `uid` (TEXT)
- `user_email` (TEXT NOT NULL)
- `status` (TEXT)
- `amount` (NUMERIC(12, 2))
- `points` (INTEGER)
- `reason` (TEXT)
- `review_id` (TEXT)
- `firm` (TEXT)
- `method` (TEXT)
- `source_collection` (TEXT)
- `dedupe_key` (TEXT UNIQUE)
- `raw_payload` (JSONB NOT NULL DEFAULT '{}'::jsonb)
- `state` (TEXT NOT NULL DEFAULT 'queued')
- `resend_id` (TEXT)
- `error_message` (TEXT)
- `created_at` (TIMESTAMPTZ NOT NULL DEFAULT now())
- `updated_at` (TIMESTAMPTZ NOT NULL DEFAULT now())

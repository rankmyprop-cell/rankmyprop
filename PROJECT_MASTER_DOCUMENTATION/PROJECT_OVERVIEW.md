# Rank My Prop — Project Overview

> **STATUS:** LOCKED BASELINE  
> **AUDIT DATE:** 2026-11-22  
> **CANONICAL DOMAIN:** `https://www.rankmyprop.in` (Apex redirects to `www.rankmyprop.in`)  
> **REPO NAME:** `rank-my-prop`  

---

## 1. Executive Summary & Purpose

**Rank My Prop (RMP)** is an institutional-grade prop firm intelligence, comparison, review, and trader utility platform. It serves proprietary trading firm participants with independent evaluations, verified challenge rules, structured fee and drawdown comparisons, live discount codes, verified payout proofs, community reviews, trading calculators, and a personal trade journal.

The system is architected as an integrated hybrid:
- A modern **React 18/19 + TypeScript + Vite** application powering the high-traffic homepage and dynamic discovery layers.
- A battle-tested **Preserved Vanilla MPA & Dashboard Suite** in `public/` preserving 36+ authenticated dashboard, admin management, support console, calculator, and detail surfaces.
- A **Multi-Cloud Backend Architecture** utilizing Cloudflare Workers (edge compute, D1 SQLite database, R2 media storage, Cloudflare Queues), Firebase (Firestore source of truth & client authentication), and Supabase (PostgreSQL with Row Level Security for support operations and email notification queue).

---

## 2. Core Application Surfaces

### A. Public Website (`src/` & `public/`)
1. **Homepage (`src/App.tsx`)**:
   - Modern React single-page interface with dynamic header navigation, dropdown portals, market switch (`Prop Firm` vs `Broker`), search drawer with keyboard navigation (`ESC` / `Enter`), hero with rotating keywords, live offer carousels, live ranking table, trust orbit, video showcase, FAQ accordion, and global footer.
2. **Prop Firm Directory & Ranking System (`public/listedprop.html`, `public/bestprop.html`, category pages)**:
   - Evaluates firms across key dimensions: payout speed, drawdown limits, profit split, pricing, and community feedback.
   - Segmented ranking views: Best Overall, Fast Payout, Instant Funding, Lowest Fee, Futures, HFT, Beginner-friendly, Most Trusted.
3. **Firm Detail & Deep Breakdown Pages (`public/firm-detail.html`, `public/*detail.html`)**:
   - Individual firm profile hubs, dynamic challenge calculators, detailed trading rules, spreads, announcements, and review archives.
4. **Comparison Engine (`public/compare.html`)**:
   - Side-by-side comparison matrix evaluating up to 3 firms across trading conditions, leverage, drawdown calculation type, and challenge fees.
5. **Discount & Cashback Portal (`public/offers.html`, `public/discount-offer.html`)**:
   - Directory of active promo codes, coupon verification status, and direct affiliate handoffs.
6. **Trader Toolkit & Calculators (`public/calculators.html` & dedicated calculator pages)**:
   - Lot Size Calculator, Risk-to-Reward Calculator, Drawdown Calculator, Profit Split Calculator, Consistency Rule Calculator, Loss Recovery Planner, and Rule Translator.
7. **Educational Hubs & Prop News (`public/prop-news.html`, `public/trading-guides.html`, etc.)**:
   - Content library categorised into Prop News, Trading Guides, Funding Strategies, Trading Psychology, and Beginner Tutorials.
8. **Public Reviews & Payout Proofs (`public/reviews.html`, `public/firm-reviews.html`)**:
   - Verified community reviews, aspect ratings (customer service, trading conditions, payout speed, user friendliness), and trader payout proof screenshots.

### B. Trader Dashboard (`public/dashboard.html` & sub-panels)
- Complete client dashboard interface for authenticated traders:
  - Account onboarding, profile settings, notification preferences.
  - Interactive Trade Journal (`public/tradejournal.html`) for logging trades, performance tracking, and win-rate analysis.
  - Challenge tracker, reward points, bonus claims, giveaways, and review submission workflow.

### C. Admin Operations Management (`public/dashboard-admin.html` & 20+ `admin-*.html` screens)
- Comprehensive administrative control center:
  - **Firm Management**: `admin-firms.html`, `admin-firm-details.html`, `admin-filters.html`.
  - **Review Moderation**: `admin-reviews.html`, `admin-moderation.html`.
  - **Offer & Promo Management**: `admin-offers.html`, `admin-website-popup.html`.
  - **Content CMS**: `admin-content-cms.html`, `admin-propnews.html`, `admin-trading-guides.html`, `admin-funding-strategies.html`, `admin-trading-psychology.html`, `admin-beginner-tutorials.html`, `admin-faqs.html`.
  - **Community & Events**: `admin-announcements.html`, `admin-giveaways.html`, `admin-events.html`, `admin-community.html`.
  - **Push & Communications**: `admin-push.html`, `admin-newsletter.html`.
  - **Audit & Activity**: `admin-activity.html`, `admin-clients.html`, `admin-purchases.html`.

### D. Support Operations Console (`public/support-dashboard.html`, `admin-support-access.html`)
- Two-man rule governance portal:
  - Support agents have segregated credentials stored in Supabase.
  - Support staff propose content, firm, or review updates (`support_submissions`).
  - Proposed changes remain pending until reviewed and approved by the CEO/Super Admin, preventing unauthorized direct modifications to live production databases.

---

## 3. Technology Stack Summary

| Layer | Primary Technology | Purpose |
|---|---|---|
| **Public Frontend** | React 18/19, TypeScript, Vite | Fast, responsive landing page, interactive header, live search, dynamic rankings |
| **Preserved UI / MPA** | HTML5, Vanilla JavaScript, CSS3 | Preserved dashboards, admin screens, calculators, detail pages, reviews |
| **Development & Local API** | Express.js, Node.js 22, TSX | Local server mimicking production edge routing & hosting local compatibility APIs |
| **Edge Compute & Production Routing** | Cloudflare Workers & Cloudflare Pages (`_worker.js`) | Edge reverse proxy, URL rewrites, 301/308 redirects, API routing, security headers |
| **Edge API & Cache** | Cloudflare Worker (`rankmyprop-api`) | REST API for collections, auth session exchange, push notifications |
| **Edge Database & Storage** | Cloudflare D1 (SQLite), Cloudflare R2 | Relational document store, revisions, push queue, binary media storage |
| **Primary Production Auth & Database** | Google Firebase (Auth & Firestore) | Client authentication, primary database for firms, reviews, offers, user accounts |
| **Internal Ops Database & Auth** | Supabase (PostgreSQL + RLS) | Support staff authentication, change proposal submissions, audit trails |
| **Email Delivery** | Supabase Edge Function (`rmp-email-notifier`), Resend | Transactional notification emails for purchases, reviews, account status |
| **Search Engine Optimization** | Custom Node.js CJS pipeline | Programmatic HTML generation, JSON-LD schemas, static first-paint, XML sitemaps |
| **Search Console Integration** | Local MCP Server (`tools/gsc-mcp`) | Read-only Google Search Console analytics and indexation inspection |

---

## 4. Current Repository Status & Lock Baseline

1. **Working Directory Cleanliness**: All source files are strictly locked. No unilateral changes, refactors, or design updates are permitted.
2. **Preservation Hashes**: The files under `public/` and `docs/` represent a verified snapshot of the system.
3. **Environment Security**: Sensitive keys reside strictly in secure runtime secrets or `.env.local` (never committed). `public/rmp-runtime-env.json` exposes only non-sensitive browser-safe keys prefixed with `VITE_`.

# Existing Features Inventory

> **STATUS:** LOCKED BASELINE  
> **SCOPE:** Exhaustive Catalog of All Implemented Features, Functional Modules, and User Capabilities

---

## 1. Feature Domain Catalog

### 1. Prop Firm Discovery & Ranking System
- **Prop Firm Directory (`/listedprop`, `/bestprop`):**
  - Comprehensive listing of verified proprietary trading firms.
  - Sorting and filtering by evaluation model: 1-Step Evaluation, 2-Step Evaluation, 3-Step Evaluation, Instant Funding.
  - Category rankings: Best Overall, Fast Payout, Instant Funding, Lowest Fee, Futures Prop Firms, HFT Friendly, Beginner Friendly, Most Trusted.
- **Dynamic Scoring Algorithm:**
  - Evaluates payout reliability, drawdown buffer, profit split percentages, platform stability, and verified trader ratings.
  - Prevents commercial partners from artificially manipulating editorial score.
- **Live Comparison Selector:**
  - Direct checkbox selection of up to 3 firms from the homepage or directory.
  - Quick launch into side-by-side comparison.

### 2. Deep Firm Breakdown & Challenge Rules
- **Firm Profile Hubs (`/prop-firms/:slug`):**
  - Overview of supported platforms (MT4, MT5, cTrader, DXtrade, Match-Trader, TradingView).
  - Payment methods (Credit Card, Crypto, Bank Transfer, Skrill).
  - Key trading conditions: Daily Drawdown, Maximum Loss, Drawdown Type (Balance-based vs Trailing Equity), Minimum Trading Days, Weekend Holding, News Trading, EA allowance.
  - Leverage matrix broken down by asset class (Forex, Indices, Commodities, Crypto).
  - Challenge models matrix: Phase 1 target, Phase 2 target, profit split, max allocation, pricing.
- **Rules Verification & Explainer (`/prop-firm-rules/:firm`):**
  - Deep-dive documentation of firm-specific rules, breach conditions (soft breach vs hard breach), and payout eligibility criteria.

### 3. Comparison Engine (`/compare`)
- Multi-column comparison view for 2 to 3 firms simultaneously.
- Direct parameter comparison across:
  - Account sizes ($5K to $500K).
  - Target profit percentages.
  - Maximum drawdown limits.
  - Payout frequency (Bi-weekly, Weekly, On-Demand).
  - Reset fees and scaling plan conditions.

### 4. Verified Discounts & Promotional Offers (`/offers`, `/discount-offer.html`)
- Searchable catalog of active prop firm discount codes.
- One-click copy code button with animated feedback.
- Automatic affiliate link redirection with partner campaign tracking.
- Banner announcement integration for time-sensitive promotions.

### 5. Community Reviews & Payout Proofs (`/reviews`, `/firm-reviews.html`)
- Independent community review submission workflow with anti-spam rate limiting.
- Aspect ratings breakdown:
  - Customer Service
  - Trading Conditions
  - Payout Speed & Reliability
  - User Friendliness & Dashboard
- Public Payout Proofs:
  - Traders upload screenshot URLs verifying received payouts.
  - Payout count aggregation displayed on firm profiles.
- Moderation Queue: Reviews require administrative approval before appearing publicly.

### 6. Trader Toolkit & Calculators
- **Lot Size Calculator (`/lotsizecalculator`):** Computes exact lot sizing based on account balance, risk percentage, currency pair, and stop loss distance.
- **Drawdown Calculator (`/drawdown-calculator`):** Analyzes daily equity vs balance drawdown limits to protect traders from unexpected rule violations.
- **Profit Split Calculator (`/profit-split-calculator`):** Calculates net trader payout vs firm share based on profit milestones.
- **Consistency Rule Calculator (`/consistency-rule-calculator`):** Tests trading day profit distribution against prop firm consistency rules (e.g., no single day exceeding 30% of total profit).
- **Risk-to-Reward Calculator (`/risk-to-reward-calculator`):** Calculates trade R:R, break-even win rate, and expectancy.
- **Loss Recovery Planner (`/lossrecoveryplanner`):** Calculates exact percentage return needed to recover from specific drawdown depths.
- **Rule Translator (`/ruletranslator`):** Searchable glossary explaining complex industry jargon into simple language.

### 7. Trade Journal (`/tradejournal`)
- Personal web-based trading journal for registered traders.
- Log trade entries with instrument, direction (Long/Short), entry price, stop loss, take profit, exit price, and outcome.
- Automated calculation of win rate, average R:R, profit factor, and equity curve.
- Local storage and Firebase sync capabilities.

### 8. Trader Client Dashboard (`/dashboard`)
- Authenticated trader dashboard:
  - Onboarding milestone checklist.
  - User profile and payout preferences.
  - Challenge progress tracking.
  - Bonus points, rewards catalog, and giveaway ticket inventory.
  - Notification management.

### 9. Administrative Control Center (`/dashboard-admin`)
- Complete administrative management across 20+ specialized consoles:
  - Firm details editor with structured JSON imports.
  - Review moderation and audit controls.
  - Promo code and popup campaign manager.
  - Article and guide CMS with rich-text editor (`admin-richtext.js`).
  - Announcement bar and event broadcaster.
  - Client activity logger.

### 10. Two-Man Rule Support Operations (`/support-dashboard`)
- Segregated support staff access via Supabase.
- Support agents create change proposals (`support_submissions`).
- CEO / Super Admin reviews visual diffs of proposed changes and approves or rejects.
- Approvals automatically commit verified records into production Firestore.
- Immutable audit log (`support_audit_logs`) records all operational actions.

### 11. Push Notifications & Communication Engine
- Web Push Notifications powered by browser Push API and VAPID keys.
- Subscribers select categories: `announcements`, `offers`, `firms`.
- Broadcast queue with retry logic in Cloudflare D1.
- Newsletter subscription capture with sanitization.

### 12. Programmatic SEO & Market Research
- Custom pre-rendering pipeline generating 360+ crawlable, canonical HTML pages.
- Dynamic generation of `public/prop-firm-market-report.html` citable research asset.
- Auto-generated XML sitemaps for pages, firms, offers, rules, and articles.
- Structured data schemas (JSON-LD) for `Article`, `Dataset`, `Review`, `Organization`.

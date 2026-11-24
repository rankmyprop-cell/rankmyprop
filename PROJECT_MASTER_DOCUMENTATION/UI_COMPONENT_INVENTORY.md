# UI Component Inventory

> **STATUS:** LOCKED BASELINE  
> **SCOPE:** Complete Catalog of React and Preserved MPA UI Components

---

## 1. React Components (`src/`)

### 1. `App.tsx` (Root Shell & Layout Orchestrator)
- **Location:** `src/App.tsx`
- **Role:** Main application entry layout.
- **Key Features:**
  - Sticky glass header with backdrop blur and top alignment border.
  - Dynamic brand logo link with gradient text (`Rank My Prop`).
  - Desktop navigation items: `Listed Props`, `Best Prop Firms` (with dropdown), `Offers`, `Reviews`, `Compare` (with dropdown), `Calculators` (with dropdown), `Prop News`.
  - Dropdown panels (`DropdownPanel`): Rich multi-item menus with numbers (`01`, `02`), badges (`Popular`, `New`, `Verified`), descriptions, and arrow indicators.
  - Quick Search drawer: Live filtering across 24+ search items, keyboard navigation (`Enter` opens top hit, `ESC` closes), highlighted query feedback.
  - Market switcher (`MarketSwitch`): Toggles between `Prop Firm` and `Broker` (routes to `/broker-coming-soon`).
  - Account state button: Dynamically listens to Firebase Auth to render either `Login -> /login` or `Dashboard -> /dashboard`.
  - Responsive mobile drawer (`mobileOpen`): Slide-out navigation with search trigger and account CTA.
  - Lazy loading wrapper (`DeferredSection`): Uses `IntersectionObserver` with a `500px` root margin to defer below-the-fold component bundle loading.

### 2. `HomeHero.tsx`
- **Location:** `src/HomeHero.tsx`
- **Dependencies:** Loads `/home-hero.js` runtime dynamically.
- **Key Features:**
  - Top kicker badge link: `Independent Prop Firm Research | See Who Ranks #1 in 2026 →`.
  - H1 heading with rotating keyword animation (`#rotateWord`).
  - SSR bootstrap hydration fallback reading `window.__RMP_SSR_BOOTSTRAP`.
  - Two CTA buttons: `▶ Explore Prop Firm Reviews` (outline) and `See Top Ranked Firms` (glow).
  - Live Offer Wall: Dual panel showing `Current Forex Offers` (with pagination arrows and dot indicators) and `Most Popular Futures Prop Firms`.

### 3. `RankingsSection.tsx`
- **Location:** `src/RankingsSection.tsx`
- **Data Source:** `src/rankingsData.ts` -> queries Cloudflare Worker `/v1/collections/firms`.
- **Key Features:**
  - Filter pills: `Best Overall`, `Fast Payout`, `Instant Funding`, `Lowest Fee`.
  - Table showing rank number, firm logo, verified badge, followers, reviews count, starting fee, max drawdown, profit split, and payout speed.
  - Multi-firm comparison selector: Allows picking up to 3 firms and triggers side-by-side comparison.
  - Client-side pagination (10 firms per page) with range indicators (`Showing 1–10 of 22`).
  - Supported platform logo chips via `PlatformLogo.tsx`.

### 4. `FundingOffersBanner.tsx`
- **Location:** `src/FundingOffersBanner.tsx`
- **Key Features:**
  - High-visibility promotional banner with trophy icon.
  - Copy-to-clipboard coupon module (`Code: RMP`) with animated confirmation state (`Copied!` for 1.6s).
  - Direct CTA button linking to `/offers`.

### 5. `WhyRankMyProp.tsx`
- **Location:** `src/WhyRankMyProp.tsx`
- **Key Features:**
  - Central glowing logo core with glass ring effects.
  - Interactive circular trust orbit displaying 7 distinct benefit cards:
    1. Independent research (`ResearchIcon`)
    2. Verified trader reviews (`ReviewIcon`)
    3. Rules compared side by side (`CompareIcon`)
    4. Offers tracked and updated (`UpdateIcon`)
    5. Read prop firm rules clearly (`BookIcon`)
    6. Get payout assurance (`ShieldIcon`)
    7. Uncover hidden rules (`HiddenRuleIcon`)

### 6. `TradersLoveRankMyProp.tsx`
- **Location:** `src/TradersLoveRankMyProp.tsx`
- **Key Features:**
  - Section heading with animated SVG heart icon.
  - 3 white feature cards: Verified Prop Firm Reviews, Exclusive Discount Codes (highlighted in emerald green), Hidden Rules Explained.
  - 3 dark blue feature cards: Compare Before You Buy, Free Giveaways, Latest Prop Firm News.
  - Floating guarantee graphic SVG with checkmark emblem.

### 7. `VideoShowcase.tsx`
- **Location:** `src/VideoShowcase.tsx`
- **Data Source:** YouTube oEmbed API & Cloudflare collection fallback.
- **Key Features:**
  - Video cards grid displaying educational YouTube shorts and breakdown videos.
  - Dynamic hydration of video titles, author names, and thumbnails via YouTube oEmbed without requiring API keys.
  - Direct links to YouTube channel `@RankMyProp`.

### 8. `TrustAndNewsletter.tsx`
- **Location:** `src/TrustAndNewsletter.tsx`
- **Key Features:**
  - Newsletter sign-up form with input validation and loading state.
  - Submits to `/api/newsletter/subscribe`.
  - Privacy compliance notice and trust metrics.

### 9. `FaqSection.tsx`
- **Location:** `src/FaqSection.tsx`
- **Data Source:** Static fallback (`homeFaq`) merged with dynamic CMS records from Cloudflare collection `pageFaqs`.
- **Key Features:**
  - Expandable accordion with smooth open/close height animation.
  - Formatted question blocks with dual pipe delimiter parsing (`||`).
  - Help card sidebar linking to `/contact` for custom questions.

### 10. `Footer.tsx`
- **Location:** `src/Footer.tsx`
- **Key Features:**
  - Community Discord card with 3D avatar stage.
  - 24/7 customer support contact card.
  - 5 categorical link groups: Discover, Research, Tools, Learning, Company.
  - Social media pills: Instagram, X, YouTube, Discord.
  - Regulatory disclosure paragraphs covering prop trading risk, demo nature of accounts, and affiliate compensation transparency.
  - Copyright and legal links (Privacy, Terms, Disclaimer).

### 11. `PlatformLogo.tsx`
- **Location:** `src/PlatformLogo.tsx`
- **Key Features:**
  - Exact SVG icons for MetaTrader 4, MetaTrader 5, cTrader, DXtrade, Match-Trader, TradeLocker, and TradingView.

### 12. `HomeCampaignPopup.tsx`
- **Location:** `src/HomeCampaignPopup.tsx`
- **Key Features:**
  - Time-delayed event popup modal stored in `localStorage` to avoid repeatedly disturbing returning visitors.

---

## 2. Preserved UI Surfaces (`public/`)

### A. Trader Dashboard Surface
- **`dashboard.html`**:
  - Full application shell featuring sidebar, top header, account switcher, KYC/onboarding progress, trade journal tabs, challenge progress widgets, notification bell, and rewards shop.
- **`tradejournal.html`**:
  - Trade entry form, P&L calculator, asset selector, win-rate metrics, risk-per-trade logger, equity curve graph.
- **`my-profile.html` / `edit-profile.html`**:
  - Personal profile management, avatar upload, password reset, payout address details.
- **`bonus.html` & `giveaways.html`**:
  - Reward claims, coupon redemption, active community giveaway ticket tracking.

### B. Admin & Operational Surfaces
- **`dashboard-admin.html`**:
  - Administrative command dashboard displaying platform-wide statistics, pending submissions, active users, and review queues.
- **`admin-firm-details.html` & `admin-firms.html`**:
  - Prop firm editor: Challenge models, phases, leverage matrices, payment methods, platforms, restricted countries, and visibility switches.
- **`admin-reviews.html` & `admin-moderation.html`**:
  - Review moderation table: Status toggling (`Approved`, `Pending`, `Rejected`), aspect rating verification, payout proof inspection.
- **`admin-content-cms.html`**:
  - Rich text CMS for blog articles, news posts, trading guides, and SEO headings.
- **`admin-support-access.html`**:
  - Staff management: Creates and suspends support team accounts with restricted privileges.

### C. Public Calculator Interfaces
- **`lotsizecalculator.html`**: Calculates position size in lots based on account equity, risk percentage, stop loss pips, and currency pair.
- **`drawdown-calculator.html`**: Calculates daily equity vs balance drawdown limits to prevent rule breaches.
- **`profit-split-calculator.html`**: Models trader share vs firm share across varying profit milestones.
- **`consistency-rule-calculator.html`**: Evaluates single-day profit concentration against firm threshold rules.
- **`risk-to-reward-calculator.html`**: Calculates R:R ratio, break-even win rate, and expectancy.
- **`lossrecoveryplanner.html`**: Computes required percentage gain to recover from drawdown levels.
- **`ruletranslator.html`**: Interactive glossary and rule simulator for complex challenge conditions.

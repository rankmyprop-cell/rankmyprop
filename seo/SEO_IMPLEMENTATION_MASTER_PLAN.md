# SEO Implementation Master Plan — PropFirmMine

Status: **research & plan only. Nothing has been changed. Awaiting your approval.**

## 1. Executive summary
PropFirmMine's biggest problem is not keywords; it is that **its best content may not be reaching Google reliably**: list/compare/deal pages show empty states in raw HTML, the sitemap omits every firm page, canonicals and the sitemap use the non-www host while pages are served on www, and firm pages display placeholder and contradictory data alongside unsupported superlatives. Prop Firm Match, by contrast, runs a country × challenge-type × vertical page system with FAQs, vetting copy and review counts. The path to compete is: **(1) make the site crawlable and truthful, (2) ship a small set of genuinely better pages (India, futures, rule-based), (3) earn authority with original data.**

## 2. Key evidence (see individual reports)
- Sitemap: 12 URLs, no firm pages, identical lastmod, non-www host [V].
- Raw HTML emptiness on 5 money pages [V]; rendered state unverified [A].
- FTMO page: 0 reviews / 0 challenges / 0 deals, "90%%", code "MINING" vs site-wide "PROPFIRMMINE" [V].
- PFM: 60+ firms, 1,600+ challenges, India hub of 36 firms, localized pages [V, self-reported counts].
- Not verified at all: robots.txt, schema, CWV, backlinks, rankings, volumes [A].

## 3. Prioritised backlog
| Pri | Items |
|---|---|
| P0 | R1 rendered-state check · R2 server-render data · R3 single host · R4 firm pages in sitemap · R5 data defects · R6 unsupported claims |
| P1 | R7 titles · R8 schema · R9 CWV · R10 real blog · R11 E-E-A-T pages · R12 sponsored links · R13 internal links · R14 robots · R15 filter policy · India/forex/futures/type landing pages · firm pages complete |
| P2 | Rule-based category pages · top comparison pages · guides · calculators · reviews collection · research report |
| P3 | Digital PR · community presence · directories · video · Hindi/other locales |

## 4. Stages
**First 7 days** — tasks 1–7 in the 90-day roadmap (P0 + baseline).
**Days 8–30** — on-page rewrite, trust pages, schema, CWV, first six landing pages, full firm pages.
**Days 31–90** — content calendar, programmatic waves (gated), tools, original research, outreach.

## 5. Risks & compliance notes
- Affiliate/discount claims ("up to 80%", "guaranteed lowest rates") must be provable and consistent; consider a legal/advertising review, especially for India-targeted copy. I'm not a lawyer.
- India payment/legal explainers must cite official sources and avoid advice.
- No fabricated reviews, ratings or payout stats (also a policy risk for rich results).
- Programmatic expansion without unique data risks "Crawled – not indexed" and quality demotion; gates in the programmatic doc apply.

## 6. AI-search visibility (no guarantees)
- Entity consistency: one brand/legal name across site, schema, socials.
- Answer-first paragraphs (40–60 words) at the top of rule pages and guides; tables with clear column labels.
- `Organization`, `Article`, `FAQPage` (visible FAQs), `BreadcrumbList` schema; author and reviewer pages.
- Cite primary sources (firm rule pages, regulator pages) and show "last verified".
- Publish original, citable data (rule-change reports, fee indices) with downloadable CSV.
- Allow Googlebot, Bingbot and reputable AI crawlers unless you decide otherwise; check robots.txt.
- Measure: brand mentions, referral traffic from perplexity/chatgpt/copilot in GA4, manual query sampling monthly.

## 7. What I need from you to convert [A] into [V]
1. Read access to GSC and GA4. 2. Repo (or a Next.js/React stack description + rendering mode). 3. Ahrefs/Semrush export or login. 4. Confirmation: is `rankmyprop.in` yours or a competitor? 5. Whether discount code and "80% off" claims are contractually confirmed by each firm.

## 8. Approval gate
I will not touch code, metadata, routes, DB or deployments until you approve. Suggested first approval: **P0 items R1–R6 only.**

## Deliverables index
SEO_COMPETITOR_AUDIT.md · PROPFIRMMINE_TECHNICAL_SEO_AUDIT.md · KEYWORD_RESEARCH.md · CONTENT_GAP_ANALYSIS.md · BACKLINK_AND_AUTHORITY_STRATEGY.md · PROGRAMMATIC_SEO_ARCHITECTURE.md · 90_DAY_SEO_ROADMAP.md · SEO_IMPLEMENTATION_MASTER_PLAN.md

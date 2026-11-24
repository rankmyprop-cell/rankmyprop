# 90-Day SEO Roadmap (24 Nov 2026 → ~22 Feb 2027)

Priority key: P0 critical technical · P1 high impact · P2 content/keyword expansion · P3 authority. All items wait for your approval.

## Days 1–7 — Critical technical & indexing (P0)
| # | Task | Owner input | Done when |
|---|---|---|---|
| 1 | Verify GSC (domain property), submit sitemap, run URL Inspection on `/`, `/firms`, `/firms/ftmo`, `/challenges`, `/compare`, `/deals` (R1) | GSC access | Rendered-vs-raw difference documented |
| 2 | Choose preferred host; 301 + canonical + sitemap alignment (R3) | Repo | One host in GSC |
| 3 | Dynamic sitemap incl. all firm pages, real `lastmod` (R4) | Repo | Sitemap ≈ indexable set |
| 4 | Server-render firms/challenges/deals/compare data (R2) | Repo | Raw HTML has data |
| 5 | Fix data defects & contradictions; remove unsupported claims (R5, R6) | Your data owner | QA list clean |
| 6 | Review/author robots.txt (R14) | Repo | Report clean |
| 7 | Baseline: Lighthouse/CrUX, crawl, GA4 conversions | Tool access | Baseline sheet saved |

## Days 8–30 — On-page & high-priority landing pages (P1)
- Titles/descriptions/H1s on existing pages (R7); homepage rewritten around "compare prop firms / best prop firms / India" in plain language.
- `/methodology`, `/how-we-make-money`, author bylines, last-verified dates (R11); `rel="sponsored"` (R12).
- JSON-LD baseline (R8); breadcrumbs + internal-link modules (R13); Core Web Vitals fixes (R9).
- Publish first landing pages: `/prop-firms/india`, `/prop-firms/forex`, `/prop-firms/futures`, `/prop-firms/1-step`, `/prop-firms/2-step`, `/prop-firms/instant-funding`.
- Complete the 8–12 firm pages to full quality.

## Days 31–90 — Content, programmatic, authority (P2/P3)

### Content calendar (priority/intent as in KEYWORD_RESEARCH.md; volumes need tool validation)
| Wk | Title | Target keyword | Intent | URL | Outline | Pri | Internal links |
|---|---|---|---|---|---|---|---|
| 5 | Best Prop Firms in India (2026): Tested Rules, Payouts & Costs | best prop firms in India | C | `/prop-firms/india` | criteria → table → firm verdicts → payments → restrictions → FAQ | P1 | firm pages, payouts guide |
| 5 | Trailing vs Static vs EOD Drawdown Explained | trailing drawdown vs static | I | `/guides/drawdown-types` | definitions → worked examples → firm table | P1 | all firm rules |
| 6 | Best Futures Prop Firms | best futures prop firms | C | `/prop-firms/futures` | criteria → Topstep/Apex/Funded Futures → drawdown models | P1 | drawdown guide |
| 6 | Best Forex Prop Firms | best forex prop firms | C | `/prop-firms/forex` | criteria → table → verdicts | P1 | hub |
| 7 | 1-Step vs 2-Step Prop Firms | 1 step vs 2 step prop firm | C | `/guides/1-step-vs-2-step` | cost, targets, pass-rate caveats | P1 | type pages |
| 7 | Prop Firms With No Minimum Trading Days | prop firms no minimum trading days | C | `/prop-firms/no-minimum-trading-days` | verified table + caveats | P1 | rule guides |
| 8 | FTMO vs FundingPips | ftmo vs fundingpips | C | `/compare/ftmo-vs-fundingpips` | diff table → verdict → who for | P1 | both firm pages |
| 8 | Prop Firm Payouts in India: Methods, Speed, Fees | prop firm payout India | I/C | `/guides/prop-firm-payouts-india` | methods → speed data → pitfalls (no legal advice) | P1 | India hub |
| 9 | Instant Funding Prop Firms | instant funding prop firms | C | `/prop-firms/instant-funding` | model explainer → cost premium → table | P1 | type guide |
| 9 | Consistency Rules Explained | prop firm consistency rule | I | `/guides/consistency-rules` | definitions → firm examples | P2 | firm pages |
| 10 | Cheapest Prop Firms by Account Size | cheapest prop firms | C/T | `/prop-firms/cheapest` | live fees, refund-adjusted cost | P1 | calculator |
| 10 | Prop Firms That Allow EAs | prop firms EA allowed | C | `/prop-firms/ea-allowed` | verified permissions + restrictions | P2 | firm pages |
| 11 | Topstep vs Apex | topstep vs apex | C | `/compare/apex-vs-topstep` | futures diff table | P1 | futures hub |
| 11 | News Trading on Funded Accounts | prop firm news trading rules | I | `/guides/news-trading-rules` | rule table | P2 | rules |
| 12 | Weekend Holding Prop Firms | prop firms weekend holding | C | `/prop-firms/weekend-holding` | table + risk | P2 | rules |
| 12 | Quarterly Rule-Change Report (Q4 2026) | prop firm rule changes | I | `/research/rule-changes-q4-2026` | changelog data → trends → CSV | P2 | firm pages; outreach asset |
| 13 | Is Prop Trading Legal in India? (sourced explainer) | prop trading legal India | I | `/guides/is-prop-trading-legal-in-india` | regulator sources, risks, disclaimer | P2 | India hub |
| 13 | Funding Pips / FundedNext / The5ers reviews (one per week during 9–13) | `[firm] review` | C | `/firms/{slug}` | complete rules, payouts, pros/cons | P1 | alternatives |

Parallel (P2/P3): ship drawdown calculator and true-cost calculator (wk 8–12); outreach for the rule-change report (wk 12–13); collect verified reviews; digital PR and community participation per BACKLINK doc.

## Measurement plan
- Indexing: GSC Pages (indexed / crawled-not-indexed), sitemap coverage.
- Visibility: impressions, clicks, non-brand queries, avg position for the page groups above.
- Authority: referring domains (Ahrefs).
- Business: affiliate outbound clicks, GA4 key events.
- **Realistic targets are set after the baseline (day 7).** I won't promise ranks; a sensible 90-day aim is "all priority pages indexed, non-brand impressions growing week over week, first top-20 positions on long-tail/India terms".

# Content Gap Analysis — PropFirmMine vs Prop Firm Match

Basis: PFM public pages seen in search results [V]; PropFirmMine pages fetched [V]. PFM pages beyond those seen are not inventoried [A]. Principle: **fewer, genuinely useful pages — no thin template spam.**

| Area | PFM (seen) | PropFirmMine now | Gap | Recommended response | Pri |
|---|---|---|---|---|---|
| Country hub | `/prop-firm-lists/countries/india` — 36 firms, definitions, vetting text | None | Missing | One strong `/prop-firms/india` hub with payments, restrictions, firm table, FAQ | P1 |
| Country × challenge-type | instant-funding, one-step, no-evaluation (India) | None | Missing | Build India × {instant, 1-step, 2-step} only if ≥6 firms each with distinct rule data | P2 |
| Vertical split | forex / futures / crypto prefixes | Filter chips only (client-side) | Missing indexable pages | `/prop-firms/forex`, `/futures`, `/crypto` | P1 |
| Firm review pages | Per-firm ratings with review counts | `/firms/ftmo` exists but shows 0 reviews, 0 challenges, placeholders | Quality gap | Fix data, add rules detail, payouts, pros/cons, last-verified date | P0/P1 |
| Comparison pages | Firm lists + rank filters | `/compare` loads client-side only | Not indexable | Static `/compare/{a}-vs-{b}` for top pairs + keep interactive tool | P1 |
| Category pages | Best sellers / favorites / lists | None | Missing | Cheapest, highest split, no-min-days, EA-allowed, weekend-holding | P1 |
| Educational articles | YouTube-led explainers; FAQ blocks | Empty social feed | Missing | Drawdown, consistency, payouts, news trading guides | P1 |
| Tools | Comparison filters | `/compare` matrix (not crawlable) | Partially present | Drawdown calculator, true-cost-after-refund calculator, rule-change tracker | P2 |
| FAQs | On every list page | 4 on home; 1 answer visible in raw HTML | Thin | Visible FAQ per money page (answers in HTML) | P1 |
| Trust pages | "How Prop Firm Match vets firms", transparency statement | None | Missing | `/methodology`, `/how-we-make-money`, author pages | P0/P1 |
| Reviews | 12,500+ claimed trader reviews | `/reviews` page; firm pages show 0 | Large | Collect real verified reviews; never fabricate | P2 |
| Video | 83K-sub YouTube channel, 981 videos | YouTube link in footer | Large | Embed firm explainers later; low priority | P3 |
| Freshness | "Updated" dates, offer end dates | All sitemap lastmod identical | Gap | Real `updated_at` shown on page + in sitemap | P1 |
| Internal links | "Other challenge types in India", "Back to Country" | Nav/footer only | Large | Related-firm, related-guide, hub↔spoke links | P1 |
| Localisation | `/es/` versions | None | Gap | Not now; consider Hindi only after English India pages rank | P3 |

## Genuine value PropFirmMine can add (differentiators)
1. **Rule diffs with dates**: "FTMO changed X on <date>" — requires a change log in the DB.
2. **Drawdown model explained per firm** with a worked example (balance vs equity, trailing vs EOD) — matches your homepage promise.
3. **India payment reality**: which firms pay via USDT/wire/Rise/Deel and what that means for Indian traders — careful, sourced, non-legal-advice.
4. **True cost calculators**: fee − refund − discount vs realistic pass rate scenarios.
5. **Data integrity page**: what is verified, by whom, when.

## What not to build
- A page per firm × account size × platform × country combination without unique data (doorway risk).
- "[Firm] discount code" pages for every firm with identical copy.
- Fake review counts/ratings, fake "verified" badges, or copied competitor text.

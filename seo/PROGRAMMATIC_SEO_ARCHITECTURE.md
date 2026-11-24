# Programmatic SEO Architecture

Principle: **a template page is indexable only if it shows data that differs materially from its siblings and answers a real query.** Everything else is `noindex,follow` or not generated.

## Data model needed (your DB) [A: confirm against schema]
firms(slug, name, verticals, HQ, years, platforms, payout methods, restricted countries, updated_at, verified_by, verified_at) · challenges(firm, model [instant/1/2/3-step], size, fee, refund, targets, daily/total DD type+%, min days, consistency, news/weekend/EA rules, split, payout cycle, updated_at) · deals(firm, code, discount, expiry, verified_at) · changelog(firm, field, old, new, date).

## URL architecture (clean, no parameters in indexable URLs)
| Template | URL | Index rule | Minimum uniqueness gate |
|---|---|---|---|
| Hub | `/prop-firms` | index | — |
| Vertical | `/prop-firms/{forex\|futures\|crypto}` | index | ≥8 firms |
| Challenge type | `/prop-firms/{1-step\|2-step\|instant-funding}` | index | ≥6 firms |
| Rule-based | `/prop-firms/{no-minimum-trading-days\|ea-allowed\|weekend-holding\|…}` | index | ≥5 firms with verified rule field |
| Pricing | `/prop-firms/cheapest`, `/prop-firms/account-size/{25k…}` | index | live fee data per size |
| Highest split | `/prop-firms/highest-profit-split` | index | ≥6 firms |
| Platform | `/prop-firms/platform/{mt5\|ctrader\|tradovate\|tradelocker}` | index | ≥5 firms |
| India | `/prop-firms/india` (+ `/india/{type}`) | index hub; type pages only if gate met | ≥6 firms with India-allowed + payment data |
| Firm | `/firms/{slug}` | index | complete record, not placeholder |
| Firm rules | `/firms/{slug}/rules` | index only if ≥ rule detail not already on firm page; otherwise merge | — |
| Alternatives | `/firms/{slug}/alternatives` | index for top ~15 firms | ≥5 genuine alternatives with reasons |
| Vs | `/compare/{a}-vs-{b}` (alphabetical slug order) | index for top pairs by demand only | both firms complete; written verdict + diff table |
| Interactive compare | `/compare?firms=a,b,c` | `noindex,follow`; canonical `/compare` | — |
| Filter/sort params | `?sort=`, `?sector=`, `?size=` | `noindex,follow`; canonical to base | — |
| Deals | `/deals` | index; expired deals removed or marked | — |

## Rules
1. **Canonical**: self-canonical on indexable pages; param/filter variants canonical to the clean URL; one host (see R3).
2. **One order for pair slugs** (`ftmo-vs-fundingpips`, never both orders) with 301 from the reverse.
3. **Thin-page kill switch**: if a template's data completeness < threshold, render `noindex` and exclude from sitemap automatically.
4. **Sitemaps**: split by template (`sitemap-firms.xml`, `-lists.xml`, `-compare.xml`, `-guides.xml`); `lastmod` from `updated_at`.
5. **Each page needs hand-written parts**: intro answering the query, a "who it's for" verdict, rule caveats, FAQ, last-verified date. Template = tables + schema; humans = judgement.
6. **Internal links**: hub → spokes → firm pages → related guides; breadcrumbs everywhere.
7. **Schema**: `BreadcrumbList` everywhere; `FAQPage` only on visible FAQs; `ItemList` on rankings; `Review`/`AggregateRating` **only** with real, collected, visible reviews.
8. **Rollout in waves** (≈10–20 pages each); watch GSC "Crawled – currently not indexed" before scaling.
9. **Expected page count (realistic)**: ~12 firms × (1 page) + ~20 category pages + ~10 vs pages + India hub + ~15 guides ≈ 60–80 high-quality URLs in 90 days — not hundreds.

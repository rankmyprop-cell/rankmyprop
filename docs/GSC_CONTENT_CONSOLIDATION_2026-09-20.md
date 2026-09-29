# GSC-backed content consolidation — 20 September 2026

Search Console property: `sc-domain:rankmyprop.in`  
Available range: 23 April 2026 to 17 September 2026

## Property baseline

- 208 clicks
- 12.2K impressions
- 1.7% CTR
- 27.8 average position

## Winner selection evidence

| Topic | Retained destination | GSC evidence |
|---|---|---|
| Beginner prop firms | `/beginner-friendly-firms` | 147 combined apex/www impressions for “beginner” queries; article variants had only isolated impressions |
| Instant funding | `/best-instant-funding-firms` | 140 combined apex/www impressions; strongest article variant had 29 |
| Cheap prop firms | `/cheapest-prop-firms` | 220 combined apex/www impressions and 2 clicks; competing articles had 13 combined impressions |
| Fast payouts | `/fast-payout-prop-firms` | 33 combined apex/www impressions; no competing article appeared in the filtered page table |
| Most trusted | `/most-trusted-prop-firms` | 72 combined apex/www impressions; category page clearly dominated |
| No time limit | `/news/best-prop-firms-with-no-time-limit-in-2026-top-unlimited-evaluation-accounts` | 13 impressions versus 11 and 7 for its two variants |
| No consistency rule | `/news/best-prop-firms-with-no-consistency-rule-in-2026-top-flexible-funded-accounts` | Only relevant page with a click |
| One-step prop firms | `/news/best-one-step-prop-firms-in-2026-top-easy-evaluation-funded-accounts` | 9 impressions versus 2 for the competing variant |

Gold, news-trading, scalping, swing-trading and small-account clusters had zero or negligible filtered impressions. Their exact-topic duplicates were consolidated into the clearest stable URL rather than keeping multiple near-identical pages competing with each other.

## Implementation

- 35 weak or duplicate article URLs removed from sitemap generation and internal article directories.
- Each removed URL has a direct permanent redirect to its retained destination.
- Redirect destinations are verified to remain indexable sitemap URLs.
- Automated checks reject redirect chains, sitemap leakage and missing Worker/Pages redirect rules.
- Three additional historical URLs seen in GSC were given direct permanent redirects.

No layout, CSS, database, CMS records or backend APIs were changed.

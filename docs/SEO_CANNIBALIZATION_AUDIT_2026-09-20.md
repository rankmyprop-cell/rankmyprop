# RankMyProp SEO Cannibalization Audit — 20 September 2026

## Completed consolidation

- Removed 29 legacy `/blog/blog-post-XX` URLs from the XML article sitemap.
- Added one-hop permanent redirects for both `/blog/blog-post-XX` and `/blog-post-XX` variants.
- Preserved the detailed legacy article copy on the matching descriptive `/news/...` URLs before redirecting.
- Redirected the accidental `blog-post-04` ruleboard page to `/prop-firm-rules`.
- Retained `/blog/blog-post-30` because it is a distinct market-outlook article.
- Removed reader-facing SEO-production wording and updated the retained article's internal links.

## Validation

- Canonical host: apex redirects to `https://www.rankmyprop.in/` with HTTP 308.
- Canonical host responds with HTTP 200.
- Sitemap inventory reduced from 540 to 511 canonical URLs.
- Article sitemap reduced from 222 to 193 canonical URLs.
- Consolidated sample article contains more than 1,100 words at its descriptive canonical URL.
- All 58 legacy blog URL variants have permanent redirect rules.
- Build verification confirms unique titles, descriptions, canonicals, JSON-LD and crawlable internal links.

## Remaining query-overlap clusters

These require Search Console query/page data before choosing winners, because title similarity alone is not enough to safely redirect an indexed page:

- Beginner prop firms
- Instant-funding prop firms
- Forex prop firms
- Gold/XAUUSD prop firms
- News-trading prop firms
- Scalping prop firms
- Swing-trading prop firms
- Small-account prop firms
- No-time-limit prop firms
- No-consistency-rule prop firms
- Fastest-payout prop firms
- Most-trusted prop firms
- Cheap/low-cost prop firms
- One-step evaluation prop firms

For each cluster, retain the URL receiving the strongest relevant impressions/clicks, merge useful unique sections from competing pages, then redirect the weaker URLs directly to the retained page.

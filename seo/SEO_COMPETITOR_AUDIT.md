# SEO Competitor Audit — PropFirmMine vs Prop Firm Match (and RankMyProp)

Audit date: 24 Nov 2026 · Scope: research only, no code/metadata/DB/deploy changes.

## 0. Read this first: scope, naming, evidence limits

**Naming assumption.** Your brief calls `rankmyprop.in` "my website" in one place, calls `propfirmmatch.com` "RankMyProp" in Step 1, and says PropFirmMine should compete with "RankMyProp". I treated it as follows: **PropFirmMine = your site (subject of the audit)**, **Prop Firm Match (PFM) = primary competitor**, **rankmyprop.in = secondary site, partially inspected**. If rankmyprop.in is actually your site, tell me and the audit target changes.

**Evidence tags used everywhere**
- **[V]** Verified — I fetched/read it in this session.
- **[E]** Estimated/inferred — reasoned from [V] evidence, not measured.
- **[A]** Needs account/tool access — GSC, GA4, Ahrefs/Semrush, Lighthouse/CrUX, repo.

**What I could not do**
- `propfirmmatch.com` **blocked my fetcher (bot detection)**. Everything about PFM below comes from search-engine snippets of its public pages and third-party pages, not a crawl. Its robots.txt, sitemap, schema, canonicals, heading hierarchy and speed are **unverified [A]**.
- `rankmyprop.in` returned only `<head>` (title, description, canonical) to my fetcher — body content is **client-rendered [V]**. Nothing beyond that is verified.
- I could not retrieve PropFirmMine's `robots.txt`. No GSC, GA4, backlink or keyword-volume tool is connected. **No traffic, rankings, DA, backlinks or search volumes appear in this report unless explicitly sourced.**

## 1. Prop Firm Match — what is verifiable

| Finding | Evidence | Tag |
|---|---|---|
| Self-reported scale: 60+ verified firms, 1,600+ challenges, 12,500+ trader reviews | PFM homepage snippet | [V] (claims are PFM's own) |
| Homepage title: "Compare the Best Prop Trading Firms of 2026" | search result title | [V] |
| Country × challenge-type landing matrix, e.g. `/prop-firm-lists/countries/india`, `/…/india/challenges/instant-funding`, `/…/one-step`, `/…/no-evaluation` | search results | [V] |
| Vertical prefixes: `/futures/prop-firm-lists/…`, `/crypto/prop-firm-lists/…` | search results | [V] |
| Localised versions (e.g. `/es/prop-firm-lists/…`) | search results | [V] |
| India hub lists 36 firms; each list page carries a definition block, FAQ ("What is instant funding?", etc.), "How Prop Firm Match vets these firms", and live offers | search snippets | [V] |
| Per-firm rating + review count shown in lists (e.g. 4.7 / 1,396–1,411 reviews) | snippets | [V] |
| YouTube: ~83K subscribers, 981 videos (page dated Oct 14, 2026); review videos such as "Maven Prop Firm Challenge Explained (2026)" | snippet | [V] |
| Loyalty-points system, giveaways, live chat support, transparency statement | Trustpilot + site snippets | [V] |
| Trustpilot page displays "rating unavailable due to a breach of our guidelines" | Trustpilot snippet | [V] — don't over-interpret; just don't rely on Trustpilot as proof of quality for either site |
| Company entity: Prop Firm Match Global FZCO | job listing | [V] |

**PFM's strategy, inferred [E]:** a templated *programmatic* architecture (`audience/country × challenge type × vertical`) on top of one large structured database, each page given a definition + FAQ + vetting copy; brand reinforced by YouTube and reviews; commercial pages target "best/instant funding/one-step … in India". Whether any given page *ranks* is **not verified [A]** — measure with Semrush/Ahrefs.

## 2. Who actually ranks for India-intent terms (SERP neighbours) [V, not rank-measured]

Search results for India prop-firm queries surfaced: PFM list pages; **fxempire.com** (author + reviewer byline, "updated Jun 28, 2026", 50-hour methodology claim); **india.com** and **thehansindia.com** (publisher-domain listicles); **thetrustedprop.com**; **ibtimes.co.uk** (UK variant); **investinglive.com** directory; **propfirm.compare** and **propfirmapp.com** (futures-focused comparison tools). Pattern: winners combine **named authors, update dates, explicit methodology, comparison tables, and country-specific practicalities** (payment methods, LRS remittance). PropFirmMine has none of these today (see technical audit).

Market signal: Prop Firm Compare's own press release reports ~1,800 monthly US searches for "best futures prop firms" vs ~400 for "best forex prop firms" and +108% futures demand vs 2024 [V — company-reported, US only]. Implication [E]: PropFirmMine's futures coverage (Topstep, Apex, Funded Futures) is under-exploited.

## 3. Direct comparison table

| SEO factor | Prop Firm Match | PropFirmMine | Gap | Priority |
|---|---|---|---|---|
| Technical SEO | Unverified [A]; live, indexable list pages seen in SERPs [V] | Sitemap host mismatch, firm pages absent from sitemap, list pages empty in raw HTML [V] | Large | P0 |
| Homepage SEO | Keyword-led title ("Compare the Best Prop Trading Firms of 2026"), stats, FAQ, video [V] | Brand-led title, jargon copy ("Telemetry", "Forensic Architecture"), no "best prop firms" H2 [V] | Large | P1 |
| Keyword targeting | Country × type × vertical pages [V] | Only 12 URLs; no head-term or India pages [V] | Very large | P1 |
| Content quality | Definitions + FAQ + vetting + review counts [V] | Blog is an empty social feed; firm page shows 0 reviews/0 challenges/0 deals and typo "90%%" [V] | Very large | P0/P1 |
| Page architecture | Hub → country → challenge type → firm [V] | Flat: /firms, /challenges, /compare, /deals, /blog [V] | Large | P1 |
| Internal linking | Cross-links "Other challenge types in India", "Back to Country" [V] | Nav + footer + logo links only [V] | Large | P1 |
| Backlink profile | Unknown [A] (YouTube/community footprint is evidence of brand reach) | Unknown [A] | Unknown | P3 |
| Structured data | Unverified [A] | Unverified [A] | Unknown | P1 |
| Mobile performance | Unverified [A] | Viewport meta present [V]; speed unverified [A] (heavy animation/"Reduce Effects" toggle suggests JS weight [E]) | Unknown | P1 |
| Indexability | Pages appear in SERPs [V] | Canonical non-www vs served www; sitemap omits firm URLs [V]; GSC status [A] | Large | P0 |
| Topical authority | Videos, reviews, country hubs [V] | Minimal | Large | P2 |
| Programmatic SEO | Yes [V] | None | Very large | P2 |
| Local/Indian SEO | Dedicated India hub, 36 firms, India × challenge pages [V] | No India content [V] | Large | P1 |
| E-E-A-T | Entity (FZCO), vetting page, transparency statement, reviews, video faces [V] | Unverifiable superlatives ("$160,000,000+", "100% Audited"), no authors, 0 reviews [V] | Large | P0/P1 |

## 4. Where PropFirmMine can realistically win

1. **Accuracy and transparency PFM-style sites don't foreground**: real rule diffs, dated change logs, verified-by-whom proof, no placeholder data.
2. **India-first depth**: payments (LRS/USDT/wire), INR pricing context, restrictions, tax/regulatory caveats written with care — not just a country filter.
3. **Futures + forex dual coverage with drawdown-model explainers** (trailing vs EOD vs static) — PropFirmMine's homepage already has the concept; it needs indexable pages.
4. **Niche tools**: drawdown/consistency-rule calculators, rule-change tracker, "true cost after refund" calculator.

Be realistic: PFM has years of brand, a YouTube channel and thousands of reviews. Head terms ("best prop firms") are a 12+ month objective; long-tail, India and rule-specific queries are the 60–120 day opportunity.

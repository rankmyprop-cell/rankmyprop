# PropFirmMine — Technical SEO Audit

Audit date: 24 Nov 2026 · Method: fetched public HTML for `/`, `/firms`, `/firms/ftmo`, `/challenges`, `/compare`, `/deals`, `/blog`, `/sitemap.xml`. No repo, GSC, Lighthouse or header access.
Tags: **[V]** verified · **[E]** inferred · **[A]** needs account/tool.

> Important caveat: my fetcher reads server HTML and may not execute JavaScript. Findings marked "raw HTML" describe what a non-rendering crawler sees. Googlebot does render JS, so the first action is to confirm the *rendered* state in GSC URL Inspection (finding T1).

## Findings

| ID | Finding | Evidence | Pri |
|---|---|---|---|
| T1 | `/firms`, `/challenges`, `/deals`, `/blog` show empty states in raw HTML ("No Verified Firms Found", "No Matching Challenges Found", "No Deals Found", "No posts found"); `/compare` shows only "Loading PropFirmMine Matrix…". Data is client-loaded or the data call failed. | [V] raw HTML | P0 |
| T2 | Sitemap lists only 12 URLs. **No `/firms/{slug}` pages** (the pages with real content) are included. | [V] sitemap.xml | P0 |
| T3 | Host inconsistency: pages are served on `www.propfirmmine.com`, but canonicals, `og:url` and sitemap `<loc>` all use `https://propfirmmine.com`. Redirect direction/status unverified. | [V] canonical + sitemap; redirects [A] | P0 |
| T4 | `<title>` on list pages repeats the brand: "…— PropFirmMine \| PropFirmMine". | [V] | P1 |
| T5 | Twitter title/description are identical on every page ("PropFirmMine — Compare Prop Trading Firms, Rules & Payout Proof"); `meta keywords` is identical everywhere and ignored by Google. | [V] | P2 |
| T6 | Sitemap includes low-value URLs (`/careers`, `/pricing`, `/events`, `/about`, `/contact`) at the same weight as money pages; every `lastmod` is the generation timestamp (2026-11-12T12:39:53Z) and `changefreq`/`priority` are ignored by Google. `lastmod` should reflect real content change. | [V] | P1 |
| T7 | Firm page data defects: "0.0 (0 reviews)", "Challenges (0)", "Promo Deals (0)", "Verified Reviews (0)", "Split: 90%%", restricted countries rendered as one run-on string ("KPIRSYCU"). | [V] /firms/ftmo | P0 |
| T8 | Data contradictions: home matrix says FTMO min trading days = 4, firm page says "0 Days (Best)"; home says 2-step uses ~10%/5% targets; firm page promo code is "MINING" while home/challenges say universal code is PROPFIRMMINE; blog shows MINEBOGO / MINE20; discount claim is "up to 80%" on home/deals page but "up to 50%" in `/deals` meta description. | [V] | P0 |
| T9 | Unsupported claims presented as fact: "$160,000,000+ total payouts", "100% Audited Rules", "guarantees lowest verified rates", "verified via blockchain hashes". Zero reviews and zero proof pages exist to back them. Ranking-quality and advertising-compliance risk. | [V] | P0 |
| T10 | Homepage text is copy-light and jargon-heavy ("Telemetry Dispatch", "Forensic Architecture", "Node 01/04"); no heading targeting "best prop firms", "compare prop firms", India, 1-step/2-step. FAQ renders one answer in raw HTML; the other three are collapsed/absent. | [V] | P1 |
| T11 | Decorative widget "21450.00 ▲ LIVE – INSTITUTIONAL INDEX" on the homepage — irrelevant content, likely JS/third-party weight. | [V] widget; weight [A] | P2 |
| T12 | Blog is a social-post feed ("State Hall", "Connect Account to Post") with no articles; one avatar is hotlinked from images.unsplash.com. | [V] | P1 |
| T13 | No visible author, editor, methodology or "last verified" date anywhere on firm pages. | [V] | P1 |
| T14 | Affiliate disclosure exists on the homepage only; no `rel="sponsored"` check possible. Outbound links use `?ref=propfirmmine` (e.g. ftmo.com). | [V] disclosure; rel attrs [A] | P1 |
| T15 | Robots.txt, structured data (JSON-LD), Core Web Vitals, response headers, image dimensions/alt text, redirect chains, 404 handling, hreflang: **not verified**. | — | [A] |
| T16 | Firm logos are SVG with alt text equal to firm name ([V] — adequate); poster JPGs referenced from `/posters/` — size/format unverified. | [V]/[A] | P2 |
| T17 | "Reduce Effects" control implies heavy animation. Mobile LCP/INP likely at risk [E] — measure. | [E] | P1 |

## Recommendations (each with what / why / where / how / priority / success metric)

| # | What | Why | Affected | How (no framework migration) | Pri | Success metric |
|---|---|---|---|---|---|---|
| R1 | Confirm rendered state of money pages | If Googlebot also sees empty states, pages are thin/soft-404 | `/firms`, `/challenges`, `/compare`, `/deals` | GSC URL Inspection → "View crawled page" + screenshot; compare to raw HTML | P0 | Rendered HTML contains firm/challenge rows |
| R2 | Server-render list/compare/deal data | Don't depend on client fetch for indexable content | same | Move the data query to server components / SSG with ISR (works in Next.js; confirm stack from repo [A]) | P0 | Raw-HTML fetch returns ≥ firm names + key rules |
| R3 | Pick one host and enforce it | Duplicate host dilutes signals | whole site, sitemap, canonicals | 301 non-preferred host → preferred; make canonical, `og:url`, sitemap, internal links match | P0 | One host in GSC; no "Duplicate, Google chose different canonical" |
| R4 | Put every firm page in the sitemap; generate `lastmod` from DB `updated_at` | Firm pages hold the content | `/sitemap.xml` | Dynamic sitemap from firms table; drop `/careers` (keep/noindex low-value pages) | P0 | Sitemap URLs ≈ indexable URLs; GSC "Submitted and indexed" rises |
| R5 | Fix data defects T7/T8 before any promotion | Wrong rules on a YMYL-adjacent site destroys trust and invites compliance trouble | firm pages, home matrix | Single source of truth (DB fields); validation (no "%%", no empty arrays rendered as "0"); hide empty tabs | P0 | Zero placeholders in crawl; QA checklist passes |
| R6 | Remove or substantiate unsupported claims | See T9 | home, firm pages | Replace with dated, sourced figures or delete; show method page | P0 | Claims register has a source per number |
| R7 | De-duplicate titles; unique social tags; delete meta keywords | Snippet quality | all pages | Template: `{Page keyword} \| PropFirmMine` once | P1 | No duplicate-brand titles in crawl |
| R8 | JSON-LD: `Organization`, `WebSite`, `BreadcrumbList`, `FAQPage` only where visible FAQ exists, `Article`; avoid fake `AggregateRating` | Eligibility for rich results without policy risk | all templates | Add after real reviews exist; validate with Rich Results Test | P1 | Zero schema errors in GSC |
| R9 | Core Web Vitals pass | Ranking tiebreaker, conversion | home, firm pages | Lighthouse/CrUX baseline; lazy-load animation; drop LIVE widget; size images | P1 | LCP < 2.5 s, INP < 200 ms on mobile (CrUX) |
| R10 | Real editorial blog | Topical authority | `/blog` | Replace social feed with articles (see roadmap); keep community feed on a separate noindexed path | P1 | Articles indexed; impressions growing |
| R11 | Author, reviewer, methodology, "last verified" | E-E-A-T | firm pages, `/about` | Add bylines + `/methodology` page | P1 | Present on 100% of money pages |
| R12 | Mark affiliate links `rel="sponsored nofollow"`; keep disclosure near CTAs | Google guidelines, trust, regulator expectations | outbound CTAs | Link component default | P1 | 100% of affiliate links tagged |
| R13 | Breadcrumbs + contextual internal links | Crawl paths, anchor relevance | all | Breadcrumb component + related-firm/related-guide modules | P1 | Every page ≥3 contextual links |
| R14 | Robots.txt review | Unknown state | `/robots.txt` | Allow all public pages; disallow `/api/`, internal search, filter params; point to sitemap | P1 | GSC robots report clean |
| R15 | Filter/URL parameter policy | Prevent duplicate faceted URLs | `/firms?…`, `/challenges?firm=…` | `noindex,follow` or canonical-to-base for parameter combos; only whitelisted landing pages indexable (see programmatic doc) | P1 | No parameter URLs in index |

## Needs your access
GSC (Pages, Sitemaps, Crawl stats, URL Inspection), GA4, repo (framework, rendering mode, sitemap/robots code), PageSpeed/CrUX, a crawler (Screaming Frog). Please share read-only access or exports and I'll convert every [A] into [V].

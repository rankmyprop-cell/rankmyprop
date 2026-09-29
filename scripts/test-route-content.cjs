const assert = require('node:assert/strict')
const fs = require('node:fs')
const { canonicalForRoute, injectRouteBootstrap, pageContentIdForRoute, selectRouteRecord } = require('../api/_lib/route-content')

const home = { id: 'home-hero', heading: 'Admin Home Heading', paragraph: 'Admin hero copy', seoTitle: 'Admin Home | Rank My Prop', seoDescription: 'Admin description' }
const firm = { id: 'firm-review-finotive-funding', heading: 'Finotive Funding, only', paragraph: 'Current Finotive copy', seoTitle: 'Finotive Funding Review | Rank My Prop', seoDescription: 'Finotive description' }
const challenge = { id: 'challenge-model-finotive-funding-instant-lite', heading: 'Finotive Instant Lite Rules', paragraph: 'Exact model rules', seoTitle: 'Finotive Instant Lite Rules | Rank My Prop', seoDescription: 'Exact model description' }

// Admin change + reload: exact backend route record always wins.
assert.equal(selectRouteRecord({ backend: home, ssr: { ...home, heading: 'Old' }, context: { id: 'home-hero', pathname: '/', search: '' } }).heading, 'Admin Home Heading')
// A firm route must never receive home copy.
assert.equal(pageContentIdForRoute('/prop-firms/finotive-funding'), firm.id)
assert.equal(selectRouteRecord({ backend: firm, staticRecord: home, context: { id: firm.id, pathname: '/prop-firms/finotive-funding', search: '' } }).heading, 'Finotive Funding, only')
// Cache failure and partial/mismatched cache preserve the SSR record.
assert.equal(selectRouteRecord({ ssr: firm, lastGood: home, context: { id: firm.id, pathname: '/prop-firms/finotive-funding', search: '' } }).heading, firm.heading)
assert.equal(selectRouteRecord({ ssr: firm, staticRecord: { id: firm.id }, context: { id: firm.id, pathname: '/prop-firms/finotive-funding', search: '' } }).heading, firm.heading)
// Route and model records are isolated by their stable ID, never cache order.
assert.equal(pageContentIdForRoute('/prop-firm-rules/finotive-funding/instant-lite'), challenge.id)
assert.equal(selectRouteRecord({ backend: challenge, ssr: firm, context: { id: challenge.id, pathname: '/prop-firm-rules/finotive-funding/instant-lite', search: '' } }).heading, challenge.heading)
assert.equal(selectRouteRecord({ ssr: challenge, lastGood: home, staticRecord: firm, context: { id: challenge.id, pathname: '/prop-firm-rules/finotive-funding/instant-lite', search: '' } }).heading, challenge.heading)
// SEO and visible content are normalized from the same backend record.
const selected = selectRouteRecord({ backend: firm, context: { id: firm.id, pathname: '/prop-firms/finotive-funding', search: '' } })
assert.equal(selected.heading, firm.heading)
assert.equal(selected.seoTitle, firm.seoTitle)
assert.equal(selected.seoDescription, firm.seoDescription)
// Direct and refreshed canonical routes resolve to the same stable ID.
assert.equal(pageContentIdForRoute('/firm-rules', '?firm=finotive-funding'), pageContentIdForRoute('/firm-rules/', '?firm=finotive-funding'))
assert.equal(canonicalForRoute('/firm-rules/', '?firm=finotive-funding'), 'https://www.rankmyprop.in/firm-rules?firm=finotive-funding')
assert.equal(pageContentIdForRoute('/prop-firms/finotive-funding/'), pageContentIdForRoute('/prop-firms/finotive-funding'))

// A hard reload receives the backend record in the HTML before hydration.
const oldHtml = '<html><head><script id="rmp-ssr-bootstrap">window.__RMP_SSR_BOOTSTRAP={"id":"home-hero","heading":"Old"};</script></head><body></body></html>'
const homeHtml = injectRouteBootstrap(oldHtml, home, { id: home.id, pathname: '/', search: '' }, '42')
assert.match(homeHtml, /Admin Home Heading/)
assert.doesNotMatch(homeHtml, /\"heading\":\"Old\"/)
assert.match(homeHtml, /\"id\":\"home-hero\"/)
const firmHtml = injectRouteBootstrap(oldHtml, firm, { id: firm.id, pathname: '/prop-firms/finotive-funding', search: '' }, '43')
assert.match(firmHtml, /firm-review-finotive-funding/)
assert.match(firmHtml, /Finotive Funding, only/)
assert.doesNotMatch(firmHtml, /Admin Home Heading/)

// Heading-less directory templates must keep the CMS block creator active.
const cmsRuntime = fs.readFileSync(require.resolve('../public/content-cms-runtime.js'), 'utf8')
assert.match(cmsRuntime, /if \(document\.querySelector\("\[data-rmp-route-heading\], main h1, h1"\)\) return;/)
assert.match(cmsRuntime, /<h1 id=\\"rmpSeoHeading\\" data-rmp-route-heading>/)
assert.match(cmsRuntime, /rmp-original-heading-layout/)
assert.match(cmsRuntime, /font-size:clamp\(38px,5\.4vw,62px\)/)
assert.match(cmsRuntime, /font-weight:600/)
assert.match(cmsRuntime, /linear-gradient\(92deg,#fff 0%,#d4ccff 24%,#846aff 75%,#b09eff 100%\)/)
const headingTheme = fs.readFileSync(require.resolve('../public/site-heading-theme.css'), 'utf8')
assert.match(headingTheme, /Shared Offers-style page introductions/)
assert.match(headingTheme, /font-size: clamp\(38px, 5\.4vw, 62px\)/)
assert.match(headingTheme, /\.home-hero-bg h1/)
assert.match(headingTheme, /\.review-page-heading h1/)
assert.match(headingTheme, /\.main > h1/)
for (const publicTemplate of ['offers.html', 'listedprop.html', 'firm-rules.html']) {
  const templateHtml = fs.readFileSync(require.resolve(`../public/${publicTemplate}`), 'utf8')
  assert.match(templateHtml, /id="rmpHomeHeaderStyles"/)
  assert.match(templateHtml, /href="\/home-header-shell\.css"/)
  assert.match(templateHtml, /href="\/home-footer-shell\.css"/)
}
const homeHero = fs.readFileSync(require.resolve('../src/HomeHero.tsx'), 'utf8')
const routeRuntime = fs.readFileSync(require.resolve('../public/route-content-runtime.js'), 'utf8')
assert.match(homeHero, /index insights for traders/)
assert.match(homeHero, /Compare top/)
assert.match(homeHero, /id="rotateWord"/)
assert.match(routeRuntime, /isGeneratedHomePlaceholder/)
assert.match(routeRuntime, /rmpDynamicRouteContent/)
const propRules = fs.readFileSync(require.resolve('../public/prop-rules.js'), 'utf8')
assert.match(propRules, /dataset\.rmpDynamicRouteContent = "true"/)
assert.match(propRules, /<span>\$\{escapeHtml\(model\)\} Rules<\/span>/)

// Firm identity is centralized by immutable Firestore document ID.
const firmIdentityService = fs.readFileSync(require.resolve('../public/firm-identity-service.js'), 'utf8')
assert.match(firmIdentityService, /OTHER_FIRM_ID = "__other__"/)
assert.match(firmIdentityService, /firmId: document\.id/)
assert.match(firmIdentityService, /doc\(db, "firms", id\)/)
assert.match(firmIdentityService, /compressFirmLogo/)
const firmAdmin = fs.readFileSync(require.resolve('../public/admin-firm-details.html'), 'utf8')
assert.match(firmAdmin, /id="identityFirmId"/)
assert.match(firmAdmin, /id="saveFirmLogoBtn"/)
assert.match(firmAdmin, /firmId: id/)
const offersAdmin = fs.readFileSync(require.resolve('../public/admin-offers.html'), 'utf8')
assert.match(offersAdmin, /<select name="firmId" id="offerFirmId"/)
assert.match(offersAdmin, /OTHER_FIRM_ID/)
const homeOffers = fs.readFileSync(require.resolve('../public/home-hero.js'), 'utf8')
assert.match(homeOffers, /hydrateCentralFirmLogos/)
assert.match(homeOffers, /getAllOffers/)
const firmListings = fs.readFileSync(require.resolve('../public/firms-view.js'), 'utf8')
const offersPage = fs.readFileSync(require.resolve('../public/offers-page.js'), 'utf8')
const firmReviews = fs.readFileSync(require.resolve('../public/firm-reviews.js'), 'utf8')
assert.match(firmListings, /animated card-shaped loading state[\s\S]*?render\(\)/)
assert.match(offersPage, /grid\.innerHTML = new Array\(4\).*skeletonCard/)
assert.match(firmReviews, /reviewsList"\)\.setAttribute\("aria-busy", "true"\)/)
assert.doesNotMatch(firmListings, /if \(!hasStaticFirstPaint\) render\(\)/)
assert.doesNotMatch(offersPage, /if \(grid\.dataset\.rmpStaticFirstPaint/)

// Shared page chrome must never replace semantic footers inside offer cards.
// The generated static first paint contains those cards before hydration.
const homeShell = fs.readFileSync(require.resolve('../public/home-shell.js'), 'utf8')
assert.match(homeShell, /\.\.\.document\.querySelectorAll\("footer"\)/)
assert.match(homeShell, /!node\.closest\("main, article"\)/)
assert.match(homeShell, /!node\.classList\.contains\("offer-card-footer"\)/)
const seoGenerator = fs.readFileSync(require.resolve('./generate-seo-pages.cjs'), 'utf8')
assert.match(seoGenerator, /function publishedRulesSection[\s\S]*?return ''/)
assert.match(seoGenerator, /function insertBeforePageFooter/)
assert.doesNotMatch(seoGenerator, /return `<section class="rmp-published-rules"/)

// Context-aware Quick Links load through the shared public navigation and use
// canonical destinations instead of keeping one hard-coded offer-only block.
const navRuntime = fs.readFileSync(require.resolve('../public/rmp-nav.js'), 'utf8')
const quickLinksRuntime = fs.readFileSync(require.resolve('../public/site-animations.js'), 'utf8')
const offersTemplate = fs.readFileSync(require.resolve('../public/offers.html'), 'utf8')
assert.match(navRuntime, /import "\.\/site-animations\.js"/)
assert.match(quickLinksRuntime, /Directory shortcuts/)
assert.match(quickLinksRuntime, /Ranking shortcuts/)
assert.match(quickLinksRuntime, /Review research/)
assert.match(quickLinksRuntime, /legacyDetailSlugs/)
assert.match(quickLinksRuntime, /href: "\/prop-firm-rules"/)
assert.match(quickLinksRuntime, /href: "\/offers"/)
assert.doesNotMatch(offersTemplate, /Quick offer picks/)
console.log('route-content tests passed')

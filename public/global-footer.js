const PRIVATE_PAGE = /(?:^|\/)(?:admin[^/]*|dashboard(?:-admin)?|support-dashboard|login|signup|onboarding|my-profile|edit-profile|bonus|review-panel|challenges-panel|announcements-panel|rules-panel|spreads-panel)(?:\.html)?\/?$/i

const groups = [
  ['Discover', [['Listed Prop Firms','/listedprop'],['Best Prop Firms','/bestprop'],['Offers & Discounts','/offers'],['Prop Firm Reviews','/reviews']]],
  ['Research', [['Compare Firms','/compare'],['Payout Proofs','/payout-proofs'],['Prop Firm Rules','/prop-firm-rules'],['Prop News','/prop-news']]],
  ['Tools', [['Calculator Hub','/calculators'],['Lot Size Calculator','/lotsizecalculator'],['Drawdown Calculator','/drawdown-calculator'],['Risk-to-Reward','/risk-to-reward-calculator'],['Consistency Rule','/consistency-rule-calculator'],['Loss Recovery','/lossrecoveryplanner'],['Trade Journal','/tradejournal']]],
  ['Learning', [['Trading Guides','/trading-guides'],['Funding Strategies','/funding-strategies'],['Trading Psychology','/trading-psychology'],['Beginner Tutorials','/beginner-tutorials'],['Giveaways','/giveaways']]],
  ['Company', [['About Rank My Prop','/about'],['Contact','/contact'],['FAQ','/faq'],['Login','/login']]],
]

function linkStylesheet() {
  if (document.querySelector('link[data-rmp-global-footer-css]')) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = '/global-footer.css'
  link.dataset.rmpGlobalFooterCss = '1'
  document.head.appendChild(link)
}

function markup() {
  const navigation = groups.map(([title, links]) => `<div class="rmp-footer-group"><h3>${title}</h3>${links.map(([label,href]) => `<a href="${href}">${label}</a>`).join('')}</div>`).join('')
  const socials = [
    ['Instagram','https://instagram.com/rankmyprop.hq','/assets/social-instagram.png'],
    ['X','https://x.com/rankmyprop','/assets/social-x.png'],
    ['YouTube','https://youtube.com/@RankMyProp','/assets/social-youtube.png'],
    ['Discord','https://discord.gg/xrP4qN3y3p','/assets/social-discord.png'],
  ].map(([label,href,image]) => `<a href="${href}" target="_blank" rel="noopener noreferrer" aria-label="Rank My Prop on ${label}" title="${label}"><img src="${image}" alt=""></a>`).join('')
  return `<div class="rmp-footer-wrap">
    <section class="rmp-footer-support-grid">
      <article class="rmp-footer-support-card rmp-footer-discord-card"><h2>Our supportive community is always there to help!</h2><p>Join the Next Generation of Informed Prop Traders</p><a class="rmp-footer-outline-button" href="https://discord.gg/xrP4qN3y3p" target="_blank" rel="noopener noreferrer">Join Discord</a><div class="rmp-footer-discord-stage" aria-hidden="true"><span></span><span></span><span><img src="/assets/social-discord.png" alt=""></span></div></article>
      <article class="rmp-footer-support-card rmp-footer-help-card"><h2>24/7 Customer<br>Support</h2><p>We offer prompt support regardless of your location or time zone. Reach out through social media, website chat, or our contact desk.</p><a class="rmp-footer-outline-button" href="/contact">Contact Support</a></article>
    </section>
    <section class="rmp-footer-links-section"><div class="rmp-footer-brand-column"><a class="rmp-footer-logo" href="/" aria-label="Rank My Prop home"><img src="/assets/rankmyprop-header-logo.png" alt=""><span>Rank My Prop</span></a><p>Independent prop firm research, real community feedback and practical tools for traders who want clarity before checkout.</p><a class="rmp-footer-start" href="/bestprop">Start your research <span>→</span></a></div><nav class="rmp-footer-navigation" aria-label="Footer navigation">${navigation}</nav></section>
    <section class="rmp-footer-social-pill" aria-label="Follow Rank My Prop on social media"><h3>Follow Our Socials:</h3><div>${socials}</div></section>
    <section class="rmp-footer-disclosures"><p>Rank My Prop provides independent research, educational content, comparison tools and community reviews relating to proprietary trading firms. Rank My Prop does not operate a proprietary trading firm, accept trader deposits, manage client funds or provide brokerage services.</p><p>Firm rules, fees, payout terms, discounts and platform information may change without notice. Although we work to keep our data current, traders should verify all material terms directly with the relevant prop firm before purchasing a challenge.</p><p>Any simulated or demo trading accounts discussed on this website are offered and administered by the respective proprietary trading firms. Rank My Prop does not issue trading accounts or make payout decisions.</p><p>All content published by RankMyProp.in is provided for general informational and educational purposes only. Nothing on this website constitutes investment, legal, tax or financial advice, an offer to buy or sell any financial instrument, or a recommendation of any specific firm.</p><p>Rank My Prop may receive compensation through affiliate links, featured placements or commercial partnerships. Compensation does not permit a partner to control community reviews, editorial scoring or the substance of our independent research.</p><p>Ratings, reviews, rankings and past payout reports do not guarantee future performance, account approval or payment. Prop trading involves significant risk, and traders remain responsible for understanding each firm's rules and applicable restrictions.</p></section>
    <div class="rmp-footer-final"><span>© ${new Date().getFullYear()} <strong>Rank My Prop</strong>. All rights reserved.</span><div><a href="/privacy-policy">Privacy</a><a href="/terms">Terms</a><a href="/disclaimer">Disclaimer</a></div><span>Research before you risk.</span></div>
  </div>`
}

function mountGlobalFooter() {
  if (document.body?.hasAttribute('data-rmp-no-global-footer') || document.getElementById('root') || PRIVATE_PAGE.test(location.pathname) || document.querySelector('[data-rmp-global-footer]')) return
  linkStylesheet()
  const footers = Array.from(document.querySelectorAll('footer')).filter((footer) => !footer.closest('.modal,.review-modal,[role="dialog"]'))
  const current = footers[footers.length - 1]
  const footer = document.createElement('footer')
  footer.className = 'rmp-global-footer'
  footer.dataset.rmpGlobalFooter = '1'
  footer.innerHTML = markup()
  if (current) current.replaceWith(footer)
  else document.body.appendChild(footer)
}

if (!document.body?.hasAttribute('data-rmp-no-global-footer')) linkStylesheet()
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountGlobalFooter, { once: true })
else mountGlobalFooter()

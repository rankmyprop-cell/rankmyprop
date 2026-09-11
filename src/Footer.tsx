const footerGroups = [
  { title: 'Discover', links: [['Listed Prop Firms', '/listedprop'], ['Best Prop Firms', '/bestprop'], ['Offers & Discounts', '/offers'], ['Prop Firm Reviews', '/reviews']] },
  { title: 'Research', links: [['Compare Firms', '/compare'], ['Payout Proofs', '/payout-proofs'], ['Prop Firm Rules', '/prop-firm-rules'], ['Prop News', '/prop-news']] },
  { title: 'Tools', links: [['Calculator Hub', '/calculators'], ['Lot Size Calculator', '/lotsizecalculator'], ['Drawdown Calculator', '/drawdown-calculator'], ['Risk-to-Reward', '/risk-to-reward-calculator'], ['Consistency Rule', '/consistency-rule-calculator'], ['Loss Recovery', '/lossrecoveryplanner'], ['Trade Journal', '/tradejournal']] },
  { title: 'Learning', links: [['Trading Guides', '/trading-guides'], ['Funding Strategies', '/funding-strategies'], ['Trading Psychology', '/trading-psychology'], ['Beginner Tutorials', '/beginner-tutorials'], ['Giveaways', '/giveaways']] },
  { title: 'Company', links: [['About Rank My Prop', '/about'], ['Contact', '/contact'], ['FAQ', '/faq'], ['Login', '/login']] },
]

const socials = [
  { label: 'Instagram', href: 'https://instagram.com/rankmyprop.hq', image: '/assets/social-instagram.png' },
  { label: 'X', href: 'https://x.com/rankmyprop', image: '/assets/social-x.png' },
  { label: 'YouTube', href: 'https://youtube.com/@RankMyProp', image: '/assets/social-youtube.png' },
  { label: 'Discord', href: 'https://discord.gg/xrP4qN3y3p', image: '/assets/social-discord.png' },
]

function DiscordStage() {
  return (
    <div className="rmp-footer-discord-stage" aria-hidden="true">
      <span /><span /><span><img src="/assets/social-discord.png" alt="" /></span>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="rmp-global-footer" data-rmp-global-footer>
      <div className="rmp-footer-wrap">
        <section className="rmp-footer-support-grid">
          <article className="rmp-footer-support-card rmp-footer-discord-card">
            <h2>Our supportive community is always there to help!</h2>
            <p>Join the Next Generation of Informed Prop Traders</p>
            <a className="rmp-footer-outline-button" href="https://discord.gg/xrP4qN3y3p" target="_blank" rel="noopener noreferrer">Join Discord</a>
            <DiscordStage />
          </article>
          <article className="rmp-footer-support-card rmp-footer-help-card">
            <h2>24/7 Customer<br />Support</h2>
            <p>We offer prompt support regardless of your location or time zone. Reach out through social media, website chat, or our contact desk.</p>
            <a className="rmp-footer-outline-button" href="/contact">Contact Support</a>
          </article>
        </section>

        <section className="rmp-footer-links-section">
          <div className="rmp-footer-brand-column">
            <a className="rmp-footer-logo" href="/" aria-label="Rank My Prop home"><img src="/assets/rankmyprop-header-logo.png" alt="" /><span>Rank My Prop</span></a>
            <p>Independent prop firm research, real community feedback and practical tools for traders who want clarity before checkout.</p>
            <a className="rmp-footer-start" href="/bestprop">Start your research <span>→</span></a>
          </div>
          <nav className="rmp-footer-navigation" aria-label="Footer navigation">
            {footerGroups.map((group) => (
              <div className="rmp-footer-group" key={group.title}>
                <h3>{group.title}</h3>
                {group.links.map(([label, href]) => <a href={href} key={label}>{label}</a>)}
              </div>
            ))}
          </nav>
        </section>

        <section className="rmp-footer-social-pill" aria-label="Follow Rank My Prop on social media">
          <h3>Follow Our Socials:</h3>
          <div>
            {socials.map((social) => (
              <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={`Rank My Prop on ${social.label}`} title={social.label} key={social.label}>
                <img src={social.image} alt="" />
              </a>
            ))}
          </div>
        </section>

        <section className="rmp-footer-disclosures">
          <p>Rank My Prop provides independent research, educational content, comparison tools and community reviews relating to proprietary trading firms. Rank My Prop does not operate a proprietary trading firm, accept trader deposits, manage client funds or provide brokerage services.</p>
          <p>Firm rules, fees, payout terms, discounts and platform information may change without notice. Although we work to keep our data current, traders should verify all material terms directly with the relevant prop firm before purchasing a challenge.</p>
          <p>Any simulated or demo trading accounts discussed on this website are offered and administered by the respective proprietary trading firms. Rank My Prop does not issue trading accounts or make payout decisions.</p>
          <p>All content published by RankMyProp.in is provided for general informational and educational purposes only. Nothing on this website constitutes investment, legal, tax or financial advice, an offer to buy or sell any financial instrument, or a recommendation of any specific firm.</p>
          <p>Rank My Prop may receive compensation through affiliate links, featured placements or commercial partnerships. Compensation does not permit a partner to control community reviews, editorial scoring or the substance of our independent research.</p>
          <p>Ratings, reviews, rankings and past payout reports do not guarantee future performance, account approval or payment. Prop trading involves significant risk, and traders remain responsible for understanding each firm&apos;s rules and applicable restrictions.</p>
        </section>

        <div className="rmp-footer-final">
          <span>© {new Date().getFullYear()} <strong>Rank My Prop</strong>. All rights reserved.</span>
          <div><a href="/privacy-policy">Privacy</a><a href="/terms">Terms</a><a href="/disclaimer">Disclaimer</a></div>
          <span>Research before you risk.</span>
        </div>
      </div>
    </footer>
  )
}

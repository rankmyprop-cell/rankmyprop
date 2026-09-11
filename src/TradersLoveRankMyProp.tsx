function TimeIcon() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="15" cy="16" r="10.5" /><path d="M15 9.5V16l4.5 2.5M24.5 8.5v5h5M24.5 13.5l4.3-4.3" /></svg>
}

function WalletIcon() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 10.5h22v15H5zM5 10.5l15-6v6M21.5 16.5H27v5h-5.5a2.5 2.5 0 0 1 0-5Z" /></svg>
}

function ConditionsIcon() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12" /><path d="m7.5 7.5 17 17" /></svg>
}

function PeopleIcon() {
  return <svg viewBox="0 0 38 38" aria-hidden="true"><circle cx="17" cy="11" r="5" /><circle cx="26.5" cy="14" r="4" /><path d="M7 27c1.3-5.6 5.2-8.2 10-8.2 3.7 0 6.8 1.6 8.5 4.8M6 28.5c4 2.7 8.2 3.6 12.5 2.5l11.6-5.3a3.2 3.2 0 0 0-3-5.6l-7.5 3.2" /></svg>
}

function GrowthIcon() {
  return <svg viewBox="0 0 38 38" aria-hidden="true"><path d="M5 6v26h27M10 26l7-7 5 4 10-11M25 12h7v7" /></svg>
}

function BoltIcon() {
  return <svg viewBox="0 0 32 38" aria-hidden="true"><path d="M18.5 1 5 22h10l-1.8 15L28 15h-10L18.5 1Z" /></svg>
}

function GuaranteeGraphic() {
  return (
    <svg className="love-guarantee-graphic" viewBox="0 0 300 190" aria-hidden="true">
      <ellipse cx="150" cy="149" rx="100" ry="28" />
      <ellipse cx="150" cy="112" rx="78" ry="20" />
      <path d="M150 16 216 42v47c0 44-25 73-66 94-41-21-66-50-66-94V42l66-26Z" />
      <path d="m118 94 22 22 45-48" />
    </svg>
  )
}

const whiteCards = [
  {
    title: 'Verified Prop Firm Reviews',
    description: 'Real trader experiences, expert analysis, and transparent ratings. No paid hype, just honest reviews.',
    icon: <TimeIcon />,
  },
  {
    title: 'Exclusive Discount Codes',
    description: 'Save on challenge fees with verified discounts from leading prop firms, all in one place.',
    icon: <WalletIcon />,
    green: true,
  },
  {
    title: 'Hidden Rules Explained',
    description: 'We break down drawdown rules, payout conditions, consistency limits, and other fine print before you buy.',
    icon: <ConditionsIcon />,
  },
]

const blueCards = [
  {
    title: 'Compare Before You Buy',
    description: 'Compare profit split, pricing, drawdown, scaling plans, and payout speed across multiple prop firms.',
    icon: <PeopleIcon />,
  },
  {
    title: 'Free Giveaways',
    description: 'Win funded accounts, challenge accounts, trading tools, and exclusive community rewards through regular giveaways.',
    icon: <GrowthIcon />,
  },
  {
    title: 'Latest Prop Firm News',
    description: 'Stay updated with new launches, rule changes, discounts, platform updates, and industry announcements.',
    icon: <BoltIcon />,
  },
]

export default function TradersLoveRankMyProp() {
  return (
    <section className="traders-love-section" aria-labelledby="traders-love-title">
      <div className="traders-love-shell">
        <h2 id="traders-love-title">Why Traders Choose <span>Rank My Prop</span> <i className="love-heart" aria-hidden="true"><svg viewBox="0 0 32 29"><path d="M16 27S2 18.6 2 9.3C2 4.8 5.1 2 9.1 2c2.8 0 5.2 1.6 6.9 4 1.7-2.4 4.1-4 6.9-4C26.9 2 30 4.8 30 9.3 30 18.6 16 27 16 27Z" /></svg></i></h2>

        <div className="love-white-grid">
          {whiteCards.map((card) => (
            <article className={`love-white-card${card.green ? ' is-green' : ''}`} key={card.title}>
              <span className="love-white-icon">{card.icon}</span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>

        <div className="love-blue-grid">
          {blueCards.map((card) => (
            <article className="love-blue-card" key={card.title}>
              <div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
              <span className="love-blue-icon">{card.icon}</span>
            </article>
          ))}
        </div>

        <div className="love-guarantee">
          <div className="love-guarantee-copy">
            <h3><span>✓</span> Payout Assurance</h3>
            <p>If a verified prop firm refuses your legitimate payout, we&apos;ll work with the firm to resolve it. If the issue isn&apos;t resolved, we&apos;ll refund your challenge fee or provide a replacement account.</p>
          </div>
          <GuaranteeGraphic />
        </div>
      </div>
    </section>
  )
}

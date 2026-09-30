import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import HomeHero from './HomeHero'
import HomeCampaignPopup from './HomeCampaignPopup'

const RankingsSection = lazy(() => import('./RankingsSection'))
const FundingOffersBanner = lazy(() => import('./FundingOffersBanner'))
const WhyRankMyProp = lazy(() => import('./WhyRankMyProp'))
const TradersLoveRankMyProp = lazy(() => import('./TradersLoveRankMyProp'))
const VideoShowcase = lazy(() => import('./VideoShowcase'))
const NewsletterCta = lazy(() => import('./TrustAndNewsletter').then((module) => ({ default: module.NewsletterCta })))
const FaqSection = lazy(() => import('./FaqSection'))
const Footer = lazy(() => import('./Footer'))

type AuthUser = { uid: string } | null

type DropdownKey = 'firms' | 'compare' | 'calculators'
type Market = 'Prop Firm' | 'Broker'

type MenuItem = {
  label: string
  description: string
  href: string
  badge?: string
}

function DeferredSection({ children, minHeight = 320 }: { children: ReactNode; minHeight?: number }) {
  const host = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!host.current || !('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setVisible(true)
      observer.disconnect()
    }, { rootMargin: '500px 0px' })
    observer.observe(host.current)
    return () => observer.disconnect()
  }, [])

  return <div ref={host} style={visible ? undefined : { minHeight }}><Suspense fallback={<div style={{ minHeight }} aria-hidden="true" />}>{visible ? children : null}</Suspense></div>
}

const firmItems: MenuItem[] = [
  { label: 'Best Prop Firms 2026', description: 'Our highest-rated firms overall', href: '/best-prop-firms-2026', badge: 'Popular' },
  { label: 'Fast Payout Firms', description: 'Get paid without the long wait', href: '/fast-payout-prop-firms' },
  { label: 'Instant Funding', description: 'Skip the evaluation challenge', href: '/best-instant-funding-firms' },
  { label: 'Futures Prop Firms', description: 'Top firms built for futures traders', href: '/best-futures-prop-firms' },
  { label: 'Most Trusted Firms', description: 'Proven track records and fair rules', href: '/most-trusted-prop-firms' },
  { label: 'Beginner Friendly', description: 'Simple rules and trader-first support', href: '/beginner-friendly-firms' },
]

const compareItems: MenuItem[] = [
  { label: 'Prop Firm Rules', description: 'Check challenge rules before you buy', href: '/prop-firm-rules', badge: 'New' },
  { label: 'Compare Prop Firms', description: 'Compare rules, fees and payouts side by side', href: '/compare' },
  { label: 'Prop Firm Reviews', description: 'Deep, independent firm breakdowns', href: '/reviews' },
  { label: 'Payout Proofs', description: 'Verified payout records from traders', href: '/payout-proofs', badge: 'Verified' },
  { label: 'Trading Guides', description: 'Actionable guides for funded traders', href: '/trading-guides' },
  { label: 'Funding Strategies', description: 'Smarter paths to getting funded', href: '/funding-strategies' },
  { label: 'Trading Psychology', description: 'Build discipline that lasts', href: '/trading-psychology' },
  { label: 'Beginner Tutorials', description: 'Learn trading foundations step by step', href: '/beginner-tutorials' },
  { label: 'Giveaways', description: 'Current prop firm rewards and winners', href: '/giveaways' },
]

const calculatorItems: MenuItem[] = [
  { label: 'Lot Size Calculator', description: 'Size every trade with confidence', href: '/lotsizecalculator' },
  { label: 'Risk-to-Reward', description: 'Plan risk before entering a trade', href: '/risk-to-reward-calculator' },
  { label: 'Drawdown Calculator', description: 'Track daily and maximum limits', href: '/drawdown-calculator' },
  { label: 'Profit Split', description: 'Calculate your expected payout', href: '/profit-split-calculator' },
  { label: 'Consistency Rule', description: 'Check best-day profit concentration', href: '/consistency-rule-calculator' },
  { label: 'Loss Recovery', description: 'Plan the path back to starting equity', href: '/lossrecoveryplanner' },
  { label: 'Rule Explainer', description: 'Browse common firm rules and examples', href: '/ruletranslator' },
  { label: 'Trade Journal', description: 'Review performance and find your edge', href: '/tradejournal' },
]

const searchItems: MenuItem[] = [
  { label: 'Listed Props', description: 'Browse every listed prop firm', href: '/listedprop' },
  { label: 'Prop Firm Offers', description: 'Explore active deals and discounts', href: '/offers' },
  { label: 'Prop News', description: 'Latest updates from the prop trading industry', href: '/prop-news' },
  ...firmItems,
  ...compareItems,
  ...calculatorItems,
]

const dropdownData: Record<DropdownKey, { eyebrow: string; title: string; items: MenuItem[]; allLabel: string; allHref: string }> = {
  firms: {
    eyebrow: 'Discover',
    title: 'Find your right prop firm',
    items: firmItems,
    allLabel: 'Explore all rankings',
    allHref: '/bestprop',
  },
  compare: {
    eyebrow: 'Research',
    title: 'Make a confident decision',
    items: compareItems,
    allLabel: 'Open comparison hub',
    allHref: '/compare',
  },
  calculators: {
    eyebrow: 'Trader toolkit',
    title: 'Trade with better numbers',
    items: calculatorItems,
    allLabel: 'View all calculators',
    allHref: '/calculators',
  },
}

function Chevron({ open = false }: { open?: boolean }) {
  return (
    <svg className={open ? 'chevron is-open' : 'chevron'} viewBox="0 0 12 8" aria-hidden="true">
      <path d="m1 1.5 5 5 5-5" />
    </svg>
  )
}

function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M3.75 9h10.5M10 4.75 14.25 9 10 13.25" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="8.8" cy="8.8" r="5.4" />
      <path d="m13 13 4 4" />
    </svg>
  )
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {open ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  )
}

function MarketSwitch({ market, onChange }: { market: Market; onChange: (market: Market) => void }) {
  return (
    <div className={`market-switch ${market === 'Broker' ? 'show-broker' : ''}`} aria-label="Select market">
      <span className="market-indicator" aria-hidden="true" />
      {(['Prop Firm', 'Broker'] as const).map((option) => (
        <button
          className={market === option ? 'selected' : ''}
          onClick={() => onChange(option)}
          aria-pressed={market === option}
          key={option}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

function DropdownPanel({ menuKey }: { menuKey: DropdownKey }) {
  const menu = dropdownData[menuKey]

  return (
    <div className={`dropdown-panel dropdown-${menuKey}`}>
      <div className="dropdown-intro">
        <span>{menu.eyebrow}</span>
        <h2>{menu.title}</h2>
        <p>Independent data and tools, designed to help traders choose with clarity.</p>
        <a href={menu.allHref}>
          {menu.allLabel}
          <Arrow />
        </a>
      </div>
      <div className="dropdown-links">
        {menu.items.map((item, index) => (
          <a href={item.href} className="dropdown-link" key={item.label}>
            <span className="item-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="item-copy">
              <strong>{item.label}{item.badge && <small>{item.badge}</small>}</strong>
              <span>{item.description}</span>
            </span>
            <Arrow />
          </a>
        ))}
      </div>
    </div>
  )
}

function App() {
  const headerRef = useRef<HTMLDivElement>(null)
  const [activeDropdown, setActiveDropdown] = useState<DropdownKey | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [market, setMarket] = useState<Market>('Prop Firm')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<AuthUser>(null)

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return searchItems.slice(0, 6)
    return searchItems
      .filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(query))
      .slice(0, 7)
  }, [searchQuery])

  useEffect(() => {
    let unsubscribeAuth = () => {}
    let active = true
    Promise.all([import('./firebase'), import('firebase/auth')]).then(([firebase, authModule]) => {
      if (!active) return
      setUser(firebase.auth.currentUser)
      unsubscribeAuth = authModule.onAuthStateChanged(firebase.auth, setUser)
    }).catch((error: unknown) => console.error('Unable to initialize account state', error))
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveDropdown(null)
        setMobileOpen(false)
        setSearchOpen(false)
      }
    }
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element
      const clickedSearch = target.closest('.search-panel, .search-button, .mobile-search-trigger')
      if (!clickedSearch) setSearchOpen(false)

      if (headerRef.current && !headerRef.current.contains(target)) {
        setActiveDropdown(null)
        setMobileOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      active = false
      unsubscribeAuth()
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  const accountLabel = user ? 'Dashboard' : 'Login'
  const accountHref = user ? '/dashboard' : '/login'

  const toggleDropdown = (key: DropdownKey) => {
    setSearchOpen(false)
    setActiveDropdown((current) => current === key ? null : key)
  }

  const toggleSearch = () => {
    setActiveDropdown(null)
    setMobileOpen(false)
    setSearchOpen((current) => !current)
  }

  const selectMarket = (nextMarket: Market) => {
    if (nextMarket === 'Broker') {
      window.location.href = '/broker-coming-soon'
      return
    }
    setMarket(nextMarket)
  }

  const openFirstSearchResult = () => {
    const firstResult = searchResults[0]
    if (firstResult) window.location.href = firstResult.href
  }

  return (
    <div className="site">
      <HomeCampaignPopup />
      <header className="site-header">
        <div ref={headerRef} className="header-shell" onMouseLeave={() => !mobileOpen && setActiveDropdown(null)}>
          <a className="brand" href="/" aria-label="RankMyProp home">
            <img src="/assets/rankmyprop-header-logo.png" alt="" />
            <span>Rank My Prop</span>
          </a>

          <nav className={mobileOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Primary navigation">
            <a className="nav-link" href="/listedprop">Listed Props</a>

            <div className="nav-group" onMouseEnter={() => setActiveDropdown('firms')}>
              <a
                href="/bestprop"
                className={activeDropdown === 'firms' ? 'nav-link nav-button is-active' : 'nav-link nav-button'}
                aria-expanded={activeDropdown === 'firms'}
              >
                Best Prop Firms <Chevron open={activeDropdown === 'firms'} />
              </a>
              {activeDropdown === 'firms' && <DropdownPanel menuKey="firms" />}
            </div>

            <a className="nav-link" href="/offers">Offers</a>
            <a className="nav-link" href="/reviews">Reviews</a>

            <div className="nav-group" onMouseEnter={() => setActiveDropdown('compare')}>
              <button
                className={activeDropdown === 'compare' ? 'nav-link nav-button is-active' : 'nav-link nav-button'}
                onClick={() => toggleDropdown('compare')}
                aria-expanded={activeDropdown === 'compare'}
              >
                Compare <Chevron open={activeDropdown === 'compare'} />
              </button>
              {activeDropdown === 'compare' && <DropdownPanel menuKey="compare" />}
            </div>

            <div className="nav-group" onMouseEnter={() => setActiveDropdown('calculators')}>
              <button
                className={activeDropdown === 'calculators' ? 'nav-link nav-button is-active' : 'nav-link nav-button'}
                onClick={() => toggleDropdown('calculators')}
                aria-expanded={activeDropdown === 'calculators'}
              >
                Calculators <Chevron open={activeDropdown === 'calculators'} />
              </button>
              {activeDropdown === 'calculators' && <DropdownPanel menuKey="calculators" />}
            </div>

            <a className="nav-link" href="/prop-news">Prop News</a>

            <div className="mobile-actions">
              <MarketSwitch market={market} onChange={selectMarket} />
              <button className="mobile-search-trigger" onClick={toggleSearch}><SearchIcon /> Search pages</button>
              <a className="login-button" href={accountHref}>{accountLabel} <Arrow /></a>
            </div>
          </nav>

          <div className="header-actions">
            <button className={searchOpen ? 'search-button is-active' : 'search-button'} onClick={toggleSearch} aria-label="Search" aria-expanded={searchOpen}><SearchIcon /></button>
            <MarketSwitch market={market} onChange={selectMarket} />
            <a className="login-button" href={accountHref}>{accountLabel} <Arrow /></a>
          </div>

          <button
            className="mobile-menu-button"
            onClick={() => {
              setMobileOpen((current) => !current)
              setActiveDropdown(null)
            }}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            <MenuIcon open={mobileOpen} />
          </button>

          {searchOpen && (
            <div className="search-panel" role="search">
              <div className="search-field">
                <SearchIcon />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && openFirstSearchResult()}
                  placeholder="Search firms, reviews, calculators..."
                  aria-label="Search RankMyProp"
                />
                <kbd>ESC</kbd>
              </div>
              <div className="search-meta">
                <span>{searchQuery ? `${searchResults.length} results` : 'Quick access'}</span>
                <span>Press Enter to open</span>
              </div>
              <div className="search-results">
                {searchResults.map((item, index) => (
                  <a href={item.href} className="search-result" key={`${item.href}-${item.label}`}>
                    <span className="search-result-index">{String(index + 1).padStart(2, '0')}</span>
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                    <Arrow />
                  </a>
                ))}
                {searchResults.length === 0 && (
                  <div className="search-empty">
                    <strong>No matching page found</strong>
                    <span>Try searching “payout”, “review” or “calculator”.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
      <HomeHero />
      <DeferredSection minHeight={760}><RankingsSection /></DeferredSection>
      <DeferredSection><FundingOffersBanner /></DeferredSection>
      <DeferredSection><WhyRankMyProp /></DeferredSection>
      <DeferredSection><TradersLoveRankMyProp /></DeferredSection>
      <DeferredSection><VideoShowcase pageKey="home" /></DeferredSection>
      <DeferredSection><NewsletterCta /></DeferredSection>
      <DeferredSection><FaqSection pageKey="index" pageType="general" /></DeferredSection>
      <DeferredSection><Footer /></DeferredSection>
    </div>
  )
}

export default App

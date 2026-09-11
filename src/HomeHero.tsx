import { useEffect } from 'react'

function HomeHero() {
  const routeContent = (window as Window & { __RMP_SSR_BOOTSTRAP?: { id?: string; heading?: string; paragraph?: string } }).__RMP_SSR_BOOTSTRAP
  const isGeneratedIndexPlaceholder = routeContent?.id === 'home-hero'
    && routeContent.heading?.trim().toLowerCase() === 'index insights for traders'
    && routeContent.paragraph?.trim().toLowerCase().startsWith('explore this index section')
  const homeContent = routeContent?.id === 'home-hero' && !isGeneratedIndexPlaceholder ? routeContent : null

  useEffect(() => {
    if (document.querySelector('script[data-home-hero]')) return

    const script = document.createElement('script')
    script.src = '/home-hero.js'
    script.dataset.homeHero = 'true'
    document.body.appendChild(script)
  }, [])

  return (
    <main className="hero-stage">
      <section className="home-hero-bg" aria-labelledby="hero-title">
        <div className="hero-shell">
          <a className="hero-badge" href="#offer-wall">
            <span>Trusted by 10,000+ Traders Worldwide</span>
            <span>See Who Ranks #1 in 2026 →</span>
          </a>

          <h1 id="hero-title" className="hero-title" data-rmp-route-heading>
            {homeContent?.heading || <>
              Compare top <span className="word-wrap"><span id="rotateWord" className="gradient-text word-animate">ranked</span></span> prop firms.<br />
              Built for serious traders.
            </>}
          </h1>

          <p className="hero-copy" data-rmp-route-hero>{homeContent?.paragraph || <>Find the best prop firms, exclusive discount codes, verified payout proofs, and<br className="desktop-break" /> trading tools — all in one place.</>}</p>

          <div className="hero-actions">
            <a href="/reviews" className="outline-btn"><span aria-hidden="true">▶</span> Explore Prop Firm Reviews</a>
            <a href="/bestprop" className="glow-btn">See Top Ranked Firms</a>
          </div>

          <div className="hero-offers" id="offer-wall">
            <section className="hero-offer-panel" aria-labelledby="heroOffersTitle">
              <div className="hero-offer-head">
                <div className="hero-offer-nav">
                  <button id="heroOffersPrev" type="button" aria-label="Previous offer page">❮</button>
                  <span className="hero-offer-dots" id="heroOffersDots" />
                  <button id="heroOffersNext" type="button" aria-label="Next offer page">❯</button>
                </div>
                <h2 className="hero-offer-title" id="heroOffersTitle">Exclusive July Forex Offers</h2>
              </div>
              <div className="hero-offer-grid-wrap">
                <div className="hero-offer-grid" id="heroOffersGrid" />
              </div>
            </section>

            <section className="hero-offer-panel" aria-labelledby="heroFuturesTitle">
              <div className="hero-offer-head">
                <h2 className="hero-offer-title" id="heroFuturesTitle">Most Popular Futures Prop Firms</h2>
              </div>
              <div className="hero-future-list" id="heroFuturesList" />
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}

export default HomeHero

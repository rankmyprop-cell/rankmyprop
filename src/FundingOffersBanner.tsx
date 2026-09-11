import { useState } from 'react'

function TrophyIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M20 9h24v15c0 9-5 15-12 15s-12-6-12-15V9ZM20 15H10v8c0 7 4 11 11 11M44 15h10v8c0 7-4 11-11 11M32 39v12M21 56h22M26 51h12" />
    </svg>
  )
}

export default function FundingOffersBanner() {
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    await navigator.clipboard?.writeText('RMP')
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <section className="rmp-offer-banner-section rmp-offer-banner-section--home" aria-label="Rank My Prop exclusive offers">
      <div className="rmp-offer-banner">
        <div className="rmp-offer-banner-copy">
          <span className="rmp-offer-trophy"><TrophyIcon /></span>
          <div>
            <h2>Ready to Get Funded?</h2>
            <p>Unlock exclusive discounts, guaranteed cashback, and verified offers from top prop firms.</p>
          </div>
        </div>

        <div className="rmp-offer-banner-actions">
          <div className="rmp-offer-code" aria-label="Offer code RMP">
            <span aria-hidden="true">✦</span>
            <strong>Code: RMP</strong>
            <button type="button" onClick={copyCode} aria-label="Copy offer code RMP">{copied ? 'Copied!' : 'Copy'} <i aria-hidden="true" /></button>
          </div>
          <a href="/offers">Explore Offers <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>
  )
}

const OFFER_BANNER_PAGE = /(?:^|\/)(?:listedprop|bestprop|best-prop-firms[^/]*|fast-payout-prop-firms|best-instant-funding-firms|best-futures-prop-firms|most-trusted-prop-firms|beginner-friendly-firms|highest-rated-firms|cheapest-prop-firms|best-hft-prop-firms)(?:\.html)?\/?$/i

function mountOfferBanner() {
  if (!OFFER_BANNER_PAGE.test(location.pathname) || document.getElementById('rmpFundingOffersBanner')) return
  if (!document.querySelector('link[data-rmp-offer-banner-css]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = '/funding-offers-banner.css'
    link.dataset.rmpOfferBannerCss = '1'
    document.head.appendChild(link)
  }

  const section = document.createElement('section')
  section.id = 'rmpFundingOffersBanner'
  section.className = 'rmp-offer-banner-section'
  section.setAttribute('aria-label', 'Rank My Prop exclusive offers')
  section.innerHTML = `<div class="rmp-offer-banner"><div class="rmp-offer-banner-copy"><span class="rmp-offer-trophy"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 9h24v15c0 9-5 15-12 15s-12-6-12-15V9ZM20 15H10v8c0 7 4 11 11 11M44 15h10v8c0 7-4 11-11 11M32 39v12M21 56h22M26 51h12"/></svg></span><div><h2>Ready to Get Funded?</h2><p>Unlock exclusive discounts, guaranteed cashback, and verified offers from top prop firms.</p></div></div><div class="rmp-offer-banner-actions"><div class="rmp-offer-code" aria-label="Offer code RMP"><span aria-hidden="true">✦</span><strong>Code: RMP</strong><button type="button" aria-label="Copy offer code RMP">Copy <i aria-hidden="true"></i></button></div><a href="/offers">Explore Offers <span aria-hidden="true">→</span></a></div></div>`

  const footer = document.querySelector('[data-rmp-global-footer], footer')
  const faq = document.getElementById('rmpFaqSection') || document.getElementById('faqSection') || document.querySelector('.faq-section')
  const anchor = faq || footer
  if (anchor?.parentNode) anchor.parentNode.insertBefore(section, anchor)
  else document.body.appendChild(section)

  const copyButton = section.querySelector('.rmp-offer-code button')
  copyButton?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('RMP') } catch { /* Clipboard can require a secure context. */ }
    copyButton.childNodes[0].textContent = 'Copied! '
    window.setTimeout(() => { copyButton.childNodes[0].textContent = 'Copy ' }, 1600)
  })
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => window.setTimeout(mountOfferBanner, 0), { once: true })
else window.setTimeout(mountOfferBanner, 0)

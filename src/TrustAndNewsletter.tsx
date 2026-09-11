import { FormEvent, useState } from 'react'

function ResearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 18.5V11m7 7.5V5.5m7 13v-10" />
      <path d="M3.5 18.5h17" />
    </svg>
  )
}

function ReviewIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5 14.5 8l5 .7-3.6 3.5.8 5-4.7-2.4-4.7 2.4.9-5-3.7-3.5 5-.7L12 3.5Z" />
    </svg>
  )
}

function CompareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4v16M17 4v16M3.5 8 7 4.5 10.5 8M13.5 16l3.5 3.5 3.5-3.5" />
    </svg>
  )
}

function UpdateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 8.5V4m0 0h-4.5M19 4l-3.2 3.2a7.5 7.5 0 1 0 1.3 9.1" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 5.5A3.5 3.5 0 0 1 8 4h4v15H8a3.5 3.5 0 0 0-3.5 1.5v-15ZM19.5 5.5A3.5 3.5 0 0 0 16 4h-4v15h4a3.5 3.5 0 0 1 3.5 1.5v-15Z" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5 19 6v5.2c0 4.4-2.9 7.7-7 9.3-4.1-1.6-7-4.9-7-9.3V6l7-2.5Z" />
      <path d="m8.7 12 2.1 2.1 4.7-4.7" />
    </svg>
  )
}

function HiddenRuleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 12s3.1-5 8.5-5 8.5 5 8.5 5-3.1 5-8.5 5-8.5-5-8.5-5Z" />
      <circle cx="12" cy="12" r="2.3" />
      <path d="m5 19 14-14" />
    </svg>
  )
}

const benefits = [
  { className: 'benefit-research', label: <>Independent<br />research</>, icon: <ResearchIcon /> },
  { className: 'benefit-reviews', label: <>Verified trader<br />reviews</>, icon: <ReviewIcon /> },
  { className: 'benefit-compare', label: <>Rules compared<br />side by side</>, icon: <CompareIcon /> },
  { className: 'benefit-updates', label: <>Offers tracked<br />and updated</>, icon: <UpdateIcon /> },
  { className: 'benefit-rulebook', label: <>Read prop firm<br />rules clearly</>, icon: <BookIcon /> },
  { className: 'benefit-payout', label: <>Get payout<br />assurance</>, icon: <ShieldIcon /> },
  { className: 'benefit-hidden', label: <>Uncover hidden<br />rules</>, icon: <HiddenRuleIcon /> },
]

export function WhyRankMyProp() {
  return (
    <section className="trust-section" aria-labelledby="trust-title">
      <div className="trust-glow" aria-hidden="true" />
      <div className="trust-shell">
        <header className="trust-heading">
          <span>WHY RANK MY PROP</span>
          <h2 id="trust-title">See what sets us <em>apart</em></h2>
        </header>

        <div className="trust-orbit">
          <div className="trust-core" aria-hidden="true">
            <span className="trust-core-glow" />
            <span className="trust-core-glass" />
            <img src="/assets/rankmyprop-header-logo.png" alt="" />
          </div>

          {benefits.map((benefit) => (
            <div className={`trust-benefit ${benefit.className}`} key={benefit.className}>
              <span className="trust-benefit-icon">{benefit.icon}</span>
              <strong>{benefit.label}</strong>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export function NewsletterCta() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const subscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setStatus('error')
      setMessage('Enter a valid email address.')
      return
    }

    setStatus('loading')
    setMessage('')
    try {
      const response = await fetch('/api/newsletter-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          source: 'rankmyprop-homepage',
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result?.ok) throw new Error(result?.error || 'Subscription failed')
      setStatus('success')
      setMessage(result.alreadySubscribed
        ? 'You’re already on the list. Watch your inbox.'
        : 'You’re on the list. Watch your inbox.')
      setEmail('')
    } catch (error) {
      console.error('Newsletter subscription failed', error)
      setStatus('error')
      setMessage('Could not subscribe right now. Please try again.')
    }
  }

  return (
    <section className="newsletter-section" aria-labelledby="newsletter-title">
      <div className="newsletter-shell">
        <div className="newsletter-copy">
          <span>Weekly Prop Firm Insights</span>
          <h2 id="newsletter-title">Join our <em>free newsletter</em> today</h2>
          <p>Get exclusive prop firm deals, payout proofs, rule changes, and high-quality<br className="newsletter-desktop-break" /> trading insights delivered straight to your inbox.</p>
        </div>
        <form onSubmit={subscribe} noValidate>
          <div className="newsletter-input-row">
            <label className="sr-only" htmlFor="newsletter-email">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (status !== 'idle') {
                  setStatus('idle')
                  setMessage('')
                }
              }}
              placeholder="Enter your email address"
              autoComplete="email"
              aria-describedby="newsletter-status"
              disabled={status === 'loading'}
            />
            <button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Subscribing…' : 'Subscribe Now'}
            </button>
          </div>
          <div
            id="newsletter-status"
            className={`newsletter-status ${status === 'success' ? 'is-success' : status === 'error' ? 'is-error' : ''}`}
            role="status"
            aria-live="polite"
          >
            {message}
          </div>
        </form>
      </div>
    </section>
  )
}

import { useEffect, useRef, useState, type ReactNode } from 'react'

type Feature = {
  title: string
  description: ReactNode
  icon: ReactNode
  highlighted?: boolean
}

type Stat = {
  target?: number
  display?: string
  prefix?: string
  suffix: string
  label: string
  grouped?: boolean
}

const features: Feature[] = [
  {
    title: 'Independent Reviews',
    description: 'Read unbiased prop firm reviews, real trader experiences, and expert analysis before purchasing a challenge.',
    icon: <path d="M13.2 4.2c3.3-2 6.3-1.7 6.3-1.7s.3 3-1.7 6.3l-3.1 3.1-4.6-4.6 3.1-3.1Zm-4 4L5.4 9.4 2.8 12l4 .4.8 4 2.6-2.6 1.2-3.8M14 13l-.4 4 4 .8 2.6-2.6-1.2-3.8M6.8 17.2l-3 3M8.6 19l-1.4 1.4M5 15.4l-1.4 1.4" />,
  },
  {
    title: 'Exclusive Offers & Cashback',
    description: <>Access verified discount codes and enjoy <strong>guaranteed cashback on every eligible purchase</strong> made through Rank My Prop.</>,
    highlighted: true,
    icon: <><circle cx="12" cy="12" r="8.2" /><path d="M14.8 8.5c-.7-.6-1.7-.9-2.8-.9-1.7 0-2.8.9-2.8 2.1 0 3.1 5.6 1.4 5.6 4.6 0 1.3-1.1 2.2-2.9 2.2-1.2 0-2.3-.4-3.1-1.1M12 5.4v13.2" /></>,
  },
  {
    title: 'Smart Comparisons',
    description: 'Compare pricing, drawdown rules, profit splits, payout speed, scaling plans, trading platforms, and hidden rules side by side.',
    icon: <><path d="M4 4.5h13.5v8M7 8h7M7 11h4" /><circle cx="16.5" cy="16.5" r="4" /><path d="M16.5 14.3v2.4l1.6 1" /></>,
  },
  {
    title: 'Payout Assurance',
    description: 'If a verified partner unfairly denies your eligible payout, we’ll work to resolve the issue. If it cannot be resolved, we’ll refund your challenge fee or provide a replacement account according to our Payout Assurance Policy.',
    icon: <><path d="M17.8 14.2a6.8 6.8 0 1 0-4.2 4.2" /><path d="M17.5 11.5a3.1 3.1 0 1 0 0 6.2h1.2a2.3 2.3 0 0 0 0-4.6h-1.2M12 8.3v3.8l2.5 1.4" /></>,
  },
]

const stats: Stat[] = [
  { target: 250, suffix: '+', label: 'Prop Firms Reviewed' },
  { target: 500, suffix: '+', label: 'Exclusive Offers' },
  { target: 10000, suffix: '+', label: 'Trader Reviews', grouped: true },
  { display: 'Guaranteed', suffix: '', label: 'Cashback on Every Eligible Purchase' },
]

function useCountUp(target: number, start: boolean, duration = 1450) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!start) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }

    let frame = 0
    const startedAt = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setValue(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [duration, start, target])

  return value
}

function AnimatedStat({ stat, active }: { stat: Stat; active: boolean }) {
  const value = useCountUp(stat.target ?? 0, active)
  const formatted = stat.grouped ? value.toLocaleString('en-US') : String(value)
  return (
    <div className={`why-rmp-stat${stat.display ? ' is-text' : ''}`}>
      <strong>{stat.display ?? `${stat.prefix ?? ''}${formatted}${stat.suffix}`}</strong>
      <span>{stat.label}</span>
    </div>
  )
}

export default function WhyRankMyProp() {
  const sectionRef = useRef<HTMLElement>(null)
  const [counting, setCounting] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setCounting(true)
        observer.disconnect()
      }
    }, { threshold: .35 })
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="why-rmp-section" ref={sectionRef} aria-labelledby="why-rmp-title">
      <div className="why-rmp-panel">
        <header className="why-rmp-heading">
          <h2 id="why-rmp-title"><span>Still Comparing Prop Firms?</span><br />Here&apos;s Why Traders Choose Rank My Prop</h2>
          <p>Everything you need to research, compare, save money, and trade with confidence, all in one trusted platform.</p>
        </header>

        <div className="why-rmp-features">
          {features.map((feature) => (
            <article className={`why-rmp-card${feature.highlighted ? ' is-highlighted' : ''}`} key={feature.title}>
              <span className="why-rmp-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">{feature.icon}</svg>
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>

        <div className="why-rmp-stats" aria-label="Rank My Prop platform statistics">
          {stats.map((stat) => <AnimatedStat stat={stat} active={counting} key={stat.label} />)}
        </div>
      </div>
    </section>
  )
}

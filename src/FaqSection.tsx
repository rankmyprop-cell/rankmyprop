import { useEffect, useId, useMemo, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'

type FaqItem = {
  question: string
  answer: string
}

type FaqContent = {
  label: string
  lead: string
  trail: string
  supportTitle: string
  supportText: string
  supportButtonText: string
  supportButtonLink: string
  items: FaqItem[]
}

type FaqCmsRow = Partial<FaqContent> & {
  id: string
  scope?: string
  pageType?: string
  pageKey?: string
  faqText?: string
}

const homeFaq: FaqContent = {
  label: 'TRADER ANSWER DESK',
  lead: 'Questions worth asking',
  trail: 'before you get funded.',
  supportTitle: 'Still comparing firms?',
  supportText: 'Tell us your strategy, budget and preferred market. Our team will point you toward the right research—not the loudest promotion.',
  supportButtonText: 'Ask Rank My Prop',
  supportButtonLink: '/contact',
  items: [
    {
      question: 'How does Rank My Prop rank prop firms?',
      answer: 'We examine payout reliability, drawdown structure, trading restrictions, platform availability, pricing and verified trader feedback. The ranking is designed to show the complete trading experience, not one attractive headline.',
    },
    {
      question: 'Are higher-ranked firms paying for their position?',
      answer: 'Commercial partnerships do not automatically determine ranking position. Sponsored offers are treated separately from the research signals used to compare firms.',
    },
    {
      question: 'What should I check before buying a challenge?',
      answer: 'Start with daily and maximum drawdown, payout timing, consistency rules, restricted strategies, platform support and refund terms. A low entry fee is useful only when the rules fit how you actually trade.',
    },
    {
      question: 'Where do the ratings and review counts come from?',
      answer: 'The website reads published review aggregates from the Rank My Prop review system. Reviews that remain pending or rejected are not included in the public aggregate.',
    },
    {
      question: 'Can I use a discount and cashback together?',
      answer: 'It depends on the firm and the offer terms. Check the live offer entry before checkout because stacking rules, eligible account sizes and expiry dates can change.',
    },
    {
      question: 'How often is firm information updated?',
      answer: 'Firm profiles are managed through the Rank My Prop CMS. Published changes flow into the public comparison experience so rules, platforms, offers and ranking inputs can be kept current.',
    },
  ],
}

function parseFaqText(value = '') {
  return value
    .split(/\n\s*\n/g)
    .map((block) => {
      const parts = block.trim().split('||')
      const question = String(parts.shift() || '').trim()
      const answer = parts.join('||').trim()
      return { question, answer }
    })
    .filter((item) => item.question && item.answer)
}

function normalize(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function mergeCmsContent(base: FaqContent, row?: FaqCmsRow): FaqContent {
  if (!row) return base
  const parsedItems = parseFaqText(row.faqText)
  return {
    label: String(row.label || base.label),
    lead: String(row.lead || base.lead),
    trail: String(row.trail || base.trail),
    supportTitle: String(row.supportTitle || base.supportTitle),
    supportText: String(row.supportText || base.supportText),
    supportButtonText: String(row.supportButtonText || base.supportButtonText),
    supportButtonLink: String(row.supportButtonLink || base.supportButtonLink),
    items: parsedItems.length ? parsedItems : base.items,
  }
}

export default function FaqSection({
  pageKey = 'index',
  pageType = 'general',
  fallback = homeFaq,
}: {
  pageKey?: string
  pageType?: string
  fallback?: FaqContent
}) {
  const sectionId = useId()
  const [content, setContent] = useState(fallback)
  const [openIndex, setOpenIndex] = useState(0)

  useEffect(() => {
    let active = true
    getDocs(collection(db, 'pageFaqs'))
      .then((snapshot) => {
        if (!active) return
        const rows: FaqCmsRow[] = []
        snapshot.forEach((document) => rows.push({ id: document.id, ...document.data() } as FaqCmsRow))
        const exactPage = rows.find((row) =>
          normalize(row.scope || (row.id.startsWith('type-') ? 'type' : 'page')) === 'page' &&
          normalize(row.pageKey) === normalize(pageKey),
        )
        const typeDefault = rows.find((row) =>
          normalize(row.scope || (row.id.startsWith('type-') ? 'type' : 'page')) === 'type' &&
          normalize(row.pageType) === normalize(pageType),
        )
        setContent(mergeCmsContent(fallback, exactPage || typeDefault))
      })
      .catch((error: unknown) => {
        console.warn('FAQ CMS could not be loaded; using editorial page copy.', error)
      })
    return () => {
      active = false
    }
  }, [fallback, pageKey, pageType])

  const heading = useMemo(() => `${content.lead} ${content.trail}`, [content.lead, content.trail])

  return (
    <section className="faq-section" id="faq" aria-labelledby={`${sectionId}-title`}>
      <div className="faq-ambient" aria-hidden="true" />
      <div className="faq-shell">
        <header className="faq-heading">
          <span>{content.label}</span>
          <h2 id={`${sectionId}-title`}>
            {content.lead}<br />
            <em>{content.trail}</em>
          </h2>
          <p>{heading} Answered clearly, without hiding the details that affect a funded account.</p>
        </header>

        <div className="faq-layout">
          <aside className="faq-support">
            <span className="faq-support-mark" aria-hidden="true">
              <img src="/assets/rankmyprop-header-logo.png" alt="" />
            </span>
            <div>
              <small>PERSONAL GUIDANCE</small>
              <h3>{content.supportTitle}</h3>
              <p>{content.supportText}</p>
            </div>
            <a href="/contact">
              {content.supportButtonText}
              <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3.5 9h11M10.5 5l4 4-4 4" /></svg>
            </a>
          </aside>

          <div className="faq-list">
            {content.items.map((item, index) => {
              const isOpen = openIndex === index
              const answerId = `${sectionId}-answer-${index}`
              return (
                <article className={isOpen ? 'faq-item is-open' : 'faq-item'} key={item.question}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                  >
                    <span className="faq-number">{String(index + 1).padStart(2, '0')}</span>
                    <strong>{item.question}</strong>
                    <span className="faq-toggle" aria-hidden="true"><i /><i /></span>
                  </button>
                  <div className="faq-answer" id={answerId}>
                    <div><p>{item.answer}</p></div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

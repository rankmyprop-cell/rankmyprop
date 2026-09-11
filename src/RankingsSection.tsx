import { useEffect, useMemo, useState } from 'react'
import { PlatformLogo } from './PlatformLogo'
import { loadRankedFirms, type RankedFirm, type RankingFilter } from './rankingsData'

const filters: RankingFilter[] = ['Best Overall', 'Fast Payout', 'Instant Funding', 'Lowest Fee']
const pageSize = 10

function Arrow() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path d="M3.5 9h11M10.5 5l4 4-4 4" />
    </svg>
  )
}

function Metric({ value }: { value: string }) {
  return <strong>{value || '—'}</strong>
}

function RankingsSection() {
  const [activeFilter, setActiveFilter] = useState<RankingFilter>('Best Overall')
  const [selected, setSelected] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [firms, setFirms] = useState<RankedFirm[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true
    loadRankedFirms()
      .then((rows) => {
        if (!active) return
        setFirms(rows)
        setLoadError('')
      })
      .catch((error: unknown) => {
        if (!active) return
        console.error('Unable to load live firm rankings', error)
        setFirms([])
        setLoadError('Live rankings are temporarily unavailable. Please try again shortly.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filteredFirms = useMemo(
    () => firms.filter((firm) => firm.filters.includes(activeFilter)),
    [activeFilter, firms],
  )
  const pageCount = Math.ceil(filteredFirms.length / pageSize)
  const visibleFirms = filteredFirms.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
  const rangeStart = filteredFirms.length ? currentPage * pageSize + 1 : 0
  const rangeEnd = Math.min((currentPage + 1) * pageSize, filteredFirms.length)
  const toggleFirm = (id: string) => {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      if (current.length === 3) return current
      return [...current, id]
    })
  }

  return (
    <section className="rankings-section" aria-labelledby="rankings-title">
      <div className="rankings-shell">
        <div className="rankings-heading">
          <div>
            <span className="rankings-kicker">PROP FIRM DIRECTORY</span>
            <h2 id="rankings-title">Prop firm rankings</h2>
          </div>
          <p>A side-by-side view of fees, payout terms and trader feedback. Filter the list, then compare the firms that fit your trading style.</p>
        </div>

        <div className="ranking-controls">
          <span>Filter rankings</span>
          <div className="ranking-filters" aria-label="Filter prop firms">
            {filters.map((filter) => (
              <button
                className={activeFilter === filter ? 'is-active' : ''}
                onClick={() => {
                  setActiveFilter(filter)
                  setCurrentPage(0)
                }}
                aria-pressed={activeFilter === filter}
                key={filter}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="ranking-table">
          <div className="ranking-table-title">
            <div><strong>Live overall ranking</strong><span>Showing {rangeStart}–{rangeEnd} of {filteredFirms.length}</span></div>
            <span>Synced with CMS</span>
          </div>
          <div className="ranking-table-head" aria-hidden="true">
            <span>Firm</span>
            <span>RMP score</span>
            <span>Platforms</span>
            <span>Starting fee</span>
            <span>Account</span>
            <span>Profit split</span>
            <span>Max DD</span>
            <span>Payout</span>
            <span />
          </div>

          <div className="ranking-list" aria-busy={loading}>
            {loading && Array.from({ length: 5 }, (_, index) => (
              <div className="ranking-row ranking-skeleton" aria-hidden="true" key={index}>
                {Array.from({ length: 8 }, (__, cell) => <span key={cell} />)}
              </div>
            ))}

            {!loading && (loadError || visibleFirms.length === 0) && (
              <div className="ranking-empty">
                <strong>{loadError ? 'Could not load live data' : 'No firms in this filter yet'}</strong>
                <span>{loadError || 'Add or publish firms from the admin CMS to show them here.'}</span>
              </div>
            )}

            {!loading && visibleFirms.map((firm) => {
              const isSelected = selected.includes(firm.id)
              return (
                <article className="ranking-row" key={firm.id}>
                  <div className="firm-identity">
                    <span className="ranking-logo">
                      {firm.logo ? <img src={firm.logo} alt={`${firm.name} logo`} /> : firm.initials}
                    </span>
                    <span className="ranking-name">
                      <strong>{firm.name}{firm.verified && <span className="verified-dot" title="Verified firm">✓</span>}</strong>
                      <small><b>★ {firm.rating.toFixed(1)}</b> <span>({firm.reviewCount.toLocaleString('en-IN')} reviews)</span></small>
                      <small>Loved by {firm.followers.toLocaleString('en-IN')} traders</small>
                    </span>
                  </div>

                  <div className="score-cell" data-label="RMP score">
                    <span className="score-number"><strong>{firm.score}</strong><span>/10</span></span>
                    <span className="score-track"><i style={{ width: `${firm.score * 10}%` }} /></span>
                  </div>
                  <div className="platform-cell" data-label="Platforms">
                    {firm.platforms.slice(0, 6).map((platform) => <PlatformLogo key={platform} platform={platform} />)}
                  </div>
                  <div className="metric-cell" data-label="Starting fee">
                    <Metric value={firm.fee} />
                    {firm.offer && <span className="offer-label">{firm.offer}</span>}
                  </div>
                  <div className="metric-cell" data-label="Account size"><Metric value={firm.accountSize} /></div>
                  <div className="metric-cell" data-label="Profit split"><Metric value={firm.profitSplit} /></div>
                  <div className="metric-cell" data-label="Max drawdown"><Metric value={firm.maxDrawdown} /></div>
                  <div className="metric-cell" data-label="Payout"><Metric value={firm.payout} /></div>

                  <div className="ranking-actions">
                    <button
                      className={isSelected ? 'compare-toggle is-selected' : 'compare-toggle'}
                      onClick={() => toggleFirm(firm.id)}
                      aria-pressed={isSelected}
                      aria-label={`${isSelected ? 'Remove' : 'Add'} ${firm.name} ${isSelected ? 'from' : 'to'} comparison`}
                    >
                      <span>{isSelected ? '✓' : '+'}</span> Compare
                    </button>
                    <a href={firm.href} aria-label={`View ${firm.name} review`}><Arrow /></a>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        {pageCount > 1 && (
          <div className="ranking-pagination" aria-label="Ranking pages">
            <span>Showing {rangeStart}–{rangeEnd} of {filteredFirms.length} firms</span>
            <div>
              <button onClick={() => setCurrentPage((page) => Math.max(0, page - 1))} disabled={currentPage === 0}>Previous</button>
              {Array.from({ length: pageCount }, (_, index) => (
                <button
                  className={currentPage === index ? 'is-active' : ''}
                  onClick={() => setCurrentPage(index)}
                  aria-label={`Ranking page ${index + 1}`}
                  aria-current={currentPage === index ? 'page' : undefined}
                  key={index}
                >
                  {index + 1}
                </button>
              ))}
              <button onClick={() => setCurrentPage((page) => Math.min(pageCount - 1, page + 1))} disabled={currentPage === pageCount - 1}>Next</button>
            </div>
          </div>
        )}

        <div className="rankings-footer">
          <span>Firm details, ratings and community counts come directly from the Rank My Prop CMS.</span>
          <a href="/bestprop">View complete rankings <Arrow /></a>
        </div>

        {selected.length > 0 && (
          <div className="compare-dock">
            <div>
              <strong>{selected.length} firm{selected.length > 1 ? 's' : ''} selected</strong>
              <span>Select up to 3 firms to compare</span>
            </div>
            <div className="compare-firms">
              {selected.map((id) => {
                const firm = firms.find((item) => item.id === id)
                return firm ? <button onClick={() => toggleFirm(id)} key={id}>{firm.initials} <span>×</span></button> : null
              })}
            </div>
            <a className={selected.length < 2 ? 'is-disabled' : ''} href={selected.length >= 2 ? `/compare?firms=${selected.join(',')}` : undefined}>
              Compare now <Arrow />
            </a>
          </div>
        )}
      </div>
    </section>
  )
}

export default RankingsSection

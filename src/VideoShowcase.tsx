import { useEffect, useState } from 'react'
import { listCloudflareCollection } from './cloudflareData'

type VideoRow = {
  id: string
  title: string
  description: string
  youtubeUrl: string
  thumbUrl: string
  authorName: string
  pageKeys: string[]
  sortOrder: number
  active: boolean
}

type OEmbedData = {
  title?: string
  author_name?: string
  thumbnail_url?: string
}

type LatestVideosResponse = {
  videos?: Array<Partial<VideoRow>>
}

const YOUTUBE_CHANNEL_URL = 'https://youtube.com/@RankMyProp'

const CHANNEL_FALLBACK: VideoRow = {
  id: 'rank-my-prop-youtube-channel',
  title: 'Explore the latest Rank My Prop videos',
  description: 'Watch fresh prop firm breakdowns, payout discussions, rule updates and practical challenge guides on our YouTube channel.',
  youtubeUrl: YOUTUBE_CHANNEL_URL,
  thumbUrl: '',
  authorName: 'Rank My Prop',
  pageKeys: ['home'],
  sortOrder: 0,
  active: true,
}

const HOME_SHORTS: VideoRow[] = [
  'https://youtube.com/shorts/bGxkR-0tZDQ?si=_oG9mZk6YaVA99wU',
  'https://youtube.com/shorts/bGxkR-0tZDQ?si=V9xfS9TS7rZg7vDD',
  'https://youtube.com/shorts/kRxzAmJBxBs?si=cdPb7wvGkizqKSmt',
].map((youtubeUrl, index) => ({
  id: `home-short-${index + 1}`,
  title: '',
  description: '',
  youtubeUrl,
  thumbUrl: '',
  authorName: 'Rank My Prop',
  pageKeys: ['home'],
  sortOrder: index,
  active: true,
}))

function text(value: unknown) {
  return String(value ?? '').trim()
}

function normalizePageKey(value: unknown) {
  return text(value).toLowerCase().replace(/^\/+|\/+$/g, '') || 'home'
}

function pageKeysFrom(row: Record<string, unknown>) {
  const source = row.pageKeys ?? row.pages ?? row.pageKey
  if (Array.isArray(source)) return source.map(normalizePageKey).filter(Boolean)
  return text(source).split(',').map(normalizePageKey).filter(Boolean)
}

function youtubeId(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.split('/').filter(Boolean)[0] || ''
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v') ||
        parsed.pathname.match(/\/(?:shorts|embed|live)\/([^/?]+)/)?.[1] ||
        ''
    }
  } catch {
    return ''
  }
  return ''
}

async function hydrateVideo(row: VideoRow): Promise<VideoRow> {
  if (row.id === CHANNEL_FALLBACK.id) return row
  if (row.title && row.thumbUrl && row.description) return row
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(row.youtubeUrl)}&format=json`)
    if (!response.ok) throw new Error('YouTube metadata unavailable')
    const metadata = await response.json() as OEmbedData
    const resolvedTitle = row.title || text(metadata.title)
    const author = row.authorName || text(metadata.author_name) || 'Rank My Prop'
    return {
      ...row,
      title: resolvedTitle || 'Watch on YouTube',
      thumbUrl: row.thumbUrl || text(metadata.thumbnail_url),
      authorName: author,
      description: row.description || `Watch ${resolvedTitle || 'this video'} from ${author} for practical prop firm research and trader insights.`,
    }
  } catch {
    const id = youtubeId(row.youtubeUrl)
    return {
      ...row,
      title: row.title || 'Watch on YouTube',
      thumbUrl: row.thumbUrl || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : ''),
      description: row.description || 'Prop firm research, payout discussions, rule changes and practical trader insights.',
    }
  }
}

async function loadLatestChannelVideos(): Promise<VideoRow[]> {
  const response = await fetch('/api/youtube-latest?format=cards-v2', { cache: 'no-store' })
  if (!response.ok) throw new Error('Latest YouTube videos unavailable')
  const payload = await response.json() as LatestVideosResponse
  return (Array.isArray(payload.videos) ? payload.videos : [])
    .map((video, index) => ({
      id: text(video.id) || `youtube-latest-${index}`,
      title: text(video.title),
      description: text(video.description),
      youtubeUrl: text(video.youtubeUrl),
      thumbUrl: text(video.thumbUrl),
      authorName: text(video.authorName) || 'Rank My Prop',
      pageKeys: ['home'],
      sortOrder: index,
      active: true,
    }))
    .filter((video) => video.youtubeUrl && video.title)
    .slice(0, 3)
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9.5 7 7 5-7 5V7Z" />
    </svg>
  )
}

export default function VideoShowcase({ pageKey = 'home' }: { pageKey?: string }) {
  const [videos, setVideos] = useState<VideoRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadVideos() {
      try {
        const rows: VideoRow[] = []

        try {
          const cmsRows = await listCloudflareCollection<Record<string, unknown> & { id: string }>('propNewsVideos', 100)
          cmsRows.forEach((data) => {
            const pages = pageKeysFrom(data)
            rows.push({
              id: data.id,
              title: text(data.title),
              description: text(data.description ?? data.excerpt),
              youtubeUrl: text(data.youtubeUrl ?? data.videoUrl ?? data.url),
              thumbUrl: text(data.thumbUrl ?? data.thumbnailUrl),
              authorName: text(data.authorName),
              pageKeys: pages.length ? pages : ['home'],
              sortOrder: Number(data.sortOrder ?? data.order) || 0,
              active: data.active !== false,
            })
          })
        } catch (error) {
          console.warn('CMS videos could not be loaded; using the YouTube feed.', error)
        }

        const target = normalizePageKey(pageKey)
        const visible = rows
          .filter((row) => row.active && row.youtubeUrl)
          .filter((row) => row.pageKeys.some((key) => key === 'all' || key === target))
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .slice(0, 3)

        const curated = target === 'home' ? HOME_SHORTS : []
        const latest = visible.length || curated.length ? [] : await loadLatestChannelVideos().catch((error: unknown) => {
          console.warn('Latest YouTube videos could not be loaded; showing the channel link.', error)
          return []
        })
        const sourceRows = curated.length ? curated : visible.length ? visible : latest.length ? latest : [CHANNEL_FALLBACK]
        const hydrated = await Promise.all(sourceRows.map(hydrateVideo))
        if (active) setVideos(hydrated)
      } catch (error) {
        console.warn('Video showcase could not be loaded.', error)
        if (active) setVideos([CHANNEL_FALLBACK])
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadVideos()

    return () => {
      active = false
    }
  }, [pageKey])

  return (
    <section className={`video-showcase ${loading ? 'is-loading' : ''}`} aria-labelledby="video-showcase-title">
      <div className="video-showcase-glow" aria-hidden="true" />
      <div className="video-showcase-shell">
        <header className="video-showcase-heading">
          <span>RANK MY PROP VIDEO DESK</span>
          <h2 id="video-showcase-title">Watch our <em>latest videos</em></h2>
          <p>Fresh prop firm breakdowns, payout discussions, rule changes and challenge explainers from the Rank My Prop team.</p>
        </header>

        {loading ? (
          <div className="video-showcase-skeleton" aria-label="Loading latest videos">
            <span /><span /><span />
          </div>
        ) : (
          <div className={`video-showcase-grid video-count-${videos.length}`}>
            {videos.map((video, index) => {
              const isShort = video.id.startsWith('home-short-')
              return (
                <a
                  className={`video-card ${index === 0 ? 'is-featured' : ''}${isShort ? ' is-short' : ''}`}
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={video.id}
                >
                  <div className="video-card-media">
                    {video.thumbUrl ? <img src={video.thumbUrl} alt="" loading="lazy" /> : <span className="video-card-placeholder" />}
                    <span className="video-play"><PlayIcon /></span>
                    {index === 0 && <span className="video-featured-label">{video.id === CHANNEL_FALLBACK.id ? 'YouTube channel' : isShort ? 'Featured short' : 'Featured breakdown'}</span>}
                  </div>
                  <div className="video-card-copy">
                    <span>{isShort ? 'YouTube Shorts' : 'YouTube'} <i>•</i> Rank My Prop</span>
                    <h3>{video.title}</h3>
                    <p>{video.description}</p>
                    <strong>{video.id === CHANNEL_FALLBACK.id ? 'Visit channel' : isShort ? 'Watch short' : 'Watch video'}</strong>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

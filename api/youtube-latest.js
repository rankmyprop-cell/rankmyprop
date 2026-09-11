const CHANNEL_ID = 'UCdErQzX-O6KymTozg6xyTEQ'
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`

function decodeXml(value = '') {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

function field(block, pattern) {
  return decodeXml(block.match(pattern)?.[1] || '')
}

function cleanDescription(value = '') {
  const paragraphs = String(value)
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter((paragraph) => paragraph && !paragraph.startsWith('#'))
  return paragraphs[0] || ''
}

function parseFeed(xml) {
  return Array.from(String(xml).matchAll(/<entry>([\s\S]*?)<\/entry>/g))
    .slice(0, 3)
    .map((match) => {
      const block = match[1]
      const videoId = field(block, /<yt:videoId>([\s\S]*?)<\/yt:videoId>/)
      const title = field(block, /<title>([\s\S]*?)<\/title>/)
      const description = cleanDescription(field(block, /<media:description>([\s\S]*?)<\/media:description>/))
      const publishedAt = field(block, /<published>([\s\S]*?)<\/published>/)
      return {
        id: `youtube-${videoId}`,
        videoId,
        title,
        description: description || `Watch ${title} from Rank My Prop for practical prop firm research and trader insights.`,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        thumbUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        authorName: 'Rank My Prop',
        publishedAt,
      }
    })
    .filter((video) => video.videoId && video.title)
}

module.exports = async function youtubeLatest(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await fetch(FEED_URL, {
      headers: { 'User-Agent': 'RankMyProp/1.0 (+https://www.rankmyprop.in)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) throw new Error(`YouTube feed returned ${response.status}`)
    const videos = parseFeed(await response.text())
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600')
    return res.status(200).json({ channelId: CHANNEL_ID, source: 'youtube-feed', videos })
  } catch (error) {
    console.error('[youtube-latest]', error)
    return res.status(502).json({ error: 'Latest videos are temporarily unavailable', videos: [] })
  }
}

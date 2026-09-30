import { useEffect, useState, type CSSProperties } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import './home-campaign-popup.css'

type PopupSettings = {
  enabled?: boolean
  imageUrl?: string
  targetUrl?: string
  alt?: string
  desktopWidth?: number
  mobileWidth?: number
  openDelay?: number
  updatedAt?: { seconds?: number } | string | number
}

const SETTINGS_COLLECTION = 'siteSettings'
const SETTINGS_ID = 'websitePopup'
const DISMISSED_KEY = 'rmp:website-popup:dismissed'

// A reload begins a fresh popup viewing session. Ordinary page navigation
// keeps the dismissal for this tab so the popup cannot reappear on another page.
if (typeof window !== 'undefined') {
  try {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (navigation?.type === 'reload') sessionStorage.removeItem(DISMISSED_KEY)
  } catch { /* Storage may be unavailable in restricted browser contexts. */ }
}

const safeUrl = (value = '') => {
  const url = String(value || '').trim()
  if (!url) return ''
  try {
    const parsed = new URL(url, window.location.origin)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : ''
  } catch {
    return ''
  }
}

function PopupCloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
}

export default function HomeCampaignPopup() {
  const [settings, setSettings] = useState<PopupSettings | null>(null)
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    let live = true
    getDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_ID))
      .then((snapshot) => {
        if (!live || !snapshot.exists()) return
        const data = snapshot.data() as PopupSettings
        if (!data.enabled || !safeUrl(data.imageUrl)) return
        setSettings(data)
      })
      .catch(() => {})
    return () => { live = false }
  }, [])

  useEffect(() => {
    if (!settings || open) return
    try { if (sessionStorage.getItem(DISMISSED_KEY) === '1') return } catch { /* Continue without persistence. */ }

    let timer = 0
    const onScroll = () => {
      if (window.scrollY < 120 || timer) return
      const delay = Math.max(0, Math.min(30, Number(settings.openDelay ?? 2))) * 1000
      timer = window.setTimeout(() => {
        try { sessionStorage.setItem(DISMISSED_KEY, '1') } catch { /* Popup is still limited to this mounted page. */ }
        setOpen(true)
        window.removeEventListener('scroll', onScroll)
      }, delay)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (timer) window.clearTimeout(timer)
    }
  }, [settings, open])

  const close = () => {
    if (!settings || closing) return
    setClosing(true)
    try { sessionStorage.setItem(DISMISSED_KEY, '1') } catch { /* Dismiss for this mounted page. */ }
    window.setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, 180)
  }

  if (!settings || !open) return null
  const imageUrl = safeUrl(settings.imageUrl)
  const targetUrl = safeUrl(settings.targetUrl)
  const desktopWidth = Math.max(260, Math.min(760, Number(settings.desktopWidth || 620)))
  const mobileWidth = Math.max(70, Math.min(100, Number(settings.mobileWidth || 92)))

  return (
    <div className={closing ? 'rmp-campaign-popup is-closing' : 'rmp-campaign-popup'} role="dialog" aria-modal="true" aria-label="Website offer">
      <button className="rmp-campaign-backdrop" type="button" aria-label="Close popup" onClick={close} />
      <section className="rmp-campaign-card" style={{ '--popup-width': `${desktopWidth}px`, '--popup-mobile-width': `${mobileWidth}vw` } as CSSProperties}>
        <button className="rmp-campaign-close" type="button" aria-label="Close popup" onClick={close}><PopupCloseIcon /></button>
        {targetUrl ? (
          <a className="rmp-campaign-image-link" href={targetUrl} target="_blank" rel="noopener noreferrer" aria-label={settings.alt || 'Open offer'}>
            <img src={imageUrl} alt={settings.alt || 'Rank My Prop offer'} />
          </a>
        ) : <img className="rmp-campaign-image" src={imageUrl} alt={settings.alt || 'Rank My Prop offer'} />}
      </section>
    </div>
  )
}

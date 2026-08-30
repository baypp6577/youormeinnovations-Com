export type HostingPublicStatus = {
  active: boolean
  homepageDisabled: boolean
  inReminderWindow: boolean
  periodEnd: string | null
  disableOn: string | null
  yearlyGbp: number
}

const DEFAULT_STATUS_URL = 'https://hometolive.net/api/hosting-support/status/'
const CLIENT_ID = 'youorme'
const CACHE_MS = 5 * 60 * 1000

let cache: { at: number; status: HostingPublicStatus | null } | null = null

function statusUrl() {
  const configured = (import.meta.env.VITE_HOSTING_STATUS_URL || '').trim()
  const base = (configured || DEFAULT_STATUS_URL).replace(/\/$/, '')
  return `${base}/?clientId=${encodeURIComponent(CLIENT_ID)}`
}

export async function fetchHomepageHostingStatus(): Promise<HostingPublicStatus | null> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.status

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(statusUrl(), { signal: controller.signal })
    const payload = res.ok ? await res.json() : null
    const status = (payload?.data || null) as HostingPublicStatus | null
    cache = { at: Date.now(), status }
    return status
  } catch {
    cache = { at: Date.now(), status: null }
    return null
  } finally {
    window.clearTimeout(timer)
  }
}

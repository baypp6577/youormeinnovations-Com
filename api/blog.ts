import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const FILE_REL = 'src/data/blog-posts.json'
const COOKIE = 'yom_blog_sess'
const MAX_TITLE = 200
const MAX_EXCERPT = 500
const MAX_BODY = 50000
const MAX_SLUG = 80
const SESSION_HOURS = 12
const LOGIN_MAX = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const loginsByIp = new Map<string, number[]>()

type BlogPost = {
  slug: string
  title: string
  excerpt: string
  date: string
  body: string
  published?: boolean
}

type BlogFile = { posts: BlogPost[] }

type Req = {
  method?: string
  url?: string
  body?: unknown
  headers?: Record<string, string | string[] | undefined>
  [Symbol.asyncIterator]?: () => AsyncIterableIterator<Buffer | string>
}

type Res = {
  status?: (code: number) => { json: (body: unknown) => unknown }
  statusCode?: number
  setHeader?: (name: string, value: string | string[]) => void
  end?: (chunk?: string) => void
  json?: (body: unknown) => unknown
}

function env(name: string): string {
  return String(process.env[name] || '').trim()
}

function adminPassword(): string {
  return env('BLOG_ADMIN_PASSWORD')
}

function adminSecret(): string {
  return env('BLOG_ADMIN_SECRET') || adminPassword()
}

function json(res: Res, status: number, body: unknown) {
  const payload = JSON.stringify(body)
  if (typeof res.status === 'function') {
    return res.status(status).json(body)
  }
  res.statusCode = status
  res.setHeader?.('Content-Type', 'application/json; charset=utf-8')
  res.setHeader?.('Cache-Control', 'no-store')
  res.end?.(payload)
}

function clientIp(req: Req) {
  const forwarded = req.headers?.['x-forwarded-for']
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return raw?.split(',')[0]?.trim() || 'unknown'
}

function header(req: Req, name: string): string {
  const v = req.headers?.[name] ?? req.headers?.[name.toLowerCase()]
  return Array.isArray(v) ? v[0] || '' : String(v || '')
}

function isSecure(req: Req) {
  if (process.env.VERCEL) return true
  return header(req, 'x-forwarded-proto').includes('https')
}

function parseCookies(req: Req): Record<string, string> {
  const raw = header(req, 'cookie')
  const out: Record<string, string> = {}
  raw.split(';').forEach((part) => {
    const idx = part.indexOf('=')
    if (idx < 1) return
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim())
  })
  return out
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', adminSecret() || 'missing').update(payload).digest('hex')
}

function makeSession(): string {
  const exp = Date.now() + SESSION_HOURS * 60 * 60 * 1000
  const payload = Buffer.from(JSON.stringify({ exp }), 'utf8').toString('base64url')
  return `${payload}.${sign(payload)}`
}

function sessionOk(token: string): boolean {
  if (!adminPassword() || !adminSecret()) return false
  const parts = String(token || '').split('.')
  if (parts.length !== 2) return false
  const [payload, sig] = parts
  const expected = sign(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number }
    return typeof data.exp === 'number' && data.exp > Date.now()
  } catch {
    return false
  }
}

function setSessionCookie(req: Req, res: Res, token: string | null) {
  const secure = isSecure(req) ? '; Secure' : ''
  const value = token
    ? `${COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_HOURS * 3600}; SameSite=Strict${secure}`
    : `${COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${secure}`
  res.setHeader?.('Set-Cookie', value)
}

function tooManyLogins(ip: string) {
  const now = Date.now()
  const recent = (loginsByIp.get(ip) || []).filter((at) => now - at < LOGIN_WINDOW_MS)
  if (recent.length >= LOGIN_MAX) {
    loginsByIp.set(ip, recent)
    return true
  }
  recent.push(now)
  loginsByIp.set(ip, recent)
  return false
}

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a)
  const bb = Buffer.from(b)
  if (aa.length !== bb.length) {
    crypto.timingSafeEqual(aa, Buffer.alloc(aa.length))
    return false
  }
  return crypto.timingSafeEqual(aa, bb)
}

function localFilePath() {
  return path.join(process.cwd(), FILE_REL)
}

function emptyFile(): BlogFile {
  return { posts: [] }
}

function normalizePosts(raw: unknown): BlogFile {
  const posts = Array.isArray((raw as BlogFile)?.posts) ? (raw as BlogFile).posts : []
  return {
    posts: posts
      .filter((p) => p && typeof p === 'object')
      .map((p) => ({
        slug: String(p.slug || '').trim(),
        title: String(p.title || '').trim(),
        excerpt: String(p.excerpt || '').trim(),
        date: String(p.date || '').trim(),
        body: String(p.body || ''),
        published: p.published !== false,
      }))
      .filter((p) => p.slug && p.title),
  }
}

function slugify(title: string) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG)
}

function validSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= MAX_SLUG
}

function publicPost(p: BlogPost) {
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    date: p.date,
    body: p.body,
    published: p.published !== false,
  }
}

function sortPosts(posts: BlogPost[]) {
  return [...posts].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || a.title.localeCompare(b.title))
}

async function githubGet(): Promise<{ file: BlogFile; sha: string } | null> {
  const token = env('GITHUB_TOKEN')
  const repo = env('GITHUB_REPO')
  if (!token || !repo) return null
  const branch = env('GITHUB_BRANCH') || 'main'
  const url = `https://api.github.com/repos/${repo}/contents/${FILE_REL}?ref=${encodeURIComponent(branch)}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'youorme-blog-cms',
    },
  })
  if (res.status === 404) return { file: emptyFile(), sha: '' }
  if (!res.ok) throw new Error('read-failed')
  const data = (await res.json()) as { content?: string; encoding?: string; sha?: string }
  const decoded = Buffer.from(data.content || '', 'base64').toString('utf8')
  return { file: normalizePosts(JSON.parse(decoded || '{}')), sha: String(data.sha || '') }
}

async function githubPut(file: BlogFile, sha: string, message: string) {
  const token = env('GITHUB_TOKEN')
  const repo = env('GITHUB_REPO')
  if (!token || !repo) throw new Error('github-unconfigured')
  const branch = env('GITHUB_BRANCH') || 'main'
  const url = `https://api.github.com/repos/${repo}/contents/${FILE_REL}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'youorme-blog-cms',
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(`${JSON.stringify(file, null, 2)}\n`, 'utf8').toString('base64'),
      sha: sha || undefined,
      branch,
    }),
  })
  if (!res.ok) throw new Error('write-failed')
}

function readLocal(): BlogFile {
  try {
    const raw = fs.readFileSync(localFilePath(), 'utf8')
    return normalizePosts(JSON.parse(raw))
  } catch {
    return emptyFile()
  }
}

function writeLocal(file: BlogFile) {
  fs.mkdirSync(path.dirname(localFilePath()), { recursive: true })
  fs.writeFileSync(localFilePath(), `${JSON.stringify(file, null, 2)}\n`, 'utf8')
}

async function loadStore(): Promise<{ file: BlogFile; sha: string; source: 'github' | 'local' }> {
  if (env('GITHUB_TOKEN') && env('GITHUB_REPO')) {
    const remote = await githubGet()
    if (remote) return { file: remote.file, sha: remote.sha, source: 'github' }
  }
  return { file: readLocal(), sha: '', source: 'local' }
}

async function saveStore(file: BlogFile, sha: string, message: string) {
  if (env('GITHUB_TOKEN') && env('GITHUB_REPO')) {
    await githubPut(file, sha, message)
    return
  }
  if (process.env.VERCEL) {
    throw new Error('github-unconfigured')
  }
  writeLocal(file)
}

async function readBody(req: Req): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>
  }
  if (typeof req.body === 'string') {
    return req.body.trim() ? (JSON.parse(req.body) as Record<string, unknown>) : {}
  }
  if (typeof req[Symbol.asyncIterator] === 'function') {
    const chunks: Buffer[] = []
    for await (const chunk of req as AsyncIterable<Buffer | string>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    const raw = Buffer.concat(chunks).toString('utf8')
    return raw.trim() ? (JSON.parse(raw) as Record<string, unknown>) : {}
  }
  return {}
}

function actionOf(req: Req, body: Record<string, unknown>) {
  try {
    const url = new URL(req.url || '/', 'http://localhost')
    return String(url.searchParams.get('action') || body.action || '').trim()
  } catch {
    return String(body.action || '').trim()
  }
}

function cleanPost(input: Record<string, unknown>, fallbackSlug = ''): { ok: true; post: BlogPost } | { ok: false; error: string } {
  const title = String(input.title || '').trim()
  const excerpt = String(input.excerpt || '').trim()
  const body = String(input.body || '').trim()
  const date = String(input.date || '').trim()
  let slug = String(input.slug || fallbackSlug || slugify(title)).trim().toLowerCase()
  slug = slugify(slug)
  if (!title || title.length > MAX_TITLE) return { ok: false, error: 'Title is required (max 200 characters).' }
  if (!excerpt || excerpt.length > MAX_EXCERPT) return { ok: false, error: 'Excerpt is required (max 500 characters).' }
  if (!body || body.length > MAX_BODY) return { ok: false, error: 'Body is required.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: 'Date must be YYYY-MM-DD.' }
  if (!validSlug(slug)) return { ok: false, error: 'Slug can only use lowercase letters, numbers and hyphens.' }
  return {
    ok: true,
    post: {
      slug,
      title,
      excerpt,
      date,
      body,
      published: input.published !== false && input.published !== 'false',
    },
  }
}

export default async function handler(req: Req, res: Res) {
  res.setHeader?.('Cache-Control', 'no-store')
  const method = String(req.method || 'GET').toUpperCase()
  if (method !== 'GET' && method !== 'POST') {
    return json(res, 405, { ok: false, error: 'Method not allowed' })
  }

  let body: Record<string, unknown> = {}
  if (method === 'POST') {
    try {
      body = await readBody(req)
    } catch {
      return json(res, 400, { ok: false, error: 'Invalid JSON' })
    }
  }

  const action = actionOf(req, body) || (method === 'GET' ? 'list' : '')
  const authed = sessionOk(parseCookies(req)[COOKIE] || '')

  try {
    if (action === 'list') {
      const { file } = await loadStore()
      const posts = sortPosts(file.posts.filter((p) => p.published !== false)).map(publicPost)
      return json(res, 200, { ok: true, posts })
    }

    if (action === 'session') {
      return json(res, 200, { ok: true, authed })
    }

    if (action === 'login') {
      if (method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' })
      if (!adminPassword()) return json(res, 503, { ok: false, error: 'Admin password is not configured.' })
      if (tooManyLogins(clientIp(req))) return json(res, 429, { ok: false, error: 'Too many attempts. Try again later.' })
      const password = String(body.password || '')
      if (!safeEqual(password, adminPassword())) {
        return json(res, 401, { ok: false, error: 'Incorrect password.' })
      }
      setSessionCookie(req, res, makeSession())
      return json(res, 200, { ok: true, authed: true })
    }

    if (action === 'logout') {
      if (method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' })
      setSessionCookie(req, res, null)
      return json(res, 200, { ok: true, authed: false })
    }

    if (!authed) {
      return json(res, 401, { ok: false, error: 'Please sign in.' })
    }

    if (action === 'all') {
      const { file } = await loadStore()
      return json(res, 200, { ok: true, posts: sortPosts(file.posts).map(publicPost) })
    }

    if (action === 'save') {
      if (method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' })
      const cleaned = cleanPost(body)
      if (!cleaned.ok) return json(res, 400, { ok: false, error: cleaned.error })
      const { file, sha } = await loadStore()
      const original = String(body.originalSlug || cleaned.post.slug).trim()
      const without = file.posts.filter((p) => p.slug !== original && p.slug !== cleaned.post.slug)
      if (file.posts.some((p) => p.slug === cleaned.post.slug && p.slug !== original)) {
        return json(res, 409, { ok: false, error: 'That slug is already used.' })
      }
      without.push(cleaned.post)
      const next = { posts: sortPosts(without) }
      await saveStore(next, sha, `Publish blog: ${cleaned.post.slug}`)
      return json(res, 200, { ok: true, post: publicPost(cleaned.post), posts: next.posts.map(publicPost) })
    }

    if (action === 'delete') {
      if (method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' })
      const slug = slugify(String(body.slug || ''))
      if (!validSlug(slug)) return json(res, 400, { ok: false, error: 'Missing post slug.' })
      const { file, sha } = await loadStore()
      const next = { posts: file.posts.filter((p) => p.slug !== slug) }
      if (next.posts.length === file.posts.length) {
        return json(res, 404, { ok: false, error: 'Post not found.' })
      }
      await saveStore(next, sha, `Remove blog: ${slug}`)
      return json(res, 200, { ok: true, posts: next.posts.map(publicPost) })
    }

    return json(res, 400, { ok: false, error: 'Unknown action.' })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'unknown'
    if (code === 'github-unconfigured') {
      return json(res, 503, {
        ok: false,
        error: 'Publishing is not configured. Set GITHUB_TOKEN and GITHUB_REPO, or save locally in development.',
      })
    }
    console.error('blog-api:', code)
    return json(res, 500, { ok: false, error: 'Could not update blog posts.' })
  }
}

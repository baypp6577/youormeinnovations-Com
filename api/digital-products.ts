import crypto from 'crypto'
import { put, get, del } from '@vercel/blob'

const COOKIE = 'yom_dp_sess'
const CATALOG_PATH = 'digital-products/catalog.json'
const SESSION_HOURS = 12
const LOGIN_MAX = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const MAX_PDF_BYTES = 4 * 1024 * 1024
const loginsByIp = new Map<string, number[]>()

export type DigitalProduct = {
  id: string
  name: string
  price: string
  tagline: string
  description: string
  cta: string
  paymentUrl: string
  blobPathname: string | null
  fileName: string | null
  updatedAt: string
}

type Catalog = { products: DigitalProduct[] }

type Req = {
  method?: string
  url?: string
  body?: unknown
  headers?: Record<string, string | string[] | undefined>
  query?: Record<string, string | string[] | undefined>
  [Symbol.asyncIterator]?: () => AsyncIterableIterator<Buffer | string>
}

type Res = {
  status?: (code: number) => { json: (body: unknown) => unknown; end?: (chunk?: unknown) => unknown }
  statusCode?: number
  setHeader?: (name: string, value: string | string[]) => void
  end?: (chunk?: string | Buffer) => void
  json?: (body: unknown) => unknown
}

function env(name: string): string {
  return String(process.env[name] || '').trim()
}

function adminPassword(): string {
  return env('DIGITAL_PRODUCTS_ADMIN_PASSWORD') || env('BLOG_ADMIN_PASSWORD')
}

function adminSecret(): string {
  return env('DIGITAL_PRODUCTS_ADMIN_SECRET') || env('BLOG_ADMIN_SECRET') || adminPassword()
}

function blobToken(): string {
  return env('BLOB_READ_WRITE_TOKEN')
}

function stripeSecret(): string {
  return env('STRIPE_SECRET_KEY') || env('YOUORME_STRIPE_SECRET_KEY')
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

function queryOf(req: Req): Record<string, string> {
  const out: Record<string, string> = {}
  if (req.query) {
    for (const [k, v] of Object.entries(req.query)) {
      out[k] = Array.isArray(v) ? String(v[0] || '') : String(v || '')
    }
  }
  try {
    const u = new URL(req.url || '', 'http://localhost')
    u.searchParams.forEach((v, k) => {
      out[k] = v
    })
  } catch {
    /* ignore */
  }
  return out
}

function defaultCatalog(): Catalog {
  const now = new Date().toISOString()
  const seed: Array<Omit<DigitalProduct, 'updatedAt' | 'blobPathname' | 'fileName'>> = [
    {
      id: 'product-1',
      name: 'Product 1',
      price: 'See Stripe',
      tagline: 'Starter download',
      description: 'Digital download — update title and price in Digital Products admin.',
      cta: 'Get Product 1',
      paymentUrl: 'https://buy.stripe.com/aFa9AT48K1Jif2F3gq2sM03',
    },
    {
      id: 'product-2',
      name: 'Product 2',
      price: 'See Stripe',
      tagline: 'Next level',
      description: 'Digital download — update title and price in Digital Products admin.',
      cta: 'Upgrade to Product 2',
      paymentUrl: 'https://buy.stripe.com/fZuaEXeNoew45s5bMW2sM04',
    },
    {
      id: 'product-3',
      name: 'Product 3',
      price: 'See Stripe',
      tagline: 'Higher tier',
      description: 'Digital download — update title and price in Digital Products admin.',
      cta: 'Upgrade to Product 3',
      paymentUrl: 'https://buy.stripe.com/fZu14n9t45Zy8Eh04e2sM05',
    },
    {
      id: 'product-4',
      name: 'Product 4',
      price: 'See Stripe',
      tagline: 'Top tier',
      description: 'Digital download — update title and price in Digital Products admin.',
      cta: 'Upgrade to Product 4',
      paymentUrl: 'https://buy.stripe.com/4gMbJ18p09bK1bP9EO2sM06',
    },
  ]
  return {
    products: seed.map((p) => ({
      ...p,
      blobPathname: null,
      fileName: null,
      updatedAt: now,
    })),
  }
}

function normalizeCatalog(raw: unknown): Catalog {
  const products = Array.isArray((raw as Catalog)?.products) ? (raw as Catalog).products : []
  const mapped = products
    .filter((p) => p && typeof p === 'object')
    .map((p) => ({
      id: String(p.id || '').trim(),
      name: String(p.name || '').trim(),
      price: String(p.price || '').trim(),
      tagline: String(p.tagline || '').trim(),
      description: String(p.description || '').trim(),
      cta: String(p.cta || 'Buy now').trim() || 'Buy now',
      paymentUrl: String(p.paymentUrl || '').trim(),
      blobPathname: p.blobPathname ? String(p.blobPathname) : null,
      fileName: p.fileName ? String(p.fileName) : null,
      updatedAt: String(p.updatedAt || new Date().toISOString()),
    }))
    .filter((p) => /^product-[1-4]$/.test(p.id))

  if (mapped.length === 0) return defaultCatalog()

  const byId = new Map(mapped.map((p) => [p.id, p]))
  const base = defaultCatalog().products
  return {
    products: base.map((seed) => byId.get(seed.id) || seed),
  }
}

function publicProduct(p: DigitalProduct) {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    tagline: p.tagline,
    description: p.description,
    cta: p.cta,
    paymentUrl: p.paymentUrl,
    hasPdf: Boolean(p.blobPathname),
  }
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const ab = await new Response(stream).arrayBuffer()
  return Buffer.from(ab)
}

async function readCatalog(): Promise<Catalog> {
  const token = blobToken()
  if (!token) return defaultCatalog()
  try {
    const result = await get(CATALOG_PATH, { access: 'private', token, useCache: false })
    if (!result || result.statusCode !== 200 || !result.stream) return defaultCatalog()
    const text = (await streamToBuffer(result.stream)).toString('utf8')
    return normalizeCatalog(JSON.parse(text || '{}'))
  } catch {
    return defaultCatalog()
  }
}

async function writeCatalog(catalog: Catalog) {
  const token = blobToken()
  if (!token) throw new Error('blob-unconfigured')
  await put(CATALOG_PATH, JSON.stringify(normalizeCatalog(catalog), null, 2), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    token,
  })
}

async function readBodyBuffer(req: Req): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) return req.body
  if (typeof req.body === 'string') return Buffer.from(req.body)
  if (req.body && typeof req.body === 'object' && 'type' in (req.body as object)) {
    /* unlikely */
  }
  if (typeof req[Symbol.asyncIterator] === 'function') {
    const chunks: Buffer[] = []
    for await (const chunk of req as AsyncIterable<Buffer | string>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
  }
  return Buffer.alloc(0)
}

async function parseJsonBody(req: Req): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>
  }
  const buf = await readBodyBuffer(req)
  if (!buf.length) return {}
  try {
    return JSON.parse(buf.toString('utf8')) as Record<string, unknown>
  } catch {
    return {}
  }
}

function isAuthed(req: Req) {
  return sessionOk(parseCookies(req)[COOKIE] || '')
}

async function verifyStripeSession(sessionId: string, productId: string): Promise<{ ok: boolean; error?: string }> {
  const secret = stripeSecret()
  if (!secret) {
    return { ok: false, error: 'Download verification is not configured yet (Stripe secret).' }
  }
  const id = String(sessionId || '').trim()
  if (!/^cs_[a-zA-Z0-9_]+$/.test(id)) {
    return { ok: false, error: 'Invalid checkout session.' }
  }
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  })
  if (!res.ok) {
    return { ok: false, error: 'Could not verify payment with Stripe.' }
  }
  const session = (await res.json()) as {
    payment_status?: string
    status?: string
    metadata?: Record<string, string>
    amount_total?: number
  }
  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    return { ok: false, error: 'Payment not completed.' }
  }
  const metaProduct = String(session.metadata?.productId || session.metadata?.product || '').trim()
  if (metaProduct && metaProduct !== productId && `product-${metaProduct}` !== productId) {
    return { ok: false, error: 'Payment does not match this product.' }
  }
  return { ok: true }
}

async function streamPdf(res: Res, pathname: string, fileName: string | null) {
  const token = blobToken()
  if (!token) {
    return json(res, 503, { ok: false, error: 'Blob storage is not configured.' })
  }
  const result = await get(pathname, { access: 'private', token, useCache: false })
  if (!result || result.statusCode !== 200 || !result.stream) {
    return json(res, 404, { ok: false, error: 'PDF not found.' })
  }
  const safeName = (fileName || 'download.pdf').replace(/[^\w.\-()+ ]+/g, '_')
  const buf = await streamToBuffer(result.stream)
  res.statusCode = 200
  res.setHeader?.('Content-Type', 'application/pdf')
  res.setHeader?.('Content-Disposition', `attachment; filename="${safeName}"`)
  res.setHeader?.('Cache-Control', 'no-store')
  if (typeof res.status === 'function') {
    const r = res.status(200) as { end?: (c?: unknown) => unknown }
    res.setHeader?.('Content-Type', 'application/pdf')
    res.setHeader?.('Content-Disposition', `attachment; filename="${safeName}"`)
    return r.end?.(buf)
  }
  res.end?.(buf)
}

export default async function handler(req: Req, res: Res) {
  const method = (req.method || 'GET').toUpperCase()
  const q = queryOf(req)
  let action = String(q.action || '').trim()
  let body: Record<string, unknown> = {}

  if (method === 'POST' || method === 'PUT') {
    const ct = header(req, 'content-type').toLowerCase()
    if (ct.includes('application/pdf') || ct.includes('application/octet-stream')) {
      action = action || 'upload'
    } else {
      body = await parseJsonBody(req)
      if (!action) action = String(body.action || '').trim()
    }
  }

  if (!action) return json(res, 400, { ok: false, error: 'Missing action' })

  if (action === 'session') {
    if (method !== 'GET') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
    return json(res, 200, {
      ok: true,
      authed: isAuthed(req),
      blobConfigured: Boolean(blobToken()),
      stripeConfigured: Boolean(stripeSecret()),
    })
  }

  if (action === 'login') {
    if (method !== 'POST') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
    const password = String(body.password || '')
    const expected = adminPassword()
    if (!expected) return json(res, 503, { ok: false, error: 'Admin password is not configured.' })
    const ip = clientIp(req)
    if (tooManyLogins(ip)) return json(res, 429, { ok: false, error: 'Too many attempts. Try again later.' })
    if (!safeEqual(password, expected)) return json(res, 401, { ok: false, error: 'Incorrect password.' })
    setSessionCookie(req, res, makeSession())
    return json(res, 200, { ok: true, authed: true })
  }

  if (action === 'logout') {
    if (method !== 'POST') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
    setSessionCookie(req, res, null)
    return json(res, 200, { ok: true, authed: false })
  }

  if (action === 'public-list') {
    if (method !== 'GET') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
    const catalog = await readCatalog()
    return json(res, 200, { ok: true, products: catalog.products.map(publicProduct) })
  }

  if (action === 'download') {
    if (method !== 'GET') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
    const productId = String(q.product || '').trim()
    if (!/^product-[1-4]$/.test(productId)) {
      return json(res, 400, { ok: false, error: 'Invalid product.' })
    }
    const catalog = await readCatalog()
    const product = catalog.products.find((p) => p.id === productId)
    if (!product?.blobPathname) {
      return json(res, 404, { ok: false, error: 'No PDF uploaded for this product yet.' })
    }

    if (isAuthed(req) && q.preview === '1') {
      return streamPdf(res, product.blobPathname, product.fileName)
    }

    const sessionId = String(q.session_id || q.sessionId || '').trim()
    const verified = await verifyStripeSession(sessionId, productId)
    if (!verified.ok) {
      return json(res, 403, { ok: false, error: verified.error || 'Not authorised.' })
    }
    return streamPdf(res, product.blobPathname, product.fileName)
  }

  if (!isAuthed(req)) {
    return json(res, 401, { ok: false, error: 'Sign in required.' })
  }

  if (action === 'list') {
    if (method !== 'GET') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
    const catalog = await readCatalog()
    return json(res, 200, {
      ok: true,
      products: catalog.products,
      blobConfigured: Boolean(blobToken()),
      stripeConfigured: Boolean(stripeSecret()),
    })
  }

  if (action === 'save') {
    if (method !== 'POST') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
    const id = String(body.id || '').trim()
    if (!/^product-[1-4]$/.test(id)) return json(res, 400, { ok: false, error: 'Invalid product id.' })
    const catalog = await readCatalog()
    const idx = catalog.products.findIndex((p) => p.id === id)
    if (idx < 0) return json(res, 404, { ok: false, error: 'Product not found.' })
    const prev = catalog.products[idx]
    catalog.products[idx] = {
      ...prev,
      name: String(body.name || prev.name).trim().slice(0, 120) || prev.name,
      price: String(body.price || prev.price).trim().slice(0, 40) || prev.price,
      tagline: String(body.tagline || prev.tagline).trim().slice(0, 120),
      description: String(body.description || prev.description).trim().slice(0, 800),
      cta: String(body.cta || prev.cta).trim().slice(0, 60) || prev.cta,
      paymentUrl: String(body.paymentUrl || prev.paymentUrl).trim().slice(0, 300) || prev.paymentUrl,
      updatedAt: new Date().toISOString(),
    }
    try {
      await writeCatalog(catalog)
    } catch {
      return json(res, 503, { ok: false, error: 'Could not save catalog (check BLOB_READ_WRITE_TOKEN).' })
    }
    return json(res, 200, { ok: true, product: catalog.products[idx] })
  }

  if (action === 'upload') {
    if (method !== 'POST' && method !== 'PUT') {
      return json(res, 405, { ok: false, error: 'Method Not Allowed' })
    }
    if (!blobToken()) {
      return json(res, 503, { ok: false, error: 'BLOB_READ_WRITE_TOKEN is not set on this environment.' })
    }
    const productId = String(q.productId || body.productId || '').trim()
    if (!/^product-[1-4]$/.test(productId)) {
      return json(res, 400, { ok: false, error: 'Invalid productId.' })
    }

    let buf: Buffer
    const b64 = String(body.pdfBase64 || '').trim()
    if (b64) {
      const cleaned = b64.replace(/^data:application\/pdf;base64,/i, '')
      try {
        buf = Buffer.from(cleaned, 'base64')
      } catch {
        return json(res, 400, { ok: false, error: 'Invalid PDF data.' })
      }
    } else {
      const ct = header(req, 'content-type').toLowerCase()
      if (!ct.includes('pdf') && !ct.includes('octet-stream') && !ct.includes('json')) {
        return json(res, 400, { ok: false, error: 'Upload a PDF.' })
      }
      buf = await readBodyBuffer(req)
    }

    if (!buf.length) return json(res, 400, { ok: false, error: 'Empty file.' })
    if (buf.length > MAX_PDF_BYTES) {
      return json(res, 400, { ok: false, error: 'PDF must be under 4MB for upload (Vercel request limit).' })
    }
    if (buf.subarray(0, 4).toString('utf8') !== '%PDF') {
      return json(res, 400, { ok: false, error: 'File does not look like a PDF.' })
    }

    const fileName = String(q.fileName || body.fileName || `${productId}.pdf`)
      .replace(/[^\w.\-()+ ]+/g, '_')
      .slice(0, 120)
    const pathname = `digital-products/pdfs/${productId}.pdf`
    const catalog = await readCatalog()
    const idx = catalog.products.findIndex((p) => p.id === productId)
    if (idx < 0) return json(res, 404, { ok: false, error: 'Product not found.' })

    const prevPath = catalog.products[idx].blobPathname
    await put(pathname, buf, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/pdf',
      token: blobToken(),
    })

    if (prevPath && prevPath !== pathname) {
      try {
        await del(prevPath, { token: blobToken() })
      } catch {
        /* ignore */
      }
    }

    catalog.products[idx] = {
      ...catalog.products[idx],
      blobPathname: pathname,
      fileName: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
      updatedAt: new Date().toISOString(),
    }
    await writeCatalog(catalog)
    return json(res, 200, { ok: true, product: catalog.products[idx] })
  }

  if (action === 'clear-pdf') {
    if (method !== 'POST') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
    const id = String(body.id || '').trim()
    if (!/^product-[1-4]$/.test(id)) return json(res, 400, { ok: false, error: 'Invalid product id.' })
    const catalog = await readCatalog()
    const idx = catalog.products.findIndex((p) => p.id === id)
    if (idx < 0) return json(res, 404, { ok: false, error: 'Product not found.' })
    const prev = catalog.products[idx].blobPathname
    if (prev) {
      try {
        await del(prev, { token: blobToken() })
      } catch {
        /* ignore */
      }
    }
    catalog.products[idx] = {
      ...catalog.products[idx],
      blobPathname: null,
      fileName: null,
      updatedAt: new Date().toISOString(),
    }
    await writeCatalog(catalog)
    return json(res, 200, { ok: true, product: catalog.products[idx] })
  }

  return json(res, 400, { ok: false, error: 'Unknown action' })
}

import crypto from 'crypto'
import { put, get, del } from '@vercel/blob'

const COOKIE = 'yom_dp_sess'
const CATALOG_PATH = 'digital-products/catalog.json'
const SESSION_HOURS = 12
const LOGIN_MAX = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const FREE_DL_MAX = 30
const FREE_DL_WINDOW_MS = 15 * 60 * 1000
const MAX_PDF_BYTES = 4 * 1024 * 1024
const loginsByIp = new Map<string, number[]>()
const freeDownloadsByIp = new Map<string, number[]>()

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

type StripeMode = 'test' | 'live' | 'unknown'

const STRIPE_SECRET_ENV_KEYS = [
  'STRIPE_SECRET_KEY',
  'YOUORME_STRIPE_SECRET_KEY',
  'STRIPE_SECRET_KEY_TEST',
  'YOUORME_STRIPE_SECRET_KEY_TEST',
] as const

function checkoutSessionMode(sessionId: string): StripeMode {
  const id = String(sessionId || '').trim()
  if (id.startsWith('cs_test_')) return 'test'
  if (id.startsWith('cs_live_')) return 'live'
  return 'unknown'
}

function stripeSecretMode(secret: string): StripeMode {
  if (secret.startsWith('sk_test_') || secret.startsWith('rk_test_')) return 'test'
  if (secret.startsWith('sk_live_') || secret.startsWith('rk_live_')) return 'live'
  return 'unknown'
}

function stripeSecretsList(): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const name of STRIPE_SECRET_ENV_KEYS) {
    const value = env(name)
    if (!value || seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out
}

function secretsForSession(
  sessionId: string,
  secrets: string[],
): { mode: StripeMode; secrets: string[]; error: string | null } {
  const mode = checkoutSessionMode(sessionId)
  if (!secrets.length) {
    return { mode, secrets: [], error: 'Download verification is not configured yet (Stripe secret).' }
  }
  const matching = secrets.filter((secret) => {
    const keyMode = stripeSecretMode(secret)
    return keyMode === mode || keyMode === 'unknown'
  })
  if (mode === 'test' && matching.length === 0) {
    return {
      mode,
      secrets: [],
      error:
        'This is a Stripe test checkout, but the site has no test-mode secret. Add STRIPE_SECRET_KEY_TEST (sk_test_...) on Vercel, then retry the thank-you page.',
    }
  }
  if (mode === 'live' && matching.length === 0) {
    return {
      mode,
      secrets: [],
      error: 'This is a live Stripe checkout, but the site has no live secret. Add STRIPE_SECRET_KEY (sk_live_...) on Vercel.',
    }
  }
  return { mode, secrets: matching.length ? matching : secrets, error: null }
}

function stripeSecret(): string {
  const secrets = stripeSecretsList()
  const forceTest = ['1', 'true', 'yes'].includes(env('YOUORME_STRIPE_TEST_MODE').toLowerCase())
  if (forceTest) {
    return secrets.find((secret) => stripeSecretMode(secret) === 'test') || secrets[0] || ''
  }
  return (
    secrets.find((secret) => stripeSecretMode(secret) === 'live') ||
    secrets.find((secret) => stripeSecretMode(secret) === 'test') ||
    secrets[0] ||
    ''
  )
}

function stripeStatus() {
  const secrets = stripeSecretsList()
  return {
    stripeConfigured: secrets.length > 0,
    stripeTestConfigured: secrets.some((secret) => stripeSecretMode(secret) === 'test'),
    stripeLiveConfigured: secrets.some((secret) => stripeSecretMode(secret) === 'live'),
  }
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

function tooManyFreeDownloads(ip: string) {
  const now = Date.now()
  const recent = (freeDownloadsByIp.get(ip) || []).filter((at) => now - at < FREE_DL_WINDOW_MS)
  if (recent.length >= FREE_DL_MAX) {
    freeDownloadsByIp.set(ip, recent)
    return true
  }
  recent.push(now)
  freeDownloadsByIp.set(ip, recent)
  return false
}

function isFreeProduct(product: DigitalProduct): boolean {
  return parsePricePence(product.price) === 0
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
      paymentUrl: 'https://buy.stripe.com/4gM5kD48K1JicUx7wG2sM07',
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
    products: base.map((seed) => {
      const row = byId.get(seed.id) || seed
      // Retire broken FREE Payment Link so live lead-capture link is used.
      if (row.id === 'product-1' && row.paymentUrl.includes('aFa9AT48K1Jif2F3gq2sM03')) {
        return { ...row, paymentUrl: seed.paymentUrl }
      }
      return row
    }),
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

function normalizeProductId(raw: string): string {
  const value = String(raw || '')
    .trim()
    .toLowerCase()
  if (!value) return ''
  const match = value.match(/^(?:product-?)?([1-4])$/)
  if (match) return `product-${match[1]}`
  return value
}

function normalizeBuyUrl(url: string): string {
  return String(url || '')
    .trim()
    .replace(/\/$/, '')
    .toLowerCase()
}

function parsePricePence(price: string): number | null {
  const raw = String(price || '').trim().toLowerCase().replace(/,/g, '')
  if (!raw) return null
  if (raw === 'free' || raw === '£0' || raw === '£0.00' || raw === '0' || raw === '0.00') return 0
  const m = raw.match(/(\d+(?:\.\d{1,2})?)/)
  if (!m) return null
  return Math.round(Number(m[1]) * 100)
}

function thankYouUrl(productId: string): string {
  return `https://youormeinnovations.com/thank-you?session_id={CHECKOUT_SESSION_ID}&product=${encodeURIComponent(productId)}`
}

const THANK_YOU_SUCCESS =
  'https://youormeinnovations.com/thank-you?session_id={CHECKOUT_SESSION_ID}'
const CHECKOUT_CANCEL = 'https://youormeinnovations.com/'

async function stripeGetRaw<T>(
  path: string,
  secret: string,
): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${secret}` },
  })
  if (!res.ok) return { ok: false, status: res.status }
  return { ok: true, data: (await res.json()) as T }
}

async function stripeGet<T>(path: string, secret: string): Promise<T | null> {
  const result = await stripeGetRaw<T>(path, secret)
  return result.ok ? result.data : null
}

async function stripeForm<T>(
  path: string,
  secret: string,
  params: URLSearchParams,
  method: 'POST' | 'GET' = 'POST',
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: method === 'POST' ? params.toString() : undefined,
  })
  const data = (await res.json().catch(() => null)) as T & { error?: { message?: string } }
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: String(data?.error?.message || `Stripe ${res.status}`),
    }
  }
  return { ok: true, data }
}

type StripePaymentLink = {
  id: string
  url?: string
  active?: boolean
  metadata?: Record<string, string>
  line_items?: { data?: Array<{ price?: { id?: string } | string; quantity?: number }> }
}

async function listPaymentLinks(secret: string): Promise<StripePaymentLink[]> {
  const out: StripePaymentLink[] = []
  let startingAfter = ''
  for (let page = 0; page < 10; page++) {
    const q = new URLSearchParams({ limit: '100', active: 'true' })
    if (startingAfter) q.set('starting_after', startingAfter)
    const batch = await stripeGet<{ data?: StripePaymentLink[]; has_more?: boolean }>(
      `payment_links?${q.toString()}`,
      secret,
    )
    const rows = batch?.data || []
    out.push(...rows)
    if (!batch?.has_more || !rows.length) break
    startingAfter = rows[rows.length - 1]?.id || ''
    if (!startingAfter) break
  }
  return out
}

async function findPaymentLinkByBuyUrl(
  secret: string,
  buyUrl: string,
): Promise<StripePaymentLink | null> {
  const want = normalizeBuyUrl(buyUrl)
  if (!want) return null
  const links = await listPaymentLinks(secret)
  return links.find((l) => normalizeBuyUrl(String(l.url || '')) === want) || null
}

async function paymentLinkPriceIds(
  secret: string,
  paymentLinkId: string,
): Promise<Array<{ price: string; quantity: number }>> {
  const link = await stripeGet<StripePaymentLink>(
    `payment_links/${encodeURIComponent(paymentLinkId)}?expand[]=line_items.data.price`,
    secret,
  )
  const rows = link?.line_items?.data || []
  const items: Array<{ price: string; quantity: number }> = []
  for (const row of rows) {
    const priceId =
      typeof row.price === 'string' ? row.price : String(row.price?.id || '').trim()
    if (!priceId) continue
    items.push({ price: priceId, quantity: Math.max(1, Number(row.quantity) || 1) })
  }
  return items
}

/** Front-style: create Checkout Session in code with success_url (no Dashboard After payment needed). */
async function createCheckoutSessionForProduct(
  product: DigitalProduct,
): Promise<{ ok: true; url: string; sessionId: string } | { ok: false; error: string }> {
  const secret = stripeSecret()
  if (!secret) return { ok: false, error: 'Stripe secret is not configured.' }

  const free = isFreeProduct(product)
  const params = new URLSearchParams()
  params.set('mode', 'payment')
  params.set('success_url', thankYouUrl(product.id))
  params.set('cancel_url', CHECKOUT_CANCEL)
  params.set('metadata[productId]', product.id)
  // Lead capture: name + billing address (customer asked for FREE leads this way).
  params.set('billing_address_collection', 'required')
  params.set('customer_creation', 'if_required')
  // Do not set payment_method_collection — Stripe only allows that for recurring/subscription prices.

  let usedPaymentLink = false
  if (product.paymentUrl) {
    const plink = await findPaymentLinkByBuyUrl(secret, product.paymentUrl)
    if (plink?.id) {
      const lineItems = await paymentLinkPriceIds(secret, plink.id)
      if (lineItems.length) {
        usedPaymentLink = true
        if (!free) {
          params.set('payment_intent_data[metadata][productId]', product.id)
        }
        lineItems.forEach((item, i) => {
          params.set(`line_items[${i}][price]`, item.price)
          params.set(`line_items[${i}][quantity]`, String(item.quantity))
        })
      }
    }
  }

  if (!usedPaymentLink) {
    if (!free) {
      return {
        ok: false,
        error: 'Could not find that buy.stripe.com Payment Link in Stripe. Check the URL in admin.',
      }
    }
    // FREE fallback: £0 line item so checkout still collects name + address as a lead.
    params.set('line_items[0][price_data][currency]', 'gbp')
    params.set('line_items[0][price_data][unit_amount]', '0')
    params.set(
      'line_items[0][price_data][product_data][name]',
      product.name.slice(0, 120) || 'Free download',
    )
    params.set('line_items[0][quantity]', '1')
  }

  const created = await stripeForm<{ id?: string; url?: string }>(
    'checkout/sessions',
    secret,
    params,
  )
  if (!created.ok) return { ok: false, error: created.error }
  const url = String(created.data.url || '').trim()
  const sessionId = String(created.data.id || '').trim()
  if (!url || !sessionId) return { ok: false, error: 'Stripe did not return a checkout URL.' }
  return { ok: true, url, sessionId }
}

/** Point existing Payment Links at thank-you (so direct buy.stripe.com clicks also land correctly). */
async function syncPaymentLinkRedirect(
  secret: string,
  product: DigitalProduct,
): Promise<{ ok: true; paymentLinkId: string } | { ok: false; error: string }> {
  const plink = await findPaymentLinkByBuyUrl(secret, product.paymentUrl)
  if (!plink?.id) return { ok: false, error: `No Payment Link for ${product.id}` }
  const params = new URLSearchParams()
  params.set('after_completion[type]', 'redirect')
  params.set('after_completion[redirect][url]', thankYouUrl(product.id))
  params.set('metadata[productId]', product.id)
  const updated = await stripeForm<{ id?: string }>(
    `payment_links/${encodeURIComponent(plink.id)}`,
    secret,
    params,
  )
  if (!updated.ok) return { ok: false, error: updated.error }
  return { ok: true, paymentLinkId: plink.id }
}

/** Resolve which ladder product a paid Checkout Session belongs to (metadata, Payment Link URL, or amount). */
async function resolvePaidProductFromSession(
  sessionId: string,
  catalog: Catalog,
  claimedProductId = '',
): Promise<{ ok: true; productId: string } | { ok: false; error: string }> {
  const id = String(sessionId || '').trim()
  if (!/^cs_[a-zA-Z0-9_]+$/.test(id)) {
    return { ok: false, error: 'Invalid checkout session.' }
  }

  const picked = secretsForSession(id, stripeSecretsList())
  if (!picked.secrets.length) {
    return { ok: false, error: picked.error || 'Stripe secret is not configured.' }
  }

  type StripeSession = {
    payment_status?: string
    status?: string
    metadata?: Record<string, string>
    amount_total?: number
    payment_link?: string | { id?: string; url?: string; metadata?: Record<string, string> } | null
    line_items?: {
      data?: Array<{
        amount_total?: number
        price?: { id?: string; unit_amount?: number | null } | string
      }>
    }
  }

  let session: StripeSession | null = null
  let secretUsed = ''
  let lastStatus = 0
  for (const secret of picked.secrets) {
    const got = await stripeGetRaw<StripeSession>(
      `checkout/sessions/${encodeURIComponent(id)}?expand[]=line_items`,
      secret,
    )
    if (got.ok) {
      session = got.data
      secretUsed = secret
      break
    }
    lastStatus = got.status
  }

  if (!session || !secretUsed) {
    if (picked.error) return { ok: false, error: picked.error }
    if (lastStatus === 401 || lastStatus === 403) {
      return { ok: false, error: 'Stripe key cannot read Checkout Sessions. Check the secret on Vercel.' }
    }
    if (picked.mode === 'test') {
      return {
        ok: false,
        error:
          'Could not find this test checkout in Stripe. Use the test-mode secret (sk_test_...) for the same Stripe account.',
      }
    }
    return { ok: false, error: 'Could not verify payment with Stripe.' }
  }

  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    return { ok: false, error: 'Payment not completed.' }
  }

  const claimed = normalizeProductId(claimedProductId)
  const inCatalog = (productId: string) => catalog.products.some((p) => p.id === productId)

  const metaRaw = String(session.metadata?.productId || session.metadata?.product || '').trim()
  const fromMeta = normalizeProductId(metaRaw)
  if (fromMeta && inCatalog(fromMeta)) {
    return { ok: true, productId: fromMeta }
  }

  const paymentLinkRef = session.payment_link
  const paymentLinkId =
    typeof paymentLinkRef === 'string'
      ? paymentLinkRef.trim()
      : String(paymentLinkRef?.id || '').trim()
  if (paymentLinkId) {
    const link = await stripeGet<{ url?: string; metadata?: Record<string, string> }>(
      `payment_links/${encodeURIComponent(paymentLinkId)}`,
      secretUsed,
    )
    if (link) {
      const linkMeta = normalizeProductId(String(link.metadata?.productId || link.metadata?.product || ''))
      if (linkMeta && inCatalog(linkMeta)) {
        return { ok: true, productId: linkMeta }
      }
      const buyUrl = normalizeBuyUrl(String(link.url || ''))
      if (buyUrl) {
        const byUrl = catalog.products.find((p) => normalizeBuyUrl(p.paymentUrl) === buyUrl)
        if (byUrl) return { ok: true, productId: byUrl.id }
      }
    }
  }

  const line = session.line_items?.data?.[0]
  const linePrice = line?.price && typeof line.price === 'object' ? line.price : null
  const unitAmount = typeof linePrice?.unit_amount === 'number' ? linePrice.unit_amount : null
  if (unitAmount != null) {
    const byUnit = catalog.products.filter((p) => parsePricePence(p.price) === unitAmount)
    if (byUnit.length === 1) return { ok: true, productId: byUnit[0].id }
  }

  const amount = typeof session.amount_total === 'number' ? session.amount_total : unitAmount
  if (amount != null) {
    const byAmount = catalog.products.filter((p) => parsePricePence(p.price) === amount)
    if (byAmount.length === 1) return { ok: true, productId: byAmount[0].id }
  }

  if (claimed && inCatalog(claimed)) {
    const claimedPence = parsePricePence(catalog.products.find((p) => p.id === claimed)?.price || '')
    if (claimedPence != null && (unitAmount === claimedPence || amount === claimedPence)) {
      return { ok: true, productId: claimed }
    }
    if (claimedPence === 0 && (unitAmount == null || unitAmount === 0) && (amount == null || amount === 0)) {
      return { ok: true, productId: claimed }
    }
  }

  const freeProducts = catalog.products.filter((p) => parsePricePence(p.price) === 0)
  if (freeProducts.length === 1 && (amount === 0 || unitAmount === 0)) {
    return { ok: true, productId: freeProducts[0].id }
  }

  return {
    ok: false,
    error: 'Could not match this payment to a product. Check Payment Link URLs in Digital Products admin.',
  }
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
  try {
    return await handleDigitalProducts(req, res)
  } catch (err) {
    console.error('digital-products', err instanceof Error ? err.message : err)
    return json(res, 500, { ok: false, error: 'Digital products service failed.' })
  }
}

async function handleDigitalProducts(req: Req, res: Res) {
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
      ...stripeStatus(),
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

  if (action === 'resolve-session') {
    if (method !== 'GET') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
    const sessionId = String(q.session_id || q.sessionId || q.checkout_session_id || '').trim()
    const catalog = await readCatalog()
    const claimed = normalizeProductId(String(q.product || '').trim())
    const resolved = await resolvePaidProductFromSession(sessionId, catalog, claimed)
    if (!resolved.ok) {
      return json(res, 403, { ok: false, error: resolved.error })
    }
    const product = catalog.products.find((p) => p.id === resolved.productId)
    return json(res, 200, {
      ok: true,
      productId: resolved.productId,
      hasPdf: Boolean(product?.blobPathname),
      product: product ? publicProduct(product) : null,
    })
  }

  if (action === 'download') {
    if (method !== 'GET') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
    const catalog = await readCatalog()
    const claimed = normalizeProductId(String(q.product || '').trim())
    const freeFlag = q.free === '1' || q.free === 'true'

    if (isAuthed(req) && q.preview === '1') {
      if (!/^product-[1-4]$/.test(claimed)) {
        return json(res, 400, { ok: false, error: 'Invalid product.' })
      }
      const previewProduct = catalog.products.find((p) => p.id === claimed)
      if (!previewProduct?.blobPathname) {
        return json(res, 404, { ok: false, error: 'No PDF uploaded for this product yet.' })
      }
      return streamPdf(res, previewProduct.blobPathname, previewProduct.fileName)
    }

    // FREE products: no Stripe — only when catalogue price is FREE/£0.
    if (freeFlag) {
      if (!/^product-[1-4]$/.test(claimed)) {
        return json(res, 400, { ok: false, error: 'Invalid product.' })
      }
      const freeProduct = catalog.products.find((p) => p.id === claimed)
      if (!freeProduct || !isFreeProduct(freeProduct)) {
        return json(res, 403, { ok: false, error: 'This product is not free.' })
      }
      if (!freeProduct.blobPathname) {
        return json(res, 404, { ok: false, error: 'No PDF uploaded for this product yet.' })
      }
      const ip = clientIp(req)
      if (tooManyFreeDownloads(ip)) {
        return json(res, 429, { ok: false, error: 'Too many free downloads. Try again later.' })
      }
      return streamPdf(res, freeProduct.blobPathname, freeProduct.fileName)
    }

    const sessionId = String(q.session_id || q.sessionId || q.checkout_session_id || '').trim()
    const resolved = await resolvePaidProductFromSession(sessionId, catalog, claimed)
    if (!resolved.ok) {
      return json(res, 403, { ok: false, error: resolved.error || 'Not authorised.' })
    }
    if (claimed && claimed !== resolved.productId) {
      return json(res, 403, { ok: false, error: 'Payment does not match this product.' })
    }
    const productId = resolved.productId
    const product = catalog.products.find((p) => p.id === productId)
    if (!product?.blobPathname) {
      return json(res, 404, { ok: false, error: 'No PDF uploaded for this product yet.' })
    }
    return streamPdf(res, product.blobPathname, product.fileName)
  }

  /** Same pattern as front.hometolive.com: success_url set in code, not Stripe Dashboard. */
  if (action === 'create-checkout') {
    if (method !== 'POST') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
    const productId = normalizeProductId(String(body.productId || body.product || q.product || ''))
    if (!/^product-[1-4]$/.test(productId)) {
      return json(res, 400, { ok: false, error: 'Invalid productId.' })
    }
    const catalog = await readCatalog()
    const product = catalog.products.find((p) => p.id === productId)
    if (!product) return json(res, 404, { ok: false, error: 'Product not found.' })
    const created = await createCheckoutSessionForProduct(product)
    if (!created.ok) return json(res, 502, { ok: false, error: created.error })
    return json(res, 200, { ok: true, url: created.url, sessionId: created.sessionId })
  }

  if (!isAuthed(req)) {
    return json(res, 401, { ok: false, error: 'Sign in required.' })
  }

  if (action === 'sync-redirects') {
    if (method !== 'POST') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
    const secrets = stripeSecretsList()
    if (!secrets.length) return json(res, 503, { ok: false, error: 'Stripe secret is not configured.' })
    const catalog = await readCatalog()
    const results: Array<{ id: string; ok: boolean; paymentLinkId?: string; error?: string }> = []
    for (const product of catalog.products) {
      let lastError = 'Could not find this Payment Link in Stripe.'
      let saved:
        | { ok: true; paymentLinkId: string }
        | { ok: false; error: string }
        | null = null
      for (const secret of secrets) {
        const synced = await syncPaymentLinkRedirect(secret, product)
        if (synced.ok) {
          saved = synced
          break
        }
        lastError = synced.error
      }
      if (saved?.ok) results.push({ id: product.id, ok: true, paymentLinkId: saved.paymentLinkId })
      else results.push({ id: product.id, ok: false, error: lastError })
    }
    const allOk = results.every((r) => r.ok)
    return json(res, allOk ? 200 : 207, {
      ok: allOk,
      thankYouUrl: THANK_YOU_SUCCESS,
      results,
    })
  }

  if (action === 'list') {
    if (method !== 'GET') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
    const catalog = await readCatalog()
    return json(res, 200, {
      ok: true,
      products: catalog.products,
      blobConfigured: Boolean(blobToken()),
      ...stripeStatus(),
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

import nodemailer from 'nodemailer'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
// CJS interop — some Vercel builds resolve nodemailer more reliably this way
const nm = (nodemailer as unknown as { createTransport?: typeof nodemailer.createTransport }).createTransport
  ? nodemailer
  : (require('nodemailer') as typeof nodemailer)

const NOTIFY_EMAIL = (process.env.CONTACT_NOTIFY_EMAIL || 'yomiodeneye@hotmail.com').trim()
const FROM_EMAIL = (
  process.env.FROM_EMAIL ||
  'You Or Me Innovations <no-reply@youormeinnovations.com>'
).trim()
const MOTHER_API = (
  process.env.MOTHER_EMAIL_API ||
  'https://hometolive.com/api/front/send-email.jsp'
).trim()
const MOTHER_SECRET = (
  process.env.MOTHER_EMAIL_SECRET ||
  process.env.FRONT_EMAIL_SECRET ||
  'htl-front-email-2026'
).trim()
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_PER_HOUR = 5
const submissionsByIp = new Map<string, number[]>()

type ContactBody = {
  name?: string
  email?: string
  phone?: string
  subject?: string
  source?: string
  message?: string
  company?: string
  website?: string
  issuedAt?: number
  submitTime?: number
}

function json(res: { status: (code: number) => { json: (body: unknown) => void } }, status: number, body: unknown) {
  return res.status(status).json(body)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function clientIp(req: { headers?: Record<string, string | string[] | undefined> }) {
  const forwarded = req.headers?.['x-forwarded-for']
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return raw?.split(',')[0]?.trim() || 'unknown'
}

function tooMany(ip: string) {
  const now = Date.now()
  const windowMs = 60 * 60 * 1000
  const recent = (submissionsByIp.get(ip) || []).filter((at) => now - at < windowMs)
  if (recent.length >= MAX_PER_HOUR) {
    submissionsByIp.set(ip, recent)
    return true
  }
  recent.push(now)
  submissionsByIp.set(ip, recent)
  return false
}

function isSpam(data: ContactBody) {
  if (data.company?.trim() || data.website?.trim()) return true

  const message = data.message?.toLowerCase() || ''
  const subject = data.subject?.toLowerCase() || ''
  const patterns = [/lorem.*ipsum/i, /click.*here/i, /buy.*now/i, /free.*money/i, /urgent.*action/i]
  if (patterns.some((pattern) => pattern.test(message) || pattern.test(subject))) return true
  if ((message.match(/https?:\/\//g) || []).length > 2) return true
  if (message.length > 20 && message === message.toUpperCase()) return true

  if (data.issuedAt && data.submitTime) {
    const timeDiff = data.submitTime - data.issuedAt
    if (timeDiff < 3000) return true
  }

  return false
}

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim(),
  )
}

function resolveFrom(smtpUser: string) {
  if (FROM_EMAIL.includes('@')) return FROM_EMAIL
  return `You Or Me Innovations <${smtpUser}>`
}

function createTransport() {
  const port = Number(process.env.SMTP_PORT || 587)
  const secureEnv = String(process.env.SMTP_SECURE || '').trim().toLowerCase()
  const secure = secureEnv === 'true' || secureEnv === '1' || port === 465

  return nm.createTransport({
    host: process.env.SMTP_HOST!.trim(),
    port: Number.isFinite(port) ? port : 587,
    secure,
    auth: {
      user: process.env.SMTP_USER!.trim(),
      pass: process.env.SMTP_PASS!.trim(),
    },
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 12_000,
    tls: {
      // Some cPanel hosts present mismatched certs on mail.* hostnames
      rejectUnauthorized: String(process.env.SMTP_TLS_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false',
      minVersion: 'TLSv1.2',
    },
  })
}

function classifySmtpError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err || '')
  const lower = msg.toLowerCase()
  if (/auth|invalid login|535|534|username|password/i.test(lower)) return 'smtp_auth'
  if (/timeout|etimedout|econnrefused|enotfound|connect|socket/i.test(lower)) return 'smtp_connect'
  if (/certificate|ssl|tls/i.test(lower)) return 'smtp_tls'
  return 'smtp_send'
}

async function sendViaMother(opts: {
  name: string
  email: string
  phone: string
  subject: string
  source: string
  message: string
}) {
  if (!MOTHER_SECRET) return { ok: false as const, code: 'mother_not_configured' }
  const html = `
    <p><strong>Admin note:</strong> Delivered via HomeToLive mailer fallback (cPanel SMTP from Vercel failed).</p>
    <h2>New You Or Me Innovations enquiry</h2>
    <p><strong>Name:</strong> ${escapeHtml(opts.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(opts.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(opts.phone || 'Not provided')}</p>
    <p><strong>Subject:</strong> ${escapeHtml(opts.subject)}</p>
    <p><strong>Form source:</strong> ${escapeHtml(opts.source)}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(opts.message).replace(/\n/g, '<br>')}</p>
  `
  const params = new URLSearchParams({
    secret: MOTHER_SECRET,
    to: NOTIFY_EMAIL,
    subject: `New Contact Form Message: ${opts.subject}`,
    body: html,
    html: '1',
  })
  const res = await fetch(MOTHER_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://youormeinnovations.com',
      Referer: 'https://youormeinnovations.com/',
    },
    body: params.toString(),
    signal: AbortSignal.timeout(15_000),
  })
  const data = (await res.json().catch(() => null)) as { success?: boolean } | null
  return { ok: Boolean(res.ok && data?.success), code: 'mother_failed' as const }
}

export default async function handler(
  req: { method?: string; body?: ContactBody; headers?: Record<string, string | string[] | undefined> },
  res: { status: (code: number) => { json: (body: unknown) => void } },
) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' })
  }

  const ip = clientIp(req)
  if (tooMany(ip)) {
    return json(res, 429, { error: 'Too many messages. Please try again later.' })
  }

  let data: ContactBody = {}
  try {
    data = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {}
  } catch {
    return json(res, 400, { error: 'Invalid request' })
  }
  if (isSpam(data)) {
    return json(res, 200, { success: true, message: 'Message received successfully!' })
  }

  const name = String(data.name || '').trim()
  const email = String(data.email || '').trim()
  const subject = String(data.subject || '').trim()
  const source = String(data.source || subject).trim()
  const message = String(data.message || '').trim().slice(0, 1000)
  const phone = String(data.phone || '').trim()

  if (!name || !email || !subject || !message) {
    return json(res, 400, { error: 'Missing required fields: name, email, subject, message' })
  }
  if (!EMAIL_RE.test(email)) {
    return json(res, 400, { error: 'Invalid email address' })
  }
  if (subject.length < 5 || message.length < 10) {
    return json(res, 400, { error: 'Subject or message is too short' })
  }

  const payload = { name, email, phone, subject, source, message }

  if (smtpConfigured()) {
    try {
      const smtpUser = process.env.SMTP_USER!.trim()
      const transport = createTransport()
      await transport.sendMail({
        from: resolveFrom(smtpUser),
        to: NOTIFY_EMAIL,
        replyTo: email,
        subject: `New Contact Form Message: ${subject}`,
        html: `
          <h2>New You Or Me Innovations enquiry</h2>
          <p>Someone submitted a message through the website form.</p>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0;">
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(phone || 'Not provided')}</p>
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
            <p><strong>Form source:</strong> ${escapeHtml(source)}</p>
            <p><strong>Message:</strong></p>
            <div style="background:white;padding:15px;border-radius:5px;margin-top:10px;">
              ${escapeHtml(message).replace(/\n/g, '<br>')}
            </div>
          </div>
          <p style="color:#666;font-size:12px;">Sent from the You Or Me Innovations contact form. Do not reply to the no-reply sender — use the visitor email above.</p>
        `,
      })
      return json(res, 200, { success: true, message: 'Message sent successfully!', via: 'smtp' })
    } catch (error) {
      const code = classifySmtpError(error)
      console.error('Contact form SMTP failed:', code, error instanceof Error ? error.message : error)

      const fallback = await sendViaMother(payload)
      if (fallback.ok) {
        return json(res, 200, { success: true, message: 'Message sent successfully!', via: 'mother_fallback' })
      }

      return json(res, 500, {
        error: 'Email could not be sent. Check SMTP settings or try again later.',
        code,
      })
    }
  }

  // No SMTP env — try mother bridge if configured on Vercel
  const motherOnly = await sendViaMother(payload)
  if (motherOnly.ok) {
    return json(res, 200, { success: true, message: 'Message sent successfully!', via: 'mother' })
  }

  console.error('Contact form: SMTP not configured and mother fallback unavailable')
  return json(res, 500, {
    error: 'Email is not configured yet.',
    code: 'smtp_not_configured',
  })
}

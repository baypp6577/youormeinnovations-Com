import { Resend } from 'resend'

const NOTIFY_EMAIL = (process.env.CONTACT_NOTIFY_EMAIL || 'yomiodeneye@hotmail.com').trim()
const FROM_EMAIL = (process.env.FROM_EMAIL || 'You Or Me Innovations <no-reply@youormeinnovations.com>').trim()
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

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('Contact form: RESEND_API_KEY is not configured')
    return json(res, 500, { error: 'An error occurred while processing your request' })
  }

  try {
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: FROM_EMAIL,
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

    return json(res, 200, { success: true, message: 'Message sent successfully!' })
  } catch (error) {
    console.error('Contact form email failed:', error instanceof Error ? error.message : 'unknown')
    return json(res, 500, { error: 'An error occurred while processing your request' })
  }
}

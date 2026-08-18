export const CONTACT_HASH = 'contact-section'
const SUBJECT_KEY = 'yom_contact_subject'
const SOURCE_KEY = 'yom_contact_source'
export const CONTACT_SUBJECT_EVENT = 'yom-contact-subject'

export type ContactPrefill = {
  subject: string
  source: string
}

export function setContactPrefill(subject: string, source = subject) {
  const trimmed = subject.trim()
  if (!trimmed) return
  sessionStorage.setItem(SUBJECT_KEY, trimmed)
  sessionStorage.setItem(SOURCE_KEY, source.trim() || trimmed)
  window.dispatchEvent(
    new CustomEvent<ContactPrefill>(CONTACT_SUBJECT_EVENT, {
      detail: { subject: trimmed, source: source.trim() || trimmed },
    }),
  )
}

export function consumeContactPrefill(): ContactPrefill | null {
  const subject = sessionStorage.getItem(SUBJECT_KEY)?.trim() || ''
  const source = sessionStorage.getItem(SOURCE_KEY)?.trim() || subject
  sessionStorage.removeItem(SUBJECT_KEY)
  sessionStorage.removeItem(SOURCE_KEY)
  if (!subject) return null
  return { subject, source }
}

export function openContactForm(subject: string, source = subject) {
  setContactPrefill(subject, source)
  const el = document.getElementById(CONTACT_HASH)
  if (el) {
    history.replaceState(null, '', `#${CONTACT_HASH}`)
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  window.location.hash = CONTACT_HASH
}

export function bindContactHashClicks() {
  document.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const link = target.closest('a[href="#contact-section"]')
    if (!(link instanceof HTMLAnchorElement)) return

    const label = link.dataset.contactSubject || link.textContent?.trim() || 'General enquiry'
    const source = link.dataset.contactSource || label
    setContactPrefill(label, source)
  })
}

export const COUNTRY_CODES = [
  { value: '+44', label: '🇬🇧 +44' },
  { value: '+34', label: '🇪🇸 +34' },
  { value: '+1', label: '🇺🇸 +1' },
  { value: '+33', label: '🇫🇷 +33' },
  { value: '+49', label: '🇩🇪 +49' },
  { value: '+39', label: '🇮🇹 +39' },
  { value: '+351', label: '🇵🇹 +351' },
  { value: '+31', label: '🇳🇱 +31' },
  { value: '+234', label: '🇳🇬 +234' },
  { value: '+233', label: '🇬🇭 +233' },
  { value: '+254', label: '🇰🇪 +254' },
  { value: '+27', label: '🇿🇦 +27' },
  { value: '+91', label: '🇮🇳 +91' },
  { value: '+61', label: '🇦🇺 +61' },
  { value: '+353', label: '🇮🇪 +353' },
] as const

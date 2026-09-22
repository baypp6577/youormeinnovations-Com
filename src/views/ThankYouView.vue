<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { thankYou } from '@/data/site'
import { setContactPrefill } from '@/lib/contact'

type PublicProduct = {
  id: string
  name: string
  price: string
  tagline: string
  description: string
  cta: string
  paymentUrl: string
  hasPdf: boolean
}

const DOWNLOAD_EXPIRED_CODE = 'download_link_expired'

const route = useRoute()
const ladder = ref(thankYou.upgrades.items.map((item) => ({ ...item, hasPdf: false } as PublicProduct)))
const downloadError = ref('')
const downloadBusy = ref(false)
const resolveBusy = ref(false)
const resolveError = ref('')
const resolveExpired = ref(false)
const resolvedProductId = ref('')

function normalizeProductId(raw: string): string {
  const value = raw.trim().toLowerCase()
  if (!value) return ''
  const match = value.match(/^(?:product-?)?([1-4])$/)
  if (match) return `product-${match[1]}`
  return value
}

const queryProductId = computed(() => normalizeProductId(String(route.query.product || '')))
const sessionId = computed(() =>
  String(route.query.session_id || route.query.sessionId || route.query.checkout_session_id || '').trim(),
)
const freeUnlock = computed(() => {
  const raw = String(route.query.free || '').trim().toLowerCase()
  return raw === '1' || raw === 'true' || raw === 'yes'
})

function isFreePrice(price: string): boolean {
  const raw = String(price || '')
    .trim()
    .toLowerCase()
    .replace(/,/g, '')
  return raw === 'free' || raw === '£0' || raw === '£0.00' || raw === '0' || raw === '0.00'
}

const purchasedId = computed(() => resolvedProductId.value || queryProductId.value)

const purchasedIndex = computed(() => ladder.value.findIndex((item) => item.id === purchasedId.value))

const purchasedProduct = computed(() =>
  purchasedIndex.value >= 0 ? ladder.value[purchasedIndex.value] : null,
)

const isFreeGift = computed(
  () => freeUnlock.value && Boolean(purchasedProduct.value && isFreePrice(purchasedProduct.value.price)),
)

/** Ladder: after product N, offer only product N+1. Top tier → none. */
const nextUpgrade = computed(() => {
  if (purchasedIndex.value < 0) return null
  return ladder.value[purchasedIndex.value + 1] ?? null
})

const atTopTier = computed(
  () => purchasedIndex.value >= 0 && purchasedIndex.value === ladder.value.length - 1,
)

const canDownload = computed(
  () => Boolean(purchasedProduct.value?.hasPdf && (sessionId.value || isFreeGift.value) && !resolveExpired.value),
)

/** htnet-style dynamic subject: action — product (not put in the URL). */
const contactSubject = computed(() => {
  const productName = purchasedProduct.value?.name?.trim() || queryProductId.value || 'digital product'
  if (resolveExpired.value) {
    return `Digital download re-send — ${productName}`
  }
  return thankYou.contactCta.contactSubject || `Help after purchase — ${productName}`
})

const contactSource = computed(() =>
  resolveExpired.value ? 'Thank you page — expired download' : thankYou.contactCta.contactSource || 'Thank you page',
)

function goToContact(event?: Event) {
  event?.preventDefault()
  setContactPrefill(contactSubject.value, contactSource.value)
  window.location.href = '/#contact-section'
}

async function loadProducts() {
  try {
    const res = await fetch('/api/digital-products?action=public-list')
    const data = (await res.json()) as { ok?: boolean; products?: PublicProduct[] }
    if (data.ok && Array.isArray(data.products) && data.products.length) {
      ladder.value = data.products
    }
  } catch {
    /* keep static seed */
  }
}

async function resolveFromSession() {
  resolveError.value = ''
  resolveExpired.value = false
  resolvedProductId.value = ''
  if (freeUnlock.value && queryProductId.value) {
    resolvedProductId.value = queryProductId.value
    return
  }
  if (!sessionId.value) return
  resolveBusy.value = true
  try {
    const params = new URLSearchParams({
      action: 'resolve-session',
      session_id: sessionId.value,
    })
    if (queryProductId.value) params.set('product', queryProductId.value)
    const res = await fetch(`/api/digital-products?${params.toString()}`)
    const data = (await res.json().catch(() => null)) as {
      ok?: boolean
      productId?: string
      hasPdf?: boolean
      error?: string
      code?: string
      product?: PublicProduct | null
    } | null
    if (!res.ok || !data?.ok || !data.productId) {
      resolveExpired.value = data?.code === DOWNLOAD_EXPIRED_CODE
      resolveError.value =
        data?.error ||
        (res.status >= 500
          ? 'Download service is restarting. Wait a minute and refresh.'
          : 'Could not match this payment to a product.')
      return
    }
    resolvedProductId.value = data.productId
    if (data.product) {
      const idx = ladder.value.findIndex((p) => p.id === data.productId)
      if (idx >= 0) ladder.value[idx] = { ...ladder.value[idx], ...data.product, hasPdf: Boolean(data.hasPdf) }
    }
  } catch {
    resolveError.value = 'Could not verify payment.'
  } finally {
    resolveBusy.value = false
  }
}

function downloadHref() {
  const params = new URLSearchParams({ action: 'download' })
  if (purchasedId.value) params.set('product', purchasedId.value)
  if (isFreeGift.value) {
    params.set('free', '1')
  } else if (sessionId.value) {
    params.set('session_id', sessionId.value)
  } else {
    return '#'
  }
  return `/api/digital-products?${params.toString()}`
}

async function downloadPdf() {
  downloadError.value = ''
  if (!isFreeGift.value && !sessionId.value) {
    downloadError.value =
      'Missing Stripe session — set After payment redirect to include session_id={CHECKOUT_SESSION_ID}.'
    return
  }
  if (!purchasedProduct.value?.hasPdf) {
    downloadError.value = 'PDF not uploaded yet for this product.'
    return
  }
  downloadBusy.value = true
  try {
    const res = await fetch(downloadHref(), { credentials: 'same-origin' })
    const ct = res.headers.get('content-type') || ''
    if (!res.ok || !ct.includes('pdf')) {
      const data = (await res.json().catch(() => null)) as { error?: string; code?: string } | null
      if (data?.code === DOWNLOAD_EXPIRED_CODE) {
        resolveExpired.value = true
        resolveError.value = data.error || 'This download link has expired.'
      }
      downloadError.value = data?.error || 'Download failed.'
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${purchasedId.value || 'download'}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    downloadError.value = 'Download failed.'
  } finally {
    downloadBusy.value = false
  }
}

const checkoutBusy = ref(false)
const checkoutError = ref('')

async function startCheckout(productId: string) {
  checkoutError.value = ''
  checkoutBusy.value = true
  try {
    const res = await fetch('/api/digital-products?action=create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    })
    const data = (await res.json()) as { ok?: boolean; url?: string; error?: string }
    if (!res.ok || !data.ok || !data.url) {
      checkoutError.value = data.error || 'Could not start checkout.'
      return
    }
    window.location.href = data.url
  } catch {
    checkoutError.value = 'Could not start checkout.'
  } finally {
    checkoutBusy.value = false
  }
}

watch(
  () => [sessionId.value, queryProductId.value, freeUnlock.value] as const,
  () => {
    void resolveFromSession()
  },
)

onMounted(async () => {
  document.title = `${thankYou.title} | You Or Me Innovations`
  await loadProducts()
  await resolveFromSession()
})
</script>

<template>
  <section class="relative overflow-hidden bg-gradient-to-b from-yom-navy via-yom-navy-light to-yom-surface">
    <div
      class="pointer-events-none absolute inset-0 opacity-40"
      style="background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(47,111,237,0.45), transparent 60%)"
      aria-hidden="true"
    />

    <div class="relative mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div class="animate-[float-up_0.7s_ease-out_both] text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-gold-soft">
          {{ resolveExpired ? 'Link expired' : isFreeGift ? 'Free download' : thankYou.eyebrow }}
        </p>
        <h1 class="mt-4 font-display text-3xl font-bold text-white sm:text-5xl">
          {{
            resolveExpired
              ? 'Your download link has expired'
              : isFreeGift
                ? 'Your free guide is ready'
                : thankYou.title
          }}
        </h1>
        <p class="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">
          {{
            resolveExpired
              ? 'Download links stay active for 48 hours after purchase. Use the contact form to request a re-send — the subject is filled in for you.'
              : isFreeGift
                ? 'Download your free PDF below. No card. No Stripe checkout.'
                : thankYou.subtitle
          }}
        </p>
        <p v-if="!resolveExpired" class="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
          {{
            isFreeGift
              ? 'When you are ready, the next product on this page upgrades your toolkit.'
              : thankYou.note
          }}
        </p>

        <p v-if="resolveBusy" class="mt-6 text-sm text-slate-300">Confirming your purchase…</p>
        <p v-else-if="resolveError && !resolveExpired" class="mt-6 text-sm text-rose-200">{{ resolveError }}</p>

        <div v-if="purchasedProduct && !resolveExpired" class="mt-8">
          <button
            type="button"
            class="inline-flex rounded-full bg-yom-gold px-6 py-3 text-sm font-semibold text-yom-navy transition hover:bg-yom-gold-soft disabled:opacity-60"
            :disabled="downloadBusy || !canDownload"
            @click="downloadPdf"
          >
            {{ downloadBusy ? 'Preparing…' : isFreeGift ? 'Download free PDF' : 'Download your PDF' }}
          </button>
          <p v-if="downloadError" class="mt-3 text-sm text-rose-200">{{ downloadError }}</p>
          <p v-else-if="!sessionId && !isFreeGift" class="mt-3 text-xs text-slate-300">
            If download fails, set Stripe After payment redirect to
            <code class="text-yom-gold-soft">thank-you?session_id={'{'}CHECKOUT_SESSION_ID{'}'}</code>
            on every Payment Link.
          </p>
        </div>

        <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <RouterLink
            :to="thankYou.homeCta.href"
            class="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-yom-navy transition hover:bg-yom-gold-soft"
          >
            {{ thankYou.homeCta.label }}
          </RouterLink>
          <a
            href="/#contact-section"
            :data-contact-subject="contactSubject"
            :data-contact-source="contactSource"
            class="inline-flex rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            @click="goToContact"
          >
            {{ resolveExpired ? 'Request a re-send' : thankYou.contactCta.label }}
          </a>
        </div>
      </div>
    </div>
  </section>

  <section
    v-if="nextUpgrade && !resolveExpired"
    class="bg-yom-surface py-16 sm:py-20"
    aria-labelledby="thank-you-upgrade"
  >
    <div class="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-blue">
          {{ thankYou.upgrades.eyebrow }}
        </p>
        <h2 id="thank-you-upgrade" class="mt-3 font-display text-2xl font-bold text-yom-navy sm:text-3xl">
          {{ thankYou.upgrades.title }}
        </h2>
        <p class="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
          {{ thankYou.upgrades.description }}
        </p>
      </div>

      <article
        class="mt-10 animate-[float-up_0.6s_ease-out_0.12s_both] border-t border-yom-navy/15 pt-8 text-center"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-yom-blue">{{ nextUpgrade.name }}</p>
        <p class="mt-2 font-display text-3xl font-bold text-yom-navy">{{ nextUpgrade.price }}</p>
        <p class="mt-1 text-sm text-slate-500">{{ nextUpgrade.tagline }}</p>
        <p class="mt-4 text-sm leading-relaxed text-slate-600">{{ nextUpgrade.description }}</p>
        <p v-if="checkoutError" class="mt-4 text-sm text-rose-600">{{ checkoutError }}</p>
        <button
          type="button"
          class="mt-8 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-yom-gold to-yom-gold-soft px-6 py-3 text-sm font-semibold text-yom-navy shadow-md shadow-yom-gold/20 transition hover:brightness-105 disabled:opacity-60 sm:w-auto"
          :disabled="checkoutBusy"
          @click="startCheckout(nextUpgrade.id)"
        >
          {{ checkoutBusy ? 'Opening checkout…' : nextUpgrade.cta }}
        </button>
        <p class="mt-3 text-xs text-slate-500">
          Secure Stripe checkout — same flow as HomeToLive (redirect set in code).
        </p>
      </article>
    </div>
  </section>

  <section
    v-else-if="atTopTier && !resolveExpired"
    class="bg-yom-surface py-16 sm:py-20"
    aria-labelledby="thank-you-complete"
  >
    <div class="mx-auto max-w-xl px-4 text-center sm:px-6 lg:px-8">
      <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-blue">Complete</p>
      <h2 id="thank-you-complete" class="mt-3 font-display text-2xl font-bold text-yom-navy sm:text-3xl">
        {{ thankYou.upgrades.completeTitle }}
      </h2>
      <p class="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
        {{ thankYou.upgrades.completeDescription }}
      </p>
    </div>
  </section>
</template>

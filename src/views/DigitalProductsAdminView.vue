<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

type Product = {
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

const authed = ref(false)
const checking = ref(true)
const password = ref('')
const notice = ref('')
const noticeErr = ref(false)
const saving = ref(false)
const uploadingId = ref('')
const products = ref<Product[]>([])
const selectedId = ref('product-1')
const blobConfigured = ref(false)
const stripeConfigured = ref(false)
const form = ref(emptyForm())

function emptyForm() {
  return {
    id: 'product-1',
    name: '',
    price: '',
    tagline: '',
    description: '',
    cta: '',
    paymentUrl: '',
  }
}

function flash(message: string, err = false) {
  notice.value = message
  noticeErr.value = err
}

async function api(action: string, payload: Record<string, unknown> = {}, method: 'GET' | 'POST' = 'POST') {
  const url = method === 'GET' ? `/api/digital-products?action=${encodeURIComponent(action)}` : '/api/digital-products'
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
    body: method === 'POST' ? JSON.stringify({ action, ...payload }) : undefined,
  })
  const data = (await res.json()) as {
    ok?: boolean
    error?: string
    authed?: boolean
    products?: Product[]
    product?: Product
    blobConfigured?: boolean
    stripeConfigured?: boolean
    results?: Array<{ id: string; ok: boolean; error?: string; paymentLinkId?: string }>
  }
  return { status: res.status, data }
}

function selectProduct(p: Product) {
  selectedId.value = p.id
  form.value = {
    id: p.id,
    name: p.name,
    price: p.price,
    tagline: p.tagline,
    description: p.description,
    cta: p.cta,
    paymentUrl: p.paymentUrl,
  }
}

async function refreshSession() {
  checking.value = true
  try {
    const { data } = await api('session', {}, 'GET')
    authed.value = Boolean(data.authed)
    blobConfigured.value = Boolean(data.blobConfigured)
    stripeConfigured.value = Boolean(data.stripeConfigured)
    if (authed.value) await loadProducts()
  } catch {
    authed.value = false
  } finally {
    checking.value = false
  }
}

async function loadProducts() {
  const { data } = await api('list', {}, 'GET')
  if (data.ok && Array.isArray(data.products)) {
    products.value = data.products
    blobConfigured.value = Boolean(data.blobConfigured)
    stripeConfigured.value = Boolean(data.stripeConfigured)
    const current = data.products.find((p) => p.id === selectedId.value) || data.products[0]
    if (current) selectProduct(current)
  }
}

async function login() {
  flash('')
  const { data } = await api('login', { password: password.value })
  if (!data.ok) {
    flash(data.error || 'Could not sign in.', true)
    return
  }
  password.value = ''
  authed.value = true
  await loadProducts()
}

async function logout() {
  await api('logout')
  authed.value = false
  products.value = []
}

async function saveProduct() {
  saving.value = true
  flash('')
  try {
    const { data } = await api('save', { ...form.value })
    if (!data.ok) {
      flash(data.error || 'Save failed.', true)
      return
    }
    flash('Saved.')
    await loadProducts()
  } catch {
    flash('Save failed.', true)
  } finally {
    saving.value = false
  }
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  flash('')
  if (file.size > 4 * 1024 * 1024) {
    flash('PDF must be under 4MB.', true)
    input.value = ''
    return
  }
  uploadingId.value = form.value.id
  try {
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!)
    const pdfBase64 = btoa(binary)
    const { data } = await api('upload', {
      productId: form.value.id,
      fileName: file.name,
      pdfBase64,
    })
    if (!data.ok) {
      flash(data.error || 'Upload failed.', true)
      return
    }
    flash('PDF uploaded to private Blob.')
    await loadProducts()
  } catch {
    flash('Upload failed.', true)
  } finally {
    uploadingId.value = ''
    input.value = ''
  }
}

async function clearPdf() {
  flash('')
  const { data } = await api('clear-pdf', { id: form.value.id })
  if (!data.ok) {
    flash(data.error || 'Could not clear PDF.', true)
    return
  }
  flash('PDF removed.')
  await loadProducts()
}

function previewUrl(id: string) {
  return `/api/digital-products?action=download&product=${encodeURIComponent(id)}&preview=1`
}

const syncingRedirects = ref(false)
const thankYouRedirect =
  'https://youormeinnovations.com/thank-you?session_id={CHECKOUT_SESSION_ID}'

async function syncStripeRedirects() {
  syncingRedirects.value = true
  flash('')
  const { data } = await api('sync-redirects', {})
  syncingRedirects.value = false
  if (!data.ok && !Array.isArray(data.results)) {
    flash(data.error || 'Could not sync Stripe redirects.', true)
    return
  }
  const results = (data.results as Array<{ id: string; ok: boolean; error?: string }>) || []
  const failed = results.filter((r) => !r.ok)
  if (failed.length) {
    flash(
      `Synced with errors: ${failed.map((f) => `${f.id}: ${f.error || 'failed'}`).join('; ')}`,
      true,
    )
    return
  }
  flash('All Payment Links now redirect to thank-you after payment (wired in Stripe via API).')
}

onMounted(() => {
  document.title = 'Digital Products | You Or Me Innovations'
  void refreshSession()
})
</script>

<template>
  <section class="min-h-screen bg-yom-surface py-12 sm:py-16">
    <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-blue">Admin</p>
          <h1 class="mt-2 font-display text-3xl font-bold text-yom-navy">Digital Products</h1>
          <p class="mt-2 text-sm text-slate-600">Upload private PDFs and edit ladder product details.</p>
        </div>
        <div class="flex items-center gap-3">
          <RouterLink to="/" class="text-sm font-semibold text-yom-blue hover:underline">Site home</RouterLink>
          <button
            v-if="authed"
            type="button"
            class="text-sm font-semibold text-slate-500 hover:text-yom-navy"
            @click="logout"
          >
            Sign out
          </button>
        </div>
      </div>

      <p v-if="checking" class="mt-8 text-sm text-slate-500">Checking session…</p>

      <form
        v-else-if="!authed"
        class="mt-8 max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50"
        @submit.prevent="login"
      >
        <label class="block text-sm font-semibold text-yom-navy" for="dp-admin-password">Password</label>
        <input
          id="dp-admin-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          class="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          required
        />
        <p v-if="notice" class="mt-3 text-sm" :class="noticeErr ? 'text-red-700' : 'text-emerald-700'">{{ notice }}</p>
        <button type="submit" class="mt-5 inline-flex rounded-full bg-yom-navy px-5 py-2.5 text-sm font-semibold text-white">
          Sign in
        </button>
      </form>

      <div v-else class="mt-8 space-y-6">
        <div class="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p>
            Blob:
            <span :class="blobConfigured ? 'text-emerald-700' : 'text-amber-700'">
              {{ blobConfigured ? 'configured' : 'missing BLOB_READ_WRITE_TOKEN' }}
            </span>
            · Stripe verify:
            <span :class="stripeConfigured ? 'text-emerald-700' : 'text-amber-700'">
              {{ stripeConfigured ? 'configured' : 'add YOUORME_STRIPE_SECRET_KEY for buyer downloads' }}
            </span>
          </p>
          <p class="mt-2">
            Checkout works like HomeToLive: the site creates a Stripe Checkout Session and sets the return URL in code.
            Buyers land on:
            <code class="mt-1 block break-all text-xs text-yom-navy">{{ thankYouRedirect }}</code>
          </p>
          <button
            type="button"
            class="mt-3 inline-flex rounded-full border border-yom-navy/20 bg-white px-4 py-2 text-xs font-semibold text-yom-navy hover:bg-slate-50 disabled:opacity-60"
            :disabled="syncingRedirects || !stripeConfigured"
            @click="syncStripeRedirects"
          >
            {{ syncingRedirects ? 'Wiring…' : 'Wire all Payment Link redirects in Stripe' }}
          </button>
        </div>

        <p v-if="notice" class="text-sm" :class="noticeErr ? 'text-red-700' : 'text-emerald-700'">{{ notice }}</p>

        <div class="grid gap-8 lg:grid-cols-[minmax(0,14rem)_1fr]">
          <aside class="space-y-2">
            <button
              v-for="p in products"
              :key="p.id"
              type="button"
              class="w-full rounded-xl border px-3 py-3 text-left text-sm transition"
              :class="
                selectedId === p.id
                  ? 'border-yom-blue bg-white shadow-sm'
                  : 'border-slate-200 bg-white/70 hover:border-yom-blue/40'
              "
              @click="selectProduct(p)"
            >
              <span class="font-semibold text-yom-navy">{{ p.name }}</span>
              <span class="mt-1 block text-xs text-slate-500">
                {{ p.blobPathname ? 'PDF ready' : 'No PDF' }}
              </span>
            </button>
          </aside>

          <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
            <h2 class="font-display text-xl font-bold text-yom-navy">{{ form.id }}</h2>

            <div class="mt-5 grid gap-4 sm:grid-cols-2">
              <label class="block text-sm">
                <span class="font-semibold text-yom-navy">Name</span>
                <input v-model="form.name" class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
              </label>
              <label class="block text-sm">
                <span class="font-semibold text-yom-navy">Price label</span>
                <input v-model="form.price" class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
              </label>
              <label class="block text-sm sm:col-span-2">
                <span class="font-semibold text-yom-navy">Tagline</span>
                <input v-model="form.tagline" class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
              </label>
              <label class="block text-sm sm:col-span-2">
                <span class="font-semibold text-yom-navy">Description</span>
                <textarea v-model="form.description" rows="3" class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
              </label>
              <label class="block text-sm">
                <span class="font-semibold text-yom-navy">CTA</span>
                <input v-model="form.cta" class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
              </label>
              <label class="block text-sm">
                <span class="font-semibold text-yom-navy">Stripe Payment Link</span>
                <input v-model="form.paymentUrl" class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
              </label>
            </div>

            <div class="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                class="rounded-full bg-yom-navy px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                :disabled="saving"
                @click="saveProduct"
              >
                {{ saving ? 'Saving…' : 'Save details' }}
              </button>
            </div>

            <div class="mt-8 border-t border-slate-100 pt-6">
              <p class="text-sm font-semibold text-yom-navy">PDF (private Blob)</p>
              <p class="mt-1 text-xs text-slate-500">
                Max 4MB. Current:
                {{
                  products.find((p) => p.id === form.id)?.fileName ||
                  products.find((p) => p.id === form.id)?.blobPathname ||
                  'none'
                }}
              </p>
              <div class="mt-4 flex flex-wrap items-center gap-3">
                <label class="inline-flex cursor-pointer rounded-full bg-yom-blue px-5 py-2.5 text-sm font-semibold text-white">
                  {{ uploadingId === form.id ? 'Uploading…' : 'Upload PDF' }}
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    class="hidden"
                    :disabled="Boolean(uploadingId)"
                    @change="onFileChange"
                  />
                </label>
                <a
                  v-if="products.find((p) => p.id === form.id)?.blobPathname"
                  :href="previewUrl(form.id)"
                  target="_blank"
                  rel="noopener"
                  class="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-yom-navy"
                >
                  Preview (admin)
                </a>
                <button
                  v-if="products.find((p) => p.id === form.id)?.blobPathname"
                  type="button"
                  class="text-sm font-semibold text-red-700"
                  @click="clearPdf"
                >
                  Remove PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

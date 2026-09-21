<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { packages, type PackageItem } from '@/data/site'

type PublicProduct = {
  id: string
  name: string
  price: string
  tagline: string
  description: string
  cta: string
  paymentUrl: string
}

/** Shared primary CTA classes — same gold pill as hero / about / header. */
const primaryCtaClass =
  'mt-auto inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-yom-gold to-yom-gold-soft px-5 py-3 text-sm font-semibold text-yom-navy shadow-md shadow-yom-gold/20 transition hover:brightness-105'

const items = ref<PackageItem[]>(packages.items.map((item) => ({ ...item })))

onMounted(async () => {
  try {
    const res = await fetch('/api/digital-products?action=public-list')
    const data = (await res.json()) as { ok?: boolean; products?: PublicProduct[] }
    if (!data.ok || !Array.isArray(data.products) || data.products.length === 0) return
    items.value = data.products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      tagline: product.tagline,
      description: product.description,
      cta: product.cta,
      paymentUrl: product.paymentUrl,
    }))
  } catch {
    /* keep static catalogue */
  }
})
</script>

<template>
  <section id="packages" class="bg-white py-20 sm:py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto mb-14 max-w-3xl text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-blue">{{ packages.eyebrow }}</p>
        <h2 class="mt-3 font-display text-3xl font-bold text-yom-navy sm:text-4xl">{{ packages.title }}</h2>
      </div>

      <div class="grid gap-6 sm:grid-cols-2">
        <article
          v-for="item in items"
          :key="item.id"
          class="flex flex-col rounded-3xl border border-slate-200/80 bg-yom-surface p-8 shadow-xl shadow-slate-200/40"
        >
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-yom-blue">{{ item.name }}</p>
          <div class="mt-4 flex flex-wrap items-end gap-3">
            <p class="font-display text-4xl font-bold text-yom-navy">{{ item.price }}</p>
            <p class="pb-1 text-sm text-slate-500">{{ item.tagline }}</p>
          </div>
          <p class="mt-4 text-sm leading-relaxed text-slate-600">{{ item.description }}</p>
          <p v-if="item.idealFor" class="mt-4 text-sm font-medium text-slate-700">
            Ideal for: {{ item.idealFor }}
          </p>
          <a
            v-if="item.paymentUrl"
            :href="item.paymentUrl"
            :class="primaryCtaClass"
          >
            {{ item.cta }}
          </a>
        </article>
      </div>
    </div>
  </section>
</template>

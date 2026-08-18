<script setup lang="ts">
import { finalCta } from '@/data/site'
</script>

<template>
  <section class="bg-gradient-to-r from-yom-blue to-yom-navy py-20 text-white sm:py-24">
    <div class="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
      <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-gold-soft">{{ finalCta.eyebrow }}</p>
      <h2 class="mt-3 font-display text-3xl font-bold sm:text-4xl">{{ finalCta.title }}</h2>
      <p class="mt-4 text-sm leading-relaxed text-slate-100 sm:text-base">{{ finalCta.description }}</p>

      <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          :href="finalCta.primaryCta.href"
          :target="finalCta.primaryCta.external ? '_blank' : undefined"
          :rel="finalCta.primaryCta.external ? 'noopener noreferrer' : undefined"
          class="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-yom-navy [touch-action:manipulation]"
        >
          {{ finalCta.primaryCta.label }}
        </a>
        <a
          :href="finalCta.secondaryCta.href"
          :target="finalCta.secondaryCta.external ? '_blank' : undefined"
          :rel="finalCta.secondaryCta.external ? 'noopener noreferrer' : undefined"
          data-contact-subject="Contact Us — Ready to grow"
          data-contact-source="Final CTA"
          class="inline-flex rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          {{ finalCta.secondaryCta.label }}
        </a>
      </div>
    </div>
  </section>
</template>

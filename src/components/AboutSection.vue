<script setup lang="ts">
import { about } from '@/data/site'
</script>

<template>
  <section id="about" class="bg-white py-20 sm:py-24">
    <div class="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-blue">{{ about.eyebrow }}</p>
        <h2 class="mt-3 font-display text-3xl font-bold text-yom-navy sm:text-4xl">{{ about.title }}</h2>
        <p class="mt-5 text-base leading-relaxed text-slate-700">{{ about.intro }}</p>
        <a
          :href="about.cta.href"
          :target="about.cta.external ? '_blank' : undefined"
          :rel="about.cta.external ? 'noopener noreferrer' : undefined"
          data-contact-subject="Work With Us — About"
          data-contact-source="About section"
          class="mt-8 inline-flex rounded-full bg-gradient-to-r from-yom-gold to-yom-gold-soft px-5 py-3 text-sm font-semibold text-yom-navy shadow-md shadow-yom-gold/20 transition hover:brightness-105"
        >
          {{ about.cta.label }}
        </a>
      </div>

      <div class="space-y-4">
        <div
          v-for="(paragraph, index) in about.description"
          :key="index"
          class="rounded-3xl border border-slate-200/80 bg-yom-surface p-6 shadow-lg shadow-slate-200/30"
        >
          <p class="text-sm leading-relaxed text-slate-600 sm:text-base">
            {{ paragraph }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

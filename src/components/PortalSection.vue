<script setup lang="ts">
import { portal } from '@/data/site'
</script>

<template>
  <section id="portal" class="bg-white py-20 sm:py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-blue">{{ portal.eyebrow }}</p>
          <h2 class="mt-3 font-display text-3xl font-bold text-yom-navy sm:text-4xl">{{ portal.title }}</h2>
          <p class="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {{ portal.description }}
          </p>
          <a
            :href="portal.cta.href"
            :target="portal.cta.external ? '_blank' : undefined"
            :rel="portal.cta.external ? 'noopener noreferrer' : undefined"
            class="mt-8 inline-flex rounded-full bg-gradient-to-r from-yom-gold to-yom-gold-soft px-5 py-3 text-sm font-semibold text-yom-navy shadow-md shadow-yom-gold/20 transition hover:brightness-105"
          >
            {{ portal.cta.label }}
          </a>
        </div>

        <ul class="grid gap-3 sm:grid-cols-2">
          <li
            v-for="point in portal.points"
            :key="point"
            class="rounded-2xl border border-slate-200/80 bg-yom-surface px-5 py-4 text-sm font-semibold text-yom-navy shadow-lg shadow-slate-200/30"
          >
            {{ point }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { results } from '@/data/site'
</script>

<template>
  <section class="bg-yom-navy py-20 text-white sm:py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto mb-14 max-w-3xl text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-gold-soft">{{ results.eyebrow }}</p>
        <h2 class="mt-3 font-display text-3xl font-bold sm:text-4xl">{{ results.title }}</h2>
        <p class="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">{{ results.description }}</p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="metric in results.metrics"
          :key="metric.id"
          class="rounded-3xl border border-white/10 bg-white/5 px-5 py-6 text-center backdrop-blur-sm"
        >
          <p class="font-display text-lg font-semibold">{{ metric.label }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

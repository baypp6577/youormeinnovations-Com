<script setup lang="ts">
import { services } from '@/data/site'

const pillarIcons = ['◆', '◎', '★']
</script>

<template>
  <section id="services" class="bg-yom-surface py-20 sm:py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto mb-14 max-w-2xl text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-blue">{{ services.eyebrow }}</p>
        <h2 class="mt-3 font-display text-3xl font-bold text-yom-navy sm:text-4xl">{{ services.title }}</h2>
      </div>

      <div class="grid gap-6 md:grid-cols-3">
        <article
          v-for="(pillar, index) in services.pillars"
          :key="pillar.id"
          class="group rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-yom-blue/10"
        >
          <p class="text-[11px] font-semibold uppercase tracking-wider text-yom-slate">{{ pillar.label }}</p>

          <div
            class="mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yom-blue/10 to-yom-gold/10 text-xl text-yom-blue transition group-hover:scale-110"
            aria-hidden="true"
          >
            {{ pillarIcons[index] }}
          </div>

          <h3 class="mt-5 font-display text-xl font-bold uppercase tracking-wide text-yom-navy">
            {{ pillar.title }}
          </h3>
          <p class="mt-3 text-sm leading-relaxed text-slate-600">{{ pillar.description }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { servicesDetail } from '@/data/site'
</script>

<template>
  <section id="services-detail" class="bg-yom-surface py-20 sm:py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto mb-14 max-w-3xl text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-blue">{{ servicesDetail.eyebrow }}</p>
        <h2 class="mt-3 font-display text-3xl font-bold text-yom-navy sm:text-4xl">{{ servicesDetail.title }}</h2>
        <p class="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">{{ servicesDetail.description }}</p>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <article
          v-for="item in servicesDetail.items"
          :id="item.id"
          :key="item.id"
          class="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xl shadow-slate-200/40"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-yom-blue">{{ item.tagline }}</p>
          <h3 class="mt-3 font-display text-2xl font-bold text-yom-navy">{{ item.title }}</h3>
          <p class="mt-3 text-sm leading-relaxed text-slate-600">{{ item.description }}</p>

          <ul v-if="item.bullets?.length" class="mt-5 grid gap-2 sm:grid-cols-2">
            <li
              v-for="bullet in item.bullets"
              :key="bullet"
              class="rounded-2xl bg-yom-surface px-4 py-3 text-sm text-slate-700"
            >
              {{ bullet }}
            </li>
          </ul>

          <p v-if="item.cta" class="mt-5 text-sm font-semibold text-yom-blue">
            {{ item.cta }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

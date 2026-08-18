<script setup lang="ts">
import { packages } from '@/data/site'
</script>

<template>
  <section id="packages" class="bg-white py-20 sm:py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto mb-14 max-w-3xl text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-blue">{{ packages.eyebrow }}</p>
        <h2 class="mt-3 font-display text-3xl font-bold text-yom-navy sm:text-4xl">{{ packages.title }}</h2>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <article
          v-for="item in packages.items"
          :key="item.id"
          class="rounded-3xl border border-slate-200/80 bg-yom-surface p-8 shadow-xl shadow-slate-200/40"
        >
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-yom-blue">{{ item.name }}</p>
          <div class="mt-4 flex items-end gap-3">
            <p class="font-display text-4xl font-bold text-yom-navy">{{ item.price }}</p>
            <p class="pb-1 text-sm text-slate-500">{{ item.tagline }}</p>
          </div>
          <p class="mt-4 text-sm leading-relaxed text-slate-600">{{ item.description }}</p>
          <p class="mt-4 text-sm font-medium text-slate-700">
            Ideal for: {{ item.idealFor }}
          </p>
          <p class="mt-5 text-sm font-semibold text-yom-blue">
            {{ item.cta }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

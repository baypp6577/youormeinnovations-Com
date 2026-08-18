<script setup lang="ts">
import { audiences } from '@/data/site'
</script>

<template>
  <section id="audiences" class="bg-white py-20 sm:py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto mb-14 max-w-3xl text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-blue">{{ audiences.eyebrow }}</p>
        <h2 class="mt-3 font-display text-3xl font-bold text-yom-navy sm:text-4xl">{{ audiences.title }}</h2>
      </div>

      <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="item in audiences.items"
          :key="item.id"
          class="rounded-3xl border border-slate-200/80 bg-yom-surface p-7 shadow-lg shadow-slate-200/30"
        >
          <h3 class="font-display text-xl font-bold text-yom-navy">{{ item.title }}</h3>
          <p class="mt-3 text-sm leading-relaxed text-slate-600">{{ item.description }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

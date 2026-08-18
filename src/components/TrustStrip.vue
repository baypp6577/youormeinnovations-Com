<script setup lang="ts">
import { trustStrip } from '@/data/site'
</script>

<template>
  <section class="border-y border-slate-200 bg-white">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <h2 class="font-display text-2xl font-bold text-yom-navy sm:text-3xl">
          {{ trustStrip.headline }}
        </h2>
        <p class="text-sm leading-relaxed text-slate-600 sm:text-base">
          {{ trustStrip.description }}
        </p>
      </div>
    </div>
  </section>
</template>

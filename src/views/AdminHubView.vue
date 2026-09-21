<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { BLOG_ADMIN_PATH, DIGITAL_PRODUCTS_ADMIN_PATH } from '@/lib/adminPaths'
import { portal } from '@/data/site'
</script>

<template>
  <section class="min-h-screen bg-yom-surface py-12 sm:py-16">
    <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-blue">You Or Me · Site admin</p>
      <h1 class="mt-2 font-display text-3xl font-bold text-yom-navy sm:text-4xl">Admin</h1>
      <p class="mt-3 text-slate-600">
        {{ portal.description }}
      </p>
      <ul class="mt-6 grid gap-3 sm:grid-cols-2">
        <li
          v-for="point in portal.points"
          :key="point"
          class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-yom-navy"
        >
          {{ point }}
        </li>
      </ul>

      <div class="mt-10 grid gap-4 sm:grid-cols-2">
        <RouterLink
          :to="DIGITAL_PRODUCTS_ADMIN_PATH"
          class="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 transition hover:border-yom-blue/40"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-yom-blue">Products</p>
          <h2 class="mt-2 font-display text-xl font-bold text-yom-navy">Digital Products</h2>
          <p class="mt-2 text-sm text-slate-600">Upload private PDFs and edit Stripe ladder product details.</p>
        </RouterLink>

        <RouterLink
          :to="BLOG_ADMIN_PATH"
          class="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 transition hover:border-yom-blue/40"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-yom-blue">Content</p>
          <h2 class="mt-2 font-display text-xl font-bold text-yom-navy">Blog CMS</h2>
          <p class="mt-2 text-sm text-slate-600">Add, edit and publish blog posts on youormeinnovations.com.</p>
        </RouterLink>
      </div>

      <p class="mt-8 text-sm text-slate-500">
        <RouterLink to="/" class="font-semibold text-yom-blue hover:underline">Back to site home</RouterLink>
      </p>
    </div>
  </section>
</template>

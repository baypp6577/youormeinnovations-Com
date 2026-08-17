<script setup lang="ts">
import { brand, contact, footerLinks } from '@/data/site'
</script>

<template>
  <footer id="contact" class="bg-yom-navy text-slate-200">
    <div class="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
      <div class="lg:col-span-2">
        <div class="mb-4 flex items-center gap-3">
          <span
            class="flex h-12 w-12 items-center justify-center rounded-full border border-yom-gold/30 bg-yom-navy-light text-sm font-bold text-white"
            aria-hidden="true"
          >
            {{ brand.shortName }}
          </span>
          <p class="font-display text-lg font-semibold text-white">{{ brand.name }}</p>
        </div>
        <p class="max-w-md text-sm leading-relaxed text-slate-300">
          {{ brand.tagline }}
        </p>
      </div>

      <div>
        <h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-yom-gold">Company</h2>
        <ul class="space-y-2 text-sm">
          <li v-for="link in footerLinks.company" :key="link.href">
            <a :href="link.href" class="text-slate-300 transition hover:text-white">{{ link.label }}</a>
          </li>
        </ul>
      </div>

      <div>
        <h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-yom-gold">Connect</h2>
        <ul class="space-y-2 text-sm">
          <li v-for="link in footerLinks.resources" :key="link.href">
            <a
              :href="link.href"
              class="text-slate-300 transition hover:text-white"
              :target="link.href.startsWith('http') ? '_blank' : undefined"
              :rel="link.href.startsWith('http') ? 'noopener noreferrer' : undefined"
            >
              {{ link.label }}
            </a>
          </li>
          <li v-if="contact.phone">
            <a :href="`tel:${contact.phone.replace(/\s/g, '')}`" class="text-slate-300 transition hover:text-white">
              {{ contact.phone }}
            </a>
          </li>
          <li>
            <a :href="`mailto:${contact.email}`" class="text-slate-300 transition hover:text-white">
              {{ contact.email }}
            </a>
          </li>
          <li v-if="contact.website">
            <a
              :href="contact.website"
              class="text-slate-300 transition hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ contact.website.replace(/^https?:\/\//, '') }}
            </a>
          </li>
        </ul>
      </div>
    </div>

    <div class="border-t border-white/10 py-5 text-center text-xs text-slate-400">
      © {{ new Date().getFullYear() }} {{ brand.name }}. All rights reserved.
    </div>
  </footer>
</template>

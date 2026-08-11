<script setup lang="ts">
import { navLinks } from '@/data/site'
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-white/10 bg-yom-navy/90 backdrop-blur-xl supports-[backdrop-filter]:bg-yom-navy/75"
  >
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
      <a href="#home" class="group flex items-center gap-3 no-underline">
        <span
          class="flex h-11 w-11 items-center justify-center rounded-full border border-yom-gold/40 bg-gradient-to-br from-yom-blue to-yom-navy-light text-sm font-bold tracking-tight text-white shadow-lg shadow-yom-blue/20 transition group-hover:scale-105"
          aria-hidden="true"
        >
          YOM
        </span>
        <span class="hidden font-display text-sm font-semibold uppercase tracking-[0.18em] text-white sm:block">
          You Or Me Innovations
        </span>
      </a>

      <nav class="hidden items-center gap-1 lg:flex" aria-label="Primary">
        <a
          v-for="link in navLinks"
          :key="link.href"
          :href="link.href"
          class="rounded-full px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yom-gold"
          :class="link.href === '#home' ? 'bg-white/10 text-white' : ''"
        >
          {{ link.label }}
        </a>
      </nav>

      <a
        href="#contact"
        class="rounded-full bg-gradient-to-r from-yom-gold to-yom-gold-soft px-4 py-2 text-sm font-semibold text-yom-navy shadow-md shadow-yom-gold/25 transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yom-gold"
      >
        Work with us
      </a>
    </div>
  </header>
</template>

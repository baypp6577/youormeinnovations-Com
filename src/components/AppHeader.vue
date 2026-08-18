<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { hero, navLinks } from '@/data/site'
import BrandLogo from '@/components/BrandLogo.vue'

const menuOpen = ref(false)
const menuButton = ref<HTMLButtonElement | null>(null)

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && menuOpen.value) {
    closeMenu()
    menuButton.value?.focus()
  }
}

function onResize() {
  if (window.matchMedia('(min-width: 1024px)').matches) {
    closeMenu()
  }
}

watch(menuOpen, (open) => {
  document.body.classList.toggle('overflow-hidden', open)
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  document.body.classList.remove('overflow-hidden')
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-white/10 bg-yom-navy/90 backdrop-blur-xl supports-[backdrop-filter]:bg-yom-navy/75"
  >
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
      <a href="#home" class="group min-w-0 no-underline" aria-label="You Or Me Innovations" @click="closeMenu">
        <BrandLogo compact />
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

      <div class="flex shrink-0 items-center gap-2">
        <a
          :href="hero.primaryCta.href"
          :target="hero.primaryCta.external ? '_blank' : undefined"
          :rel="hero.primaryCta.external ? 'noopener noreferrer' : undefined"
          class="hidden rounded-full bg-gradient-to-r from-yom-gold to-yom-gold-soft px-4 py-2 text-sm font-semibold text-yom-navy shadow-md shadow-yom-gold/25 transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yom-gold sm:inline-flex"
        >
          {{ hero.primaryCta.label }}
        </a>

        <button
          ref="menuButton"
          type="button"
          class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yom-gold lg:hidden"
          :aria-expanded="menuOpen"
          aria-controls="mobile-nav"
          :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
          @click="toggleMenu"
        >
          <svg v-if="!menuOpen" class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>

    <div
      v-if="menuOpen"
      class="border-t border-white/10 bg-yom-navy lg:hidden"
      id="mobile-nav"
    >
      <nav class="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6" aria-label="Mobile">
        <a
          v-for="link in navLinks"
          :key="link.href"
          :href="link.href"
          class="rounded-xl px-4 py-3 text-base font-medium text-slate-200 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yom-gold"
          @click="closeMenu"
        >
          {{ link.label }}
        </a>
        <a
          :href="hero.primaryCta.href"
          :target="hero.primaryCta.external ? '_blank' : undefined"
          :rel="hero.primaryCta.external ? 'noopener noreferrer' : undefined"
          class="mt-2 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-yom-gold to-yom-gold-soft px-4 py-3 text-sm font-semibold text-yom-navy shadow-md shadow-yom-gold/25 transition hover:brightness-105 sm:hidden"
          @click="closeMenu"
        >
          {{ hero.primaryCta.label }}
        </a>
      </nav>
    </div>
  </header>
</template>

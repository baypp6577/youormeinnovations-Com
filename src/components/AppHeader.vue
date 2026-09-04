<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { hero, navLinks } from '@/data/site'
import BrandLogo from '@/components/BrandLogo.vue'

const route = useRoute()
const menuOpen = ref(false)
const menuButton = ref<HTMLButtonElement | null>(null)

function isAppPath(href: string) {
  return href.startsWith('/') && !href.includes('#')
}

function navHref(href: string) {
  if (href.startsWith('#') && route.path !== '/') return `/${href}`
  return href
}

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
  <header class="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-yom-navy shadow-lg">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between gap-3 py-3 lg:py-5">
        <RouterLink to="/" class="flex min-w-0 items-center no-underline" aria-label="You Or Me Innovations" @click="closeMenu">
          <BrandLogo compact grow-on-desktop />
        </RouterLink>

        <nav class="relative hidden items-center gap-1 lg:flex" aria-label="Primary">
          <template v-for="link in navLinks" :key="link.href">
            <RouterLink
              v-if="isAppPath(link.href)"
              :to="link.href"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-200 hover:text-yom-gold-soft"
              :class="route.path === link.href || route.path.startsWith(`${link.href}/`) ? 'text-white' : ''"
            >
              {{ link.label }}
            </RouterLink>
            <a
              v-else
              :href="navHref(link.href)"
              :data-contact-subject="link.href === '#contact-section' ? 'General enquiry — Navigation' : undefined"
              :data-contact-source="link.href === '#contact-section' ? 'Header navigation' : undefined"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-200 hover:text-yom-gold-soft"
              :class="link.href === '#home' && route.path === '/' ? 'text-white' : ''"
            >
              {{ link.label }}
            </a>
          </template>
          <a
            :href="navHref(hero.primaryCta.href)"
            :target="hero.primaryCta.external ? '_blank' : undefined"
            :rel="hero.primaryCta.external ? 'noopener noreferrer' : undefined"
            :data-contact-subject="hero.primaryCta.contactSubject"
            :data-contact-source="hero.primaryCta.contactSource"
            class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-yom-gold to-yom-gold-soft px-4 py-1.5 text-sm font-bold text-yom-navy shadow-md shadow-yom-gold/25 transition hover:brightness-105"
          >
            {{ hero.primaryCta.label }}
          </a>
        </nav>

        <div class="lg:hidden">
          <button
            ref="menuButton"
            type="button"
            class="text-white hover:text-yom-gold-soft"
            :aria-expanded="menuOpen"
            aria-controls="mobile-nav"
            :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
            @click="toggleMenu"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path
                v-if="!menuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="menuOpen" class="pb-3 lg:hidden" id="mobile-nav">
        <nav class="space-y-1 px-2 pt-2 sm:px-3" aria-label="Mobile">
          <template v-for="link in navLinks" :key="`m-${link.href}`">
            <RouterLink
              v-if="isAppPath(link.href)"
              :to="link.href"
              class="block w-full rounded-md px-3 py-2.5 text-base font-medium text-slate-100 hover:bg-white/5 hover:text-yom-gold-soft"
              @click="closeMenu"
            >
              {{ link.label }}
            </RouterLink>
            <a
              v-else
              :href="navHref(link.href)"
              :data-contact-subject="link.href === '#contact-section' ? 'General enquiry — Navigation' : undefined"
              :data-contact-source="link.href === '#contact-section' ? 'Mobile navigation' : undefined"
              class="block w-full rounded-md px-3 py-2.5 text-base font-medium text-slate-100 hover:bg-white/5 hover:text-yom-gold-soft"
              @click="closeMenu"
            >
              {{ link.label }}
            </a>
          </template>
          <a
            :href="navHref(hero.primaryCta.href)"
            :target="hero.primaryCta.external ? '_blank' : undefined"
            :rel="hero.primaryCta.external ? 'noopener noreferrer' : undefined"
            :data-contact-subject="hero.primaryCta.contactSubject"
            :data-contact-source="hero.primaryCta.contactSource"
            class="mt-2 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-yom-gold to-yom-gold-soft px-4 py-2.5 text-sm font-bold text-yom-navy"
            @click="closeMenu"
          >
            {{ hero.primaryCta.label }}
          </a>
        </nav>
      </div>
    </div>
  </header>
  <div class="h-[4.5rem] shrink-0 lg:h-[7.25rem]" aria-hidden="true" />
</template>

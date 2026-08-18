<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import HeroCanvas from '@/components/HeroCanvas.vue'
import { heroBackgroundAnimation } from '@/config/hero-background'
import { hero } from '@/data/site'

const sectionRef = ref<HTMLElement | null>(null)
const heroInView = ref(true)
let observer: IntersectionObserver | null = null

const heroBgStyle = {
  '--hero-pulse-duration': `${heroBackgroundAnimation.pulseGlowDurationSec}s`,
} as Record<string, string>

onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      heroInView.value = Boolean(entry?.isIntersecting)
    },
    { rootMargin: '80px' },
  )
  if (sectionRef.value) observer.observe(sectionRef.value)
})

onUnmounted(() => observer?.disconnect())
</script>

<template>
  <section
    id="home"
    ref="sectionRef"
    class="relative overflow-hidden bg-gradient-to-br from-yom-navy via-yom-navy-light to-[#1a3a6b] text-white"
    :class="{ 'hero-offscreen': !heroInView }"
    :style="heroBgStyle"
  >
    <HeroCanvas />

    <!-- WCAG: dark scrim over animated background for text contrast -->
    <div class="pointer-events-none absolute inset-0 bg-yom-navy/55" aria-hidden="true" />

    <div
      class="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-yom-blue/20 blur-3xl animate-hero-pulse-glow"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-yom-gold/15 blur-3xl animate-hero-pulse-glow"
      aria-hidden="true"
    />

    <div class="relative mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
      <p
        class="animate-float-up mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-yom-gold-soft"
        style="animation-delay: 0.05s"
      >
        {{ hero.eyebrow }}
      </p>

      <h1
        class="animate-float-up font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
        style="animation-delay: 0.12s"
      >
        {{ hero.headline }}<br class="hidden sm:block" />
        <span class="bg-gradient-to-r from-white via-slate-100 to-yom-gold-soft bg-clip-text text-transparent">
          {{ hero.headlineAccent }}
        </span>
      </h1>

      <p
        class="animate-float-up mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg"
        style="animation-delay: 0.2s"
      >
        {{ hero.description }}
      </p>

      <div
        class="animate-float-up mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap"
        style="animation-delay: 0.28s"
      >
        <a
          :href="hero.primaryCta.href"
          :target="hero.primaryCta.external ? '_blank' : undefined"
          :rel="hero.primaryCta.external ? 'noopener noreferrer' : undefined"
          class="inline-flex min-w-[200px] items-center justify-center rounded-full bg-gradient-to-r from-yom-gold to-yom-gold-soft px-7 py-3.5 text-sm font-bold text-yom-navy shadow-lg shadow-yom-gold/30 transition hover:scale-[1.02] hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yom-gold"
        >
          {{ hero.primaryCta.label }}
        </a>
        <a
          :href="hero.secondaryCta.href"
          :target="hero.secondaryCta.external ? '_blank' : undefined"
          :rel="hero.secondaryCta.external ? 'noopener noreferrer' : undefined"
          class="inline-flex min-w-[200px] items-center justify-center rounded-full border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {{ hero.secondaryCta.label }}
        </a>
        <a
          v-if="hero.tertiaryCta"
          :href="hero.tertiaryCta.href"
          :target="hero.tertiaryCta.external ? '_blank' : undefined"
          :rel="hero.tertiaryCta.external ? 'noopener noreferrer' : undefined"
          data-contact-subject="Contact Us — Homepage hero"
          data-contact-source="Homepage hero"
          class="inline-flex min-w-[200px] items-center justify-center rounded-full border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {{ hero.tertiaryCta.label }}
        </a>
      </div>
    </div>
  </section>
</template>

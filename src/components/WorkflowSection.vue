<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { workflow } from '@/data/site'

const active = ref(0)
const sectionRef = ref<HTMLElement | null>(null)
let timer = 0
let observer: IntersectionObserver | null = null
let sectionVisible = true

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  observer = new IntersectionObserver(
    ([entry]) => {
      sectionVisible = Boolean(entry?.isIntersecting)
    },
    { rootMargin: '80px' },
  )
  if (sectionRef.value) observer.observe(sectionRef.value)

  timer = window.setInterval(() => {
    if (!sectionVisible) return
    active.value = (active.value + 1) % workflow.steps.length
  }, 2800)
})

onUnmounted(() => {
  observer?.disconnect()
  window.clearInterval(timer)
})
</script>

<template>
  <section id="workflow" ref="sectionRef" class="relative overflow-hidden bg-yom-navy py-20 text-white sm:py-24">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(47,111,237,0.25),transparent_50%)]" />

    <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-gold-soft">{{ workflow.eyebrow }}</p>
          <h2 class="mt-3 font-display text-3xl font-bold sm:text-4xl">{{ workflow.title }}</h2>
          <p class="mt-4 max-w-lg text-sm leading-relaxed text-slate-300 sm:text-base">
            {{ workflow.description }}
          </p>
          <a
            :href="workflow.cta.href"
            :target="workflow.cta.external ? '_blank' : undefined"
            :rel="workflow.cta.external ? 'noopener noreferrer' : undefined"
            :data-contact-subject="workflow.cta.contactSubject"
            :data-contact-source="workflow.cta.contactSource"
            class="mt-8 inline-flex rounded-full border border-yom-gold/40 px-5 py-2.5 text-sm font-semibold text-yom-gold-soft transition hover:bg-yom-gold/10"
          >
            {{ workflow.cta.label }}
          </a>
        </div>

        <div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <ol class="space-y-4">
            <li
              v-for="(step, index) in workflow.steps"
              :key="step.id"
              class="flex items-start gap-4 rounded-2xl p-4 transition"
              :class="active === index ? 'bg-white/10 ring-1 ring-yom-gold/40' : 'opacity-70'"
            >
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                :class="active === index ? 'bg-yom-gold text-yom-navy' : 'bg-white/10 text-white'"
              >
                {{ index + 1 }}
              </span>
              <div>
                <p class="font-display font-semibold">{{ step.label }}</p>
                <p class="text-sm text-slate-300">{{ step.description }}</p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  </section>
</template>

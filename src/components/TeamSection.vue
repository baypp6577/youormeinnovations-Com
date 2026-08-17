<script setup lang="ts">
import { hasTeamContent, team } from '@/data/site'
</script>

<template>
  <section id="team" class="bg-white py-20 sm:py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto mb-14 max-w-2xl text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-blue">{{ team.eyebrow }}</p>
        <h2 class="mt-3 font-display text-3xl font-bold text-yom-navy sm:text-4xl">{{ team.title }}</h2>
        <p class="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">{{ team.description }}</p>
      </div>

      <div v-if="hasTeamContent()" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="member in team.members"
          :key="member.id"
          class="rounded-3xl border border-slate-200/80 bg-yom-surface p-8 shadow-lg shadow-slate-200/40"
        >
          <div
            class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yom-blue/15 to-yom-gold/15 font-display text-xl font-bold text-yom-navy"
            aria-hidden="true"
          >
            {{ member.name.charAt(0) }}
          </div>
          <h3 class="font-display text-lg font-bold text-yom-navy">{{ member.name }}</h3>
          <p class="mt-1 text-sm font-medium text-yom-blue">{{ member.role }}</p>
          <p v-if="member.bio" class="mt-3 text-sm leading-relaxed text-slate-600">{{ member.bio }}</p>
        </article>
      </div>

      <div
        v-else
        class="mx-auto max-w-2xl rounded-3xl border border-dashed border-slate-300 bg-yom-surface/80 px-8 py-12 text-center"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-yom-slate">Coming soon</p>
        <p class="mt-4 text-sm leading-relaxed text-slate-600">{{ team.placeholderMessage }}</p>
      </div>
    </div>
  </section>
</template>

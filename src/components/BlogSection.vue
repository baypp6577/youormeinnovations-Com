<script setup lang="ts">
import { blog, hasBlogContent } from '@/data/site'
</script>

<template>
  <section id="blog" class="bg-yom-surface py-20 sm:py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto mb-14 max-w-2xl text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-blue">{{ blog.eyebrow }}</p>
        <h2 class="mt-3 font-display text-3xl font-bold text-yom-navy sm:text-4xl">{{ blog.title }}</h2>
        <p class="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">{{ blog.description }}</p>
      </div>

      <div v-if="hasBlogContent()" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="post in blog.posts"
          :key="post.id"
          class="flex flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50"
        >
          <p v-if="post.date" class="text-xs font-medium uppercase tracking-wider text-yom-slate">{{ post.date }}</p>
          <h3 class="mt-2 font-display text-lg font-bold text-yom-navy">{{ post.title }}</h3>
          <p class="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{{ post.excerpt }}</p>
          <a
            v-if="post.href"
            :href="post.href"
            class="mt-5 inline-flex text-sm font-semibold text-yom-blue transition hover:text-yom-navy"
          >
            Read more →
          </a>
        </article>
      </div>

      <div
        v-else
        class="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2"
      >
        <div
          v-for="n in 2"
          :key="n"
          class="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6"
        >
          <div class="h-3 w-20 rounded-full bg-slate-200" aria-hidden="true" />
          <div class="mt-4 h-4 w-3/4 rounded-full bg-slate-200" aria-hidden="true" />
          <div class="mt-3 space-y-2" aria-hidden="true">
            <div class="h-2.5 w-full rounded-full bg-slate-100" />
            <div class="h-2.5 w-5/6 rounded-full bg-slate-100" />
          </div>
        </div>
        <p class="sm:col-span-2 text-center text-sm leading-relaxed text-slate-600">
          {{ blog.placeholderMessage }}
        </p>
      </div>
    </div>
  </section>
</template>

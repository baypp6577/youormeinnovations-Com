<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { blog } from '@/data/site'
import {
  bundledBlogPosts,
  formatPostDate,
  postPath,
  publishedPosts,
  type YomBlogPost,
} from '@/lib/blog'

const posts = ref<YomBlogPost[]>(publishedPosts(bundledBlogPosts()))

onMounted(async () => {
  document.title = `${blog.title} | You Or Me Innovations`
  try {
    const res = await fetch('/api/blog?action=list')
    const data = (await res.json()) as { ok?: boolean; posts?: YomBlogPost[] }
    if (data.ok && Array.isArray(data.posts)) posts.value = publishedPosts(data.posts)
  } catch {
    /* bundled */
  }
})
</script>

<template>
  <section class="bg-yom-surface py-16 sm:py-24">
    <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-blue">{{ blog.eyebrow }}</p>
      <h1 class="mt-3 font-display text-3xl font-bold text-yom-navy sm:text-5xl">{{ blog.title }}</h1>
      <p class="mt-4 text-base leading-relaxed text-slate-600">{{ blog.description }}</p>

      <ul v-if="posts.length" class="mt-12 space-y-4">
        <li v-for="post in posts" :key="post.slug">
          <RouterLink
            :to="postPath(post.slug)"
            class="block rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/40 transition hover:border-yom-gold/60"
          >
            <p class="text-xs font-medium uppercase tracking-wider text-yom-slate">{{ formatPostDate(post.date) }}</p>
            <h2 class="mt-2 font-display text-xl font-bold text-yom-navy">{{ post.title }}</h2>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ post.excerpt }}</p>
            <p class="mt-4 text-sm font-semibold text-yom-blue">Read full article →</p>
          </RouterLink>
        </li>
      </ul>

      <p v-else class="mt-12 rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center text-sm text-slate-600">
        {{ blog.placeholderMessage }}
      </p>
    </div>
  </section>
</template>

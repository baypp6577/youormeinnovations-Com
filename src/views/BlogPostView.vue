<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { blog } from '@/data/site'
import {
  bodyParagraphs,
  bundledBlogPosts,
  findPublishedPost,
  formatPostDate,
  type YomBlogPost,
} from '@/lib/blog'

const route = useRoute()
const posts = ref<YomBlogPost[]>(bundledBlogPosts())
const loading = ref(true)

const slug = computed(() => String(route.params.slug || ''))
const post = computed(() => findPublishedPost(slug.value, posts.value))
const paragraphs = computed(() => (post.value ? bodyParagraphs(post.value.body) : []))

async function load() {
  loading.value = true
  try {
    const res = await fetch('/api/blog?action=list')
    const data = (await res.json()) as { ok?: boolean; posts?: YomBlogPost[] }
    if (data.ok && Array.isArray(data.posts)) posts.value = data.posts
  } catch {
    posts.value = bundledBlogPosts()
  } finally {
    loading.value = false
  }
}

watch(
  post,
  (current) => {
    document.title = current
      ? `${current.title} | You Or Me Innovations`
      : `Article | You Or Me Innovations`
  },
  { immediate: true },
)

onMounted(() => {
  load()
})
</script>

<template>
  <section class="bg-yom-surface py-16 sm:py-24">
    <article v-if="post" class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <p class="text-sm font-medium text-yom-blue">
        <RouterLink to="/blog" class="hover:underline">Blog</RouterLink>
        <span class="text-slate-400"> · </span>
        <span>{{ formatPostDate(post.date) }}</span>
      </p>
      <h1 class="mt-3 font-display text-3xl font-bold text-yom-navy sm:text-5xl">{{ post.title }}</h1>
      <p class="mt-4 text-lg leading-relaxed text-slate-600">{{ post.excerpt }}</p>
      <div class="mt-10 space-y-5 text-base leading-relaxed text-slate-700">
        <p v-for="(para, idx) in paragraphs" :key="idx" class="whitespace-pre-wrap">{{ para }}</p>
      </div>
      <p class="mt-12 flex flex-wrap items-center gap-x-4 gap-y-2">
        <RouterLink to="/blog" class="text-sm font-semibold text-yom-blue hover:text-yom-navy">← All articles</RouterLink>
        <a href="/#contact-section" class="text-sm font-semibold text-yom-navy hover:text-yom-blue">Start a project →</a>
      </p>
    </article>

    <div v-else-if="!loading" class="mx-auto max-w-3xl px-4 text-center sm:px-6">
      <h1 class="font-display text-3xl font-bold text-yom-navy">Article not found</h1>
      <p class="mt-3 text-sm text-slate-600">This post is unpublished or the link is out of date.</p>
      <RouterLink to="/blog" class="mt-6 inline-flex text-sm font-semibold text-yom-blue">Back to the blog</RouterLink>
    </div>

    <p v-else class="mx-auto max-w-3xl px-4 text-sm text-slate-500">{{ blog.title }}…</p>
  </section>
</template>

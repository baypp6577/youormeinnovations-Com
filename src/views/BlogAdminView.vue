<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { postPath, slugifyTitle, type YomBlogPost } from '@/lib/blog'

const authed = ref(false)
const checking = ref(true)
const password = ref('')
const notice = ref('')
const noticeErr = ref(false)
const saving = ref(false)
const posts = ref<YomBlogPost[]>([])
const originalSlug = ref('')
const form = ref(emptyForm())

const editing = computed(() => Boolean(originalSlug.value))

function emptyForm(): YomBlogPost {
  const today = new Date()
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return { slug: '', title: '', excerpt: '', date, body: '', published: true }
}

async function api(action: string, payload: Record<string, unknown> = {}, method: 'GET' | 'POST' = 'POST') {
  const url = method === 'GET' ? `/api/blog?action=${encodeURIComponent(action)}` : '/api/blog'
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
    body: method === 'POST' ? JSON.stringify({ action, ...payload }) : undefined,
  })
  const data = (await res.json()) as { ok?: boolean; error?: string; authed?: boolean; posts?: YomBlogPost[] }
  return { status: res.status, data }
}

function flash(message: string, err = false) {
  notice.value = message
  noticeErr.value = err
}

function startNew() {
  originalSlug.value = ''
  form.value = emptyForm()
}

function editPost(post: YomBlogPost) {
  originalSlug.value = post.slug
  form.value = { ...post, published: post.published !== false }
}

function onTitleInput() {
  if (!editing.value || !form.value.slug) {
    form.value.slug = slugifyTitle(form.value.title)
  }
}

async function refreshSession() {
  checking.value = true
  try {
    const { data } = await api('session', {}, 'GET')
    authed.value = Boolean(data.authed)
    if (authed.value) await loadPosts()
  } catch {
    authed.value = false
  } finally {
    checking.value = false
  }
}

async function loadPosts() {
  const { data } = await api('all', {}, 'GET')
  if (data.ok && Array.isArray(data.posts)) posts.value = data.posts
}

async function login() {
  flash('')
  const { data } = await api('login', { password: password.value })
  if (!data.ok) {
    flash(data.error || 'Could not sign in.', true)
    return
  }
  password.value = ''
  authed.value = true
  await loadPosts()
}

async function logout() {
  await api('logout')
  authed.value = false
  posts.value = []
  startNew()
}

async function savePost() {
  saving.value = true
  flash('')
  try {
    const { data } = await api('save', {
      ...form.value,
      originalSlug: originalSlug.value || form.value.slug,
    })
    if (!data.ok) {
      flash(data.error || 'Could not save.', true)
      return
    }
    if (Array.isArray(data.posts)) posts.value = data.posts
    originalSlug.value = form.value.slug
    flash('Saved. The public blog updates immediately via the API; a deploy follows if GitHub publish is configured.')
  } catch {
    flash('Network error — try again.', true)
  } finally {
    saving.value = false
  }
}

async function deletePost() {
  if (!originalSlug.value) return
  if (!window.confirm(`Remove “${form.value.title || originalSlug.value}”? This cannot be undone.`)) return
  saving.value = true
  flash('')
  try {
    const { data } = await api('delete', { slug: originalSlug.value })
    if (!data.ok) {
      flash(data.error || 'Could not remove this post.', true)
      return
    }
    if (Array.isArray(data.posts)) posts.value = data.posts
    startNew()
    flash('Post removed.')
  } catch {
    flash('Network error — try again.', true)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  document.title = 'Blog editor | You Or Me Innovations'
  refreshSession()
})
</script>

<template>
  <section class="min-h-[70vh] bg-slate-50 py-12">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-blue">You Or Me · Blog CMS</p>
      <div class="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 class="font-display text-3xl font-bold text-yom-navy">Add and edit articles</h1>
        <button
          v-if="authed"
          type="button"
          class="text-sm font-semibold text-slate-500 hover:text-yom-navy"
          @click="logout"
        >
          Sign out
        </button>
      </div>

      <p v-if="checking" class="mt-8 text-sm text-slate-500">Checking session…</p>

      <form
        v-else-if="!authed"
        class="mt-8 max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50"
        @submit.prevent="login"
      >
        <label class="block text-sm font-semibold text-yom-navy" for="blog-admin-password">Password</label>
        <input
          id="blog-admin-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          class="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          required
        />
        <p v-if="notice" class="mt-3 text-sm" :class="noticeErr ? 'text-red-700' : 'text-emerald-700'">{{ notice }}</p>
        <button
          type="submit"
          class="mt-5 inline-flex rounded-full bg-yom-navy px-5 py-2.5 text-sm font-semibold text-white"
        >
          Sign in
        </button>
      </form>

      <div v-else class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,16rem)_1fr]">
        <aside class="rounded-3xl border border-slate-200 bg-white p-4">
          <button
            type="button"
            class="mb-3 w-full rounded-full bg-yom-gold px-4 py-2 text-sm font-semibold text-yom-navy"
            @click="startNew"
          >
            New article
          </button>
          <ul class="space-y-1">
            <li v-for="post in posts" :key="post.slug">
              <button
                type="button"
                class="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50"
                :class="post.slug === originalSlug ? 'bg-slate-100 font-semibold text-yom-navy' : 'text-slate-700'"
                @click="editPost(post)"
              >
                <span class="block truncate">{{ post.title }}</span>
                <span class="text-xs text-slate-500">{{ post.published === false ? 'Draft' : 'Live' }}</span>
              </button>
            </li>
          </ul>
          <p v-if="!posts.length" class="px-1 text-sm text-slate-500">No articles yet.</p>
        </aside>

        <form class="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40" @submit.prevent="savePost">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="sm:col-span-2 text-sm font-semibold text-yom-navy">
              Title
              <input v-model="form.title" class="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" maxlength="200" required @input="onTitleInput" />
            </label>
            <label class="text-sm font-semibold text-yom-navy">
              Slug
              <input v-model="form.slug" class="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" maxlength="80" required />
            </label>
            <label class="text-sm font-semibold text-yom-navy">
              Date
              <input v-model="form.date" type="date" class="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" required />
            </label>
            <label class="sm:col-span-2 text-sm font-semibold text-yom-navy">
              Excerpt
              <textarea v-model="form.excerpt" class="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" rows="3" maxlength="500" required />
            </label>
            <label class="sm:col-span-2 text-sm font-semibold text-yom-navy">
              Full article
              <textarea v-model="form.body" class="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" rows="12" required />
              <span class="mt-1 block font-normal text-xs text-slate-500">Blank line between paragraphs. No HTML.</span>
            </label>
            <label class="flex items-center gap-2 text-sm font-semibold text-yom-navy">
              <input v-model="form.published" type="checkbox" />
              Published (show on the site)
            </label>
          </div>

          <p v-if="notice" class="mt-4 text-sm" :class="noticeErr ? 'text-red-700' : 'text-emerald-800'">{{ notice }}</p>

          <div class="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              class="rounded-full bg-yom-navy px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              :disabled="saving"
            >
              {{ saving ? 'Saving…' : 'Save article' }}
            </button>
            <button
              v-if="editing"
              type="button"
              class="rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700"
              :disabled="saving"
              @click="deletePost"
            >
              Delete
            </button>
            <RouterLink
              v-if="editing && form.published !== false"
              :to="postPath(form.slug)"
              class="rounded-full px-5 py-2.5 text-sm font-semibold text-yom-blue"
            >
              View public page
            </RouterLink>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

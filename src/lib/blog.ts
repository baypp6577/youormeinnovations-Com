import bundled from '@/data/blog-posts.json'

export type YomBlogPost = {
  slug: string
  title: string
  excerpt: string
  date: string
  body: string
  published?: boolean
}

export type YomBlogFile = {
  posts: YomBlogPost[]
}

export function postPath(slug: string): string {
  return `/blog/${encodeURIComponent(slug)}`
}

export function isPublished(post: YomBlogPost): boolean {
  return post.published !== false
}

export function sortPosts(posts: YomBlogPost[]): YomBlogPost[] {
  return [...posts].sort((a, b) => {
    const byDate = String(b.date || '').localeCompare(String(a.date || ''))
    if (byDate !== 0) return byDate
    return a.title.localeCompare(b.title)
  })
}

export function publishedPosts(posts: YomBlogPost[] = bundled.posts as YomBlogPost[]): YomBlogPost[] {
  return sortPosts(posts.filter(isPublished))
}

export function findPublishedPost(slug: string, posts: YomBlogPost[] = bundled.posts as YomBlogPost[]): YomBlogPost | undefined {
  return publishedPosts(posts).find((post) => post.slug === slug)
}

export function bodyParagraphs(body: string): string[] {
  return String(body || '')
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function formatPostDate(date: string): string {
  const raw = String(date || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const [year, month, day] = raw.split('-').map((n) => Number(n))
  const dt = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(dt.getTime())) return raw
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(dt)
}

export function bundledBlogPosts(): YomBlogPost[] {
  return Array.isArray(bundled.posts) ? (bundled.posts as YomBlogPost[]) : []
}

export function slugifyTitle(title: string): string {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

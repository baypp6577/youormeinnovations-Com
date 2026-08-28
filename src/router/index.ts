import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { BLOG_ADMIN_PATH } from '@/lib/adminPaths'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/blog',
      name: 'blog',
      component: () => import('@/views/BlogIndexView.vue'),
    },
    {
      path: '/blog/:slug',
      name: 'blog-post',
      component: () => import('@/views/BlogPostView.vue'),
    },
    {
      path: BLOG_ADMIN_PATH,
      name: 'blog-admin',
      component: () => import('@/views/BlogAdminView.vue'),
    },
  ],
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

export default router

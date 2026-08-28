import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'
import blogHandler from './api/blog'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function applyLocalEnv(mode: string) {
  const env = loadEnv(mode, process.cwd(), '')
  const keys = ['BLOG_ADMIN_PASSWORD', 'BLOG_ADMIN_SECRET', 'GITHUB_TOKEN', 'GITHUB_REPO', 'GITHUB_BRANCH']
  for (const key of keys) {
    if (env[key] && !process.env[key]) process.env[key] = env[key]
  }
}

function blogApiPlugin(): Plugin {
  return {
    name: 'yom-blog-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''
        if (!url.startsWith('/api/blog')) {
          next()
          return
        }
        Promise.resolve(blogHandler(req, res)).catch((error) => {
          console.error('blog-api middleware:', error instanceof Error ? error.message : error)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: 'Could not update blog posts.' }))
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  applyLocalEnv(mode)
  return {
    plugins: [vue(), tailwindcss(), blogApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})

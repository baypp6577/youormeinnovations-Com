<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { heroBackgroundAnimation } from '@/config/hero-background'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const { particleSpeed, linkDistance } = heroBackgroundAnimation

type Node = { x: number; y: number; vx: number; vy: number; r: number }

let raf = 0
let running = false
let visible = false
let needsResize = true
let nodes: Node[] = []
let width = 0
let height = 0
let observer: IntersectionObserver | null = null

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function initNodes() {
  const areaCount = Math.floor((width * height) / 28000)
  const count = Math.max(8, Math.min(width < 640 ? 16 : 28, areaCount))
  nodes = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * particleSpeed,
    vy: (Math.random() - 0.5) * particleSpeed,
    r: 1.2 + Math.random() * 2,
  }))
}

function resizeCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const rect = canvas.getBoundingClientRect()
  width = Math.max(1, Math.floor(rect.width))
  height = Math.max(1, Math.floor(rect.height))
  canvas.width = width * dpr
  canvas.height = height * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  initNodes()
  needsResize = false
}

function paint() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) return

  if (needsResize) resizeCanvas(canvas, ctx)

  ctx.clearRect(0, 0, width, height)

  for (const node of nodes) {
    node.x += node.vx
    node.y += node.vy
    if (node.x < 0 || node.x > width) node.vx *= -1
    if (node.y < 0 || node.y > height) node.vy *= -1
  }

  ctx.lineWidth = 1
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i]
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const distSq = dx * dx + dy * dy
      const maxSq = linkDistance * linkDistance
      if (distSq >= maxSq) continue
      const alpha = 1 - Math.sqrt(distSq) / linkDistance
      ctx.strokeStyle = `rgba(91, 141, 239, ${alpha * 0.28})`
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
  }

  ctx.fillStyle = 'rgba(201, 162, 39, 0.75)'
  for (const node of nodes) {
    ctx.beginPath()
    ctx.arc(node.x, node.y, node.r * 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

function loop() {
  raf = 0
  if (!running || !visible || document.hidden) return
  paint()
  raf = requestAnimationFrame(loop)
}

function start() {
  if (prefersReducedMotion() || document.hidden || (running && raf)) return
  running = true
  if (!raf) raf = requestAnimationFrame(loop)
}

function stop() {
  running = false
  if (raf) {
    cancelAnimationFrame(raf)
    raf = 0
  }
}

function onResize() {
  needsResize = true
}

function onVisibility() {
  if (document.hidden) stop()
  else if (visible) start()
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  window.addEventListener('resize', onResize, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)

  if (prefersReducedMotion()) {
    visible = true
    paint()
    return
  }

  observer = new IntersectionObserver(
    ([entry]) => {
      visible = Boolean(entry?.isIntersecting)
      if (visible) start()
      else stop()
    },
    { rootMargin: '80px' },
  )
  observer.observe(canvas)
})

onUnmounted(() => {
  stop()
  observer?.disconnect()
  window.removeEventListener('resize', onResize)
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="absolute inset-0 h-full w-full opacity-80"
    aria-hidden="true"
  />
</template>

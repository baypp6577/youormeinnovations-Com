<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as d3 from 'd3'

const canvasRef = ref<HTMLCanvasElement | null>(null)

type Node = { x: number; y: number; vx: number; vy: number; r: number }

let frame = 0
let nodes: Node[] = []

function initNodes(width: number, height: number) {
  const count = Math.min(48, Math.floor((width * height) / 18000))
  nodes = d3.range(count).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: 1.2 + Math.random() * 2,
  }))
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  const width = rect.width
  const height = rect.height

  if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    initNodes(width, height)
  }

  ctx.clearRect(0, 0, width, height)

  for (const node of nodes) {
    node.x += node.vx
    node.y += node.vy
    if (node.x < 0 || node.x > width) node.vx *= -1
    if (node.y < 0 || node.y > height) node.vy *= -1
  }

  const linkDistance = 120
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]
      const b = nodes[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const dist = Math.hypot(dx, dy)
      if (dist < linkDistance) {
        const alpha = 1 - dist / linkDistance
        ctx.strokeStyle = `rgba(91, 141, 239, ${alpha * 0.35})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
    }
  }

  for (const node of nodes) {
    const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 4)
    gradient.addColorStop(0, 'rgba(201, 162, 39, 0.9)')
    gradient.addColorStop(1, 'rgba(47, 111, 237, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(node.x, node.y, node.r * 2, 0, Math.PI * 2)
    ctx.fill()
  }

  frame = requestAnimationFrame(draw)
}

onMounted(() => {
  frame = requestAnimationFrame(draw)
  window.addEventListener('resize', draw)
})

onUnmounted(() => {
  cancelAnimationFrame(frame)
  window.removeEventListener('resize', draw)
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="absolute inset-0 h-full w-full opacity-80"
    aria-hidden="true"
  />
</template>

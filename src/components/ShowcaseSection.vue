<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as d3 from 'd3'
import { projects, type ShowcaseType } from '@/data/site'

const showcaseItems = projects.items

const svgRef = ref<SVGSVGElement | null>(null)
const sectionRef = ref<HTMLElement | null>(null)
const activeId = ref<string>(showcaseItems[0]?.id ?? '')

let timer = 0
let spinFrame = 0
let sectionVisible = true
let observer: IntersectionObserver | null = null
let reduceMotion = false

function render(type: ShowcaseType) {
  cancelAnimationFrame(spinFrame)
  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const width = 320
  const height = 220
  svg.attr('viewBox', `0 0 ${width} ${height}`)

  const g = svg.append('g')

  if (type === 'globe') {
    const projection = d3
      .geoOrthographic()
      .scale(78)
      .translate([width / 2, height / 2])
      .clipAngle(90)

    const path = d3.geoPath(projection)
    const graticule = d3.geoGraticule10()

    let lambda = 0

    function spin() {
      if (!sectionVisible || document.hidden) return
      projection.rotate([lambda, -12])
      g.selectAll('path').attr('d', path as never)
      lambda += 0.3
      spinFrame = requestAnimationFrame(spin)
    }

    g.append('path')
      .datum(graticule)
      .attr('fill', 'rgba(47,111,237,0.15)')
      .attr('stroke', 'rgba(91,141,239,0.45)')
      .attr('stroke-width', 0.7)

    g.append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', 78)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(201,162,39,0.55)')
      .attr('stroke-width', 1.5)

    if (!reduceMotion) spin()
    return
  }

  if (type === 'dashboard') {
    const data = [32, 48, 40, 62, 55, 78, 70]
    const x = d3.scaleBand().domain(data.map((_, i) => String(i))).range([24, width - 24]).padding(0.25)
    const y = d3.scaleLinear().domain([0, 80]).range([height - 30, 24])

    g.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', (_, i) => x(String(i)) ?? 0)
      .attr('y', (d) => y(d))
      .attr('width', x.bandwidth())
      .attr('height', (d) => height - 30 - y(d))
      .attr('rx', 4)
      .attr('fill', (_, i) => (i === data.length - 1 ? '#c9a227' : '#2f6fed'))
      .attr('opacity', 0.85)
    return
  }

  if (type === 'workflow') {
    const nodes = [
      { id: 'brief', x: 50, y: height / 2 },
      { id: 'design', x: width / 2, y: 40 },
      { id: 'build', x: width / 2, y: height - 40 },
      { id: 'launch', x: width - 50, y: height / 2 },
    ]
    const links = [
      ['brief', 'design'],
      ['brief', 'build'],
      ['design', 'launch'],
      ['build', 'launch'],
    ]

    g.selectAll('line')
      .data(links)
      .join('line')
      .attr('x1', (d) => nodes.find((n) => n.id === d[0])!.x)
      .attr('y1', (d) => nodes.find((n) => n.id === d[0])!.y)
      .attr('x2', (d) => nodes.find((n) => n.id === d[1])!.x)
      .attr('y2', (d) => nodes.find((n) => n.id === d[1])!.y)
      .attr('stroke', 'rgba(91,141,239,0.5)')
      .attr('stroke-width', 2)

    g.selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', 14)
      .attr('fill', '#2f6fed')
      .attr('stroke', '#c9a227')
      .attr('stroke-width', 2)
    return
  }

  const before = [28, 35, 22]
  const after = [52, 68, 61]
  const groups = [
    { label: 'Before', values: before, x: 60 },
    { label: 'After', values: after, x: 200 },
  ]
  const y = d3.scaleLinear().domain([0, 70]).range([height - 28, 24])

  for (const group of groups) {
    g.selectAll(`rect.${group.label}`)
      .data(group.values)
      .join('rect')
      .attr('class', group.label)
      .attr('x', (_, i) => group.x + i * 22)
      .attr('y', (d) => y(d))
      .attr('width', 16)
      .attr('height', (d) => height - 28 - y(d))
      .attr('rx', 3)
      .attr('fill', group.label === 'After' ? '#c9a227' : '#64748b')
  }
}

watch(activeId, (id) => {
  const item = showcaseItems.find((s) => s.id === id)
  if (item) render(item.type)
})

onMounted(() => {
  if (!showcaseItems.length) return
  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  render(showcaseItems[0].type)
  if (reduceMotion) return

  observer = new IntersectionObserver(
    ([entry]) => {
      sectionVisible = Boolean(entry?.isIntersecting)
      if (sectionVisible) {
        const item = showcaseItems.find((s) => s.id === activeId.value)
        if (item?.type === 'globe') render('globe')
      } else {
        cancelAnimationFrame(spinFrame)
      }
    },
    { rootMargin: '80px' },
  )
  if (sectionRef.value) observer.observe(sectionRef.value)

  timer = window.setInterval(() => {
    if (!sectionVisible) return
    const idx = showcaseItems.findIndex((s) => s.id === activeId.value)
    activeId.value = showcaseItems[(idx + 1) % showcaseItems.length].id
  }, 4000)
})

onUnmounted(() => {
  observer?.disconnect()
  window.clearInterval(timer)
  cancelAnimationFrame(spinFrame)
})
</script>

<template>
  <section id="projects" ref="sectionRef" class="py-20 sm:py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-blue">{{ projects.eyebrow }}</p>
          <h2 class="mt-3 font-display text-3xl font-bold text-yom-navy sm:text-4xl">{{ projects.title }}</h2>
        </div>
        <p class="max-w-md text-sm text-slate-600">
          {{ projects.description }}
        </p>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <div
          class="flex min-h-[280px] items-center justify-center rounded-3xl border border-slate-200 bg-gradient-to-br from-yom-navy to-yom-navy-light p-6 shadow-xl"
        >
          <svg ref="svgRef" class="h-full w-full max-h-[240px]" role="img" aria-label="Animated showcase visualization" />
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <button
            v-for="item in showcaseItems"
            :key="item.id"
            type="button"
            class="rounded-2xl border p-5 text-left transition"
            :class="
              activeId === item.id
                ? 'border-yom-blue bg-yom-blue/5 shadow-md shadow-yom-blue/10'
                : 'border-slate-200 bg-white hover:border-yom-blue/40'
            "
            @click="activeId = item.id"
          >
            <p class="font-display text-sm font-bold text-yom-navy">{{ item.title }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ item.subtitle }}</p>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

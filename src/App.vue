<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import ChatAssistant from '@/components/ChatAssistant.vue'
import HostingUnavailableView from '@/views/HostingUnavailableView.vue'
import { bindContactHashClicks } from '@/lib/contact'
import { isAdminUiPath } from '@/lib/adminPaths'
import { fetchHomepageHostingStatus } from '@/lib/hostingSupport'

const route = useRoute()
const homepageDisabled = ref(false)

async function checkHosting() {
  if (route.path !== '/') {
    homepageDisabled.value = false
    return
  }
  const status = await fetchHomepageHostingStatus()
  homepageDisabled.value = Boolean(status?.homepageDisabled)
}

const hidePublicChrome = computed(
  () => isAdminUiPath(route.path) || (route.path === '/' && homepageDisabled.value)
)

function applyRobotsMeta() {
  const noIndex = isAdminUiPath(route.path) || String(route.meta.robots || '').includes('noindex')
  let el = document.querySelector('meta[name="robots"]')
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', 'robots')
    document.head.appendChild(el)
  }
  el.setAttribute('content', noIndex ? 'noindex, nofollow' : 'index, follow')
}

onMounted(() => {
  bindContactHashClicks()
  void checkHosting()
  applyRobotsMeta()
})

watch(
  () => route.path,
  () => {
    void checkHosting()
    applyRobotsMeta()
  }
)
</script>

<template>
  <HostingUnavailableView v-if="route.path === '/' && homepageDisabled" />
  <div v-else class="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden bg-white">
    <AppHeader v-if="!hidePublicChrome" />
    <RouterView />
    <AppFooter v-if="!hidePublicChrome" />
    <ChatAssistant v-if="!hidePublicChrome" />
  </div>
</template>

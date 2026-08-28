<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import ChatAssistant from '@/components/ChatAssistant.vue'
import { bindContactHashClicks } from '@/lib/contact'
import { isAdminUiPath } from '@/lib/adminPaths'

const route = useRoute()
const hidePublicChrome = computed(() => isAdminUiPath(route.path))

onMounted(() => {
  bindContactHashClicks()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white">
    <AppHeader v-if="!hidePublicChrome" />
    <RouterView />
    <AppFooter v-if="!hidePublicChrome" />
    <ChatAssistant v-if="!hidePublicChrome" />
  </div>
</template>

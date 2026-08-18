<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import ChatAssistant from '@/components/ChatAssistant.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white">
    <AppHeader />
    <RouterView />
    <AppFooter />
    <ChatAssistant />
  </div>
</template>

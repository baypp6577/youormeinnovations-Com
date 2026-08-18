<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { answerQuestion } from '@/lib/assistant'
import { brand } from '@/data/site'
import BrandLogo from '@/components/BrandLogo.vue'
import { openContactForm } from '@/lib/contact'

type ChatMessage = {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: string
  navigation?: { url: string; label: string }
}

const STORAGE_KEY = 'yom_chat_messages'

const isOpen = ref(false)
const inputText = ref('')
const isTyping = ref(false)
const messagesEnd = ref<HTMLElement | null>(null)

const welcome: ChatMessage = {
  id: 'welcome',
  sender: 'bot',
  timestamp: new Date().toISOString(),
  text: `Hello! I’m the ${brand.name} assistant. I can explain our services, PR packages, process, and how to start a project. What would you like to know?`,
  navigation: { url: '#services-detail', label: 'Explore Our Services' },
}

function loadMessages(): ChatMessage[] {
  if (typeof localStorage === 'undefined') return [welcome]
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [welcome]
    const parsed = JSON.parse(raw) as ChatMessage[]
    return parsed.length ? parsed : [welcome]
  } catch {
    return [welcome]
  }
}

const messages = ref<ChatMessage[]>(loadMessages())

watch(
  messages,
  (value) => {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value.slice(-40)))
  },
  { deep: true }
)

watch([messages, isTyping, isOpen], async () => {
  await nextTick()
  messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
})

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function followLink(url: string) {
  if (url.startsWith('http')) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  if (url.includes('contact')) {
    openContactForm('Chat assistant enquiry', 'Chat assistant')
  } else {
    window.location.hash = url.replace(/^#/, '')
  }
  isOpen.value = false
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isTyping.value) return

  messages.value.push({
    id: `u-${Date.now()}`,
    text,
    sender: 'user',
    timestamp: new Date().toISOString(),
  })
  inputText.value = ''
  isTyping.value = true

  await new Promise((resolve) => window.setTimeout(resolve, 500))
  const reply = answerQuestion(text)
  messages.value.push({
    id: `b-${Date.now()}`,
    text: reply.text,
    sender: 'bot',
    timestamp: new Date().toISOString(),
    navigation: reply.navigation,
  })
  isTyping.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    void sendMessage()
  }
}
</script>

<template>
  <div>
    <button
      v-if="!isOpen"
      type="button"
      class="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-yom-gold to-yom-gold-soft text-yom-navy shadow-lg shadow-yom-gold/30 transition hover:scale-110 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yom-gold md:bottom-6 md:right-6"
      aria-label="Open AI assistant"
      @click="isOpen = true"
    >
      <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 12a8 8 0 018-8h1a7 7 0 017 7v5.2A1.8 1.8 0 0118.2 18H9l-3.6 2.4A.8.8 0 014 19.7V12z"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <section
      v-if="isOpen"
      class="fixed bottom-20 right-2 left-2 z-50 flex h-[70vh] max-h-[500px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl md:bottom-24 md:left-auto md:right-6 md:w-96"
      aria-label="YOM AI assistant"
    >
      <header class="flex items-center justify-between bg-yom-navy px-4 py-3 text-white">
        <div>
          <p class="flex items-center gap-3 text-sm font-semibold">
            <BrandLogo compact />
            <span>AI Assistant</span>
          </p>
          <p class="mt-1 text-[11px] uppercase tracking-[0.16em] text-yom-gold-soft">Online · services brief</p>
        </div>
        <button
          type="button"
          class="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
          aria-label="Close assistant"
          @click="isOpen = false"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </header>

      <div class="flex-1 space-y-3 overflow-y-auto bg-yom-surface px-4 py-4">
        <div
          v-for="message in messages"
          :key="message.id"
          class="flex"
          :class="message.sender === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[85%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed"
            :class="
              message.sender === 'user'
                ? 'bg-yom-navy text-white'
                : 'border border-slate-200 bg-white text-slate-700'
            "
          >
            <p class="whitespace-pre-line">{{ message.text }}</p>
            <button
              v-if="message.navigation"
              type="button"
              class="mt-2 inline-flex rounded-full bg-gradient-to-r from-yom-gold to-yom-gold-soft px-3 py-1 text-xs font-semibold text-yom-navy"
              @click="followLink(message.navigation.url)"
            >
              {{ message.navigation.label }}
            </button>
            <p class="mt-1 text-[10px] opacity-60">{{ formatTime(message.timestamp) }}</p>
          </div>
        </div>

        <div v-if="isTyping" class="flex justify-start">
          <div class="rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <div class="flex gap-1">
              <span class="h-2 w-2 animate-bounce rounded-full bg-yom-navy" />
              <span class="h-2 w-2 animate-bounce rounded-full bg-yom-navy [animation-delay:150ms]" />
              <span class="h-2 w-2 animate-bounce rounded-full bg-yom-navy [animation-delay:300ms]" />
            </div>
          </div>
        </div>
        <div ref="messagesEnd" />
      </div>

      <div class="flex gap-2 border-t border-slate-200 bg-white p-3">
        <input
          v-model="inputText"
          type="text"
          class="min-w-0 flex-1 rounded-full border border-slate-200 bg-yom-surface px-4 py-2 text-sm text-yom-navy focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yom-gold"
          placeholder="Ask about a service..."
          @keydown="onKeydown"
        />
        <button
          type="button"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-yom-gold to-yom-gold-soft text-yom-navy disabled:opacity-50"
          :disabled="!inputText.trim() || isTyping"
          aria-label="Send message"
          @click="sendMessage"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 12l16-7-7 16-2-6-7-3z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  </div>
</template>

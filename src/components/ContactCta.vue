<script setup lang="ts">
import { openContactForm } from '@/lib/contact'

const props = withDefaults(
  defineProps<{
    subject: string
    source?: string
    label: string
    variant?: 'gold' | 'outline' | 'text'
  }>(),
  { variant: 'gold' },
)

function go() {
  openContactForm(props.subject, props.source || props.subject)
}
</script>

<template>
  <button
    type="button"
    :class="{
      'mt-8 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-yom-gold to-yom-gold-soft px-6 py-3.5 text-sm font-semibold text-yom-navy shadow-md shadow-yom-gold/20 transition hover:brightness-105 sm:w-auto':
        variant === 'gold',
      'mt-8 inline-flex w-full items-center justify-center rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto':
        variant === 'outline',
      'mt-8 inline-flex w-full items-center justify-center rounded-full border border-yom-navy/15 bg-white px-6 py-3.5 text-sm font-semibold text-yom-navy transition hover:border-yom-gold hover:text-yom-navy sm:w-auto':
        variant === 'text',
    }"
    @click="go"
  >
    {{ label }}
  </button>
</template>

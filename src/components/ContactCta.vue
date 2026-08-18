<script setup lang="ts">
import { openContactForm } from '@/lib/contact'

const props = withDefaults(
  defineProps<{
    subject: string
    source?: string
    label: string
    variant?: 'gold' | 'outline' | 'text'
  }>(),
  { variant: 'text' },
)

function go() {
  openContactForm(props.subject, props.source || props.subject)
}
</script>

<template>
  <button
    type="button"
    :class="{
      'inline-flex justify-center rounded-full bg-gradient-to-r from-yom-gold to-yom-gold-soft px-5 py-3 text-sm font-semibold text-yom-navy transition hover:brightness-105':
        variant === 'gold',
      'inline-flex justify-center rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10':
        variant === 'outline',
      'mt-5 text-left text-sm font-semibold text-yom-blue transition hover:text-yom-navy': variant === 'text',
    }"
    @click="go"
  >
    {{ label }}
  </button>
</template>

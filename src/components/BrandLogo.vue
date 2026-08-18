<script setup lang="ts">
withDefaults(
  defineProps<{
    compact?: boolean
  }>(),
  { compact: false },
)
</script>

<template>
  <!-- Exact lockup from HEADER / NAVIGATION brief: Logo = You Or Me Innovations -->
  <span class="inline-flex flex-col justify-center leading-none" aria-hidden="true">
    <span
      class="font-display font-bold tracking-tight text-white"
      :class="compact ? 'text-[0.95rem] sm:text-base' : 'text-lg sm:text-xl'"
    >
      You <span class="italic text-yom-gold">Or</span> Me
    </span>
    <span
      class="mt-0.5 font-semibold uppercase text-yom-gold-soft"
      :class="compact ? 'text-[0.55rem] tracking-[0.28em]' : 'text-[0.62rem] tracking-[0.34em]'"
    >
      Innovations
    </span>
  </span>
</template>

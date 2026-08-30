<script setup lang="ts">
withDefaults(
  defineProps<{
    compact?: boolean
  }>(),
  { compact: false },
)
</script>

<template>
  <!-- Original client mark (left) beside the HEADER brief wordmark, for client comparison -->
  <span class="inline-flex min-w-0 items-center gap-2.5 sm:gap-3">
    <img
      src="/images/yom-original-logo.png"
      alt=""
      width="72"
      height="96"
      class="shrink-0 rounded-md object-contain"
      :class="compact ? 'h-11 w-auto sm:h-12' : 'h-16 w-auto sm:h-20'"
    />
    <span class="h-9 w-px shrink-0 bg-white/25 sm:h-11" aria-hidden="true" />
    <span class="inline-flex min-w-0 flex-col justify-center leading-none" aria-hidden="true">
      <span
        class="inline-flex items-baseline font-display font-extrabold tracking-wide text-white"
        :class="compact ? 'gap-x-1.5 text-lg sm:gap-x-2 sm:text-xl' : 'gap-x-2 text-xl sm:gap-x-2.5 sm:text-2xl'"
      >
        <span>You</span>
        <span class="italic text-yom-gold">Or</span>
        <span>Me</span>
      </span>
      <span
        class="mt-1 font-semibold uppercase text-yom-gold-soft"
        :class="compact ? 'text-[0.6rem] tracking-[0.32em]' : 'text-[0.7rem] tracking-[0.38em]'"
      >
        Innovations
      </span>
    </span>
  </span>
</template>

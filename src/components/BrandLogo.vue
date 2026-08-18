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
      :class="compact ? 'h-10 w-auto sm:h-11' : 'h-14 w-auto sm:h-16'"
    />
    <span class="h-8 w-px shrink-0 bg-white/25 sm:h-10" aria-hidden="true" />
    <span class="inline-flex min-w-0 flex-col justify-center leading-none" aria-hidden="true">
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
  </span>
</template>

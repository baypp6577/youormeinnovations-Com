<script setup lang="ts">
withDefaults(
  defineProps<{
    compact?: boolean
    growOnDesktop?: boolean
  }>(),
  { compact: false, growOnDesktop: false },
)
</script>

<template>
  <span class="inline-flex min-w-0 items-center gap-3 sm:gap-4">
    <span
      class="relative shrink-0 overflow-hidden rounded-full bg-[#1a3358] shadow-[0_2px_10px_rgba(0,0,0,0.35)] ring-2 ring-white/80"
      :class="
        growOnDesktop
          ? compact
            ? 'h-12 w-12 sm:h-14 sm:w-14 lg:h-[4.75rem] lg:w-[4.75rem]'
            : 'h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24'
          : compact
            ? 'h-12 w-12'
            : 'h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]'
      "
    >
      <img
        src="/images/yom-original-logo.png"
        alt=""
        width="682"
        height="1024"
        class="absolute left-1/2 top-[36%] h-[175%] w-[175%] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover object-[center_8%]"
      />
    </span>
    <span class="inline-flex min-w-0 flex-col justify-center leading-none" aria-hidden="true">
      <span
        class="inline-flex items-baseline font-display font-extrabold tracking-wide text-white"
        :class="
          growOnDesktop
            ? compact
              ? 'gap-x-1.5 text-lg sm:gap-x-2 sm:text-xl lg:text-2xl'
              : 'gap-x-2 text-xl sm:gap-x-2.5 sm:text-2xl lg:text-3xl'
            : compact
              ? 'gap-x-1.5 text-lg sm:text-xl'
              : 'gap-x-2 text-xl sm:text-2xl'
        "
      >
        <span>You</span>
        <span class="italic text-yom-gold">Or</span>
        <span>Me</span>
      </span>
      <span
        class="mt-1 font-semibold uppercase text-yom-gold-soft"
        :class="
          growOnDesktop
            ? compact
              ? 'text-[0.62rem] tracking-[0.32em] lg:text-[0.72rem] lg:tracking-[0.4em]'
              : 'text-[0.7rem] tracking-[0.38em] lg:text-sm'
            : compact
              ? 'text-[0.6rem] tracking-[0.32em]'
              : 'text-[0.7rem] tracking-[0.38em]'
        "
      >
        Innovations
      </span>
    </span>
  </span>
</template>

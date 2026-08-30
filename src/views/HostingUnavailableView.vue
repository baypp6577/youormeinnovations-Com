<script setup lang="ts">
const renewHref = 'https://hometolive.net/hosting-support/subscribe/?clientId=youorme'
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center bg-yom-navy px-6 py-16 text-center text-white">
    <p class="text-sm font-semibold tracking-[0.2em] text-yom-gold uppercase">You Or Me Innovations</p>
    <h1 class="mt-4 max-w-xl font-display text-3xl font-semibold sm:text-4xl">This homepage is temporarily offline</h1>
    <p class="mt-4 max-w-lg text-sm leading-relaxed text-white/75">
      Yearly hosting support has expired. The site can be restored as soon as hosting support is renewed
      with HomeToLive.
    </p>
    <a
      :href="renewHref"
      class="mt-8 inline-flex items-center justify-center rounded-full bg-yom-gold px-6 py-3 text-sm font-semibold text-yom-navy"
    >
      Renew hosting support
    </a>
  </main>
</template>

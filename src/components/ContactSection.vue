<script setup lang="ts">
import ContactForm from '@/components/ContactForm.vue'
import { contact, contactSection } from '@/data/site'
</script>

<template>
  <section id="contact-section" class="overflow-x-clip bg-yom-surface py-16 sm:py-24">
    <div class="mx-auto grid max-w-7xl gap-8 px-3 sm:gap-10 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8">
      <div class="min-w-0">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-yom-blue sm:tracking-[0.24em]">{{ contactSection.eyebrow }}</p>
        <h2 class="mt-3 break-words font-display text-3xl font-bold text-yom-navy sm:text-4xl">{{ contactSection.title }}</h2>
        <p class="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">{{ contactSection.description }}</p>
        <p v-if="contact.servicesLine" class="mt-3 break-words text-sm font-medium text-yom-navy">
          {{ contact.servicesLine }}
        </p>
        <p class="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
          Use the form to send a message. We will come back to you by email.
        </p>

        <div class="mt-8 space-y-3 text-sm text-slate-700">
          <p v-if="contact.website" class="min-w-0 break-words">
            <strong>Website:</strong>
            <a class="ml-1 break-all text-yom-blue hover:text-yom-navy" :href="contact.website" target="_blank" rel="noopener noreferrer">
              {{ contact.website.replace(/^https?:\/\//, '') }}
            </a>
          </p>
        </div>
      </div>

      <div class="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl shadow-slate-200/40 sm:rounded-3xl sm:p-6 lg:p-8">
        <ContactForm />
      </div>
    </div>
  </section>
</template>

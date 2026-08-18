<script setup lang="ts">
import ContactForm from '@/components/ContactForm.vue'
import { contact, contactSection } from '@/data/site'
</script>

<template>
  <section id="contact-section" class="bg-yom-surface py-20 sm:py-24">
    <div class="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-blue">{{ contactSection.eyebrow }}</p>
        <h2 class="mt-3 font-display text-3xl font-bold text-yom-navy sm:text-4xl">{{ contactSection.title }}</h2>
        <p class="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">{{ contactSection.description }}</p>
        <p class="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
          Use the form to send a message. We will come back to you by email.
        </p>

        <div class="mt-8 space-y-3 text-sm text-slate-700">
          <p v-if="contact.website">
            <strong>Website:</strong>
            <a class="ml-1 text-yom-blue hover:text-yom-navy" :href="contact.website" target="_blank" rel="noopener noreferrer">
              {{ contact.website.replace(/^https?:\/\//, '') }}
            </a>
          </p>
          <p>
            <a
              :href="contact.portal"
              target="_blank"
              rel="noopener noreferrer"
              class="font-semibold text-yom-blue hover:text-yom-navy"
            >
              Start your project in the client portal
            </a>
          </p>
        </div>
      </div>

      <div class="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/40">
        <ContactForm />
      </div>
    </div>
  </section>
</template>

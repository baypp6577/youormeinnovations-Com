<script setup lang="ts">
import { contact, contactSection } from '@/data/site'
</script>

<template>
  <section id="contact-section" class="bg-yom-surface py-20 sm:py-24">
    <div class="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-yom-blue">{{ contactSection.eyebrow }}</p>
        <h2 class="mt-3 font-display text-3xl font-bold text-yom-navy sm:text-4xl">{{ contactSection.title }}</h2>
        <p class="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">{{ contactSection.description }}</p>

        <div class="mt-8 space-y-3 text-sm text-slate-700">
          <p><strong>Email:</strong> <a class="text-yom-blue hover:text-yom-navy" :href="`mailto:${contact.email}`">{{ contact.email }}</a></p>
          <p v-if="contact.phone"><strong>Phone / WhatsApp:</strong> <a class="text-yom-blue hover:text-yom-navy" :href="`tel:${contact.phone.replace(/\s/g, '')}`">{{ contact.phone }}</a></p>
          <p v-if="contact.website"><strong>Website:</strong> <a class="text-yom-blue hover:text-yom-navy" :href="contact.website" target="_blank" rel="noopener noreferrer">{{ contact.website }}</a></p>
        </div>
      </div>

      <div class="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/40">
        <form class="grid gap-4">
          <input type="text" placeholder="Name" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-yom-blue" />
          <input type="email" placeholder="Email Address" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-yom-blue" />
          <input type="text" placeholder="Phone / WhatsApp" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-yom-blue" />
          <input type="text" placeholder="Company / Organisation" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-yom-blue" />

          <select class="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-yom-blue">
            <option selected disabled>What do you need help with?</option>
            <option v-for="service in contactSection.services" :key="service">{{ service }}</option>
          </select>

          <textarea
            rows="5"
            placeholder="Tell us about your project"
            class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-yom-blue"
          />

          <div class="flex flex-col gap-3 sm:flex-row">
            <button type="button" class="inline-flex justify-center rounded-full bg-gradient-to-r from-yom-gold to-yom-gold-soft px-5 py-3 text-sm font-semibold text-yom-navy transition hover:brightness-105">
              {{ contactSection.submitLabel }}
            </button>
            <a
              :href="contact.portal"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex justify-center rounded-full border border-yom-blue/20 px-5 py-3 text-sm font-semibold text-yom-blue transition hover:bg-yom-blue/5"
            >
              Start your project
            </a>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

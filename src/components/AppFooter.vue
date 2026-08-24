<script setup lang="ts">
import { brand, contact, footerLinks } from '@/data/site'
import BrandLogo from '@/components/BrandLogo.vue'
</script>

<template>
  <footer id="contact" class="bg-yom-navy text-slate-200">
    <div class="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-5 lg:px-8">
      <div class="lg:col-span-1">
        <div class="mb-4">
          <BrandLogo />
        </div>
        <p class="max-w-md text-sm leading-relaxed text-slate-300">
          {{ brand.tagline }}
        </p>
        <p v-if="contact.servicesLine" class="mt-3 text-xs uppercase tracking-wider text-yom-gold-soft">
          {{ contact.servicesLine }}
        </p>
      </div>

      <div>
        <h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-yom-gold">Company</h2>
        <ul class="space-y-2 text-sm">
          <li v-for="link in footerLinks.company" :key="link.href">
            <a
              :href="link.href"
              :data-contact-subject="link.href === '#contact-section' ? 'General enquiry — Footer' : undefined"
              :data-contact-source="link.href === '#contact-section' ? 'Footer company links' : undefined"
              class="text-slate-300 transition hover:text-white"
            >{{ link.label }}</a>
          </li>
        </ul>
      </div>

      <div>
        <h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-yom-gold">Services</h2>
        <ul class="space-y-2 text-sm">
          <li v-for="link in footerLinks.services" :key="link.label">
            <a :href="link.href" class="text-slate-300 transition hover:text-white">{{ link.label }}</a>
          </li>
        </ul>
      </div>

      <div>
        <h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-yom-gold">Client</h2>
        <ul class="space-y-2 text-sm">
          <li v-for="link in footerLinks.client" :key="link.label">
            <a
              :href="link.href"
              class="text-slate-300 transition hover:text-white"
              :data-contact-subject="link.contactSubject"
              :data-contact-source="link.contactSource"
              :target="link.external || link.href.startsWith('http') ? '_blank' : undefined"
              :rel="link.external || link.href.startsWith('http') ? 'noopener noreferrer' : undefined"
            >
              {{ link.label }}
            </a>
          </li>
        </ul>
      </div>

      <div>
        <h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-yom-gold">Legal</h2>
        <ul class="space-y-2 text-sm">
          <li v-for="link in footerLinks.legal" :key="link.label">
            <a :href="link.href" class="text-slate-300 transition hover:text-white">{{ link.label }}</a>
          </li>
        </ul>
        <p v-if="contact.website" class="mt-4 text-sm">
          <a
            :href="contact.website"
            class="text-slate-300 transition hover:text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ contact.website.replace(/^https?:\/\//, '') }}
          </a>
        </p>
        <p v-if="contact.socialNote" class="mt-2 text-xs text-slate-400">
          {{ contact.socialNote }}
        </p>
      </div>
    </div>

    <div class="border-t border-white/10 py-5 text-center text-xs text-slate-400">
      © {{ new Date().getFullYear() }} {{ brand.name }}. All rights reserved.
    </div>
  </footer>
</template>

<script setup lang="ts">
import { brand, contact, footerLinks } from '@/data/site'
import BrandLogo from '@/components/BrandLogo.vue'
</script>

<template>
  <footer id="contact" class="bg-yom-navy text-slate-200">
    <div class="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-5 lg:px-8">
      <div class="lg:col-span-2">
        <div class="mb-4">
          <BrandLogo />
        </div>
        <p class="max-w-md text-sm leading-relaxed text-slate-300">
          {{ brand.tagline }}
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
        <h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-yom-gold">Connect</h2>
        <ul class="space-y-2 text-sm">
          <li v-for="link in footerLinks.resources" :key="link.label">
            <a
              :href="link.href"
              class="text-slate-300 transition hover:text-white"
              :data-contact-subject="link.contactSubject"
              :data-contact-source="link.contactSource"
              :target="link.href.startsWith('http') ? '_blank' : undefined"
              :rel="link.href.startsWith('http') ? 'noopener noreferrer' : undefined"
            >
              {{ link.label }}
            </a>
          </li>
          <li>
            <a
              href="#contact-section"
              data-contact-subject="General enquiry — Footer"
              data-contact-source="Footer"
              class="text-slate-300 transition hover:text-white"
            >
              Send a message
            </a>
          </li>
          <li v-if="contact.website">
            <a
              :href="contact.website"
              class="text-slate-300 transition hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ contact.website.replace(/^https?:\/\//, '') }}
            </a>
          </li>
          <li v-if="contact.socialNote" class="text-slate-400">
            {{ contact.socialNote }}
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
      </div>
    </div>

    <div class="border-t border-white/10 py-5 text-center text-xs text-slate-400">
      © {{ new Date().getFullYear() }} {{ brand.name }}. All rights reserved.
    </div>
  </footer>
</template>

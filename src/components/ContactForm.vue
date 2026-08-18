<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import {
  CONTACT_SUBJECT_EVENT,
  COUNTRY_CODES,
  consumeContactPrefill,
  type ContactPrefill,
} from '@/lib/contact'
import { contactSection } from '@/data/site'

const DEFAULT_SUBJECT = 'General enquiry'

const form = reactive({
  name: '',
  email: '',
  phone: '',
  countryCode: '+44',
  subject: DEFAULT_SUBJECT,
  message: '',
  company: '',
  website: '',
  issuedAt: Date.now(),
})

const source = ref(DEFAULT_SUBJECT)
const errors = reactive<Record<string, string>>({})
const isSubmitting = ref(false)
const submitStatus = ref('')
const submitOk = ref(false)

const interestedBanner = computed(() => {
  const value = form.subject.trim()
  if (!value || value === DEFAULT_SUBJECT) return ''
  return value
})

function applyPrefill(prefill: ContactPrefill | null) {
  if (!prefill) return
  form.subject = prefill.subject
  source.value = prefill.source
}

function onPrefillEvent(event: Event) {
  const detail = (event as CustomEvent<ContactPrefill>).detail
  if (detail?.subject) applyPrefill(detail)
}

function validateField(name: string, value: string): string {
  switch (name) {
    case 'name':
      if (!value.trim()) return 'Name is required'
      if (value.trim().length < 2) return 'Name must be at least 2 characters'
      if (!/^[\p{L}\s'-]+$/u.test(value.trim())) return 'Name can only contain letters, spaces, hyphens and apostrophes'
      return ''
    case 'email':
      if (!value.trim()) return 'Email is required'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Please enter a valid email address'
      return ''
    case 'phone':
      if (!value.trim()) return ''
      if (!/^[\d]{6,15}$/.test(value.replace(/[\s\-()]/g, ''))) return 'Please enter a valid phone number'
      return ''
    case 'subject':
      if (!value.trim()) return 'Subject is required'
      if (value.trim().length < 5) return 'Subject must be at least 5 characters'
      return ''
    case 'message':
      if (!value.trim()) return 'Message is required'
      if (value.trim().length < 10) return 'Message must be at least 10 characters'
      if (value.length > 1000) return 'Message cannot exceed 1000 characters'
      return ''
    default:
      return ''
  }
}

function onInput(name: 'name' | 'email' | 'phone' | 'subject' | 'message' | 'company' | 'website', value: string) {
  form[name] = value
  if (errors[name]) {
    const error = validateField(name, value)
    if (error) errors[name] = error
    else delete errors[name]
  }
}

function onBlur(name: string, value: string) {
  const error = validateField(name, value)
  if (error) errors[name] = error
  else delete errors[name]
}

function validateForm(): boolean {
  if (form.company.trim() || form.website.trim()) return false
  if (Date.now() - form.issuedAt < 3000) return false

  const next: Record<string, string> = {}
  for (const key of ['name', 'email', 'phone', 'subject', 'message'] as const) {
    const error = validateField(key, form[key])
    if (error) next[key] = error
  }
  Object.keys(errors).forEach((key) => delete errors[key])
  Object.assign(errors, next)
  return Object.keys(next).length === 0
}

function resetForm() {
  form.name = ''
  form.email = ''
  form.phone = ''
  form.countryCode = '+44'
  form.subject = DEFAULT_SUBJECT
  form.message = ''
  form.company = ''
  form.website = ''
  form.issuedAt = Date.now()
  source.value = DEFAULT_SUBJECT
  Object.keys(errors).forEach((key) => delete errors[key])
}

async function onSubmit() {
  submitStatus.value = ''
  submitOk.value = false

  if (!validateForm()) {
    if (form.company.trim() || form.website.trim() || Date.now() - form.issuedAt < 3000) {
      submitOk.value = true
      submitStatus.value = 'Message sent successfully!'
      resetForm()
      return
    }
    submitStatus.value = 'Please fix the errors above'
    return
  }

  isSubmitting.value = true
  try {
    const phoneDigits = form.phone.replace(/[\s\-()]/g, '')
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: phoneDigits ? `${form.countryCode}${phoneDigits}` : '',
        subject: form.subject.trim(),
        source: source.value,
        message: form.message.trim(),
        company: form.company,
        website: form.website,
        issuedAt: form.issuedAt,
        submitTime: Date.now(),
      }),
    })

    const result = (await response.json().catch(() => ({}))) as { success?: boolean; error?: string }
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Could not send your message')
    }

    submitOk.value = true
    submitStatus.value = 'Message sent successfully!'
    resetForm()
  } catch {
    submitStatus.value = 'An error occurred. Please try again later.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  applyPrefill(consumeContactPrefill())
  form.issuedAt = Date.now()
  window.addEventListener(CONTACT_SUBJECT_EVENT, onPrefillEvent)
})

onUnmounted(() => {
  window.removeEventListener(CONTACT_SUBJECT_EVENT, onPrefillEvent)
})
</script>

<template>
  <form class="relative grid gap-4" @submit.prevent="onSubmit" novalidate>
    <div
      v-if="submitStatus"
      class="rounded-2xl px-4 py-3 text-sm"
      :class="submitOk ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'"
    >
      {{ submitStatus }}
    </div>

    <div
      v-if="interestedBanner"
      class="rounded-2xl border border-yom-blue/20 bg-yom-blue/5 px-4 py-3 text-sm text-yom-navy"
    >
      You’re enquiring about <span class="font-semibold">{{ interestedBanner }}</span>
    </div>

    <div>
      <label for="contact-name" class="mb-1 block text-sm font-medium text-slate-700">Name *</label>
      <input
        id="contact-name"
        :value="form.name"
        type="text"
        autocomplete="name"
        maxlength="80"
        placeholder="Your name"
        class="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-yom-blue"
        :class="errors.name ? 'border-red-500' : 'border-slate-200'"
        :disabled="isSubmitting"
        @input="onInput('name', ($event.target as HTMLInputElement).value)"
        @blur="onBlur('name', form.name)"
      />
      <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
    </div>

    <div>
      <label for="contact-email" class="mb-1 block text-sm font-medium text-slate-700">Email *</label>
      <input
        id="contact-email"
        :value="form.email"
        type="email"
        autocomplete="email"
        placeholder="you@company.com"
        class="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-yom-blue"
        :class="errors.email ? 'border-red-500' : 'border-slate-200'"
        :disabled="isSubmitting"
        @input="onInput('email', ($event.target as HTMLInputElement).value)"
        @blur="onBlur('email', form.email)"
      />
      <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
    </div>

    <div>
      <label for="contact-phone" class="mb-1 block text-sm font-medium text-slate-700">Phone number</label>
      <div class="flex gap-2">
        <select
          id="contact-country"
          v-model="form.countryCode"
          class="rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-yom-blue"
          :disabled="isSubmitting"
        >
          <option v-for="code in COUNTRY_CODES" :key="code.value" :value="code.value">{{ code.label }}</option>
        </select>
        <input
          id="contact-phone"
          :value="form.phone"
          type="tel"
          autocomplete="tel-national"
          placeholder="7700 900000"
          class="min-w-0 flex-1 rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-yom-blue"
          :class="errors.phone ? 'border-red-500' : 'border-slate-200'"
          :disabled="isSubmitting"
          @input="onInput('phone', ($event.target as HTMLInputElement).value)"
          @blur="onBlur('phone', form.phone)"
        />
      </div>
      <p v-if="errors.phone" class="mt-1 text-sm text-red-600">{{ errors.phone }}</p>
    </div>

    <div>
      <label for="contact-subject" class="mb-1 block text-sm font-medium text-slate-700">Subject *</label>
      <input
        id="contact-subject"
        :value="form.subject"
        type="text"
        maxlength="120"
        placeholder="How can we help you?"
        class="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-yom-blue"
        :class="errors.subject ? 'border-red-500' : 'border-slate-200'"
        :disabled="isSubmitting"
        @input="onInput('subject', ($event.target as HTMLInputElement).value)"
        @blur="onBlur('subject', form.subject)"
      />
      <p v-if="errors.subject" class="mt-1 text-sm text-red-600">{{ errors.subject }}</p>
    </div>

    <div>
      <label for="contact-need" class="mb-1 block text-sm font-medium text-slate-700">What do you need help with?</label>
      <select
        id="contact-need"
        class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-yom-blue"
        :disabled="isSubmitting"
        @change="
          onInput(
            'subject',
            ($event.target as HTMLSelectElement).value
              ? `${($event.target as HTMLSelectElement).value} enquiry`
              : form.subject,
          )
        "
      >
        <option value="">Choose a service (optional)</option>
        <option v-for="service in contactSection.services" :key="service" :value="service">{{ service }}</option>
      </select>
    </div>

    <div>
      <label for="contact-message" class="mb-1 block text-sm font-medium text-slate-700">Message *</label>
      <textarea
        id="contact-message"
        :value="form.message"
        rows="5"
        maxlength="1000"
        placeholder="Tell us more about your project..."
        class="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-yom-blue"
        :class="errors.message ? 'border-red-500' : 'border-slate-200'"
        :disabled="isSubmitting"
        @input="onInput('message', ($event.target as HTMLTextAreaElement).value)"
        @blur="onBlur('message', form.message)"
      />
      <p v-if="errors.message" class="mt-1 text-sm text-red-600">{{ errors.message }}</p>
    </div>

    <div class="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
      <label for="contact-company">Company</label>
      <input id="contact-company" :value="form.company" tabindex="-1" autocomplete="off" @input="onInput('company', ($event.target as HTMLInputElement).value)" />
      <label for="contact-website">Website</label>
      <input id="contact-website" :value="form.website" tabindex="-1" autocomplete="off" @input="onInput('website', ($event.target as HTMLInputElement).value)" />
    </div>

    <button
      type="submit"
      class="inline-flex justify-center rounded-full bg-gradient-to-r from-yom-gold to-yom-gold-soft px-5 py-3 text-sm font-semibold text-yom-navy transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      :disabled="isSubmitting"
    >
      {{ isSubmitting ? 'Sending…' : contactSection.submitLabel }}
    </button>
  </form>
</template>

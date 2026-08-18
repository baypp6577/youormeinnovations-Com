<script setup lang="ts">
import AboutSection from '@/components/AboutSection.vue'
import AudienceSection from '@/components/AudienceSection.vue'
import ContactSection from '@/components/ContactSection.vue'
import FinalCtaSection from '@/components/FinalCtaSection.vue'
import HeroSection from '@/components/HeroSection.vue'
import PackagesSection from '@/components/PackagesSection.vue'
import PillarsSection from '@/components/PillarsSection.vue'
import ResultsSection from '@/components/ResultsSection.vue'
import ShowcaseSection from '@/components/ShowcaseSection.vue'
import ServicesDetailSection from '@/components/ServicesDetailSection.vue'
import TrustStrip from '@/components/TrustStrip.vue'
import WorkflowSection from '@/components/WorkflowSection.vue'
import BlogSection from '@/components/BlogSection.vue'
</script>

<template>
  <main>
    <HeroSection />
    <TrustStrip />
    <AboutSection />
    <PillarsSection />
    <ServicesDetailSection />
    <AudienceSection />
    <WorkflowSection />
    <ShowcaseSection />
    <ResultsSection />
    <PackagesSection />
    <BlogSection />
    <FinalCtaSection />
    <ContactSection />
  </main>
</template>

import siteContent from './site-content.json'

export type SectionStatus = 'live' | 'coming_soon'

export type ShowcaseType = 'globe' | 'dashboard' | 'workflow' | 'growth'

export type SiteLink = {
  label: string
  href: string
  external?: boolean
}

export type ServiceItem = {
  id: string
  title: string
  tagline: string
  description: string
  bullets?: string[]
  cta?: string
}

export type AudienceItem = {
  id: string
  title: string
  description: string
}

export type PackageItem = {
  id: string
  name: string
  price: string
  tagline: string
  description: string
  idealFor: string
  cta: string
}

export type ResultMetric = {
  id: string
  label: string
}

export type TeamMember = {
  id: string
  name: string
  role: string
  bio?: string
}

export type BlogPost = {
  id: string
  title: string
  excerpt: string
  date?: string
  href?: string
}

export type SiteContent = {
  brand: {
    name: string
    shortName: string
    tagline: string
  }
  navLinks: Array<{ label: string; href: string }>
  footerLinks: {
    company: Array<{ label: string; href: string }>
    resources: Array<{ label: string; href: string }>
    legal: Array<{ label: string; href: string }>
  }
  contact: {
    website?: string
    socialNote?: string
    portal: string
  }
  hero: {
    eyebrow: string
    headline: string
    headlineAccent: string
    description: string
    primaryCta: SiteLink
    secondaryCta: SiteLink
    tertiaryCta?: SiteLink
  }
  trustStrip: {
    headline: string
    description: string
  }
  about: {
    eyebrow: string
    title: string
    intro: string
    description: string[]
    cta: SiteLink
  }
  services: {
    eyebrow: string
    title: string
    pillars: Array<{
      id: string
      label: string
      title: string
      description: string
    }>
  }
  servicesDetail: {
    eyebrow: string
    title: string
    description: string
    items: ServiceItem[]
  }
  audiences: {
    eyebrow: string
    title: string
    items: AudienceItem[]
  }
  workflow: {
    eyebrow: string
    title: string
    description: string
    cta: SiteLink
    steps: Array<{ id: string; label: string; description: string }>
  }
  projects: {
    eyebrow: string
    title: string
    description: string
    items: Array<{
      id: string
      title: string
      subtitle: string
      type: ShowcaseType
    }>
  }
  results: {
    eyebrow: string
    title: string
    description: string
    metrics: ResultMetric[]
  }
  packages: {
    eyebrow: string
    title: string
    items: PackageItem[]
  }
  team: {
    eyebrow: string
    title: string
    description: string
    status: SectionStatus
    placeholderMessage: string
    members: TeamMember[]
  }
  blog: {
    eyebrow: string
    title: string
    description: string
    status: SectionStatus
    placeholderMessage: string
    posts: BlogPost[]
  }
  finalCta: {
    eyebrow: string
    title: string
    description: string
    primaryCta: SiteLink
    secondaryCta: SiteLink
  }
  contactSection: {
    eyebrow: string
    title: string
    description: string
    services: string[]
    submitLabel: string
  }
  seo: {
    title: string
    description: string
  }
}

const content = siteContent as SiteContent

export const brand = content.brand
export const navLinks = content.navLinks
export const footerLinks = content.footerLinks
export const contact = content.contact
export const hero = content.hero
export const trustStrip = content.trustStrip
export const about = content.about
export const services = content.services
export const servicesDetail = content.servicesDetail
export const audiences = content.audiences
export const workflow = content.workflow
export const projects = content.projects
export const results = content.results
export const packages = content.packages
export const team = content.team
export const blog = content.blog
export const finalCta = content.finalCta
export const contactSection = content.contactSection
export const seo = content.seo

/** @deprecated use services.pillars */
export const pillars = services.pillars

/** @deprecated use projects.items */
export const showcaseItems = projects.items

export function hasTeamContent(): boolean {
  return team.members.length > 0
}

export function hasBlogContent(): boolean {
  return blog.posts.length > 0
}

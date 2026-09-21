import siteContent from './site-content.json'
import { bundledBlogPosts, publishedPosts } from '@/lib/blog'

export type SectionStatus = 'live' | 'coming_soon'

export type ShowcaseType = 'globe' | 'dashboard' | 'workflow' | 'growth'

export type SiteLink = {
  label: string
  href: string
  external?: boolean
  contactSubject?: string
  contactSource?: string
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
  idealFor?: string
  cta: string
  paymentUrl?: string
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
  id?: string
  slug?: string
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
    services: Array<{ label: string; href: string }>
    client: Array<{ label: string; href: string; contactSubject?: string; contactSource?: string; external?: boolean }>
    legal: Array<{ label: string; href: string }>
  }
  contact: {
    website?: string
    email?: string
    servicesLine?: string
    socialNote?: string
    portal?: string
  }
  hero: {
    eyebrow: string
    headline: string
    headlineAccent: string
    description: string
    supportingStatement?: string
    primaryCta: SiteLink
    secondaryCta: SiteLink
    tertiaryCta?: SiteLink
  }
  trustStrip: {
    headline: string
    description: string
    promise?: string
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
    description?: string
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
    steps: Array<{ id: string; label: string; description: string; detail?: string }>
  }
  portal: {
    eyebrow: string
    title: string
    description: string
    points: string[]
    cta: SiteLink
  }
  projects: {
    eyebrow: string
    title: string
    description: string
    note?: string
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
    closing?: string
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
    note?: string
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
  thankYou: {
    eyebrow: string
    title: string
    subtitle: string
    note: string
    homeCta: SiteLink
    contactCta: SiteLink
    upgrades: {
      eyebrow: string
      title: string
      description: string
      completeTitle: string
      completeDescription: string
      items: Array<{
        id: string
        name: string
        price: string
        tagline: string
        description: string
        cta: string
        paymentUrl: string
      }>
    }
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
export const portal = content.portal
export const projects = content.projects
export const results = content.results
export const packages = content.packages
export const team = content.team
export const blog = content.blog
export const finalCta = content.finalCta
export const contactSection = content.contactSection
export const thankYou = content.thankYou
export const seo = content.seo

/** @deprecated use services.pillars */
export const pillars = services.pillars

/** @deprecated use projects.items */
export const showcaseItems = projects.items

export function hasTeamContent(): boolean {
  return team.members.length > 0
}

export function hasBlogContent(): boolean {
  return publishedPosts(bundledBlogPosts()).length > 0
}

export function siteHref(href: string, currentPath = '/'): string {
  if (!href) return href
  if (href.startsWith('http') || href.startsWith('mailto:')) return href
  if (href.startsWith('/') && !href.startsWith('/#')) return href
  if (href.startsWith('#') && currentPath !== '/') return `/${href}`
  return href
}

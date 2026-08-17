import siteContent from './site-content.json'

export type SectionStatus = 'live' | 'coming_soon'

export type ShowcaseType = 'globe' | 'dashboard' | 'workflow' | 'growth'

export type SiteLink = {
  label: string
  href: string
  external?: boolean
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
  }
  contact: {
    email: string
    phone?: string
    website?: string
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
}

const content = siteContent as SiteContent

export const brand = content.brand
export const navLinks = content.navLinks
export const footerLinks = content.footerLinks
export const contact = content.contact
export const hero = content.hero
export const services = content.services
export const workflow = content.workflow
export const projects = content.projects
export const team = content.team
export const blog = content.blog

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

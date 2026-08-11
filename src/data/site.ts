export const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Services', href: '#services' },
  { label: 'Projects', href: '#projects' },
  { label: 'Team', href: '#team' },
  { label: 'Blog', href: '#blog' },
  { label: 'Contact', href: '#contact' },
] as const

export const pillars = [
  {
    id: 'intelligence',
    label: 'Value pillar',
    title: 'AI-driven intelligence',
    description:
      'Smart workflows and clear reporting so every campaign decision is grounded in real data — not guesswork.',
  },
  {
    id: 'community',
    label: 'Value pillar',
    title: 'Community collaboration',
    description:
      'Inclusive growth through diaspora networks, grassroots events, and partnerships that put people first.',
  },
  {
    id: 'excellence',
    label: 'Value pillar',
    title: 'Strategic excellence',
    description:
      'PR, branding, and delivery aligned to your goals — from first brief through launch and handover.',
  },
] as const

export const showcaseItems = [
  {
    id: 'globe',
    title: 'Global reach',
    subtitle: 'Community & diaspora campaigns',
    type: 'globe' as const,
  },
  {
    id: 'dashboard',
    title: 'Client portal',
    subtitle: 'Track every milestone live',
    type: 'dashboard' as const,
  },
  {
    id: 'workflow',
    title: 'Automated workflow',
    subtitle: 'Discovery → design → delivery',
    type: 'workflow' as const,
  },
  {
    id: 'growth',
    title: 'Business growth',
    subtitle: 'Before & after impact',
    type: 'growth' as const,
  },
] as const

export const footerLinks = {
  company: [
    { label: 'Home', href: '#home' },
    { label: 'Services', href: '#services' },
    { label: 'Projects', href: '#projects' },
    { label: 'Team', href: '#team' },
  ],
  resources: [
    { label: 'Blog', href: '#blog' },
    { label: 'Contact', href: '#contact' },
    { label: 'Client portal', href: 'https://hometolive.net/client/login?clientId=youorme' },
  ],
} as const

export const contact = {
  email: 'yomiodeneye@hotmail.com',
  portal: 'https://hometolive.net/client/login?clientId=youorme',
} as const

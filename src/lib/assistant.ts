import {
  about,
  audiences,
  brand,
  contact,
  contactSection,
  hero,
  packages,
  services,
  servicesDetail,
  workflow,
} from '@/data/site'

export type KnowledgeChunk = {
  id: string
  title: string
  href: string
  navLabel: string
  keywords: string[]
  text: string
}

const STOP = new Set([
  'the',
  'and',
  'for',
  'with',
  'you',
  'your',
  'our',
  'are',
  'is',
  'was',
  'what',
  'how',
  'can',
  'do',
  'does',
  'about',
  'from',
  'that',
  'this',
  'have',
  'has',
  'will',
  'into',
  'across',
  'also',
  'just',
  'not',
  'any',
  'all',
  'who',
  'we',
  'us',
  'help',
  'need',
  'please',
  'tell',
  'me',
  'more',
])

function words(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9£&+]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP.has(token))
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

export function buildKnowledge(): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = []

  chunks.push({
    id: 'about',
    title: about.title,
    href: '#about',
    navLabel: 'Read About YOM',
    keywords: ['about', 'who', 'company', 'yom', 'youorme', 'innovations', 'brand', 'mission'],
    text: [about.intro, ...about.description].join('\n\n'),
  })

  chunks.push({
    id: 'hero',
    title: `${hero.headline} ${hero.headlineAccent}`,
    href: '#home',
    navLabel: 'Go to Home',
    keywords: ['yom', 'brand', 'tagline', 'connect', 'audiences', 'ai'],
    text: `${hero.eyebrow}\n${hero.description}\n${brand.tagline}`,
  })

  for (const pillar of services.pillars) {
    chunks.push({
      id: pillar.id,
      title: pillar.title,
      href: '#services',
      navLabel: 'See Why YOM',
      keywords: words(`${pillar.title} ${pillar.description}`),
      text: pillar.description,
    })
  }

  for (const item of servicesDetail.items) {
    chunks.push({
      id: item.id,
      title: item.title,
      href: `#${item.id}`,
      navLabel: item.cta || 'View this service',
      keywords: unique([
        ...words(`${item.title} ${item.tagline} ${item.description}`),
        ...(item.bullets || []).flatMap((bullet) => words(bullet)),
      ]),
      text: [item.tagline, item.description, ...(item.bullets || []).map((bullet) => `• ${bullet}`)].join('\n'),
    })
  }

  chunks.push({
    id: 'audiences',
    title: audiences.title,
    href: '#audiences',
    navLabel: 'See who we help',
    keywords: ['who', 'audience', 'startup', 'small', 'business', 'entrepreneur', 'global', 'community', 'creator'],
    text: audiences.items.map((item) => `${item.title}: ${item.description}`).join('\n'),
  })

  chunks.push({
    id: 'process',
    title: workflow.title,
    href: '#workflow',
    navLabel: 'See our process',
    keywords: ['process', 'workflow', 'steps', 'discover', 'strategise', 'create', 'launch', 'measure', 'portal'],
    text: [workflow.description, ...workflow.steps.map((step) => `${step.label}: ${step.description}`)].join('\n'),
  })

  chunks.push({
    id: 'packages',
    title: packages.title,
    href: '#packages',
    navLabel: 'View PR packages',
    keywords: ['price', 'pricing', 'cost', 'package', 'kickstart', 'momentum', 'pr', '£99', '£249'],
    text: packages.items
      .map((item) => `${item.name} — ${item.price}. ${item.tagline} ${item.description} Ideal for: ${item.idealFor}`)
      .join('\n\n'),
  })

  chunks.push({
    id: 'contact',
    title: contactSection.title,
    href: '#contact-section',
    navLabel: 'Open contact',
    keywords: ['contact', 'email', 'phone', 'whatsapp', 'enquiry', 'talk'],
    text: [
      contactSection.description,
      'Use the website contact form to send a message. We do not publish a phone number or email address.',
      contact.website ? `Website: ${contact.website}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  })

  return chunks
}

export type AssistantReply = {
  text: string
  navigation?: { url: string; label: string }
}

const knowledge = buildKnowledge()

function scoreChunk(query: string, chunk: KnowledgeChunk): number {
  const q = query.toLowerCase()
  const tokens = words(q)
  let score = 0

  if (q.includes(chunk.title.toLowerCase())) score += 12

  for (const token of tokens) {
    if (chunk.title.toLowerCase().includes(token)) score += 4
    if (chunk.keywords.some((keyword) => keyword.includes(token) || token.includes(keyword))) score += 3
    if (chunk.text.toLowerCase().includes(token)) score += 1
  }

  return score
}

function serviceListText(): string {
  return servicesDetail.items.map((item) => `• ${item.title} — ${item.tagline}`).join('\n')
}

export function answerQuestion(userInput: string): AssistantReply {
  const input = userInput.trim()
  const q = input.toLowerCase()

  if (!input) {
    return { text: 'Ask me about a service, PR package, our process, or how to start a project.' }
  }

  if (/\b(hello|hi|hey|good morning|good afternoon|good evening)\b/.test(q)) {
    return {
      text: `Hello — welcome to ${brand.name}. I can explain our services, PR packages, process and how to start a project.\n\n${serviceListText()}\n\nWhat would you like to know?`,
      navigation: { url: '#services-detail', label: 'Explore Our Services' },
    }
  }

  if (/\b(thanks|thank you|cheers|appreciate)\b/.test(q)) {
    return {
      text: 'You’re welcome. I can also walk you through a service, PR package, or how to start a project.',
    }
  }

  if (/\b(bye|goodbye|see you|later)\b/.test(q)) {
    return {
      text: `Thank you for chatting with ${brand.shortName}. Start a project whenever you are ready.`,
      navigation: { url: hero.primaryCta.href, label: hero.primaryCta.label },
    }
  }

  if (/\b(contact|email|phone|whatsapp|get in touch|reach|enquiry|inquiry)\b/.test(q)) {
    return {
      text: `${contactSection.title}\n\n${contactSection.description}\n\nPlease use the contact form on this page. We will reply by email.`,
      navigation: { url: '#contact-section', label: 'Open contact form' },
    }
  }

  if (/\b(price|pricing|cost|how much|package|kickstart|momentum|£99|£249)\b/.test(q)) {
    return {
      text: `${packages.title}\n\n${packages.items
        .map(
          (item) =>
            `• ${item.name} — ${item.price}\n  ${item.tagline}\n  ${item.description}\n  Ideal for: ${item.idealFor}`
        )
        .join('\n\n')}`,
      navigation: { url: '#packages', label: 'View PR packages' },
    }
  }

  if (/\b(portal|login|dashboard|track progress|approve design)\b/.test(q)) {
    return {
      text: workflow.description,
      navigation: { url: workflow.cta.href, label: workflow.cta.label.replace(' →', '') },
    }
  }

  if (/\b(process|workflow|how (do|does) it work|steps|discover|strategise)\b/.test(q)) {
    return {
      text: `${workflow.title}\n\n${workflow.steps.map((step, index) => `${index + 1}. ${step.label} — ${step.description}`).join('\n')}`,
      navigation: { url: '#workflow', label: 'See our process' },
    }
  }

  if (/\b(who (do you|we) (help|serve)|audience|startup|small business|entrepreneur)\b/.test(q)) {
    return {
      text: `${audiences.title}\n\n${audiences.items.map((item) => `• ${item.title} — ${item.description}`).join('\n')}`,
      navigation: { url: '#audiences', label: 'See who we help' },
    }
  }

  if (/\b(about|who are you|company|mission)\b/.test(q)) {
    return {
      text: `${about.title}\n\n${about.description.join('\n\n')}`,
      navigation: { url: '#about', label: 'Read About YOM' },
    }
  }

  if (/\b(services?|what do you (do|offer)|offerings?)\b/.test(q) && words(q).length <= 6) {
    return {
      text: `${servicesDetail.title}\n\n${servicesDetail.description}\n\n${serviceListText()}`,
      navigation: { url: '#services-detail', label: 'Explore Our Services' },
    }
  }

  const ranked = knowledge
    .map((chunk) => ({ chunk, score: scoreChunk(q, chunk) }))
    .sort((a, b) => b.score - a.score)

  const best = ranked[0]
  if (best && best.score >= 5) {
    return {
      text: `${best.chunk.title}\n\n${best.chunk.text}`,
      navigation: { url: best.chunk.href, label: best.chunk.navLabel },
    }
  }

  return {
    text: `I can answer from our live service brief. Ask about any of these:\n\n${serviceListText()}\n\nYou can also ask about PR packages, our process, or how to start a project.`,
    navigation: { url: '#services-detail', label: 'Explore Our Services' },
  }
}

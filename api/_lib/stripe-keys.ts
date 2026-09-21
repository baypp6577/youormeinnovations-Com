export type StripeMode = 'test' | 'live' | 'unknown'

const SECRET_ENV_KEYS = [
  'STRIPE_SECRET_KEY',
  'YOUORME_STRIPE_SECRET_KEY',
  'STRIPE_SECRET_KEY_TEST',
  'YOUORME_STRIPE_SECRET_KEY_TEST',
] as const

export function checkoutSessionMode(sessionId: string): StripeMode {
  const id = String(sessionId || '').trim()
  if (id.startsWith('cs_test_')) return 'test'
  if (id.startsWith('cs_live_')) return 'live'
  return 'unknown'
}

export function stripeSecretMode(secret: string): StripeMode {
  if (secret.startsWith('sk_test_') || secret.startsWith('rk_test_')) return 'test'
  if (secret.startsWith('sk_live_') || secret.startsWith('rk_live_')) return 'live'
  return 'unknown'
}

export function collectStripeSecrets(env: NodeJS.ProcessEnv = process.env): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const name of SECRET_ENV_KEYS) {
    const value = String(env[name] || '').trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out
}

export function secretsForSession(
  sessionId: string,
  secrets: string[],
): { mode: StripeMode; secrets: string[]; error: string | null } {
  const mode = checkoutSessionMode(sessionId)
  if (!secrets.length) {
    return { mode, secrets: [], error: 'Download verification is not configured yet (Stripe secret).' }
  }

  const matching = secrets.filter((secret) => {
    const keyMode = stripeSecretMode(secret)
    return keyMode === mode || keyMode === 'unknown'
  })

  if (mode === 'test' && matching.length === 0) {
    return {
      mode,
      secrets: [],
      error:
        'This is a Stripe test checkout, but the site has no test-mode secret. Add STRIPE_SECRET_KEY_TEST (sk_test_...) on Vercel, then retry the thank-you page.',
    }
  }

  if (mode === 'live' && matching.length === 0) {
    return {
      mode,
      secrets: [],
      error:
        'This is a live Stripe checkout, but the site has no live secret. Add STRIPE_SECRET_KEY (sk_live_...) on Vercel.',
    }
  }

  return { mode, secrets: matching.length ? matching : secrets, error: null }
}

/** Checkout + Payment Link writes: prefer live in production unless only test keys (or explicit test mode) exist. */
export function secretForCheckoutWrites(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const secrets = collectStripeSecrets(env)
  const forceTest = ['1', 'true', 'yes'].includes(String(env.YOUORME_STRIPE_TEST_MODE || '').trim().toLowerCase())
  if (forceTest) {
    return secrets.find((secret) => stripeSecretMode(secret) === 'test') || secrets[0] || ''
  }
  return (
    secrets.find((secret) => stripeSecretMode(secret) === 'live') ||
    secrets.find((secret) => stripeSecretMode(secret) === 'test') ||
    secrets[0] ||
    ''
  )
}

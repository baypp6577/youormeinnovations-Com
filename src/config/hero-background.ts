/**
 * Hero-only background animation tuning.
 * Does not affect text entrance animations or the projects showcase.
 */
export const heroBackgroundAnimation = {
  /** Particle drift speed per frame. Original: 0.35 — lower = slower. */
  particleSpeed: 0.12,

  /** How far apart nodes can be before link lines fade out (px). */
  linkDistance: 120,

  /** Blur-orb pulse cycle length in seconds. Original: 4 — higher = slower. */
  pulseGlowDurationSec: 10,
} as const

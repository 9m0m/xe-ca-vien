/**
 * Accessibility and Reduced Motion Detection for Xe Cá Viên
 * Ensures compliance with prefers-reduced-motion media queries:
 * - Replaces high-intensity tweens with instant transitions
 * - Limits particle counts and continuous motion
 */

export function isReducedMotionPreferred(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function getAnimationDuration(baseMs: number): number {
  return isReducedMotionPreferred() ? 0 : baseMs
}

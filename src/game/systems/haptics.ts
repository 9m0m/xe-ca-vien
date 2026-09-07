/**
 * Mobile Haptic Feedback System for Xe Cá Viên
 * Tactile touch response for street-food cooking actions:
 * - 'light': Food drop into frying oil, sauce squirt (12ms)
 * - 'medium': Scooping food with metal tongs (20ms)
 * - 'success': High satisfaction order complete ([20, 30, 25])
 * - 'warning': Burned/raw customer complaint ([40, 50, 40])
 */

export type HapticType = 'light' | 'medium' | 'success' | 'warning'

export function triggerHaptic(type: HapticType): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') {
    return false
  }

  try {
    switch (type) {
      case 'light':
        return navigator.vibrate(12)
      case 'medium':
        return navigator.vibrate(20)
      case 'success':
        return navigator.vibrate([20, 40, 30])
      case 'warning':
        return navigator.vibrate([40, 50, 40])
      default:
        return false
    }
  } catch {
    return false
  }
}

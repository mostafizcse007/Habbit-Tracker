export function tapHaptic(): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.vibrate === "function"
    ) {
      navigator.vibrate(8)
    }
  } catch {}
}

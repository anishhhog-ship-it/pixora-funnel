/**
 * Animated Smooth Scroll Utility for Single Page Navigation
 * Provides custom easeInOutCubic deceleration curve for up/down scrolling
 */

export function smoothScrollTo(
  target: string | HTMLElement | number,
  offset: number = 80,
  duration: number = 800
): void {
  if (typeof window === 'undefined') return;

  let targetPosition = 0;

  if (typeof target === 'number') {
    targetPosition = Math.max(0, target);
  } else if (typeof target === 'string') {
    if (target === '#' || target === '#top' || target === '#hero') {
      targetPosition = 0;
    } else {
      const id = target.startsWith('#') ? target : `#${target}`;
      const element = document.querySelector(id);
      if (!element) {
        // Fallback: search by name or data-section
        const alt = document.querySelector(`[data-section="${id.replace('#', '')}"]`);
        if (!alt) return;
        targetPosition = alt.getBoundingClientRect().top + window.pageYOffset - offset;
      } else {
        targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
      }
    }
  } else if (target instanceof HTMLElement) {
    targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
  }

  // Ensure within document bounds
  const maxScroll = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  ) - window.innerHeight;
  targetPosition = Math.max(0, Math.min(targetPosition, maxScroll));

  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  if (Math.abs(distance) < 5) return;

  let startTime: number | null = null;

  // easeInOutQuart for ultra-smooth buttery sensation
  const easeInOutQuart = (t: number): number => {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  };

  const step = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    const ease = easeInOutQuart(progress);

    window.scrollTo(0, startPosition + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(step);
    } else {
      window.scrollTo(0, targetPosition);
    }
  };

  requestAnimationFrame(step);
}

'use client'

import {useEffect, useRef} from 'react'

export interface HomeCarouselAutoplayProps {
  children: React.ReactNode
  /** Number of carousel items. Used to skip autoplay when there is ≤1. */
  itemCount: number
  /** Autoplay tick interval in milliseconds. */
  intervalMs?: number
}

/**
 * Wraps a horizontally scrollable list and steps it forward on an interval.
 *
 * - Pauses while the pointer is hovering the container.
 * - Pauses briefly while the user is actively scrolling and resumes after idle.
 * - Respects `prefers-reduced-motion`.
 * - Renders only a div; the actual `<ul>` and `<li>` markup is passed in as children.
 */
export function HomeCarouselAutoplay({
  children,
  itemCount,
  intervalMs = 4000,
}: HomeCarouselAutoplayProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    if (itemCount <= 1) return

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    let paused = false
    // Timestamp of the most recent programmatic scrollBy/scrollTo. Smooth
    // scrolling fires many `scroll` events as it animates, so a one-shot
    // boolean flag isn't enough — the trailing events would look like user
    // scrolls and incorrectly pause autoplay. We treat any scroll event
    // arriving within PROGRAMMATIC_WINDOW_MS of a programmatic call as ours.
    let lastProgrammaticAt = 0
    const PROGRAMMATIC_WINDOW_MS = 800
    let userScrollIdleTimer: ReturnType<typeof setTimeout> | null = null

    const step = () => {
      if (paused) return
      const firstChild = scroller.firstElementChild as HTMLElement | null
      if (!firstChild) return
      const gap = parseFloat(getComputedStyle(scroller).columnGap || '0') || 0
      const stepPx = firstChild.offsetWidth + gap

      // Seamless infinite loop: the parent renders the slides twice. When
      // we cross the midpoint, instantly subtract one set's width — invisible
      // to the user because the duplicated half is pixel-identical to the
      // first half. Then proceed with the normal smooth advance.
      const halfWidth = scroller.scrollWidth / 2
      if (halfWidth > 0 && scroller.scrollLeft >= halfWidth) {
        lastProgrammaticAt = Date.now()
        scroller.scrollTo({left: scroller.scrollLeft - halfWidth, behavior: 'auto'})
      }
      lastProgrammaticAt = Date.now()
      scroller.scrollBy({left: stepPx, behavior: 'smooth'})
    }

    const tick = setInterval(step, intervalMs)

    const onPointerEnter = () => {
      paused = true
    }
    const onPointerLeave = () => {
      paused = false
    }
    const onScroll = () => {
      // Ignore scroll events that we triggered ourselves. Only react to
      // genuine user-initiated scrolls.
      if (Date.now() - lastProgrammaticAt < PROGRAMMATIC_WINDOW_MS) return
      paused = true
      if (userScrollIdleTimer) clearTimeout(userScrollIdleTimer)
      userScrollIdleTimer = setTimeout(() => {
        paused = false
      }, 1000)
    }

    scroller.addEventListener('pointerenter', onPointerEnter)
    scroller.addEventListener('pointerleave', onPointerLeave)
    scroller.addEventListener('scroll', onScroll, {passive: true})

    return () => {
      clearInterval(tick)
      if (userScrollIdleTimer) clearTimeout(userScrollIdleTimer)
      scroller.removeEventListener('pointerenter', onPointerEnter)
      scroller.removeEventListener('pointerleave', onPointerLeave)
      scroller.removeEventListener('scroll', onScroll)
    }
  }, [itemCount, intervalMs])

  return (
    <div
      ref={scrollerRef}
      className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {children}
    </div>
  )
}

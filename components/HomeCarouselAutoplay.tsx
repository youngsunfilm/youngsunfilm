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
    let userScrollIdleTimer: ReturnType<typeof setTimeout> | null = null

    const step = () => {
      if (paused) return
      const firstChild = scroller.firstElementChild as HTMLElement | null
      if (!firstChild) return
      const gap = parseFloat(getComputedStyle(scroller).columnGap || '0') || 0
      const stepPx = firstChild.offsetWidth + gap
      const atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1
      if (atEnd) {
        scroller.scrollTo({left: 0, behavior: 'auto'})
      } else {
        scroller.scrollBy({left: stepPx, behavior: 'smooth'})
      }
    }

    const tick = setInterval(step, intervalMs)

    const onPointerEnter = () => {
      paused = true
    }
    const onPointerLeave = () => {
      paused = false
    }
    const onScroll = () => {
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

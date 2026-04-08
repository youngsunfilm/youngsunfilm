# Home Image Carousel — Design

**Date:** 2026-04-08
**Status:** Approved, pending implementation plan
**Scope:** Add an auto-advancing horizontal image strip to the home page, sourced from a new field on the `home` Sanity singleton.

## Goal

Give editors a way to feature a curated set of images on the home page as a cinematic, auto-advancing horizontal strip. The carousel sits between the intro header and the existing showcase projects list. Images are decorative (no captions, no links).

## Non-goals

- Captions, links, lightbox, fullscreen, prev/next arrows, indicator dots
- Swipe gestures beyond native scroll
- Multiple carousels per page, per-project carousels
- Introducing a test framework (none currently exists in this repo)

## Schema change

Add a `carouselImages` field to `sanity/schemas/singletons/home.ts`:

```ts
defineField({
  name: 'carouselImages',
  title: 'Home carousel images',
  description:
    'Images that auto-advance in a horizontal strip between the intro and showcase projects.',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alt text',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
  ],
  validation: (rule) => rule.max(20),
})
```

- Decorative only (no link fields)
- `alt` is required for accessibility
- Max 20 images as a soft cap against editor abuse
- Hotspot on so the image URL builder can crop sensibly

## Query change

Update `homePageQuery` in `sanity/lib/queries.ts` to select `carouselImages` so the generated `HomePageQueryResult` type includes it automatically after `npm run typegen`.

```groq
*[_type == "home"][0]{
  _id,
  _type,
  overview,
  carouselImages[]{
    ...,
    asset->
  },
  showcaseProjects[]{ ... },
  title,
}
```

## Component architecture

Two files, server/client split:

### `components/HomeCarousel.tsx` — Server Component

- Props: `{images: NonNullable<HomePageQueryResult>['carouselImages'], id?: string | null, type?: string | null}`
- Resolves Sanity image URLs with `urlForImage` from `sanity/lib/utils.ts`
- Renders a `<section>` containing a scroll-snap `<ul>` with one `<li>` per image, each an `Image` (`next/image`) with `fill` + `object-cover`
- First image gets `priority`
- Adds `data-sanity={createDataAttribute(...).(['carouselImages'])}` for Visual Editing click-to-edit (matches the existing pattern in `HomePage.tsx` for `showcaseProjects`)
- Guards:
  - `images` empty or undefined → renders `null`
  - Single image → renders but the client wrapper will skip autoplay

### `components/HomeCarousel.client.tsx` — Client Component (`'use client'`)

- Props: `{children: React.ReactNode}`
- Holds a `ref` to the scroll container
- On mount:
  - Reads `prefers-reduced-motion`; if reduce is requested, does nothing
  - Reads `children.length <= 1`; if so, does nothing
  - Starts a `setInterval` (~4000ms) that measures the first child's `offsetWidth + gap` and calls `scrollContainer.scrollBy({left: step, behavior: 'smooth'})`
  - When `scrollLeft + clientWidth >= scrollWidth - 1`, the next tick resets `scrollLeft = 0` (instant, not animated)
- Pauses the timer on `pointerenter`, resumes on `pointerleave`
- Pauses on active user scroll (via a debounced `scroll` handler that restarts after ~1s of idle)
- Cleans up the interval and listeners on unmount

**Rationale for the split:** the server component owns data (URL building, type narrowing, image rendering under `next/image` optimization). The client component only adds behavior around pre-rendered children. This keeps the client bundle tiny and avoids shipping the Sanity client or image builder to the browser.

### `components/HomePage.tsx` change

Import `HomeCarousel`. Destructure `carouselImages` from `data`. Render it between `<Header>` and the showcase projects `<div>`:

```tsx
<HomeCarousel
  images={carouselImages}
  id={data?._id ?? null}
  type={data?._type ?? null}
/>
```

## Visual design

- `<section>` respects the parent layout's existing horizontal padding (`px-4 md:px-16 lg:px-32` from `app/(personal)/layout.tsx`) — not full-bleed
- Inner `<ul>`:
  - `flex overflow-x-auto scroll-smooth snap-x snap-mandatory gap-4`
  - Scrollbar hidden via `scrollbar-width: none` and `::-webkit-scrollbar { display: none }`
- Each `<li>`:
  - `relative shrink-0 snap-start overflow-hidden rounded-md`
  - `aspect-[3/2]`
  - `w-[80%] md:w-[45%] lg:w-[32%]` (mobile: 1 + peek; desktop: ~3 across)
- `next/image` with `fill`, `sizes="(min-width: 1024px) 32vw, (min-width: 768px) 45vw, 80vw"`, `object-cover`
- First image gets `priority`

## Autoplay behavior

- Interval: 4000ms
- Step: one item width + gap, smooth-scrolled
- Loop: instant reset to `scrollLeft = 0` when the end is reached (no animated rewind)
- Pause: on pointer hover (desktop), on active touch/scroll (mobile, debounced ~1s)
- Disabled when `prefers-reduced-motion: reduce` is set
- Disabled when there are ≤1 images

## Data flow

1. `app/(personal)/page.tsx` calls `sanityFetch({query: homePageQuery})` (unchanged)
2. Updated query returns `carouselImages`
3. `HomePage` destructures `carouselImages` and passes it to `HomeCarousel`
4. `HomeCarousel` (server) resolves URLs and renders a client wrapper around the list
5. Client wrapper handles autoplay only

## Types

- No hand-maintained types. `npm run typegen` regenerates `sanity.types.ts` after the schema + query change.
- Component prop type uses `NonNullable<HomePageQueryResult>['carouselImages']`.

## Edge cases

| Case | Behavior |
|---|---|
| 0 images | Component renders `null` |
| 1 image | Renders, no autoplay |
| Image load failure | `next/image` shows its fallback; page does not break |
| Reduced motion | No autoplay; images still scrollable by hand |
| Narrow viewport | One image visible with ~20% peek of the next |

## Verification plan

No test framework in repo; verification is manual:

1. `npm run type-check` passes after schema and query changes
2. `npm run dev`, add 3–5 images in Studio, confirm they render in the strip
3. Confirm autoplay advances every ~4s and pauses on hover
4. Confirm `prefers-reduced-motion` disables autoplay (toggle in OS or DevTools)
5. Confirm mobile width (~375px) shows one image with a peek; desktop shows ~3
6. Empty-carousel case: remove all images, confirm the section disappears with no layout shift
7. Presentation tool: confirm clicking the carousel opens the `carouselImages` field

## Files touched

**Modified**
- `sanity/schemas/singletons/home.ts` — add `carouselImages` field
- `sanity/lib/queries.ts` — add `carouselImages` to `homePageQuery`
- `components/HomePage.tsx` — render `<HomeCarousel>` between header and showcase list
- `sanity.types.ts` — regenerated by `npm run typegen`
- `schema.json` — regenerated by `sanity schema extract`

**Added**
- `components/HomeCarousel.tsx` — server component
- `components/HomeCarousel.client.tsx` — client component (autoplay wrapper)

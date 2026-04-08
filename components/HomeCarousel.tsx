import {HomeCarouselAutoplay} from '@/components/HomeCarouselAutoplay'
import type {HomePageQueryResult} from '@/sanity.types'
import {studioUrl} from '@/sanity/lib/api'
import {urlForImage} from '@/sanity/lib/utils'
import {createDataAttribute} from 'next-sanity'
import Image from 'next/image'
import type {Image as SanityImage} from 'sanity'

type CarouselImages = NonNullable<HomePageQueryResult>['carouselImages']

export interface HomeCarouselProps {
  images: CarouselImages | null | undefined
  id: string | null
  type: string | null
}

/**
 * Horizontal auto-advancing image strip rendered on the home page between the
 * intro header and the showcase projects list. Server Component — all image
 * URL resolution and <Image> rendering happens here; only the interval/ref
 * behavior ships to the browser via HomeCarouselAutoplay.
 */
export function HomeCarousel({images, id, type}: HomeCarouselProps) {
  if (!images || images.length === 0) return null

  const resolved = images
    .map((image) => {
      if (!image) return null
      const url = urlForImage(image as unknown as SanityImage)?.width(1600).height(1066).url()
      if (!url) return null
      return {
        key: image._key,
        url,
        alt: image.alt ?? '',
      }
    })
    .filter((item): item is {key: string; url: string; alt: string} => item !== null)

  if (resolved.length === 0) return null

  const dataAttribute =
    id && type
      ? createDataAttribute({baseUrl: studioUrl, id, type})
      : null

  return (
    <section
      aria-label="Featured images"
      data-sanity={dataAttribute?.(['carouselImages'])}
    >
      <HomeCarouselAutoplay itemCount={resolved.length}>
        {resolved.map((item, index) => (
          <div
            key={item.key}
            className="relative aspect-[3/2] w-[80%] shrink-0 snap-start overflow-hidden rounded-md md:w-[45%] lg:w-[32%]"
          >
            <Image
              src={item.url}
              alt={item.alt}
              fill
              sizes="(min-width: 1024px) 32vw, (min-width: 768px) 45vw, 80vw"
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}
      </HomeCarouselAutoplay>
    </section>
  )
}

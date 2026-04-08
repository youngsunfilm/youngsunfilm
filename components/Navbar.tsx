import {NavMenu, type NavMenuItem} from '@/components/NavMenu'
import type {SettingsQueryResult} from '@/sanity.types'
import {studioUrl} from '@/sanity/lib/api'
import {resolveHref} from '@/sanity/lib/utils'
import {createDataAttribute, stegaClean} from 'next-sanity'

interface NavbarProps {
  data: SettingsQueryResult
}
export function Navbar(props: NavbarProps) {
  const {data} = props
  const dataAttribute =
    data?._id && data?._type
      ? createDataAttribute({
          baseUrl: studioUrl,
          id: data._id,
          type: data._type,
        })
      : null

  // Pre-resolve menu items on the server so the NavMenu client component
  // receives plain serializable props (no Sanity types or createDataAttribute
  // imports needed in the browser bundle).
  const navMenuItems: NavMenuItem[] = (data?.menuItems ?? [])
    .map((menuItem): NavMenuItem | null => {
      if (!menuItem) return null
      const href = resolveHref(menuItem._type, menuItem.slug)
      if (!href) return null
      return {
        key: menuItem._key as unknown as string,
        title: stegaClean(menuItem.title ?? '') || '',
        href,
        isHome: menuItem._type === 'home',
      }
    })
    .filter((item): item is NavMenuItem => item !== null)

  return (
    <header
      className="sticky top-0 z-10 flex items-center bg-white/80 px-4 py-3 backdrop-blur md:px-12 md:py-4 lg:px-24"
      data-sanity={dataAttribute?.('menuItems')}
    >
      <NavMenu items={navMenuItems} />
    </header>
  )
}

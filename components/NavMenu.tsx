'use client'

import {Button} from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {Menu} from 'lucide-react'
import Link from 'next/link'

export interface NavMenuItem {
  key: string
  title: string
  href: string
  isHome: boolean
}

export interface NavMenuProps {
  items: NavMenuItem[]
}

/**
 * Hamburger button + left-side navigation drawer.
 *
 * Server-side parents (Navbar) pre-resolve the menu items into the simple
 * shape this component expects so the client bundle has no Sanity imports.
 * The drawer slides in from the left to match the trigger button position
 * and uses DrawerClose around each link so navigating closes the drawer.
 */
export function NavMenu({items}: NavMenuProps) {
  if (items.length === 0) return null

  return (
    <Drawer direction="left">
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation menu"
          className="-ml-1.5"
        >
          <Menu className="size-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Menu</DrawerTitle>
        </DrawerHeader>
        <nav className="flex flex-col gap-1 px-4 pb-6">
          {items.map((item) => (
            <DrawerClose asChild key={item.key}>
              <Link
                href={item.href}
                className={`rounded-md px-3 py-3 text-lg transition hover:bg-muted ${
                  item.isHome
                    ? 'font-extrabold text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.title}
              </Link>
            </DrawerClose>
          ))}
        </nav>
      </DrawerContent>
    </Drawer>
  )
}

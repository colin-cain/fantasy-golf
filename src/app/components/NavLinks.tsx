'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/',         label: 'Standings' },
  { href: '/results',  label: 'Results'   },
  { href: '/picks',    label: 'Picks'     },
  { href: '/schedule', label: 'Schedule'  },
]

export default function NavLinks() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-4 sm:gap-6">
      {links.map(({ href, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`text-xs uppercase tracking-widest transition-colors sm:h-14 sm:flex sm:items-center sm:border-b-2 ${
              active
                ? 'text-orange-600 sm:border-orange-500'
                : 'text-slate-500 hover:text-orange-600 sm:border-transparent'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}

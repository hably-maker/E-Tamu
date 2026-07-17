import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSiteSettings } from '../hooks/useSiteSettings.js'

const navLinks = [
  { label: 'Beranda', to: '/' },
  { label: 'Pengunjung', to: '/pengunjung' }
]

export default function SiteNavBar() {
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const { settings } = useSiteSettings()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (to) =>
    to === '/' ? pathname === '/' : pathname.startsWith(to)

  return (
    <header
      id="main-nav"
      className={`fixed top-0 w-full z-50 flex justify-between items-center px-margin-desktop h-16 border-b border-outline-variant shadow-sm transition-all ${
        scrolled ? 'shadow-lg bg-white/95 backdrop-blur-md' : 'bg-surface'
      }`}
    >
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="E-Tamu" className="h-8 w-8 rounded object-cover" />
          ) : (
            <span className="font-headline-md text-headline-md font-bold text-on-surface">
              E-Tamu
            </span>
          )}
        </Link>
        <nav className="hidden md:flex gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`font-label-md text-label-md hover:text-secondary transition-colors transition-transform active:scale-95 ${
                isActive(link.to)
                  ? 'text-secondary border-b-2 border-secondary pb-1'
                  : 'text-on-surface-variant'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <button className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container-high rounded-full transition-all">
            notifications
          </button>
          <button className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container-high rounded-full transition-all">
            account_circle
          </button>
        </div>
        <Link
          to="/login"
          className="hidden md:block bg-secondary text-on-primary px-4 py-2 rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all"
        >
          Login Admin
        </Link>
      </div>
    </header>
  )
}

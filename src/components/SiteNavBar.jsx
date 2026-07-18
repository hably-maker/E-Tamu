import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSiteSettings } from '../hooks/useSiteSettings.js'
import Icon from './Icon.jsx'

const navLinks = [
  { label: 'Beranda', to: '/' },
  { label: 'Pengunjung', to: '/pengunjung' }
]

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const time = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  const date = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  return { time, date }
}

export default function SiteNavBar() {
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const { settings } = useSiteSettings()
  const { time, date } = useClock()

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
      className={`fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 border-b border-outline-variant shadow-sm transition-all ${
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

      <div className="flex items-center">
        <Link
          to="/login"
          className="bg-secondary text-on-primary px-4 py-2 rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
        >
          <Icon name="login" className="text-[18px]" />
          Login Admin
        </Link>
      </div>
    </header>
  )
}

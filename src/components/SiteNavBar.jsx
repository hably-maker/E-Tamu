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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const { settings } = useSiteSettings()
  const { time, date } = useClock()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const isActive = (to) =>
    to === '/' ? pathname === '/' : pathname.startsWith(to)

  return (
    <>
      <header
        id="main-nav"
        className={`fixed top-0 right-0 left-0 z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 border-b border-outline-variant shadow-sm transition-all ${
          scrolled ? 'shadow-lg bg-white/95 backdrop-blur-md' : 'bg-surface'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high"
            aria-label="Buka/tutup menu"
          >
            <Icon name={sidebarOpen ? 'close' : 'menu'} className="text-[22px]" />
          </button>
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
            <span className="hidden sm:inline">Login Admin</span>
          </Link>
        </div>
      </header>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full z-50 bg-surface-container-lowest border-r border-outline-variant w-64 flex flex-col transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex flex-col gap-1">
          <div className="flex items-center gap-3">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="E-Tamu" className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-on-secondary">
                <Icon name="security" className="" />
              </div>
            )}
            <div>
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
                E-Tamu
              </h1>
                <p className="font-label-sm text-label-sm text-on-surface-variant opacity-70">
                  Buku Tamu Digital
                </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high"
              aria-label="Tutup menu"
            >
              <Icon name="close" />
            </button>
          </div>
        </div>
        <nav className="flex-1 mt-4 px-2 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg transition-all ${
                isActive(link.to)
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Icon name={link.to === '/' ? 'home' : 'person'} />
              <span className="font-label-md text-label-md">{link.label}</span>
            </Link>
          ))}
        </nav>
        <div className="px-4 py-6 mt-auto">
          <Link
            to="/login"
            onClick={() => setSidebarOpen(false)}
            className="w-full bg-secondary text-on-secondary py-3 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
          >
            <Icon name="login" />
            Login Admin
          </Link>
        </div>
      </aside>
    </>
  )
}

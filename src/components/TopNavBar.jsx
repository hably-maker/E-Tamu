import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'

const navLinks = [
  { label: 'Beranda', active: true },
  { label: 'Pengunjung', active: false },
  { label: 'Laporan', active: false },
  { label: 'Pengaturan', active: false }
]

export default function TopNavBar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      id="main-nav"
      className={`fixed top-0 w-full z-50 flex justify-between items-center px-margin-desktop h-16 border-b border-outline-variant shadow-sm transition-all ${
        scrolled ? 'shadow-lg bg-white/95 backdrop-blur-md' : 'bg-surface'
      }`}
    >
      <div className="flex items-center gap-8">
        <span className="font-headline-md text-headline-md font-bold text-on-surface">
          E-Tamu
        </span>
        <nav className="hidden md:flex gap-6">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href="#"
              className={`font-label-md text-label-md hover:text-secondary transition-colors transition-transform active:scale-95 ${
                link.active
                  ? 'text-secondary border-b-2 border-secondary pb-1'
                  : 'text-on-surface-variant'
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center bg-surface-container rounded-full px-4 py-1.5 gap-2 border border-outline-variant">
          <Icon name="search" className="text-on-surface-variant text-[20px]" />
          <input
            className="bg-transparent border-none focus:ring-0 text-label-md w-32 xl:w-48"
            placeholder="Cari pengunjung..."
            type="text"
          />
        </div>
        <div className="flex gap-2">
          <button className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container-high rounded-full transition-all">
            notifications
          </button>
          <button className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container-high rounded-full transition-all">
            account_circle
          </button>
        </div>
        <button className="hidden md:block bg-secondary text-on-primary px-4 py-2 rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all">
          Keluar
        </button>
      </div>
    </header>
  )
}

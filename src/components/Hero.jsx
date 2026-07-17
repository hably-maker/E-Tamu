import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { useSiteSettings } from '../hooks/useSiteSettings.js'

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCNc6k0dBr0lnA31b6QZiwAxY-0S-amflEhT6VxQaJFHWOd4OeJUlnLtyk4wRlF0nQeicJtG0BHK66kMX3_3HnDLDuM1AqiMEga3m4f5kJdn7x9Mkf-5wBUI--CYnFK7EgbOejo7Vws1RyyUBKprLi1cNBxzD4F7qcNkyoYLPuniaA2MDroWv6nSwYDS9gj7Nx-YoTZ2mX2JDYtjI5jBA7hUiEgZhLAPHQHFHNEgZO_iHOPnveGkFOzJlu7AYb1qhA0P9yrRkJ0brI'

export default function Hero() {
  const { settings } = useSiteSettings()
  const rawBg = settings.hero_bg_url || HERO_IMAGE
  const bg = rawBg.includes('?') ? rawBg : `${rawBg}?v=${settings.updated_at || Date.now()}`

  return (
    <section className="relative min-h-[921px] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center brightness-75"
          style={{ backgroundImage: `url('${bg}')` }}
        />
      </div>
      <div className="container mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
        <div className="max-w-3xl glass-card p-10 md:p-16 rounded-3xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-6 leading-tight">
            Sistem Buku Tamu <br />
            <span className="text-secondary">Internal Kantor.</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-xl">
            Pencatatan kunjungan tamu ke kantor secara digital dan terpusat.
            Memudahkan resepsionis mencatat, memantau, dan melacak kehadiran
            pengunjung dengan aman.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/pengunjung"
              className="px-8 py-4 bg-secondary text-on-primary rounded-xl font-headline-md text-label-md hover:shadow-lg hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Daftar Kunjungan</span>
              <Icon name="arrow_forward" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 border border-outline text-on-surface rounded-xl font-label-md hover:bg-surface-container-high active:scale-95 transition-all flex items-center justify-center"
            >
              Login Admin
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { useSiteSettings } from '../hooks/useSiteSettings.js'
import { supabase } from '../lib/supabase.js'

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCNc6k0dBr0lnA31b6QZiwAxY-0S-amflEhT6VxQaJFHWOd4OeJUlnLtyk4wRlF0nQeicJtG0BHK66kMX3_3HnDLDuM1AqiMEga3m4f5kJdn7x9Mkf-5wBUI--CYnFK7EgbOejo7Vws1RyyUBKprLi1cNBxzD4F7qcNkyoYLPuniaA2MDroWv6nSwYDS9gj7Nx-YoTZ2mX2JDYtjI5jBA7hUiEgZhLAPHQHFHNEgZO_iHOPnveGkFOzJlu7AYb1qhA0P9yrRkJ0brI'

export default function Hero() {
  const { settings, loading } = useSiteSettings()
  const [bgUrl, setBgUrl] = useState(HERO_IMAGE)

  useEffect(() => {
    if (!loading && settings.hero_bg_url) setBgUrl(settings.hero_bg_url)
  }, [loading, settings.hero_bg_url])

  const bg = bgUrl

  const [now, setNow] = useState(new Date())
  const [visitorCount, setVisitorCount] = useState(0)

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(clock)
  }, [])

  useEffect(() => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const loadCount = async () => {
      const { count } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('check_in_at', startOfDay.toISOString())
      if (typeof count === 'number') setVisitorCount(count)
    }
    loadCount()

    const channel = supabase
      .channel('hero-visits')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visits' },
        loadCount
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
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

  return (
    <section className="relative min-h-[921px] flex items-center overflow-hidden bg-primary-container">
      <div className="absolute inset-0 z-0">
        <div
          className={`w-full h-full bg-cover bg-center brightness-75 transition-opacity duration-500 ${
            loading ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ backgroundImage: `url('${bg}')` }}
        />
      </div>
      <div className="container mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
        <div className="max-w-3xl glass-card p-10 md:p-16 rounded-3xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex items-center gap-6 mb-6">
            <div className="flex flex-col">
              <span className="font-headline-lg text-headline-lg font-bold text-on-surface tabular-nums leading-none">
                {time}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant mt-1">
                {date}
              </span>
            </div>
            <div className="h-12 w-px bg-outline-variant" />
            <div className="flex flex-col">
              <span className="font-headline-lg text-headline-lg font-bold text-secondary leading-none">
                {visitorCount}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant mt-1">
                Pengunjung hari ini
              </span>
            </div>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-6 leading-tight">
            Selamat Datang di <br />
            <span className="text-secondary">E-Tamu Pengadilan Militer Utama</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-xl">
            Pengisian buku tamu secara digital untuk seluruh pengunjung yang
            datang ke Pengadilan Militer Utama. Sistem ini memudahkan pencatatan,
            pemantauan, dan pelacakan kehadiran tamu secara tertib, cepat, dan
            aman guna mendukung ketertiban serta keamanan lingkungan perkantoran.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/pengunjung"
              className="px-8 py-4 bg-secondary text-on-primary rounded-xl font-headline-md text-label-md hover:shadow-lg hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Daftar Kunjungan</span>
              <Icon name="arrow_forward" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

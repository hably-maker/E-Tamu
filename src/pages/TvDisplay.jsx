import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import Icon from '../components/Icon.jsx'

const TICKER_ITEMS = [
  { icon: 'campaign', text: 'Selamat datang di Corporate Plaza. Semua pengunjung wajib menunjukkan tanda pengenal yang berlaku.' },
  { icon: 'schedule', text: 'Jam Operasional: Sen-Jum 08:00 - 18:00. Akses akhir pekan hanya dengan izin khusus.' },
  { icon: 'coffee', text: 'Refreshment tersedia gratis di ruang tunggu Lobby Utara.' },
  { icon: 'wifi', text: 'Wi-Fi Tamu: E-Tamu_Guest | Kata Sandi: akses2024' }
]

function initialOf(name = '?') {
  return name.charAt(0).toUpperCase()
}

function formatClock(d) {
  return d.toLocaleTimeString('id-ID', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatDate(d) {
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatArrival(value) {
  if (!value) return '-'
  return new Date(value).toLocaleTimeString('id-ID', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function TvDisplay() {
  const [clock, setClock] = useState(() => formatClock(new Date()))
  const [date, setDate] = useState(() => formatDate(new Date()))
  const [visits, setVisits] = useState([])

  // Live clock
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date()
      setClock(formatClock(now))
      setDate(formatDate(now))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Live visitors (recent check-ins)
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('visits')
        .select(
          'id, check_in_at, visitors(id, full_name), employees(id, full_name, position), departments(id, name)'
        )
        .order('check_in_at', { ascending: false })
        .limit(12)
      if (!error) setVisits(data || [])
      else console.error('TvDisplay load error:', error)
    }
    load()

    const channel = supabase
      .channel('tv-visits')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visits' },
        () => load()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const todayCount = visits.filter((v) => {
    const d = new Date(v.check_in_at)
    const now = new Date()
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  }).length

  return (
    <div className="bg-primary-container text-on-primary-fixed overflow-hidden h-screen flex flex-col font-body-md">
      {/* Header */}
      <header className="h-32 flex items-center justify-between px-xl bg-primary-container border-b border-primary shadow-2xl relative z-10">
        <div className="flex items-center gap-md">
          <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center shadow-lg">
            <Icon name="security" className="text-on-secondary text-5xl" />
          </div>
          <div>
            <h1 className="font-headline-xl text-headline-xl text-on-primary tracking-tighter">E-Tamu</h1>
            <p className="font-label-md text-label-md text-secondary tracking-widest uppercase opacity-80">
              Sistem Keamanan Perusahaan
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="font-headline-xl text-[64px] leading-none font-bold text-on-primary">{clock}</div>
          <div className="font-headline-md text-headline-md text-on-primary-container uppercase tracking-wide">{date}</div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 grid grid-cols-12 gap-lg p-lg overflow-hidden">
        {/* Left: visitors */}
        <section className="col-span-8 flex flex-col gap-md">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-lg text-headline-lg text-on-primary flex items-center gap-sm">
              <Icon name="group" className="text-secondary text-4xl" />
              Pengunjung Terbaru
            </h2>
            <div className="px-md py-xs bg-secondary-container rounded-full text-on-secondary-container font-label-md">
              UPDATE LANGSUNG
            </div>
          </div>
          <div className="flex-1 glass-card rounded-xl overflow-hidden shadow-inner">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-highest/10 sticky top-0">
                <tr>
                  <th className="p-md font-label-md text-secondary uppercase tracking-wider border-b border-white/5">
                    Nama Pengunjung
                  </th>
                  <th className="p-md font-label-md text-secondary uppercase tracking-wider border-b border-white/5">
                    Host / Departemen
                  </th>
                  <th className="p-md font-label-md text-secondary uppercase tracking-wider border-b border-white/5 text-right">
                    Waktu Kedatangan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visits.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-md text-center text-on-primary-container">
                      Belum ada kunjungan hari ini.
                    </td>
                  </tr>
                )}
                {visits.map((v) => (
                  <tr key={v.id} className="transition-colors hover:bg-white/5 group">
                    <td className="p-md font-headline-md text-on-primary py-lg">
                      <div className="flex items-center gap-md">
                        <div className="w-12 h-12 rounded-full bg-surface-container-highest/20 flex items-center justify-center text-secondary font-bold text-xl">
                          {initialOf(v.visitors?.full_name)}
                        </div>
                        {v.visitors?.full_name}
                      </div>
                    </td>
                    <td className="p-md font-body-lg text-on-primary-container">
                      {v.employees?.full_name || v.departments?.name || 'Lobi'}
                    </td>
                    <td className="p-md font-headline-md text-secondary text-right font-mono">
                      {formatArrival(v.check_in_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right: stats */}
        <aside className="col-span-4 flex flex-col gap-lg">
          <div className="glass-card p-lg rounded-xl flex flex-col justify-between h-1/2 border-l-4 border-secondary">
            <div className="flex justify-between items-start">
              <span className="font-label-md text-on-primary-container uppercase tracking-widest">
                Pengunjung Hari Ini
              </span>
              <Icon name="analytics" className="text-secondary text-4xl" />
            </div>
            <div className="mt-auto">
              <div className="font-headline-xl text-[84px] text-on-primary font-extrabold leading-none">
                {todayCount}
              </div>
              <div className="flex items-center gap-xs text-secondary mt-sm">
                <Icon name="trending_up" className="text-sm" />
                <span className="font-label-md">Update otomatis</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-lg rounded-xl flex flex-col justify-between h-1/2 border-l-4 border-secondary-container">
            <div className="flex justify-between items-start">
              <span className="font-label-md text-on-primary-container uppercase tracking-widest">
                Status Terminal
              </span>
              <Icon name="timer" className="text-secondary-container text-4xl" />
            </div>
            <div className="mt-auto">
              <div className="font-headline-xl text-[84px] text-on-primary font-extrabold leading-none">
                <span className="text-headline-md font-normal text-on-primary-container ml-xs">Online</span>
              </div>
              <div className="flex items-center gap-xs text-on-primary-container mt-sm">
                <Icon name="check_circle" className="text-sm" />
                <span className="font-label-md">Terminal Resepsionis Aktif</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-sm mt-auto p-md bg-white/5 rounded-lg border border-white/5">
            <div className="w-3 h-3 bg-secondary rounded-full animate-pulse shadow-[0_0_8px_#006a61]"></div>
            <span className="font-label-md text-on-primary-container">Terminal Resepsionis 1-4 Online</span>
          </div>
        </aside>
      </main>

      {/* Ticker */}
      <footer className="h-20 bg-inverse-surface flex items-center overflow-hidden border-t border-white/10 relative">
        <div className="absolute left-0 top-0 bottom-0 px-lg bg-inverse-surface z-20 flex items-center font-label-md text-secondary tracking-widest uppercase border-r border-white/10">
          Pengumuman
        </div>
        <div className="flex-1 relative overflow-hidden h-full flex items-center">
          <div className="ticker-animation whitespace-nowrap flex gap-xl items-center text-on-primary font-body-lg text-lg">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="flex items-center gap-sm">
                <Icon name={item.icon} className="text-secondary" />
                {item.text}
              </span>
            ))}
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 px-lg bg-inverse-surface z-20 flex items-center font-label-md text-on-primary-container">
          V 2.4.0
        </div>
      </footer>
    </div>
  )
}

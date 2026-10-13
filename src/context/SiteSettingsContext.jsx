import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const DEFAULTS = {
  hero_bg_url: '',
  form_bg_url: '',
  logo_url: '',
  favicon_url: '',
  ticker_items: []
}

const SiteSettingsContext = createContext(null)

// Satu instance untuk seluruh aplikasi: 1 request + 1 channel realtime,
// bukan satu per komponen yang memakai pengaturan.
export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single()
      if (!error && data) setSettings({ ...DEFAULTS, ...data })
    } catch (err) {
      // Tabel site_settings mungkin belum dibuat (jalankan migrasi 0004).
      // Abaikan agar halaman tidak blank.
      console.warn('site_settings belum tersedia:', err?.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const channelName = `site-settings-${Math.random().toString(36).slice(2, 9)}`
    let channel
    try {
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'site_settings' },
          () => load()
        )
        .subscribe()
    } catch (err) {
      console.warn('Gagal subscribe site_settings:', err?.message)
    }
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo(() => ({ settings, loading, reload: load }), [settings, loading])

  return (
    <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext)
  if (!ctx) {
    throw new Error('useSiteSettings() harus dipakai di dalam <SiteSettingsProvider>')
  }
  return ctx
}

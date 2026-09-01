import { useEffect } from 'react'
import { useSiteSettings } from '../hooks/useSiteSettings.js'

export default function FaviconManager() {
  const { settings, loading } = useSiteSettings()

  useEffect(() => {
    if (loading) return
    if (!settings?.favicon_url) return

    let existing = document.querySelector('link[rel="icon"]')
    if (!existing) {
      existing = document.createElement('link')
      existing.rel = 'icon'
      existing.type = 'image/svg+xml'
      document.head.appendChild(existing)
    }
    existing.href = settings.favicon_url
  }, [settings, loading])

  return null
}

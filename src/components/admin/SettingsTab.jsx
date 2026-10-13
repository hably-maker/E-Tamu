import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import Icon from '../Icon.jsx'

function storagePathFromUrl(url) {
  if (!url) return null
  const marker = '/site-assets/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(url.slice(idx + marker.length))
}

function ImageField({ label, value, onUpload, previewClass }) {
  const [busy, setBusy] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar.')
      e.target.value = ''
      return
    }
    const MAX = 5 * 1024 * 1024
    if (file.size > MAX) {
      alert('Ukuran maksimal 5 MB.')
      e.target.value = ''
      return
    }
    setBusy(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${label.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('site-assets')
        .upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('site-assets').getPublicUrl(path)
      // Hapus foto lama agar storage tidak penuh
      const oldPath = storagePathFromUrl(value)
      if (oldPath && oldPath !== path) {
        await supabase.storage.from('site-assets').remove([oldPath])
      }
      onUpload(data.publicUrl)
    } catch (err) {
      alert(err.message || 'Gagal mengunggah gambar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="glass-card p-6 rounded-xl shadow-sm">
      <p className="font-label-md text-label-md text-on-surface mb-3">{label}</p>
      <div
        className={`${previewClass} rounded-lg overflow-hidden border border-outline-variant mb-3 bg-surface-container-high`}
      >
        {value ? (
          <img src={value} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
            <Icon name="image" className="text-[40px]" />
          </div>
        )}
      </div>
      <label className="inline-block cursor-pointer px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg font-label-md text-label-md hover:opacity-90 transition-all">
        {busy ? 'Mengunggah...' : 'Unggah Gambar'}
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </label>
    </div>
  )
}

export default function SettingsTab({ settings, onChange, onSave, saving }) {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Pengaturan Tampilan
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Ubah foto background beranda, foto background halaman registrasi, dan logo E-Tamu.
          </p>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-secondary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-all disabled:opacity-60"
        >
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ImageField
          label="Background Beranda"
          value={settings.hero_bg_url}
          onUpload={(url) => onChange('hero_bg_url', url)}
          previewClass="h-40"
        />
        <ImageField
          label="Background Registrasi"
          value={settings.form_bg_url}
          onUpload={(url) => onChange('form_bg_url', url)}
          previewClass="h-40"
        />
        <ImageField
          label="Logo E-Tamu"
          value={settings.logo_url}
          onUpload={(url) => onChange('logo_url', url)}
          previewClass="h-40"
        />
        <ImageField
          label="Favicon (Icon Tab Browser)"
          value={settings.favicon_url}
          onUpload={(url) => onChange('favicon_url', url)}
          previewClass="h-20"
        />
      </div>
    </>
  )
}

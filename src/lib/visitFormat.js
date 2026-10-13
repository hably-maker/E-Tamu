export const PURPOSE_LABELS = {
  business: 'Pertemuan Kemitraan atau pihak ketiga',
  delivery: 'Pengiriman Berkas Perkara',
  letter_delivery: 'Pengiriman Surat',
  maintenance: 'Pemeliharaan / Dukungan',
  personal: 'Kunjungan Pribadi',
  interview: 'Wawancara Kerja',
  trial: 'Persidangan',
  other: 'Lainnya'
}

export const PURPOSE_OPTIONS = [
  { value: 'business', label: 'Pertemuan Kemitraan atau pihak ketiga' },
  { value: 'delivery', label: 'Pengiriman Berkas Perkara' },
  { value: 'trial', label: 'Persidangan' },
  { value: 'letter_delivery', label: 'Pengiriman Surat' },
  { value: 'maintenance', label: 'Pemeliharaan / Dukungan' },
  { value: 'personal', label: 'Kunjungan Pribadi' },
  { value: 'interview', label: 'Wawancara Kerja' },
  { value: 'other', label: 'Lainnya' }
]

export function purposeLabel(value) {
  if (!value) return '-'
  return PURPOSE_LABELS[value] || value
}

export function formatTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export function initials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

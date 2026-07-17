const PURPOSE_LABELS = {
  business: 'Pertemuan Bisnis',
  delivery: 'Pengiriman / Kurir',
  maintenance: 'Pemeliharaan / Dukungan',
  personal: 'Kunjungan Pribadi',
  interview: 'Wawancara Kerja'
}

function purposeLabel(value) {
  if (!value) return '-'
  return PURPOSE_LABELS[value] || value
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

// Bentuk baris datar dari data visits untuk export
export function flattenVisits(visits) {
  return visits.map((v) => ({
    'Nama Pengunjung': v.visitors?.full_name || '-',
    'No. Telepon': v.visitors?.phone || '-',
    'Tujuan (Yang Ditemui)': v.employees?.full_name || 'Lobi',
    Keperluan: purposeLabel(v.purpose),
    Catatan: v.remarks || '-',
    'Waktu Masuk': formatDateTime(v.check_in_at),
    Status: v.status === 'active' ? 'Sedang Di Dalam' : v.status === 'completed' ? 'Selesai' : v.status
  }))
}

// Library export di-load secara dinamis (code-splitting) hanya saat dipakai
export async function exportCSV(visits, filename = 'data-kunjungan') {
  const XLSX = await import('xlsx')
  const rows = flattenVisits(visits)
  const ws = XLSX.utils.json_to_sheet(rows)
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `${filename}.csv`)
}

export async function exportExcel(visits, filename = 'data-kunjungan') {
  const XLSX = await import('xlsx')
  const rows = flattenVisits(visits)
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Kunjungan')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export async function exportPDF(visits, filename = 'data-kunjungan') {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const rows = flattenVisits(visits)
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(14)
  doc.text('Laporan Data Kunjungan E-Tamu', 14, 14)
  autoTable(doc, {
    startY: 20,
    head: [Object.keys(rows[0] || {})],
    body: rows.map((r) => Object.values(r)),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 106, 97] }
  })
  doc.save(`${filename}.pdf`)
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

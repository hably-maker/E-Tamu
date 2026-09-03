const PURPOSE_LABELS = {
  business: 'Pertemuan Kemitraan atau pihak ketiga',
  delivery: 'Pengiriman Berkas Perkara',
  letter_delivery: 'Pengiriman Surat',
  maintenance: 'Pemeliharaan / Dukungan',
  personal: 'Kunjungan Pribadi',
  interview: 'Permohonan Informasi',
  trial: 'Persidangan'
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
  const ExcelJS = await import('exceljs')
  const rows = flattenVisits(visits)
  const headers = rows.length > 0 ? Object.keys(rows[0]) : []

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Kunjungan')
  ws.columns = headers.map((h) => ({ header: h, key: h, width: String(h).length + 2 }))

  const headerRow = ws.getRow(1)
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    cell.font = { bold: true }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = thinBorder()
  })
  headerRow.commit()

  rows.forEach((row) => {
    const added = ws.addRow(headers.map((h) => row[h] ?? ''))
    added.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', wrapText: true }
      cell.border = thinBorder()
    })
    added.commit()
  })

  // Auto-fit column width berdasarkan teks terpanjang (header + data) +2 padding
  if (headers.length > 0) {
    headers.forEach((h, i) => {
      let maxLen = String(h).length
      rows.forEach((row) => {
        const val = row[h] == null ? '' : String(row[h])
        if (val.length > maxLen) maxLen = val.length
      })
      const col = ws.getColumn(i + 1)
      col.width = maxLen + 2
    })
  }

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  downloadBlob(blob, `${filename}.xlsx`)
}

function thinBorder() {
  return {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  }
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

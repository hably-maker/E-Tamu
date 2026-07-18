import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.js'
import { useSiteSettings } from '../hooks/useSiteSettings.js'
import { exportCSV, exportExcel, exportPDF } from '../lib/export.js'
import { logActivity } from '../lib/activityLog.js'
import Icon from '../components/Icon.jsx'

function initials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

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

function formatTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

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
      <div className={`${previewClass} rounded-lg overflow-hidden border border-outline-variant mb-3 bg-surface-container-high`}>
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

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { settings, reload } = useSiteSettings()
  const [tab, setTab] = useState('dasbor') // dasbor | pegawai | admin | pengaturan
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const selectTab = (t) => {
    setTab(t)
    setSidebarOpen(false)
  }
  const [settingsLocal, setSettingsLocal] = useState(settings)
  const [savingSettings, setSavingSettings] = useState(false)
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    setSettingsLocal(settings)
  }, [settings])

  const loadVisits = async () => {
    const { data, error } = await supabase
      .from('visits')
      .select(
        'id, purpose, remarks, status, check_in_at, check_out_at, qr_code, visitors(id, full_name, phone, organization, photo_url), employees(id, full_name, position)'
      )
      .order('check_in_at', { ascending: false })
    if (!error) setVisits(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadVisits()

    const channel = supabase
      .channel('visits-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visits' },
        () => loadVisits()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const updateSetting = (key, url) => {
    setSettingsLocal((s) => ({ ...s, [key]: url }))
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          hero_bg_url: settingsLocal.hero_bg_url || null,
          form_bg_url: settingsLocal.form_bg_url || null,
          logo_url: settingsLocal.logo_url || null
        })
        .eq('id', 1)
      if (error) throw error
      reload()
      alert('Pengaturan berhasil disimpan.')
    } catch (err) {
      alert(err.message || 'Gagal menyimpan pengaturan.')
    } finally {
      setSavingSettings(false)
    }
  }

  const [employees, setEmployees] = useState([])
  const [editing, setEditing] = useState(null) // visit yang diedit
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', employeeId: '', purpose: '', remarks: '' })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Chart: kunjungan per hari kerja (Senin-Jumat), 5 hari kerja terakhir
  const [chartData, setChartData] = useState([])
  const loadChart = async () => {
    const days = []
    const now = new Date()
    let added = 0
    let cursor = new Date(now)
    while (added < 5) {
      const dow = cursor.getDay() // 0 = Minggu, 6 = Sabtu
      if (dow !== 0 && dow !== 6) {
        const d = new Date(cursor)
        d.setHours(0, 0, 0, 0)
        const end = new Date(d)
        end.setHours(23, 59, 59, 999)
        const { count } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .gte('check_in_at', d.toISOString())
          .lte('check_in_at', end.toISOString())
        days.push({
          label: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
          count: count || 0
        })
        added++
      }
      cursor.setDate(cursor.getDate() - 1)
    }
    days.reverse()
    setChartData(days)
  }

  // Employee management
  const [empForm, setEmpForm] = useState({ fullName: '', position: '' })
  const [savingEmp, setSavingEmp] = useState(false)
  const [empError, setEmpError] = useState('')

  const addEmployee = async (e) => {
    e.preventDefault()
    setEmpError('')
    if (!empForm.fullName.trim()) {
      setEmpError('Nama pegawai wajib diisi.')
      return
    }
    setSavingEmp(true)
    try {
      const { error } = await supabase
        .from('employees')
        .insert({ full_name: empForm.fullName.trim(), position: empForm.position.trim() || null })
      if (error) throw error
      setEmpForm({ fullName: '', position: '' })
      loadEmployees()
    } catch (err) {
      setEmpError(err.message || 'Gagal menambah pegawai.')
    } finally {
      setSavingEmp(false)
    }
  }

  const deleteEmployee = async (id) => {
    if (!confirm('Yakin ingin menghapus pegawai ini?')) return
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id)
      if (error) throw error
      loadEmployees()
    } catch (err) {
      alert(err.message || 'Gagal menghapus pegawai.')
    }
  }

  // Admin management
  const [admins, setAdmins] = useState([])
  const [adminForm, setAdminForm] = useState({ fullName: '', email: '', password: '' })
  const [savingAdmin, setSavingAdmin] = useState(false)
  const [adminError, setAdminError] = useState('')

  const loadAdmins = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, role, email').order('full_name')
    if (data) setAdmins(data)
  }

  const addAdmin = async (e) => {
    e.preventDefault()
    setAdminError('')
    if (!adminForm.email.trim() || !adminForm.password || adminForm.password.length < 6) {
      setAdminError('Email wajib diisi dan kata sandi minimal 6 karakter.')
      return
    }
    setSavingAdmin(true)
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: adminForm.email.trim(),
        password: adminForm.password,
        email_confirm: true,
        user_metadata: { full_name: adminForm.fullName.trim() || adminForm.email.trim(), role: 'admin' }
      })
      if (error) throw error
      if (data?.user) {
        await supabase
          .from('profiles')
          .update({ role: 'admin', full_name: adminForm.fullName.trim() || adminForm.email.trim() })
          .eq('id', data.user.id)
      }
      setAdminForm({ fullName: '', email: '', password: '' })
      loadAdmins()
    } catch (err) {
      setAdminError(err.message || 'Gagal menambah admin.')
    } finally {
      setSavingAdmin(false)
    }
  }

  const toggleAdminRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'staff' : 'admin'
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id)
      if (error) throw error
      loadAdmins()
    } catch (err) {
      alert(err.message || 'Gagal mengubah peran.')
    }
  }

  const loadEmployees = async () => {
    const { data } = await supabase.from('employees').select('id, full_name, position').order('full_name')
    if (data) setEmployees(data)
  }

  // Activity logs
  const [logs, setLogs] = useState([])
  const [logOnlyMine, setLogOnlyMine] = useState(false)
  const loadLogs = async () => {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (data) setLogs(data)
  }

  // Export state
  const [exportMode, setExportMode] = useState('all') // all | range | month | year
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [exportMonth, setExportMonth] = useState('')
  const [exportYear, setExportYear] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadChart()
    loadEmployees()
    loadAdmins()
    loadLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openEdit = (v) => {
    setEditing(v)
    setEditForm({
      fullName: v.visitors?.full_name || '',
      phone: v.visitors?.phone || '',
      employeeId: v.employee_id || '',
      purpose: v.purpose || '',
      remarks: v.remarks || ''
    })
  }

  const closeEdit = () => setEditing(null)

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error: vErr } = await supabase
        .from('visitors')
        .update({ full_name: editForm.fullName, phone: editForm.phone })
        .eq('id', editing.visitor_id)
      if (vErr) throw vErr

      const { error: visitErr } = await supabase
        .from('visits')
        .update({
          employee_id: editForm.employeeId || null,
          purpose: editForm.purpose,
          remarks: editForm.remarks || null
        })
        .eq('id', editing.id)
      if (visitErr) throw visitErr

      closeEdit()
      loadVisits()
      logActivity({
        profile,
        action: 'Mengedit Kunjungan',
        targetType: 'visits',
        targetId: editing.id,
        targetName: editForm.fullName || editing.visitors?.full_name,
        detail: `Tujuan: ${editForm.employeeId ? employees.find((e) => e.id === editForm.employeeId)?.full_name || 'Lobi' : 'Lobi'}, Keperluan: ${editForm.purpose}`
      })
    } catch (err) {
      alert(err.message || 'Gagal menyimpan perubahan.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus data kunjungan ini?')) return
    const target = visits.find((v) => v.id === id)
    setDeletingId(id)
    try {
      const { error } = await supabase.from('visits').delete().eq('id', id)
      if (error) throw error
      loadVisits()
      logActivity({
        profile,
        action: 'Menghapus Kunjungan',
        targetType: 'visits',
        targetId: id,
        targetName: target?.visitors?.full_name || '-'
      })
    } catch (err) {
      alert(err.message || 'Gagal menghapus data.')
    } finally {
      setDeletingId(null)
    }
  }

  const buildExportQuery = () => {
    let q = supabase
      .from('visits')
      .select(
        'id, purpose, remarks, status, check_in_at, check_out_at, visitors(id, full_name, phone), employees(id, full_name, position)'
      )

    if (exportMode === 'range' && rangeStart && rangeEnd) {
      q = q.gte('check_in_at', new Date(rangeStart).toISOString()).lte('check_in_at', new Date(rangeEnd + 'T23:59:59').toISOString())
    } else if (exportMode === 'month' && exportMonth) {
      const start = new Date(exportMonth + '-01')
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59)
      q = q.gte('check_in_at', start.toISOString()).lte('check_in_at', end.toISOString())
    } else if (exportMode === 'year' && exportYear) {
      const start = new Date(exportYear + '-01-01')
      const end = new Date(exportYear + '-12-31T23:59:59')
      q = q.gte('check_in_at', start.toISOString()).lte('check_in_at', end.toISOString())
    }
    return q.order('check_in_at', { ascending: false })
  }

  const handleExport = async (type) => {
    setExporting(true)
    try {
      const { data, error } = await buildExportQuery()
      if (error) throw error
      const rows = data || []
      const stamp = new Date().toISOString().slice(0, 10)
      if (type === 'csv') await exportCSV(rows, `kunjungan-${stamp}`)
      else if (type === 'excel') await exportExcel(rows, `kunjungan-${stamp}`)
      else if (type === 'pdf') await exportPDF(rows, `kunjungan-${stamp}`)
    } catch (err) {
      alert(err.message || 'Gagal mengekspor data.')
    } finally {
      setExporting(false)
    }
  }

  const todayCount = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return visits.filter((v) => new Date(v.check_in_at) >= start).length
  }, [visits])

  const weeklyCount = useMemo(() => {
    const now = new Date()
    const day = now.getDay() || 7
    const monday = new Date(now)
    monday.setDate(now.getDate() - (day - 1))
    monday.setHours(0, 0, 0, 0)
    return visits.filter((v) => new Date(v.check_in_at) >= monday).length
  }, [visits])

  const monthCount = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return visits.filter((v) => new Date(v.check_in_at) >= start).length
  }, [visits])

  const filtered = visits.filter((v) => {
    if (employeeFilter !== 'all' && v.employee_id !== employeeFilter) return false
    if (query) {
      const q = query.toLowerCase()
      const name = v.visitors?.full_name?.toLowerCase() || ''
      const org = v.visitors?.organization?.toLowerCase() || ''
      const phone = v.visitors?.phone?.toLowerCase() || ''
      const host = v.employees?.full_name?.toLowerCase() || ''
      if (!name.includes(q) && !org.includes(q) && !phone.includes(q) && !host.includes(q)) return false
    }
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface-variant">
        Memuat dasbor...
      </div>
    )
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex">
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-50 bg-surface-container-lowest border-r border-outline-variant w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex flex-col gap-1">
          <div className="flex items-center gap-3">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="E-Tamu" className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-on-secondary">
                <Icon name="security" className="" />
              </div>
            )}
            <div>
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
                E-Tamu
              </h1>
              <p className="font-label-sm text-label-sm text-on-surface-variant opacity-70">
                Keamanan Kantor
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high"
              aria-label="Tutup menu"
            >
              <Icon name="close" />
            </button>
          </div>
        </div>
        <nav className="flex-1 mt-4 px-2 space-y-1">
          <Link
            to="/"
            className="text-on-surface-variant px-4 py-3 flex items-center gap-3 hover:bg-surface-container-high transition-all rounded-lg"
          >
            <Icon name="home" />
            <span className="font-label-md text-label-md">Beranda</span>
          </Link>
          <Link
            to="/pengunjung"
            className="text-on-surface-variant px-4 py-3 flex items-center gap-3 hover:bg-surface-container-high transition-all rounded-lg"
          >
            <Icon name="person" />
            <span className="font-label-md text-label-md">Pengunjung</span>
          </Link>
          <button
            onClick={() => selectTab('dasbor')}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg transition-all ${
              tab === 'dasbor'
                ? 'bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <Icon name="dashboard" />
            <span className="font-label-md text-label-md">Dasbor</span>
          </button>
          <button
            onClick={() => selectTab('pegawai')}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg transition-all ${
              tab === 'pegawai'
                ? 'bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <Icon name="groups" />
            <span className="font-label-md text-label-md">Data Pegawai</span>
          </button>
          <button
            onClick={() => selectTab('admin')}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg transition-all ${
              tab === 'admin'
                ? 'bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <Icon name="admin_panel_settings" />
            <span className="font-label-md text-label-md">Kelola Admin</span>
          </button>
          <button
            onClick={() => selectTab('admin')}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg transition-all ${
              tab === 'admin'
                ? 'bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <Icon name="admin_panel_settings" />
            <span className="font-label-md text-label-md">Kelola Admin</span>
          </button>
          <button
            onClick={() => selectTab('log')}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg transition-all ${
              tab === 'log'
                ? 'bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <Icon name="history" />
            <span className="font-label-md text-label-md">Log Aktivitas</span>
          </button>
        </nav>
        <div className="px-4 py-6 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full bg-secondary text-on-secondary py-3 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
          >
            <Icon name="logout" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 z-50">
          <div className="h-full bg-surface border-b border-outline-variant shadow-sm flex justify-between items-center px-4 md:px-6 lg:px-margin-desktop">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen((o) => !o)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high"
                aria-label="Buka/tutup menu"
              >
                <Icon name="menu" className="text-[22px]" />
              </button>
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface lg:hidden">
                E-Tamu
              </h1>
            </div>
            <div className="hidden md:flex flex-1 max-w-md ml-auto mr-8">
              <div className="relative w-full">
                <Icon
                  name="search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full font-body-md text-body-md focus:ring-2 focus:ring-secondary/20 outline-none"
                  placeholder="Cari pengunjung, log, atau kode..."
                  type="text"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 border-l border-outline-variant pl-4">
              <div className="text-right hidden sm:block">
                <p className="font-label-md text-label-md text-on-surface font-bold leading-tight">
                  {profile?.full_name || 'Admin'}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant opacity-70">
                  {profile?.role === 'admin' ? 'Super Admin' : 'Staff'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline-variant">
                {profile?.avatar_url ? (
                  <img className="w-full h-full object-cover" src={profile.avatar_url} alt="avatar" />
                ) : (
                  <span className="font-bold text-secondary">
                    {initials(profile?.full_name || 'A')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="pt-20 pb-12 px-6 lg:px-margin-desktop min-h-screen">
          {tab === 'dasbor' && (
            <>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                Dasbor Admin
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Pengawasan waktu nyata untuk akses fasilitas dan metrik pengunjung.
              </p>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="glass-card p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <Icon name="group" />
                </div>
              </div>
              <p className="font-label-md text-label-md text-on-surface-variant">
                Pengunjung Hari Ini
              </p>
              <h3 className="font-headline-md text-headline-md mt-1">{todayCount}</h3>
            </div>
            <div className="glass-card p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-tertiary-fixed-dim flex items-center justify-center text-on-tertiary-fixed">
                  <Icon name="view_week" />
                </div>
              </div>
              <p className="font-label-md text-label-md text-on-surface-variant">
                Minggu Ini
              </p>
              <h3 className="font-headline-md text-headline-md mt-1">{weeklyCount}</h3>
            </div>
            <div className="glass-card p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container">
                  <Icon name="calendar_month" />
                </div>
              </div>
              <p className="font-label-md text-label-md text-on-surface-variant">
                Bulan Ini
              </p>
              <h3 className="font-headline-md text-headline-md mt-1">{monthCount}</h3>
            </div>
          </div>

          {/* Chart: kunjungan per hari */}
          <div className="glass-card rounded-xl p-6 mb-8 shadow-sm">
            <h4 className="font-headline-md text-headline-md text-on-surface mb-1">
              Tren Kunjungan Hari Kerja
            </h4>
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-6">
              Kunjungan Senin&ndash;Jumat (5 hari kerja terakhir) untuk memantau hari tersibuk.
            </p>
            <div className="flex items-end justify-between gap-3 h-48">
              {chartData.map((d) => {
                const max = Math.max(1, ...chartData.map((c) => c.count))
                const heightPct = (d.count / max) * 100
                return (
                  <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
                    <span className="font-label-sm text-label-sm text-on-surface font-bold">
                      {d.count}
                    </span>
                    <div className="w-full flex items-end" style={{ height: '150px' }}>
                      <div
                        className="w-full rounded-t-lg bg-secondary transition-all"
                        style={{ height: `${heightPct}%`, minHeight: d.count > 0 ? '6px' : '0' }}
                        title={`${d.label}: ${d.count} pengunjung`}
                      />
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant text-center">
                      {d.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Export toolbar */}
          <div className="glass-card rounded-xl p-4 mb-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4 flex-wrap">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                  Periode
                </label>
                <select
                  value={exportMode}
                  onChange={(e) => setExportMode(e.target.value)}
                  className="px-4 py-2 bg-surface-container-low border-none rounded-lg font-label-md text-label-md outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                >
                  <option value="all">Semua Data</option>
                  <option value="range">Rentang Waktu</option>
                  <option value="month">Bulanan</option>
                  <option value="year">Tahunan</option>
                </select>
              </div>

              {exportMode === 'range' && (
                <div className="flex gap-2 items-end">
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Dari</label>
                    <input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} className="px-3 py-2 bg-surface-container-low border-none rounded-lg font-label-md text-label-md outline-none focus:ring-1 focus:ring-secondary" />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Sampai</label>
                    <input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className="px-3 py-2 bg-surface-container-low border-none rounded-lg font-label-md text-label-md outline-none focus:ring-1 focus:ring-secondary" />
                  </div>
                </div>
              )}

              {exportMode === 'month' && (
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Bulan</label>
                  <input type="month" value={exportMonth} onChange={(e) => setExportMonth(e.target.value)} className="px-3 py-2 bg-surface-container-low border-none rounded-lg font-label-md text-label-md outline-none focus:ring-1 focus:ring-secondary" />
                </div>
              )}

              {exportMode === 'year' && (
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Tahun</label>
                  <input type="number" min="2000" max="2100" value={exportYear} onChange={(e) => setExportYear(e.target.value)} placeholder="2026" className="px-3 py-2 bg-surface-container-low border-none rounded-lg font-label-md text-label-md outline-none focus:ring-1 focus:ring-secondary w-28" />
                </div>
              )}

              <div className="flex gap-2 lg:ml-auto">
                <button
                  onClick={() => handleExport('excel')}
                  disabled={exporting}
                  className="px-4 py-2 bg-secondary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  <Icon name="description" className="text-[18px]" /> Excel
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                  className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container-highest transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  <Icon name="table_view" className="text-[18px]" /> CSV
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={exporting}
                  className="px-4 py-2 border border-outline-variant text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container-high transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  <Icon name="picture_as_pdf" className="text-[18px]" /> PDF
                </button>
              </div>
            </div>
          </div>

          {/* Visitors table */}
          <div className="glass-card rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h4 className="font-headline-md text-headline-md text-on-surface">
                Pengunjung Terbaru
              </h4>
              <div className="flex gap-2">
                <div className="relative">
                  <Icon
                    name="filter_list"
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-outline text-[18px]"
                  />
                  <select
                    value={employeeFilter}
                    onChange={(e) => setEmployeeFilter(e.target.value)}
                    className="pl-8 pr-4 py-1.5 bg-surface-container-low border-none rounded-lg font-label-sm text-label-sm outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                  >
                    <option value="all">Semua Tujuan</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                      Nama Pengunjung
                    </th>
                    <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                      No. Telepon
                    </th>
                    <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                      Tujuan (Yang Ditemui)
                    </th>
                    <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                      Keperluan
                    </th>
                    <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                      Catatan
                    </th>
                    <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                      Waktu Masuk
                    </th>
                    <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-on-surface-variant">
                        Belum ada data kunjungan.
                      </td>
                    </tr>
                  )}
                  {filtered.map((v) => (
                    <tr key={v.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-secondary">
                            {initials(v.visitors?.full_name || '?')}
                          </div>
                          <div>
                            <p className="font-label-md text-label-md font-bold text-on-surface">
                              {v.visitors?.full_name}
                            </p>
                            <p className="text-[12px] text-on-surface-variant">
                              {v.visitors?.organization || '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">
                        {v.visitors?.phone || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-label-md text-label-md text-on-surface">
                          {v.employees?.full_name || v.destination_text || 'Lobi'}
                        </p>
                        <p className="text-[12px] text-on-surface-variant">
                          {v.employees?.position || (v.destination_text ? 'Tujuan lainnya' : '-')}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">
                        {purposeLabel(v.purpose)}
                      </td>
                      <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant max-w-xs truncate">
                        {v.remarks || '-'}
                      </td>
                      <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">
                        {formatTime(v.check_in_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(v)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-secondary transition-all"
                            title="Edit"
                          >
                            <Icon name="edit" className="text-[18px]" />
                          </button>
                          <button
                            onClick={() => handleDelete(v.id)}
                            disabled={deletingId === v.id}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-all disabled:opacity-50"
                            title="Hapus"
                          >
                            <Icon name="delete" className="text-[18px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between">
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Menampilkan {filtered.length} dari {visits.length} kunjungan
              </p>
              <Link
                to="/login"
                onClick={handleLogout}
                className="lg:hidden font-label-sm text-label-sm text-secondary underline"
              >
                Keluar
              </Link>
            </div>
          </div>
          </>
          )}

          {tab === 'pegawai' && (
            <>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                    Data Pegawai
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Kelola daftar pegawai yang dapat dipilih sebagai tujuan kunjungan.
                  </p>
                </div>
              </div>

              <div className="glass-card rounded-xl p-6 mb-8 shadow-sm">
                <h4 className="font-headline-md text-headline-md text-on-surface mb-4">
                  Tambah Pegawai
                </h4>
                <form onSubmit={addEmployee} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface mb-1">Nama Lengkap</label>
                    <input
                      value={empForm.fullName}
                      onChange={(e) => setEmpForm((f) => ({ ...f, fullName: e.target.value }))}
                      className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary"
                      placeholder="Nama pegawai"
                    />
                  </div>
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface mb-1">Jabatan</label>
                    <input
                      value={empForm.position}
                      onChange={(e) => setEmpForm((f) => ({ ...f, position: e.target.value }))}
                      className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary"
                      placeholder="Jabatan / Posisi"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={savingEmp}
                      className="w-full bg-secondary text-on-primary px-4 py-2.5 rounded-lg font-label-md hover:opacity-90 transition-all disabled:opacity-60"
                    >
                      {savingEmp ? 'Menyimpan...' : 'Tambah Pegawai'}
                    </button>
                  </div>
                </form>
                {empError && (
                  <p className="mt-3 text-label-sm text-on-error-container bg-error-container px-3 py-2 rounded-lg">
                    {empError}
                  </p>
                )}
              </div>

              <div className="glass-card rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-outline-variant">
                  <h4 className="font-headline-md text-headline-md text-on-surface">
                    Daftar Pegawai ({employees.length})
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-container-low">
                      <tr>
                        <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest">Nama Pegawai</th>
                        <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest">Jabatan</th>
                        <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/50">
                      {employees.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-on-surface-variant">
                            Belum ada data pegawai.
                          </td>
                        </tr>
                      )}
                      {employees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-6 py-4 font-label-md text-label-md font-bold text-on-surface">{emp.full_name}</td>
                          <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">{emp.position || '-'}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => deleteEmployee(emp.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-all"
                              title="Hapus"
                            >
                              <Icon name="delete" className="text-[18px]" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === 'admin' && (
            <>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                    Kelola Admin
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Tambah akun admin dan atur peran akses dashboard.
                  </p>
                </div>
              </div>

              <div className="glass-card rounded-xl p-6 mb-8 shadow-sm">
                <h4 className="font-headline-md text-headline-md text-on-surface mb-4">
                  Tambah Admin Baru
                </h4>
                <form onSubmit={addAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface mb-1">Nama Lengkap</label>
                    <input
                      value={adminForm.fullName}
                      onChange={(e) => setAdminForm((f) => ({ ...f, fullName: e.target.value }))}
                      className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary"
                      placeholder="Nama admin"
                    />
                  </div>
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface mb-1">Email</label>
                    <input
                      type="email"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary"
                      placeholder="admin@email.com"
                    />
                  </div>
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface mb-1">Kata Sandi</label>
                    <input
                      type="password"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))}
                      className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary"
                      placeholder="Minimal 6 karakter"
                    />
                  </div>
                  <div className="md:col-span-3 flex items-end">
                    <button
                      type="submit"
                      disabled={savingAdmin}
                      className="bg-secondary text-on-primary px-4 py-2.5 rounded-lg font-label-md hover:opacity-90 transition-all disabled:opacity-60"
                    >
                      {savingAdmin ? 'Membuat...' : 'Tambah Admin'}
                    </button>
                  </div>
                </form>
                {adminError && (
                  <p className="mt-3 text-label-sm text-on-error-container bg-error-container px-3 py-2 rounded-lg">
                    {adminError}
                  </p>
                )}
              </div>

              <div className="glass-card rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-outline-variant">
                  <h4 className="font-headline-md text-headline-md text-on-surface">
                    Daftar Admin ({admins.length})
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-container-low">
                      <tr>
                        <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest">Nama</th>
                        <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest">Email</th>
                        <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest">Peran</th>
                        <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/50">
                      {admins.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant">
                            Belum ada data admin.
                          </td>
                        </tr>
                      )}
                      {admins.map((a) => (
                        <tr key={a.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-6 py-4 font-label-md text-label-md font-bold text-on-surface">{a.full_name || '-'}</td>
                          <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">{a.email || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`font-label-sm text-label-sm px-3 py-1 rounded-full ${a.role === 'admin' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                              {a.role === 'admin' ? 'Admin' : 'Staff'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => toggleAdminRole(a.id, a.role)}
                              className="font-label-sm text-label-sm text-secondary underline hover:opacity-80"
                            >
                              {a.role === 'admin' ? 'Jadikan Staff' : 'Jadikan Admin'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === 'log' && (
            <>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                    Log Aktivitas
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Catatan siapa yang mengedit atau menghapus data kunjungan.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={logOnlyMine}
                    onChange={(e) => setLogOnlyMine(e.target.checked)}
                    className="w-4 h-4 accent-secondary"
                  />
                  <span className="font-label-md text-label-md text-on-surface">Hanya aktivitas saya</span>
                </label>
              </div>

              <div className="glass-card rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-container-low">
                      <tr>
                        <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest">Waktu</th>
                        <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest">Admin</th>
                        <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest">Aksi</th>
                        <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest">Target</th>
                        <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/50">
                      {(() => {
                        const filtered = logOnlyMine
                          ? logs.filter((l) => l.admin_id === profile?.id)
                          : logs
                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                                Belum ada aktivitas.
                              </td>
                            </tr>
                          )
                        }
                        return filtered.map((l) => (
                          <tr key={l.id} className="hover:bg-surface-container-low transition-colors">
                            <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant whitespace-nowrap">
                              {new Date(l.created_at).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-6 py-4 font-label-md text-label-md font-bold text-on-surface">{l.admin_name || '-'}</td>
                            <td className="px-6 py-4">
                              <span className={`font-label-sm text-label-sm px-3 py-1 rounded-full ${l.action.includes('Hapus') ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                                {l.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">{l.target_name || '-'}</td>
                            <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant max-w-xs">{l.detail || '-'}</td>
                          </tr>
                        ))
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === 'pengaturan' && (
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
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="px-4 py-2 bg-secondary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-all disabled:opacity-60"
                >
                  {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ImageField
                  label="Background Beranda"
                  value={settingsLocal.hero_bg_url}
                  onUpload={(url) => updateSetting('hero_bg_url', url)}
                  previewClass="h-40"
                />
                <ImageField
                  label="Background Registrasi"
                  value={settingsLocal.form_bg_url}
                  onUpload={(url) => updateSetting('form_bg_url', url)}
                  previewClass="h-40"
                />
                <ImageField
                  label="Logo E-Tamu"
                  value={settingsLocal.logo_url}
                  onUpload={(url) => updateSetting('logo_url', url)}
                  previewClass="h-40"
                />
              </div>
            </>
          )}
        </main>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-margin-mobile">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline-md text-headline-md text-on-surface">Edit Data Kunjungan</h3>
              <button onClick={closeEdit} className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high">
                <Icon name="close" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">Nama Lengkap</label>
                <input value={editForm.fullName} onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))} className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary" />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">No. Telepon</label>
                <input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary" />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">Tujuan (Yang Ditemui)</label>
                <select value={editForm.employeeId} onChange={(e) => setEditForm((f) => ({ ...f, employeeId: e.target.value }))} className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary">
                  <option value="">Lobi</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.full_name}{emp.position ? ` (${emp.position})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">Keperluan</label>
                <select value={editForm.purpose} onChange={(e) => setEditForm((f) => ({ ...f, purpose: e.target.value }))} className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary">
                  <option value="business">Pertemuan Bisnis</option>
                  <option value="delivery">Pengiriman / Kurir</option>
                  <option value="maintenance">Pemeliharaan / Dukungan</option>
                  <option value="personal">Kunjungan Pribadi</option>
                  <option value="interview">Wawancara Kerja</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">Catatan</label>
                <textarea value={editForm.remarks} onChange={(e) => setEditForm((f) => ({ ...f, remarks: e.target.value }))} rows={3} className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeEdit} className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface font-label-md hover:bg-surface-container-high transition-all">
                  Batal
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-secondary text-on-primary font-label-md hover:opacity-90 transition-all disabled:opacity-60">
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

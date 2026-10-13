import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useSiteSettings } from '../context/SiteSettingsContext.jsx'
import { exportCSV, exportExcel, exportPDF } from '../lib/export.js'
import { logActivity } from '../lib/activityLog.js'
import AdminSidebar from '../components/admin/AdminSidebar.jsx'
import AdminTopbar from '../components/admin/AdminTopbar.jsx'
import DashboardTab from '../components/admin/DashboardTab.jsx'
import EmployeesTab from '../components/admin/EmployeesTab.jsx'
import AdminsTab from '../components/admin/AdminsTab.jsx'
import ActivityLogTab from '../components/admin/ActivityLogTab.jsx'
import SettingsTab from '../components/admin/SettingsTab.jsx'
import EditVisitModal from '../components/admin/EditVisitModal.jsx'
import EditEmployeeModal from '../components/admin/EditEmployeeModal.jsx'

// Kunci tanggal lokal (YYYY-MM-DD) untuk pencocokan agregasi per hari
function toDateKey(date) {
  const d = new Date(date)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function describeError(error, fallback) {
  if (!error) return fallback
  return [
    error.message || fallback,
    error.code ? `[code: ${error.code}]` : '',
    error.details ? `[details: ${error.details}]` : '',
    error.hint ? `[hint: ${error.hint}]` : ''
  ]
    .filter(Boolean)
    .join(' ')
}
export default function AdminDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, profile, signOut, loading: authLoading, isSuperAdmin } = useAuth()
  const { settings, reload } = useSiteSettings()
  const [tab, setTab] = useState('dasbor') // dasbor | pegawai | admin | pengaturan
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const selectTab = (t) => {
    setTab(t)
    setSidebarOpen(false)
  }

  // Clear search results when tab changes
  const isFirstTabRun = useRef(true)
  useEffect(() => {
    setSearchResults([])
    setSearchQuery('')
    setQuery('')
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    // Kembali ke dasbor: muat ulang tanpa filter pencarian
    if (isFirstTabRun.current) {
      isFirstTabRun.current = false
      return
    }
    if (tab === 'dasbor') {
      setPage(1)
      pageRef.current = 1
      loadVisits(1, { search: '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])
  const [settingsLocal, setSettingsLocal] = useState(settings)
  const [savingSettings, setSavingSettings] = useState(false)
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [visitsLoading, setVisitsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [dateFilterStart, setDateFilterStart] = useState('')
  const [dateFilterEnd, setDateFilterEnd] = useState('')
  const [query, setQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('') // debounced server search query
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchDebounceRef = useRef(null)
  const PAGE_SIZE = 20
  const [page, setPage] = useState(1)
  const pageRef = useRef(page)
  const [totalVisits, setTotalVisits] = useState(0)
  const [summary, setSummary] = useState({ today: 0, week: 0, month: 0 })
  const mountedRef = useRef(false)

  useEffect(() => {
    pageRef.current = page
  }, [page])

  useEffect(() => {
    setSettingsLocal(settings)
  }, [settings])

  // Satu request untuk tabel + filter + pencarian + paginasi + ringkasan
  // (RPC admin_visits_page, migration 0031). Nilai opsional Allows
  // override agar bisa dipanggil dari handler filter/pencarian.
  const loadVisits = async (targetPage, opts = {}) => {
    const pageToLoad = targetPage ?? pageRef.current ?? 1
    // `null` eksplisit = tanpa filter, jadi harus dibedakan dari "tidak diisi"
    const pick = (key, fallback) =>
      Object.prototype.hasOwnProperty.call(opts, key) ? opts[key] : fallback
    const search = pick('search', tab === 'dasbor' ? searchQuery : '')
    if (!opts.silent) setVisitsLoading(true)

    const { data, error } = await supabase.rpc('admin_visits_page', {
      p_page: pageToLoad,
      p_page_size: PAGE_SIZE,
      p_employee_id: pick('employeeId', employeeFilter !== 'all' ? employeeFilter : null),
      p_date_start: pick('dateStart', dateFilterStart || null),
      p_date_end: pick('dateEnd', dateFilterEnd || null),
      p_query: search || null,
      p_tz_offset_minutes: -new Date().getTimezoneOffset()
    })

    if (error) {
      const msg = `${describeError(error, 'Gagal memuat data kunjungan.')} Jalankan migration 0031_admin_visits_page_rpc.sql di Supabase.`
      if (mountedRef.current) {
        // Refreshbackground: jangan mengganti seluruh halaman
        console.warn('Gagal menyegarkan data kunjungan:', msg)
        setNotice(msg)
      } else {
        setLoadError(msg)
      }
    } else {
      const result = data || {}
      const rows = result.rows || []
      const total = Number(result.total) || 0
      const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE))

      setLoadError('')
      setNotice('')
      setSummary({
        today: Number(result.today) || 0,
        week: Number(result.week) || 0,
        month: Number(result.month) || 0
      })

      // Halaman sekarang di luar jangkauan hasil filter -> mundur
      if (total > 0 && pageToLoad > maxPage) {
        setPage(maxPage)
        pageRef.current = maxPage
        if (!opts.silent) setVisitsLoading(false)
        return loadVisits(maxPage, { ...opts, search })
      }

      setVisits(rows)
      setTotalVisits(total)
    }

    if (!mountedRef.current) {
      mountedRef.current = true
      setLoading(false)
    }
    if (!opts.silent) setVisitsLoading(false)
  }

  // Debounced server-side search
  const performSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setSearchResults([])
      setSearchQuery('')
      return
    }
    setSearchLoading(true)
    try {
      const { data, error } = await supabase.rpc('search_global', {
        p_query: q.trim(),
        p_tab: tab,
        p_limit: 50,
        p_offset: 0
      })
      if (error) throw error
      setSearchResults(data || [])
      setSearchQuery(q.trim())
    } catch (err) {
      console.error('Search error:', err)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [tab])

  const handleSearchChange = (value) => {
    setQuery(value) // dipakai filter lokal untuk tab selain dasbor
    setSearchLoading(true)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(async () => {
      if (tab === 'dasbor') {
        // Pencarian dasbor ikut lewat RPC tabel (bukan search_global)
        // supaya hasil & pagination konsisten.
        const q = value.trim()
        setSearchQuery(q)
        setPage(1)
        pageRef.current = 1
        await loadVisits(1, { search: q })
        setSearchLoading(false)
      } else {
        setSearchLoading(false)
        performSearch(value)
      }
    }, 300)
  }

  const totalPages = Math.max(1, Math.ceil(totalVisits / PAGE_SIZE))

  useEffect(() => {
    if (authLoading) return
    if (!session) {
      navigate('/login')
      return
    }
    if (session && !profile) return
    if (profile?.role !== 'admin') {
      navigate('/')
      return
    }

    loadVisits(1)
    loadChartStats()
    loadEmployees()
    loadAdmins()
    loadLogs()

    const channel = supabase
      .channel('visits-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visits' },
        () => {
          loadVisits(undefined, { silent: true })
          loadChartStats()
        }
      )
      .subscribe()

    const interval = setInterval(() => {
      loadVisits(undefined, { silent: true })
      loadChartStats()
    }, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, authLoading, session])

  useEffect(() => {
    if (location.pathname === '/admin' && profile?.role === 'admin') {
      setPage(1)
      loadVisits(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

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
          logo_url: settingsLocal.logo_url || null,
          favicon_url: settingsLocal.favicon_url || null
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
  const EMP_PAGE_SIZE = 20
  const [empPage, setEmpPage] = useState(1)
  const [editing, setEditing] = useState(null) // visit yang diedit
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', employeeId: '', purpose: '', remarks: '' })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Chart: kunjungan per hari kerja (Senin-Jumat), 5 hari kerja terakhir
  const [chartData, setChartData] = useState([])
  const [weeklyData, setWeeklyData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [chartMode, setChartMode] = useState('daily')
  const [chartError, setChartError] = useState('')
  const loadChartStats = async () => {
    // Satu request untuk ketiga mode: RPC visit_stats (migration 0029)
    // mengembalikan jumlah kunjungan per tanggal dalam zona waktu lokal.
    const tzOffsetMinutes = -new Date().getTimezoneOffset()
    const { data, error } = await supabase.rpc('visit_stats', {
      p_tz_offset_minutes: tzOffsetMinutes
    })
    if (error || !data) {
      setChartError(
        error?.message
          ? `Grafik tidak dapat dimuat (${error.message}). Jalankan migration 0029_visit_stats_rpc.sql di Supabase.`
          : 'Grafik tidak dapat dimuat. Jalankan migration 0029_visit_stats_rpc.sql di Supabase.'
      )
      return
    }
    setChartError('')

    const perDay = new Map(data.map((r) => [r.day, Number(r.visits_count) || 0]))
    const countRange = (start, end) => {
      let total = 0
      const cursor = new Date(start)
      while (cursor <= end) {
        total += perDay.get(toDateKey(cursor)) || 0
        cursor.setDate(cursor.getDate() + 1)
      }
      return total
    }

    // Harian: 5 hari kerja terakhir (Senin-Jumat)
    const days = []
    const cursor = new Date()
    while (days.length < 5) {
      const dow = cursor.getDay()
      if (dow !== 0 && dow !== 6) {
        const d = new Date(cursor)
        d.setHours(0, 0, 0, 0)
        days.push({
          label: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
          count: perDay.get(toDateKey(d)) || 0
        })
      }
      cursor.setDate(cursor.getDate() - 1)
    }
    days.reverse()
    setChartData(days)

    // Mingguan: 8 minggu terakhir (Senin-Minggu)
    const weeks = []
    const now = new Date()
    const weekCursor = new Date(now)
    weekCursor.setDate(now.getDate() - (now.getDay() || 7) + 7)
    for (let i = 0; i < 8; i++) {
      const weekEnd = new Date(weekCursor)
      const weekStart = new Date(weekCursor)
      weekStart.setDate(weekEnd.getDate() - 6)
      weekStart.setHours(0, 0, 0, 0)
      weekEnd.setHours(23, 59, 59, 999)
      weeks.push({
        label: `${weekStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`,
        count: countRange(weekStart, weekEnd)
      })
      weekCursor.setDate(weekCursor.getDate() - 7)
    }
    weeks.reverse()
    setWeeklyData(weeks)

    // Bulanan: 6 bulan terakhir
    const months = []
    const monthCursor = new Date(now.getFullYear(), now.getMonth(), 1)
    monthCursor.setHours(0, 0, 0, 0)
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(monthCursor)
      const monthEnd = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0)
      monthEnd.setHours(23, 59, 59, 999)
      months.push({
        label: monthStart.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        count: countRange(monthStart, monthEnd)
      })
      monthCursor.setMonth(monthCursor.getMonth() - 1)
    }
    months.reverse()
    setMonthlyData(months)
  }

  // Employee management
  const [empForm, setEmpForm] = useState({ fullName: '', rank: '', position: '' })
  const [editingEmp, setEditingEmp] = useState(null)
  const [empEditForm, setEmpEditForm] = useState({ fullName: '', rank: '', position: '' })
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
        .insert({
          full_name: empForm.fullName.trim(),
          rank: empForm.rank.trim() || null,
          position: empForm.position.trim() || null
        })
      if (error) throw error
      setEmpForm({ fullName: '', rank: '', position: '' })
      loadEmployees()
    } catch (err) {
      setEmpError(err.message || 'Gagal menambah pegawai.')
    } finally {
      setSavingEmp(false)
    }
  }

  const openEditEmp = (emp) => {
    setEditingEmp(emp)
    setEmpEditForm({
      fullName: emp.full_name || '',
      rank: emp.rank || '',
      position: emp.position || ''
    })
  }

  const closeEditEmp = () => setEditingEmp(null)

  const updateEmployee = async () => {
    if (!empEditForm.fullName.trim()) {
      alert('Nama pegawai wajib diisi.')
      return
    }
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          full_name: empEditForm.fullName.trim(),
          rank: empEditForm.rank.trim() || null,
          position: empEditForm.position.trim() || null
        })
        .eq('id', editingEmp.id)
      if (error) throw error
      closeEditEmp()
      loadEmployees()
    } catch (err) {
      alert(err.message || 'Gagal menyimpan perubahan.')
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

  const moveEmployee = async (id, direction) => {
    const sort = (a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0)
    const sorted = [...employees].sort(sort)
    const idx = sorted.findIndex((e) => e.id === id)
    const swapIdx = idx + direction
    if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return
    const current = sorted[idx]
    const neighbour = sorted[swapIdx]
    try {
      const { error: e1 } = await supabase
        .from('employees')
        .update({ sort_order: neighbour.sort_order })
        .eq('id', current.id)
      const { error: e2 } = await supabase
        .from('employees')
        .update({ sort_order: current.sort_order })
        .eq('id', neighbour.id)
      if (e1 || e2) throw e1 || e2
      loadEmployees()
    } catch (err) {
      alert(err.message || 'Gagal mengubah urutan.')
    }
  }

  // Admin management
  const [admins, setAdmins] = useState([])
  const [adminForm, setAdminForm] = useState({ fullName: '', email: '', password: '' })
  const [savingAdmin, setSavingAdmin] = useState(false)
  const [adminError, setAdminError] = useState('')

  const loadAdmins = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role, email, is_super_admin, must_change_password')
      .in('role', ['admin', 'staff'])
      .order('role', { ascending: false })
      .order('full_name')
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
      const { error } = await supabase.rpc('admin_create_user', {
        p_email: adminForm.email.trim(),
        p_password: adminForm.password,
        p_full_name: adminForm.fullName.trim() || adminForm.email.trim(),
        p_role: 'admin'
      })
      if (error) throw error
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
      const { error } = await supabase.rpc('admin_update_role', {
        p_user_id: id,
        p_new_role: newRole
      })
      if (error) throw error
      loadAdmins()
    } catch (err) {
      alert(err.message || 'Gagal mengubah peran.')
    }
  }

  const [resetTarget, setResetTarget] = useState(null)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [resetError, setResetError] = useState('')

  const openResetDialog = (admin) => {
    setResetTarget(admin)
    setResetError('')
  }
  const closeResetDialog = () => {
    setResetTarget(null)
    setResetError('')
  }

  // newPassword datang dari ResetPasswordDialog (state ada di dialog)
  const submitResetPassword = async (newPassword = '') => {
    if (!resetTarget) return
    if (newPassword.length < 6) {
      setResetError('Kata sandi minimal 6 karakter.')
      return
    }
    setResettingPassword(true)
    setResetError('')
    try {
      const { error } = await supabase.rpc('admin_reset_password', {
        p_user_id: resetTarget.id,
        p_new_password: newPassword
      })
      if (error) throw error
      closeResetDialog()
      loadAdmins()
    } catch (err) {
      setResetError(err.message || 'Gagal mereset kata sandi.')
    } finally {
      setResettingPassword(false)
    }
  }

  const loadEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, rank, position, sort_order')
      .order('sort_order', { ascending: true })
      .order('full_name', { ascending: true })
    if (error) console.warn('Gagal memuat pegawai:', error.message)
    if (data) setEmployees(data)
  }

  // Activity logs
  const [logs, setLogs] = useState([])
  const [logOnlyMine, setLogOnlyMine] = useState(false)
  const LOG_PAGE_SIZE = 20
  const [logPage, setLogPage] = useState(1)
  const loadLogs = async () => {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (data) setLogs(data)
  }

  // Export state: all | range | month | year
  const [exportState, setExportState] = useState({
    exportMode: 'all',
    rangeStart: '',
    rangeEnd: '',
    exportMonth: '',
    exportYear: ''
  })
  const { exportMode, rangeStart, rangeEnd, exportMonth, exportYear } = exportState
  const [exporting, setExporting] = useState(false)

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

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const [visitorRes, visitRes] = await Promise.all([
        supabase
          .from('visitors')
          .update({ full_name: editForm.fullName, phone: editForm.phone })
          .eq('id', editing.visitor_id),
        supabase
          .from('visits')
          .update({
            employee_id: editForm.employeeId || null,
            purpose: editForm.purpose,
            remarks: editForm.remarks || null
          })
          .eq('id', editing.id)
      ])

      if (visitorRes.error || visitRes.error) {
        const messages = []
        if (visitorRes.error) {
          messages.push(`Data pengunjung: ${describeError(visitorRes.error, 'gagal disimpan.')}`)
        }
        if (visitRes.error) {
          messages.push(`Data kunjungan: ${describeError(visitRes.error, 'gagal disimpan.')}`)
        }
        throw new Error(messages.join(' | '))
      }

      closeEdit()
      loadVisits()
      loadChartStats()
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
      if (error) {
        throw new Error(describeError(error, 'Gagal menghapus data.'))
      }
      loadVisits()
      loadChartStats()
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

  // Handler yang dipakai komponen tab: filter, reset, dan pagination
  const handleFilterChange = ({ employeeId, dateStart, dateEnd }) => {
    if (employeeId !== undefined) setEmployeeFilter(employeeId)
    if (dateStart !== undefined) setDateFilterStart(dateStart)
    if (dateEnd !== undefined) setDateFilterEnd(dateEnd)
    setPage(1)
    pageRef.current = 1
    // Hanya kirim parameter yang benar-benar berubah
    const opts = {}
    if (employeeId !== undefined) opts.employeeId = employeeId === 'all' ? null : employeeId
    if (dateStart !== undefined) opts.dateStart = dateStart || null
    if (dateEnd !== undefined) opts.dateEnd = dateEnd || null
    loadVisits(1, opts)
  }

  const handleResetFilters = () => {
    setEmployeeFilter('all')
    setDateFilterStart('')
    setDateFilterEnd('')
    setSearchQuery('')
    setQuery('')
    setPage(1)
    pageRef.current = 1
    loadVisits(1, { employeeId: null, dateStart: null, dateEnd: null, search: '' })
  }

  const handlePageChange = (next) => {
    setPage(next)
    pageRef.current = next
    loadVisits(next)
  }

  const buildExportQuery = () => {
    let q = supabase
      .from('visits')
      .select(
        'id, purpose, remarks, status, check_in_at, check_out_at, visitors(id, full_name, phone), employees(id, full_name, position)'
      )

    // Ikuti filter yang sedang aktif di tabel
    if (employeeFilter !== 'all') q = q.eq('employee_id', employeeFilter)
    if (dateFilterStart) {
      const start = new Date(dateFilterStart)
      start.setHours(0, 0, 0, 0)
      q = q.gte('check_in_at', new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString())
    }
    if (dateFilterEnd) {
      const end = new Date(dateFilterEnd)
      end.setHours(23, 59, 59, 999)
      q = q.lte('check_in_at', new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString())
    }

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

  // Ringkasan dihitung server (mengikuti filter aktif), bukan dari 20 baris halaman
  const hasVisitFilter =
    employeeFilter !== 'all' || !!dateFilterStart || !!dateFilterEnd || !!searchQuery

  // Server-side search results untuk tab selain dasbor
  const searchEmployeeIds = useMemo(() => new Set(searchResults.filter(r => r.type === 'employee').map(r => r.id)), [searchResults])
  const searchAdminIds = useMemo(() => new Set(searchResults.filter(r => r.type === 'admin').map(r => r.id)), [searchResults])
  const searchLogIds = useMemo(() => new Set(searchResults.filter(r => r.type === 'log').map(r => r.id)), [searchResults])

  const filteredEmployees = useMemo(() => {
    if (searchQuery) {
      // Use server search results for employees
      const ids = searchEmployeeIds
      return employees.filter(e => ids.has(e.id))
    }
    if (!query) return employees
    const q = query.toLowerCase()
    return employees.filter((e) =>
      (e.full_name || '').toLowerCase().includes(q) ||
      (e.rank || '').toLowerCase().includes(q) ||
      (e.position || '').toLowerCase().includes(q)
    )
  }, [employees, query, searchQuery, searchEmployeeIds])

  const filteredAdmins = useMemo(() => {
    if (searchQuery) {
      const ids = searchAdminIds
      return admins.filter(a => ids.has(a.id))
    }
    if (!query) return admins
    const q = query.toLowerCase()
    return admins.filter((a) =>
      (a.full_name || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.role || '').toLowerCase().includes(q)
    )
  }, [admins, query, searchQuery, searchAdminIds])

  const filteredLogs = useMemo(() => {
    let base = logOnlyMine ? logs.filter((l) => l.admin_id === profile?.id) : logs
    if (searchQuery) {
      const ids = searchLogIds
      return base.filter(l => ids.has(l.id))
    }
    if (!query) return base
    const q = query.toLowerCase()
    return base.filter((l) =>
      (l.admin_name || '').toLowerCase().includes(q) ||
      (l.action || '').toLowerCase().includes(q) ||
      (l.target_name || '').toLowerCase().includes(q) ||
      (l.detail || '').toLowerCase().includes(q)
    )
  }, [logs, logOnlyMine, profile?.id, query, searchQuery, searchLogIds])

  if (authLoading || (!profile && session)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface-variant">
        Memuat dasbor...
      </div>
    )
  }

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface-variant">
        <div className="text-center">
          <p className="font-headline-md text-headline-md mb-2">Akses Ditolak</p>
          <p className="font-body-md text-body-md">Anda tidak memiliki hak untuk mengakses halaman ini.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface-variant">
        Memuat dasbor...
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface-variant">
        <div className="text-center">
          <p className="font-headline-md text-headline-md text-error mb-2">Gagal memuat data</p>
          <p className="font-body-md text-body-md">{loadError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface text-on-surface h-screen flex overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AdminSidebar
        tab={tab}
        selectTab={selectTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isSuperAdmin={isSuperAdmin}
        logoUrl={settings.logo_url}
        onLogout={handleLogout}
        onOpenProfile={() => navigate('/admin/profile')}
      />

      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <AdminTopbar
          tab={tab}
          query={query}
          onSearchChange={handleSearchChange}
          searchLoading={searchLoading}
          profile={profile}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          onOpenProfile={() => navigate('/admin/profile')}
        />

        <main className="pt-20 pb-12 px-6 lg:px-margin-desktop min-h-screen overflow-y-auto flex-1">
          {tab === 'dasbor' && (
            <DashboardTab
              summary={summary}
              hasVisitFilter={hasVisitFilter}
              chart={{
                mode: chartMode,
                setMode: setChartMode,
                daily: chartData,
                weekly: weeklyData,
                monthly: monthlyData,
                error: chartError
              }}
              exportState={exportState}
              setExportState={setExportState}
              onExport={handleExport}
              exporting={exporting}
              table={{
                visits,
                employees,
                filters: { employeeFilter, dateFilterStart, dateFilterEnd },
                onFilterChange: handleFilterChange,
                onResetFilters: handleResetFilters,
                hasVisitFilter,
                visitsLoading,
                notice,
                totalVisits,
                page,
                totalPages,
                onPageChange: handlePageChange,
                onEdit: openEdit,
                onDelete: handleDelete,
                deletingId,
                onLogout: handleLogout
              }}
            />
          )}

          {tab === 'pegawai' && (
            <EmployeesTab
              employees={filteredEmployees}
              allEmployees={employees}
              empForm={empForm}
              setEmpForm={setEmpForm}
              onAdd={addEmployee}
              saving={savingEmp}
              error={empError}
              empPage={empPage}
              setEmpPage={setEmpPage}
              empPageSize={EMP_PAGE_SIZE}
              onMove={moveEmployee}
              onEdit={openEditEmp}
              onDelete={deleteEmployee}
            />
          )}

          {tab === 'admin' && (
            <AdminsTab
              admins={filteredAdmins}
              adminForm={adminForm}
              setAdminForm={setAdminForm}
              onAdd={addAdmin}
              saving={savingAdmin}
              error={adminError}
              onToggleRole={toggleAdminRole}
              onOpenReset={openResetDialog}
              resetTarget={resetTarget}
              onCloseReset={closeResetDialog}
              onSubmitReset={submitResetPassword}
              resetting={resettingPassword}
              resetError={resetError}
            />
          )}

          {tab === 'log' && (
            <ActivityLogTab
              logs={filteredLogs}
              logOnlyMine={logOnlyMine}
              onToggleOnlyMine={setLogOnlyMine}
              logPage={logPage}
              setLogPage={setLogPage}
              pageSize={LOG_PAGE_SIZE}
            />
          )}

          {tab === 'pengaturan' && (
            <SettingsTab
              settings={settingsLocal}
              onChange={updateSetting}
              onSave={handleSaveSettings}
              saving={savingSettings}
            />
          )}
        </main>
      </div>

      {editing && (
        <EditVisitModal
          form={editForm}
          setForm={setEditForm}
          employees={employees}
          onClose={closeEdit}
          onSave={handleSaveEdit}
          saving={saving}
        />
      )}

      {editingEmp && (
        <EditEmployeeModal
          form={empEditForm}
          setForm={setEmpEditForm}
          onClose={closeEditEmp}
          onSave={updateEmployee}
        />
      )}
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import Icon from '../components/Icon.jsx'
import SiteNavBar from '../components/SiteNavBar.jsx'
import { useSiteSettings } from '../hooks/useSiteSettings.js'

const PURPOSE_OPTIONS = [
  { value: 'business', label: 'Pertemuan Bisnis' },
  { value: 'delivery', label: 'Pengiriman / Kurir' },
  { value: 'maintenance', label: 'Pemeliharaan / Dukungan' },
  { value: 'personal', label: 'Kunjungan Pribadi' },
  { value: 'interview', label: 'Wawancara Kerja' },
  { value: 'other', label: 'Lainnya' }
]

const inputClass =
  'w-full pl-10 pr-4 py-3 rounded-lg border border-outline bg-surface-bright focus:ring-2 focus:ring-secondary focus:border-secondary transition-all font-body-md text-body-md placeholder:text-outline/60'

export default function RegistrationForm() {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    employeeId: '',
    purpose: '',
    otherPurpose: '',
    remarks: ''
  })
  const { settings } = useSiteSettings()
  const [employees, setEmployees] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [error, setError] = useState('')
  const toastTimer = useRef(null)

  // Autocomplete tujuan (yang ditemui)
  const [destInput, setDestInput] = useState('')
  const [destEmployeeId, setDestEmployeeId] = useState(null)
  const [destOther, setDestOther] = useState(false)
  const [destOtherText, setDestOtherText] = useState('')
  const [destOpen, setDestOpen] = useState(false)
  const destRef = useRef(null)

  const destMatches = useMemo(() => {
    const q = destInput.trim().toLowerCase()
    if (q.length < 2) return []
    return employees
      .filter((e) => {
        const name = (e.full_name || '').toLowerCase()
        const pos = (e.position || '').toLowerCase()
        const rk = (e.rank || '').toLowerCase()
        return name.includes(q) || pos.includes(q) || rk.includes(q)
      })
      .slice(0, 8)
  }, [destInput, employees])

  useEffect(() => {
    const onClick = (e) => {
      if (destRef.current && !destRef.current.contains(e.target)) setDestOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const pickEmployee = (emp) => {
    setDestInput(`${emp.full_name}${emp.rank ? ` (${emp.rank})` : ''}${emp.position ? ` - ${emp.position}` : ''}`)
    setDestEmployeeId(emp.id)
    setDestOther(false)
    setDestOtherText('')
    setDestOpen(false)
  }

  const chooseOther = () => {
    setDestOther(true)
    setDestEmployeeId(null)
    setDestOpen(false)
  }

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setDate(now.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }))
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: true }))
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('employees')
        .select('id, full_name, position')
        .order('full_name')
      if (data) setEmployees(data)
    }
    load()
  }, [])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { data: visitor, error: vErr } = await supabase
        .from('visitors')
        .insert({
          full_name: form.fullName,
          phone: form.phoneNumber
        })
        .select()
        .single()
      if (vErr) throw vErr

      const { error: visitErr } = await supabase.from('visits').insert({
        visitor_id: visitor.id,
        employee_id: destEmployeeId || null,
        destination_text: destOther ? destOtherText.trim() || null : null,
        purpose: form.purpose === 'other' ? form.otherPurpose : form.purpose,
        remarks: form.remarks || null
      })
      if (visitErr) throw visitErr

      setForm({ fullName: '', phoneNumber: '', employeeId: '', purpose: '', otherPurpose: '', remarks: '' })
      setDestInput('')
      setDestEmployeeId(null)
      setDestOther(false)
      setDestOtherText('')
      setShowToast(true)
      toastTimer.current = setTimeout(() => setShowToast(false), 5000)
    } catch (err) {
      setError(err.message || 'Gagal menyimpan registrasi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <SiteNavBar />

      <main className="flex-grow pt-32 pb-xl px-margin-mobile md:px-margin-desktop bg-surface">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left: context image */}
          <div className="lg:col-span-5 hidden lg:flex flex-col justify-center">
            <div className="relative rounded-xl overflow-hidden h-full min-h-[500px]">
              <img
                alt="Lobi korporat profesional"
                className="absolute inset-0 w-full h-full object-cover"
                src={settings.form_bg_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuADZ3rpZT5KecUPyHDx8h8WQ7yF1BTl-sGwOzPq0zsq66uQ4nNUbMR3o7bs6NLtJhoGj4q6eSWEBXGt76FkKUNbPb1x96TEu1LB8OzSTkHO-DP7XNEEbxIrFZNuwdy0_kGJO08Fm7rTBFRvaTatID3XVlhGP45a3FUdaAovkyJNPnfCTdvyRnEcRW4VqwloYpnf5Hf9L0UypOrCSbje44GVX5XX9JnUZKQSBK5rMdL951hLiD83eCY-NGBoII0jVZ6JAeQrrInnB1M'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 to-transparent flex flex-col justify-end p-lg">
                <h2 className="font-headline-lg text-headline-lg text-on-primary mb-sm">
                  Keamanan Ditingkatkan
                </h2>
                <p className="font-body-md text-body-md text-surface-variant opacity-90">
                  Buku tamu digital kami memastikan setiap entri dilacak dan
                  diverifikasi untuk keamanan dan kepatuhan perusahaan Anda.
                </p>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="lg:col-span-7">
            <section className="bg-surface-container-lowest p-md md:p-lg rounded-xl border border-outline-variant shadow-[0px_4px_12px_rgba(15,23,42,0.05)]">
              <div className="mb-lg">
                <h1 className="font-headline-lg text-headline-lg text-on-surface">
                  Registrasi Pengunjung
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
                  Silakan lengkapi formulir di bawah ini untuk mendaftarkan
                  kunjungan Anda.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-label-md">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mb-lg">
                <div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant/30">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">
                    Tanggal Hari Ini
                  </span>
                  <div className="flex items-center gap-2 text-on-surface">
                    <Icon name="calendar_today" className="text-[20px]" />
                    <span className="font-body-md text-body-md font-medium">{date}</span>
                  </div>
                </div>
                <div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant/30">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">
                    Waktu Masuk
                  </span>
                  <div className="flex items-center gap-2 text-on-surface">
                    <Icon name="schedule" className="text-[20px]" />
                    <span className="font-body-md text-body-md font-medium">{time}</span>
                  </div>
                </div>
              </div>

              <form className="space-y-md" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <label className="font-label-md text-label-md text-on-surface" htmlFor="fullName">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <Icon name="person" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      id="fullName"
                      required
                      value={form.fullName}
                      onChange={update('fullName')}
                      className={inputClass}
                      placeholder="Masukkan nama lengkap Anda sesuai identitas"
                      type="text"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-label-md text-label-md text-on-surface" htmlFor="phoneNumber">
                    Nomor Telepon
                  </label>
                  <div className="relative">
                    <Icon name="phone_iphone" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      id="phoneNumber"
                      required
                      value={form.phoneNumber}
                      onChange={update('phoneNumber')}
                      className={inputClass}
                      placeholder="+62 812-0000-0000"
                      type="tel"
                    />
                  </div>
                </div>

                <div className="space-y-1" ref={destRef}>
                  <label className="font-label-md text-label-md text-on-surface" htmlFor="destInput">
                    Tujuan (Yang Ditemui)
                  </label>
                  <div className="relative">
                    <Icon name="badge" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      id="destInput"
                      value={destInput}
                      onChange={(e) => {
                        setDestInput(e.target.value)
                        setDestEmployeeId(null)
                        setDestOther(false)
                        setDestOpen(true)
                      }}
                      onFocus={() => { if (destInput.trim().length >= 2) setDestOpen(true) }}
                      className={inputClass}
                      placeholder="Ketik nama pegawai..."
                      type="text"
                      autoComplete="off"
                    />
                    {destOpen && destInput.trim().length >= 2 && (
                      <div className="absolute z-20 mt-1 w-full bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {destMatches.length === 0 && (
                          <div className="px-4 py-3 text-label-md text-on-surface-variant">
                            Tidak ada rekomendasi
                          </div>
                        )}
                        {destMatches.map((emp) => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => pickEmployee(emp)}
                            className="w-full text-left px-4 py-2.5 hover:bg-surface-container-high transition-all flex flex-col"
                          >
                            <span className="font-label-md text-label-md text-on-surface">
                              {emp.full_name}{emp.rank ? ` (${emp.rank})` : ''}
                            </span>
                            {emp.position && (
                              <span className="font-label-sm text-label-sm text-on-surface-variant">{emp.position}</span>
                            )}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={chooseOther}
                          className="w-full text-left px-4 py-2.5 hover:bg-surface-container-high transition-all flex items-center gap-2 border-t border-outline-variant"
                        >
                          <Icon name="add" className="text-[18px] text-secondary" />
                          <span className="font-label-md text-label-md text-secondary">Lainnya (tulis sendiri)</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {destOther && (
                    <div className="relative mt-3">
                      <Icon name="edit_note" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        value={destOtherText}
                        onChange={(e) => setDestOtherText(e.target.value)}
                        className={inputClass}
                        placeholder="Sebutkan nama yang dimaksud"
                        type="text"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-label-md text-label-md text-on-surface" htmlFor="purpose">
                    Keperluan
                  </label>
                  <div className="relative">
                    <Icon name="business_center" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <select
                      id="purpose"
                      required
                      value={form.purpose}
                      onChange={update('purpose')}
                      className={`${inputClass} appearance-none pr-10`}
                    >
                      <option disabled value="">
                        Pilih keperluan
                      </option>
                      {PURPOSE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <Icon name="arrow_drop_down" className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
                  </div>
                  {form.purpose === 'other' && (
                    <div className="relative mt-3">
                      <Icon name="edit_note" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        id="otherPurpose"
                        required
                        value={form.otherPurpose}
                        onChange={update('otherPurpose')}
                        className={inputClass}
                        placeholder="Sebutkan keperluan"
                        type="text"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-label-md text-label-md text-on-surface" htmlFor="remarks">
                    Catatan / Keterangan
                  </label>
                  <textarea
                    id="remarks"
                    value={form.remarks}
                    onChange={update('remarks')}
                    className="w-full px-4 py-3 rounded-lg border border-outline bg-surface-bright focus:ring-2 focus:ring-secondary focus:border-secondary transition-all font-body-md text-body-md placeholder:text-outline/60"
                    placeholder="Detail tambahan (misal: nama tuan rumah, nomor suite)"
                    rows="3"
                  />
                </div>

                <div className="pt-base">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-secondary text-on-primary h-12 rounded-lg font-label-md text-label-md font-bold shadow-md hover:bg-secondary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Icon name="how_to_reg" />
                    {submitting ? 'Mendaftarkan...' : 'Kirim Registrasi'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-lg px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-md bg-inverse-surface border-t border-outline">
        <div className="flex flex-col gap-xs items-center md:items-start text-center md:text-left">
          <span className="font-headline-lg text-headline-lg text-on-primary">E-Tamu</span>
          <p className="font-body-md text-body-md text-surface-variant max-w-sm">
            © 2024 Sistem Buku Tamu Digital. Keamanan Kelas Perusahaan.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-md">
          <a className="font-label-sm text-label-sm text-surface-variant hover:text-secondary-container underline transition-all" href="#">
            Kebijakan Privasi
          </a>
          <a className="font-label-sm text-label-sm text-surface-variant hover:text-secondary-container underline transition-all" href="#">
            Ketentuan Layanan
          </a>
          <a className="font-label-sm text-label-sm text-surface-variant hover:text-secondary-container underline transition-all" href="#">
            Dokumen Keamanan
          </a>
          <a className="font-label-sm text-label-sm text-surface-variant hover:text-secondary-container underline transition-all" href="#">
            Hubungi Dukungan
          </a>
        </div>
      </footer>

      {/* Toast */}
      <div
        className={`fixed bottom-margin-desktop right-margin-desktop z-[100] transform transition-all duration-500 ease-out ${
          showToast
            ? 'translate-y-0 opacity-100'
            : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-inverse-surface text-inverse-on-surface flex items-center gap-md px-md py-4 rounded-xl shadow-2xl border border-outline-variant/20">
          <div className="bg-secondary p-1 rounded-full text-on-secondary">
            <Icon name="check_circle" className="" />
          </div>
          <div>
            <p className="font-label-md text-label-md font-bold">Registrasi Berhasil</p>
            <p className="font-label-sm text-label-sm text-surface-variant">
              Kartu pengunjung telah dibuat dan dikirim.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

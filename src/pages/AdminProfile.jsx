import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.js'
import Icon from '../components/Icon.jsx'

export default function AdminProfile() {
  const { session, profile, isSuperAdmin, signOut } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const force = searchParams.get('force') === '1'

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword.length < 6) {
      setError('Kata sandi baru minimal 6 karakter.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.')
      return
    }
    if (!force && oldPassword === newPassword) {
      setError('Kata sandi baru harus berbeda dari yang lama.')
      return
    }

    setSaving(true)
    try {
      if (!force) {
        const { error: reauthErr } = await supabase.auth.signInWithPassword({
          email: session.user.email,
          password: oldPassword
        })
        if (reauthErr) throw new Error('Kata sandi lama salah.')
      }

      const { error: updErr } = await supabase.auth.updateUser({ password: newPassword })
      if (updErr) throw updErr

      const { error: profErr } = await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', session.user.id)
      if (profErr) throw profErr

      setSuccess('Kata sandi berhasil diperbarui.')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')

      if (force) {
        setTimeout(() => navigate('/admin', { replace: true }), 800)
      }
    } catch (err) {
      setError(err.message || 'Gagal memperbarui kata sandi.')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col">
      <header className="bg-surface-container-low border-b border-outline-variant px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon name="account_circle" className="text-[28px] text-secondary" />
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface">
              Profil Saya
            </h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {profile?.email || session?.user?.email}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-outline text-on-surface hover:bg-surface-container transition-all font-label-md text-label-md"
        >
          <Icon name="logout" />
          Keluar
        </button>
      </header>

      <main className="flex-1 px-4 md:px-8 py-lg max-w-3xl w-full mx-auto w-full">
        {force && (
          <div className="mb-md p-4 rounded-lg bg-secondary-container text-on-secondary-container">
            <p className="font-label-md text-label-md font-bold mb-1">
              Wajib mengganti kata sandi
            </p>
            <p className="font-body-sm text-body-sm">
              Demi keamanan, silakan ganti kata sandi default Anda sebelum melanjutkan.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-md p-3 rounded-lg bg-error-container text-on-error-container text-label-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-md p-3 rounded-lg bg-secondary-container text-on-secondary-container text-label-md">
            {success}
          </div>
        )}

        <section className="bg-surface-container-lowest p-md md:p-lg rounded-xl border border-outline-variant mb-md">
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-base">
            Informasi Akun
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">
                Nama
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                {profile?.full_name || '-'}
              </span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">
                Email
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                {profile?.email || session?.user?.email || '-'}
              </span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">
                Peran
              </span>
              <span className="font-body-md text-body-md text-on-surface capitalize">
                {profile?.role || '-'}
              </span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">
                Status
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </span>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest p-md md:p-lg rounded-xl border border-outline-variant">
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-base">
            Ubah Kata Sandi
          </h2>

          <form className="space-y-md" onSubmit={handleChangePassword}>
            {!force && (
              <div>
                <label className="font-label-md text-label-md text-on-surface block mb-1" htmlFor="oldPassword">
                  Kata Sandi Lama
                </label>
                <input
                  id="oldPassword"
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-outline bg-surface-bright focus:ring-2 focus:ring-secondary focus:border-secondary transition-all font-body-md text-body-md"
                  placeholder="Masukkan kata sandi lama"
                />
              </div>
            )}

            <div>
              <label className="font-label-md text-label-md text-on-surface block mb-1" htmlFor="newPassword">
                Kata Sandi Baru
              </label>
              <input
                id="newPassword"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-outline bg-surface-bright focus:ring-2 focus:ring-secondary focus:border-secondary transition-all font-body-md text-body-md"
                placeholder="Minimal 6 karakter"
              />
            </div>

            <div>
              <label className="font-label-md text-label-md text-on-surface block mb-1" htmlFor="confirmPassword">
                Konfirmasi Kata Sandi Baru
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-outline bg-surface-bright focus:ring-2 focus:ring-secondary focus:border-secondary transition-all font-body-md text-body-md"
                placeholder="Ulangi kata sandi baru"
              />
            </div>

            <div className="pt-base flex items-center gap-md">
              <button
                type="submit"
                disabled={saving}
                className="bg-secondary text-on-primary h-12 px-6 rounded-lg font-label-md text-label-md font-bold shadow-md hover:bg-secondary/90 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-60"
              >
                <Icon name="lock_reset" />
                {saving ? 'Menyimpan...' : 'Simpan Kata Sandi'}
              </button>
              {!force && (
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="h-12 px-6 rounded-lg border border-outline text-on-surface hover:bg-surface-container transition-all font-label-md text-label-md"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

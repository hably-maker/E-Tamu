import { useState } from 'react'

const INPUT =
  'w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary'
const TH = 'px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest'

function ResetPasswordDialog({ target, onClose, onSubmit, saving, error }) {
  const [password, setPassword] = useState('')

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-2xl w-full max-w-md p-md md:p-lg">
        <h4 className="font-headline-md text-headline-md text-on-surface mb-base">
          Reset Kata Sandi
        </h4>
        <p className="font-body-md text-body-md text-on-surface-variant mb-md">
          Reset kata sandi untuk <span className="font-bold">{target.full_name || target.email}</span>.
          Admin akan diminta mengganti kata sandi ini saat login berikutnya.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit(password)
          }}
          className="space-y-md"
        >
          <div>
            <label
              className="block font-label-md text-label-md text-on-surface mb-1"
              htmlFor="resetNewPassword"
            >
              Kata Sandi Baru
            </label>
            <input
              id="resetNewPassword"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT}
              placeholder="Minimal 6 karakter"
              autoComplete="off"
            />
          </div>
          {error && (
            <p className="text-label-sm text-on-error-container bg-error-container px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3 pt-base">
            <button
              type="submit"
              disabled={saving}
              className="bg-secondary text-on-primary px-4 py-2.5 rounded-lg font-label-md hover:opacity-90 transition-all disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Reset'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-outline text-on-surface hover:bg-surface-container transition-all font-label-md"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminsTab({
  admins,
  adminForm,
  setAdminForm,
  onAdd,
  saving,
  error,
  onToggleRole,
  onOpenReset,
  resetTarget,
  onCloseReset,
  onSubmitReset,
  resetting,
  resetError
}) {
  return (
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
        <h4 className="font-headline-md text-headline-md text-on-surface mb-4">Tambah Admin Baru</h4>
        <form onSubmit={onAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4" autoComplete="off">
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1">
              Nama Lengkap
            </label>
            <input
              value={adminForm.fullName}
              onChange={(e) => setAdminForm((f) => ({ ...f, fullName: e.target.value }))}
              className={INPUT}
              placeholder="Nama admin"
              autoComplete="off"
              readOnly
              onFocus={(e) => e.target.removeAttribute('readonly')}
            />
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1">Email</label>
            <input
              type="email"
              value={adminForm.email}
              onChange={(e) => setAdminForm((f) => ({ ...f, email: e.target.value }))}
              className={INPUT}
              placeholder="admin@email.com"
              autoComplete="off"
              readOnly
              onFocus={(e) => e.target.removeAttribute('readonly')}
            />
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1">Kata Sandi</label>
            <input
              type="password"
              value={adminForm.password}
              onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))}
              className={INPUT}
              placeholder="Minimal 6 karakter"
              autoComplete="off"
              readOnly
              onFocus={(e) => e.target.removeAttribute('readonly')}
            />
          </div>
          <div className="md:col-span-3 flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-secondary text-on-primary px-4 py-2.5 rounded-lg font-label-md hover:opacity-90 transition-all disabled:opacity-60"
            >
              {saving ? 'Membuat...' : 'Tambah Admin'}
            </button>
          </div>
        </form>
        {error && (
          <p className="mt-3 text-label-sm text-on-error-container bg-error-container px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
      </div>

      <div className="glass-card rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant">
          <h4 className="font-headline-md text-headline-md text-on-surface">
            Daftar Pengguna ({admins.length})
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low">
              <tr>
                <th className={TH}>Nama</th>
                <th className={TH}>Email</th>
                <th className={TH}>Peran</th>
                <th className={`${TH} text-right`}>Aksi</th>
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
                  <td className="px-6 py-4 font-label-md text-label-md font-bold text-on-surface">
                    {a.full_name || '-'}
                    {a.is_super_admin && (
                      <span className="ml-2 font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container">
                        Super
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">
                    {a.email || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`font-label-sm text-label-sm px-3 py-1 rounded-full ${
                        a.role === 'admin'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {a.role === 'admin' ? 'Admin' : 'Staff'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-3">
                      <button
                        onClick={() => onToggleRole(a.id, a.role)}
                        className="font-label-sm text-label-sm text-secondary underline hover:opacity-80"
                        disabled={a.is_super_admin}
                        title={a.is_super_admin ? 'Tidak dapat mengubah peran super admin' : ''}
                      >
                        {a.role === 'admin' ? 'Jadikan Staff' : 'Jadikan Admin'}
                      </button>
                      <button
                        onClick={() => onOpenReset(a)}
                        className="font-label-sm text-label-sm text-tertiary underline hover:opacity-80"
                      >
                        Reset Password
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {resetTarget && (
        <ResetPasswordDialog
          target={resetTarget}
          onClose={onCloseReset}
          onSubmit={onSubmitReset}
          saving={resetting}
          error={resetError}
        />
      )}
    </>
  )
}

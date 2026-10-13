import Icon from '../Icon.jsx'
import { PURPOSE_OPTIONS } from '../../lib/visitFormat.js'

const INPUT =
  'w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary'
const LABEL = 'block font-label-md text-label-md text-on-surface mb-1'

export default function EditVisitModal({ form, setForm, employees, onClose, onSave, saving }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-margin-mobile"
      role="dialog"
      aria-modal="true"
      aria-label="Edit Data Kunjungan"
    >
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-headline-md text-headline-md text-on-surface">Edit Data Kunjungan</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high"
            aria-label="Tutup"
          >
            <Icon name="close" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSave()
          }}
          className="space-y-4"
        >
          <div>
            <label className={LABEL}>Nama Lengkap</label>
            <input
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>No. Telepon</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Tujuan (Yang Ditemui)</label>
            <select
              value={form.employeeId}
              onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
              className={INPUT}
            >
              <option value="">Lobi</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name}
                  {emp.rank ? ` (${emp.rank})` : ''}
                  {emp.position ? ` - ${emp.position}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Keperluan</label>
            <select
              value={form.purpose}
              onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
              className={INPUT}
            >
              {PURPOSE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
              {/* Keperluan teks bebas dari formulir registrasi */}
              {form.purpose && !PURPOSE_OPTIONS.some((o) => o.value === form.purpose) && (
                <option value={form.purpose}>{form.purpose}</option>
              )}
            </select>
          </div>
          <div>
            <label className={LABEL}>Catatan</label>
            <textarea
              value={form.remarks}
              onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
              rows={3}
              className={INPUT}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface font-label-md hover:bg-surface-container-high transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-secondary text-on-primary font-label-md hover:opacity-90 transition-all disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

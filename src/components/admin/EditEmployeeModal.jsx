import Icon from '../Icon.jsx'

const INPUT =
  'w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary'
const LABEL = 'block font-label-md text-label-md text-on-surface mb-1'

export default function EditEmployeeModal({ form, setForm, onClose, onSave }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-margin-mobile"
      role="dialog"
      aria-modal="true"
      aria-label="Edit Pegawai"
    >
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-headline-md text-headline-md text-on-surface">Edit Pegawai</h3>
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
            <label className={LABEL}>Pangkat</label>
            <input
              value={form.rank}
              onChange={(e) => setForm((f) => ({ ...f, rank: e.target.value }))}
              className={INPUT}
              placeholder="Mis. Kapten"
            />
          </div>
          <div>
            <label className={LABEL}>Jabatan</label>
            <input
              value={form.position}
              onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
              className={INPUT}
              placeholder="Jabatan / Posisi"
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
              className="px-4 py-2 rounded-lg bg-secondary text-on-primary font-label-md hover:opacity-90 transition-all"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

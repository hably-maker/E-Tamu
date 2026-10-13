import Icon from '../Icon.jsx'

const INPUT =
  'w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary'
const TH = 'px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest'

export default function EmployeesTab({
  employees,
  allEmployees,
  empForm,
  setEmpForm,
  onAdd,
  saving,
  error,
  empPage,
  setEmpPage,
  empPageSize,
  onMove,
  onEdit,
  onDelete
}) {
  // employees = hasil pencarian, allEmployees = daftar penuh untuk batas urutan
  const fullList = allEmployees || employees
  const fullPageCount = Math.max(1, Math.ceil(fullList.length / empPageSize))
  const totalPages = Math.max(1, Math.ceil(employees.length / empPageSize))
  const pageRows = employees.slice((empPage - 1) * empPageSize, empPage * empPageSize)

  return (
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
        <h4 className="font-headline-md text-headline-md text-on-surface mb-4">Tambah Pegawai</h4>
        <form onSubmit={onAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1">
              Nama Lengkap
            </label>
            <input
              value={empForm.fullName}
              onChange={(e) => setEmpForm((f) => ({ ...f, fullName: e.target.value }))}
              className={INPUT}
              placeholder="Nama pegawai"
            />
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1">Pangkat</label>
            <input
              value={empForm.rank}
              onChange={(e) => setEmpForm((f) => ({ ...f, rank: e.target.value }))}
              className={INPUT}
              placeholder="Mis. Kapten"
            />
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1">Jabatan</label>
            <input
              value={empForm.position}
              onChange={(e) => setEmpForm((f) => ({ ...f, position: e.target.value }))}
              className={INPUT}
              placeholder="Jabatan / Posisi"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-secondary text-on-primary px-4 py-2.5 rounded-lg font-label-md hover:opacity-90 transition-all disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Tambah Pegawai'}
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
            Daftar Pegawai ({employees.length})
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low">
              <tr>
                <th className={TH}>Nama Pegawai</th>
                <th className={TH}>Pangkat</th>
                <th className={TH}>Jabatan</th>
                <th className={`${TH} text-right`}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant">
                    Belum ada data pegawai.
                  </td>
                </tr>
              )}
              {pageRows.map((emp) => (
                <tr key={emp.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-label-md text-label-md font-bold text-on-surface">
                    {emp.full_name}
                  </td>
                  <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">
                    {emp.rank || '-'}
                  </td>
                  <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">
                    {emp.position || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onMove(emp.id, -1)}
                        disabled={empPage === 1 && fullList.indexOf(emp) === 0}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all disabled:opacity-40"
                        title="Pindah ke atas"
                      >
                        <Icon name="arrow_upward" className="text-[18px]" />
                      </button>
                      <button
                        onClick={() => onMove(emp.id, 1)}
                        disabled={
                          empPage === fullPageCount && fullList.indexOf(emp) === fullList.length - 1
                        }
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all disabled:opacity-40"
                        title="Pindah ke bawah"
                      >
                        <Icon name="arrow_downward" className="text-[18px]" />
                      </button>
                      <button
                        onClick={() => onEdit(emp)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-secondary transition-all"
                        title="Edit"
                      >
                        <Icon name="edit" className="text-[18px]" />
                      </button>
                      <button
                        onClick={() => onDelete(emp.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-all"
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
            Halaman {empPage} dari {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEmpPage((p) => Math.max(1, p - 1))}
              disabled={empPage <= 1}
              className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface font-label-md hover:bg-surface-container-high transition-all disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setEmpPage((p) => Math.min(totalPages, p + 1))}
              disabled={empPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface font-label-md hover:bg-surface-container-high transition-all disabled:opacity-50"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

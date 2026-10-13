const TH = 'px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest'

export default function ActivityLogTab({ logs, logOnlyMine, onToggleOnlyMine, logPage, setLogPage, pageSize }) {
  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize))
  const paged = logs.slice((logPage - 1) * pageSize, logPage * pageSize)

  return (
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
            onChange={(e) => onToggleOnlyMine(e.target.checked)}
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
                <th className={TH}>Waktu</th>
                <th className={TH}>Admin</th>
                <th className={TH}>Aksi</th>
                <th className={TH}>Target</th>
                <th className={TH}>Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {paged.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                    Belum ada aktivitas.
                  </td>
                </tr>
              )}
              {paged.map((l) => (
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
                  <td className="px-6 py-4 font-label-md text-label-md font-bold text-on-surface">
                    {l.admin_name || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`font-label-sm text-label-sm px-3 py-1 rounded-full ${
                        l.action.includes('Hapus')
                          ? 'bg-error-container text-on-error-container'
                          : 'bg-secondary-container text-on-secondary-container'
                      }`}
                    >
                      {l.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">
                    {l.target_name || '-'}
                  </td>
                  <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant max-w-xs">
                    {l.detail || '-'}
                  </td>
                </tr>
              ))}
              {paged.length > 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Halaman {logPage} dari {totalPages}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                          disabled={logPage <= 1}
                          className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface font-label-md hover:bg-surface-container-high transition-all disabled:opacity-50"
                        >
                          Sebelumnya
                        </button>
                        <button
                          onClick={() => setLogPage((p) => Math.min(totalPages, p + 1))}
                          disabled={logPage >= totalPages}
                          className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface font-label-md hover:bg-surface-container-high transition-all disabled:opacity-50"
                        >
                          Berikutnya
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

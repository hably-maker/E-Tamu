import { Link } from 'react-router-dom'
import Icon from '../Icon.jsx'
import { purposeLabel, formatTime, formatDate, initials } from '../../lib/visitFormat.js'

const TH = 'px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-widest'

export default function VisitorsTable({
  visits,
  employees,
  filters,
  onFilterChange,
  onResetFilters,
  hasVisitFilter,
  visitsLoading,
  notice,
  totalVisits,
  page,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  deletingId,
  onLogout
}) {
  return (
    <div className="glass-card rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h4 className="font-headline-md text-headline-md text-on-surface">Pengunjung Terbaru</h4>
        <div className="flex gap-2 items-center flex-wrap">
          {notice && (
            <span className="font-label-sm text-label-sm text-on-error-container bg-error-container px-3 py-1.5 rounded-lg">
              {notice}
            </span>
          )}
          <div className="relative">
            <Icon
              name="filter_list"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-outline text-[18px]"
            />
            <select
              value={filters.employeeFilter}
              onChange={(e) => onFilterChange({ employeeId: e.target.value })}
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
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={filters.dateFilterStart}
              onChange={(e) => onFilterChange({ dateStart: e.target.value })}
              className="px-2 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg font-label-sm text-label-sm outline-none focus:ring-1 focus:ring-secondary"
            />
            <span className="text-on-surface-variant text-label-sm">-</span>
            <input
              type="date"
              value={filters.dateFilterEnd}
              onChange={(e) => onFilterChange({ dateEnd: e.target.value })}
              className="px-2 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg font-label-sm text-label-sm outline-none focus:ring-1 focus:ring-secondary"
            />
          </div>
          {hasVisitFilter && (
            <button
              onClick={onResetFilters}
              className="px-2 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-high transition-all"
            >
              Reset filter
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low">
            <tr>
              <th className={TH}>Nama Pengunjung</th>
              <th className={TH}>No. Telepon</th>
              <th className={`${TH} min-w-[180px]`}>Tujuan (Yang Ditemui)</th>
              <th className={TH}>Keperluan</th>
              <th className={TH}>Catatan</th>
              <th className={TH}>Tanggal</th>
              <th className={TH}>Waktu Masuk</th>
              <th className={`${TH} text-right`}>Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {visits.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-on-surface-variant">
                  {visitsLoading
                    ? 'Memuat data...'
                    : hasVisitFilter
                      ? 'Tidak ada kunjungan yang cocok dengan filter/pencarian.'
                      : 'Belum ada data kunjungan.'}
                </td>
              </tr>
            )}
            {visits.map((v) => (
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
                <td className="px-6 py-4 align-top min-w-[180px]">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label-md text-label-md text-on-surface font-bold whitespace-nowrap">
                      {v.employees?.full_name || v.destination_text || 'Lobi'}
                    </span>
                    {v.employees?.rank && (
                      <span className="text-[12px] text-on-surface-variant whitespace-nowrap">
                        {v.employees.rank}
                      </span>
                    )}
                    {v.employees?.position && (
                      <span className="text-[12px] text-on-surface-variant whitespace-nowrap">
                        {v.employees.position}
                      </span>
                    )}
                    {!v.employees?.position && v.destination_text && (
                      <span className="text-[12px] text-on-surface-variant">Tujuan lainnya</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">
                  {purposeLabel(v.purpose)}
                </td>
                <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant max-w-xs truncate">
                  {v.remarks || '-'}
                </td>
                <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant whitespace-nowrap">
                  {formatDate(v.check_in_at)}
                </td>
                <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant whitespace-nowrap">
                  {formatTime(v.check_in_at)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(v)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-secondary transition-all"
                      title="Edit"
                    >
                      <Icon name="edit" className="text-[18px]" />
                    </button>
                    <button
                      onClick={() => onDelete(v.id)}
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

      <div className="px-6 py-4 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          {visitsLoading
            ? 'Memuat...'
            : `${hasVisitFilter ? 'Total (filter aktif)' : 'Total'} ${totalVisits} kunjungan · Halaman ${page} dari ${totalPages}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1 || visitsLoading}
            className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface font-label-md hover:bg-surface-container-high transition-all disabled:opacity-50"
          >
            Sebelumnya
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || visitsLoading}
            className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface font-label-md hover:bg-surface-container-high transition-all disabled:opacity-50"
          >
            Berikutnya
          </button>
        </div>
        <Link
          to="/login"
          onClick={onLogout}
          className="lg:hidden font-label-sm text-label-sm text-secondary underline"
        >
          Keluar
        </Link>
      </div>
    </div>
  )
}

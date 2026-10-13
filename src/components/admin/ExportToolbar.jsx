import Icon from '../Icon.jsx'

const FIELD =
  'px-3 py-2 bg-surface-container-low border-none rounded-lg font-label-md text-label-md outline-none focus:ring-1 focus:ring-secondary'

export default function ExportToolbar({ exportState, setExportState, onExport, exporting }) {
  const { exportMode, rangeStart, rangeEnd, exportMonth, exportYear } = exportState

  return (
    <div className="glass-card rounded-xl p-4 mb-8 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4 flex-wrap">
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
            Periode
          </label>
          <select
            value={exportMode}
            onChange={(e) => setExportState({ ...exportState, exportMode: e.target.value })}
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
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                Dari
              </label>
              <input
                type="date"
                value={rangeStart}
                onChange={(e) => setExportState({ ...exportState, rangeStart: e.target.value })}
                className={FIELD}
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                Sampai
              </label>
              <input
                type="date"
                value={rangeEnd}
                onChange={(e) => setExportState({ ...exportState, rangeEnd: e.target.value })}
                className={FIELD}
              />
            </div>
          </div>
        )}

        {exportMode === 'month' && (
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
              Bulan
            </label>
            <input
              type="month"
              value={exportMonth}
              onChange={(e) => setExportState({ ...exportState, exportMonth: e.target.value })}
              className={FIELD}
            />
          </div>
        )}

        {exportMode === 'year' && (
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
              Tahun
            </label>
            <input
              type="number"
              min="2000"
              max="2100"
              value={exportYear}
              onChange={(e) => setExportState({ ...exportState, exportYear: e.target.value })}
              placeholder="2026"
              className={`${FIELD} w-28`}
            />
          </div>
        )}

        <div className="flex gap-2 lg:ml-auto">
          <button
            onClick={() => onExport('excel')}
            disabled={exporting}
            className="px-4 py-2 bg-secondary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            <Icon name="description" className="text-[18px]" /> Excel
          </button>
          <button
            onClick={() => onExport('csv')}
            disabled={exporting}
            className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container-highest transition-all flex items-center gap-2 disabled:opacity-60"
          >
            <Icon name="table_view" className="text-[18px]" /> CSV
          </button>
          <button
            onClick={() => onExport('pdf')}
            disabled={exporting}
            className="px-4 py-2 border border-outline-variant text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container-high transition-all flex items-center gap-2 disabled:opacity-60"
          >
            <Icon name="picture_as_pdf" className="text-[18px]" /> PDF
          </button>
        </div>
      </div>
    </div>
  )
}

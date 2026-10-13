const MODE_COPY = {
  daily: {
    title: 'Tren Kunjungan Hari Kerja',
    desc: 'Kunjungan Senin&ndash;Jumat (5 hari kerja terakhir) untuk memantau hari tersibuk.'
  },
  weekly: {
    title: 'Tren Kunjungan Mingguan',
    desc: 'Kunjungan per minggu (8 minggu terakhir) untuk memantau tren mingguan.'
  },
  monthly: {
    title: 'Tren Kunjungan Bulanan',
    desc: 'Kunjungan per bulan (6 bulan terakhir) untuk memantau tren bulanan.'
  }
}

const MODES = [
  { id: 'daily', label: 'Harian' },
  { id: 'weekly', label: 'Mingguan' },
  { id: 'monthly', label: 'Bulanan' }
]

export default function VisitChart({ chartMode, setChartMode, daily, weekly, monthly, error }) {
  const dataset = chartMode === 'daily' ? daily : chartMode === 'weekly' ? weekly : monthly
  const copy = MODE_COPY[chartMode]
  const max = Math.max(1, ...dataset.map((c) => c.count))

  return (
    <div className="glass-card rounded-xl p-6 mb-8 shadow-sm overflow-visible">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h4 className="font-headline-md text-headline-md text-on-surface mb-1">{copy.title}</h4>
          <p className="font-label-sm text-label-sm text-on-surface-variant">{copy.desc}</p>
          {error && (
            <p className="font-label-sm text-label-sm text-on-error-container bg-error-container px-3 py-2 rounded-lg mt-2">
              {error}
            </p>
          )}
        </div>
        <div className="flex rounded-lg bg-surface-container-low p-1">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setChartMode(mode.id)}
              className={`px-3 py-1.5 rounded-md font-label-sm text-label-sm transition-all ${
                chartMode === mode.id
                  ? 'bg-secondary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-start justify-between gap-3">
        {dataset.map((d) => {
          const heightPct = (d.count / max) * 100
          return (
            <div key={d.label} className="flex-1 min-w-[64px] flex flex-col items-center gap-1">
              <span className="font-label-sm text-label-sm text-on-surface font-bold whitespace-nowrap leading-none mb-1">
                {d.count}
              </span>
              <div className="w-full flex items-end" style={{ height: '160px' }}>
                <div
                  className="w-full rounded-t-lg bg-secondary transition-all"
                  style={{ height: `${heightPct}%`, minHeight: d.count > 0 ? '8px' : '0' }}
                  title={`${d.label}: ${d.count} pengunjung`}
                />
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant text-center whitespace-nowrap truncate w-full leading-tight mt-1">
                {d.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

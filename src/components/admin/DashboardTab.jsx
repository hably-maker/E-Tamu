import SummaryCards from './SummaryCards.jsx'
import VisitChart from './VisitChart.jsx'
import ExportToolbar from './ExportToolbar.jsx'
import VisitorsTable from './VisitorsTable.jsx'

export default function DashboardTab({
  summary,
  hasVisitFilter,
  chart,
  exportState,
  setExportState,
  onExport,
  exporting,
  table
}) {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Dasbor Admin
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Pengawasan waktu nyata untuk akses fasilitas dan metrik pengunjung.
          </p>
        </div>
      </div>

      <SummaryCards
        todayCount={summary.today}
        weeklyCount={summary.week}
        monthCount={summary.month}
        hasVisitFilter={hasVisitFilter}
      />

      <VisitChart
        chartMode={chart.mode}
        setChartMode={chart.setMode}
        daily={chart.daily}
        weekly={chart.weekly}
        monthly={chart.monthly}
        error={chart.error}
      />

      <ExportToolbar
        exportState={exportState}
        setExportState={setExportState}
        onExport={onExport}
        exporting={exporting}
      />

      <VisitorsTable {...table} />
    </>
  )
}

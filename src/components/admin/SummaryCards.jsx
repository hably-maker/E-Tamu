import Icon from '../Icon.jsx'

export default function SummaryCards({ todayCount, weeklyCount, monthCount, hasVisitFilter }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <Icon name="group" />
            </div>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant">Pengunjung Hari Ini</p>
          <h3 className="font-headline-md text-headline-md mt-1">{todayCount}</h3>
        </div>
        <div className="glass-card p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-tertiary-fixed-dim flex items-center justify-center text-on-tertiary-fixed">
              <Icon name="view_week" />
            </div>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant">Minggu Ini</p>
          <h3 className="font-headline-md text-headline-md mt-1">{weeklyCount}</h3>
        </div>
        <div className="glass-card p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container">
              <Icon name="calendar_month" />
            </div>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant">Bulan Ini</p>
          <h3 className="font-headline-md text-headline-md mt-1">{monthCount}</h3>
        </div>
      </div>

      {hasVisitFilter && (
        <p className="font-label-sm text-label-sm text-on-surface-variant -mt-4 mb-6">
          Angka ringkasan mengikuti filter/pencarian yang aktif.
        </p>
      )}
    </>
  )
}

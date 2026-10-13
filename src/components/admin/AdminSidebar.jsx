import { Link } from 'react-router-dom'
import Icon from '../Icon.jsx'

const TAB_ITEMS = [
  { id: 'dasbor', label: 'Dasbor', icon: 'dashboard' },
  { id: 'pegawai', label: 'Data Pegawai', icon: 'groups' },
  { id: 'admin', label: 'Kelola Admin', icon: 'admin_panel_settings', superAdminOnly: true },
  { id: 'log', label: 'Log Aktivitas', icon: 'history' },
  { id: 'pengaturan', label: 'Pengaturan', icon: 'settings' }
]

export default function AdminSidebar({
  tab,
  selectTab,
  sidebarOpen,
  setSidebarOpen,
  isSuperAdmin,
  logoUrl,
  onLogout,
  onOpenProfile
}) {
  return (
    <aside
      className={`fixed left-0 top-0 h-full z-[60] bg-surface-container-lowest border-r border-outline-variant w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-40 lg:h-screen lg:sticky lg:top-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-6 flex flex-col gap-1">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="E-Tamu" className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-on-secondary">
              <Icon name="security" className="" />
            </div>
          )}
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface">E-Tamu</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant opacity-70">
              Buku Tamu Digital
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high"
            aria-label="Tutup menu"
          >
            <Icon name="close" />
          </button>
        </div>
      </div>
      <nav className="flex-1 mt-4 px-2 space-y-1">
        <Link
          to="/"
          className="text-on-surface-variant px-4 py-3 flex items-center gap-3 hover:bg-surface-container-high transition-all rounded-lg"
        >
          <Icon name="home" />
          <span className="font-label-md text-label-md">Beranda</span>
        </Link>
        <Link
          to="/pengunjung"
          className="text-on-surface-variant px-4 py-3 flex items-center gap-3 hover:bg-surface-container-high transition-all rounded-lg"
        >
          <Icon name="person" />
          <span className="font-label-md text-label-md">Pengunjung</span>
        </Link>
        {TAB_ITEMS.filter((item) => !item.superAdminOnly || isSuperAdmin).map((item) => (
          <button
            key={item.id}
            onClick={() => selectTab(item.id)}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg transition-all ${
              tab === item.id
                ? 'bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <Icon name={item.icon} />
            <span className="font-label-md text-label-md">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="px-4 pt-2">
        <button
          onClick={onOpenProfile}
          className="w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg transition-all text-on-surface-variant hover:bg-surface-container-high"
        >
          <Icon name="account_circle" />
          <span className="font-label-md text-label-md">Profil Saya</span>
        </button>
      </div>
      <div className="px-4 py-6 mt-auto">
        <button
          onClick={onLogout}
          className="w-full bg-secondary text-on-secondary py-3 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
        >
          <Icon name="logout" />
          Keluar
        </button>
      </div>
    </aside>
  )
}

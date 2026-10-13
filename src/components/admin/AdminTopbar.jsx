import Icon from '../Icon.jsx'

const PLACEHOLDERS = {
  dasbor: 'Cari pengunjung, organisasi, telepon, tujuan...',
  pegawai: 'Cari nama, pangkat, jabatan...',
  admin: 'Cari nama, email, peran...',
  log: 'Cari admin, aksi, target, detail...'
}

function initials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function AdminTopbar({
  tab,
  query,
  onSearchChange,
  searchLoading,
  profile,
  onToggleSidebar,
  onOpenProfile
}) {
  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 z-50">
      <div className="h-full bg-surface border-b border-outline-variant shadow-sm flex justify-between items-center px-4 md:px-6 lg:px-margin-desktop">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high"
            aria-label="Buka/tutup menu"
          >
            <Icon name="menu" className="text-[22px]" />
          </button>
        </div>
        <div className="hidden md:flex flex-1 justify-center px-8">
          <div className="relative w-full max-w-md">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]"
            />
            <input
              value={query}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full font-body-md text-body-md focus:ring-2 focus:ring-secondary/20 outline-none"
              placeholder={PLACEHOLDERS[tab] || 'Cari...'}
              type="text"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-on-surface-variant text-xs">
                <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                <span>Mencari...</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 border-l border-outline-variant pl-4">
          <div className="text-right hidden sm:block">
            <p className="font-label-md text-label-md text-on-surface font-bold leading-tight">
              {profile?.full_name || 'Admin'}
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant opacity-70">
              {profile?.is_super_admin
                ? 'Super Admin'
                : profile?.role === 'admin'
                  ? 'Admin'
                  : 'Staff'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenProfile}
            className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline-variant hover:ring-2 hover:ring-secondary/40 transition-all"
            aria-label="Buka profil saya"
          >
            {profile?.avatar_url ? (
              <img className="w-full h-full object-cover" src={profile.avatar_url} alt="avatar" />
            ) : (
              <span className="font-bold text-secondary">
                {initials(profile?.full_name || 'A')}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

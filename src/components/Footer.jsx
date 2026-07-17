import Icon from './Icon.jsx'

const footerLinks = ['Kebijakan Internal', 'Panduan Pengguna', 'Hubungi Admin', 'Bantuan']

export default function Footer() {
  return (
    <footer className="w-full py-lg px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-md bg-inverse-surface border-t border-outline">
      <div className="flex flex-col gap-4 items-center md:items-start">
        <span className="font-headline-lg text-headline-lg text-on-primary">
          E-Tamu
        </span>
        <p className="font-body-md text-body-md text-surface-variant max-w-xs text-center md:text-left">
          © 2024 Sistem Buku Tamu Internal Kantor.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-8">
        {footerLinks.map((label) => (
          <a
            key={label}
            href="#"
            className="font-label-sm text-label-sm text-surface-variant hover:text-secondary-container underline transition-all"
          >
            {label}
          </a>
        ))}
      </div>
      <div className="flex gap-4">
        <button className="w-10 h-10 rounded-full bg-surface-variant/10 flex items-center justify-center text-on-primary hover:bg-secondary transition-all">
          <Icon name="public" />
        </button>
        <button className="w-10 h-10 rounded-full bg-surface-variant/10 flex items-center justify-center text-on-primary hover:bg-secondary transition-all">
          <Icon name="alternate_email" />
        </button>
      </div>
    </footer>
  )
}

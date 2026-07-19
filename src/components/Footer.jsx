import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'

const footerLinks = [
  { label: 'Kebijakan Privasi', href: '#' },
  { label: 'Ketentuan Layanan', href: '#' },
  { label: 'Hubungi Admin', href: '#' },
  { label: 'Support', href: '#' }
]

export default function Footer() {
  return (
    <footer className="w-full py-6 px-6 md:px-8 flex flex-col md:flex-row justify-between items-center gap-md bg-inverse-surface border-t border-outline">
      <div className="flex flex-col gap-1 items-center md:items-start">
        <span className="font-headline-lg text-headline-lg text-on-primary">
          E-Tamu
        </span>
        <p className="font-body-md text-body-md text-surface-variant text-center md:text-left">
          © 2026 Sistem Buku Tamu Digital.
        </p>
      </div>
      <div className="flex flex-wrap justify-center items-center gap-8">
        {footerLinks.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="font-label-sm text-label-sm text-surface-variant hover:text-secondary-container underline transition-all"
          >
            {item.label}
          </a>
        ))}
        <a href="https://www.miltama.dilmiltama.go.id/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-surface-variant/10 flex items-center justify-center text-on-primary hover:bg-secondary transition-all">
          <Icon name="public" />
        </a>
      </div>
    </footer>
  )
}

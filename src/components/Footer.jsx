import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'

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
    </footer>
  )
}

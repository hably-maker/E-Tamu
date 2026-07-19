import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import Icon from '../components/Icon.jsx'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      navigate('/admin')
    } catch (err) {
      setError(err.message || 'Gagal masuk. Periksa email dan kata sandi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-margin-mobile bg-surface">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm p-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-secondary text-on-primary rounded-xl flex items-center justify-center">
            <Icon name="lock" />
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface">Login Admin</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Akses panel internal E-Tamu
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-label-md">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="admin@kantor.go.id"
            />
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1">
              Kata Sandi
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-8 py-3 bg-secondary text-on-primary rounded-xl font-label-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="font-label-sm text-label-sm text-secondary hover:underline">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  )
}

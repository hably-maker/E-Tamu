import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import SiteNavBar from './components/SiteNavBar.jsx'
import Hero from './components/Hero.jsx'
import Footer from './components/Footer.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

// Halaman berat hanya dimuat saat dibutuhkan agar bundel publik tetap kecil
const AdminLogin = lazy(() => import('./pages/AdminLogin.jsx'))
const RegistrationForm = lazy(() => import('./pages/RegistrationForm.jsx'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'))
const AdminProfile = lazy(() => import('./pages/AdminProfile.jsx'))
const TvDisplay = lazy(() => import('./pages/TvDisplay.jsx'))

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface-variant font-body-md text-body-md">
      Memuat...
    </div>
  )
}

export default function App() {
  const { pathname } = useLocation()
  const showPublicNav = pathname === '/' || pathname === '/pengunjung'

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0')
            entry.target.classList.remove('opacity-0', 'translate-y-8')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <div className="bg-surface text-on-surface font-body-md overflow-x-hidden min-h-screen flex flex-col">
      {showPublicNav && <SiteNavBar />}
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route
            path="/"
            element={
              <main className="pt-16 flex-1">
                <Hero />
                <Footer />
              </main>
            }
          />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/pengunjung" element={<RegistrationForm />} />
          <Route
            path="/tv"
            element={
              <ProtectedRoute>
                <TvDisplay />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute>
                <AdminProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <main className="pt-24 pb-xl px-margin-mobile md:px-margin-desktop flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="font-headline-lg text-headline-lg text-on-surface mb-2">
                    Halaman tidak ditemukan
                  </p>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                    Alamat yang Anda buka tidak tersedia.
                  </p>
                  <a
                    to="/"
                    className="inline-block px-6 py-3 rounded-xl bg-secondary text-on-primary font-label-md text-label-md hover:opacity-90 transition-all"
                  >
                    Kembali ke Beranda
                  </a>
                </div>
              </main>
            }
          />
        </Routes>
      </Suspense>
    </div>
  )
}

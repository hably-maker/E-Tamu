import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import SiteNavBar from './components/SiteNavBar.jsx'
import Hero from './components/Hero.jsx'
import FeaturesGrid from './components/FeaturesGrid.jsx'
import Footer from './components/Footer.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import RegistrationForm from './pages/RegistrationForm.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

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
      <Routes>
        <Route
          path="/"
          element={
            <main className="pt-16 flex-1">
              <Hero />
              <FeaturesGrid />
              <Footer />
            </main>
          }
        />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/pengunjung" element={<RegistrationForm />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

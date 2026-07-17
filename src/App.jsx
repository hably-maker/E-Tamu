import { useEffect } from 'react'
import TopNavBar from './components/TopNavBar.jsx'
import Hero from './components/Hero.jsx'
import FeaturesGrid from './components/FeaturesGrid.jsx'
import CTASection from './components/CTASection.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
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
    <div className="bg-surface text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <TopNavBar />
      <main className="pt-16">
        <Hero />
        <FeaturesGrid />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}

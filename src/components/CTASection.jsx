export default function CTASection() {
  return (
    <section className="py-24 bg-surface-container-lowest">
      <div className="container mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="bg-primary-container rounded-[2rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <h2 className="font-headline-xl text-headline-xl text-white mb-6">
              Siap mengamankan lobi Anda?
            </h2>
            <p className="font-body-lg text-body-lg text-surface-variant mb-10 max-w-xl mx-auto">
              Bergabunglah dengan lebih dari 2.000 fasilitas global yang
              menggunakan E-Tamu untuk mengelola pengunjung harian mereka dengan
              percaya diri.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-10 py-4 bg-secondary text-on-primary rounded-xl font-headline-md text-label-md hover:scale-105 transition-all">
                Mulai Sekarang
              </button>
              <button className="px-10 py-4 border border-outline-variant text-white rounded-xl font-label-md hover:bg-white/10 transition-all">
                Minta Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import Icon from './Icon.jsx'

const REG_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC5LfdhX8efX5QoxK-VMg5NdF_c0H3FGTa50efavqoNPeALIA6I9C5EVM7teBsEzjlqbkkqZW3uPaaLCf-QaiwStv5N90gCX_Aei01xSlUS5AqndbR1pLjofiBhPMATJNZ3YrQBpZrldsgSqM36V_hjCJjvOmhYoym7IbwLUqg1Fa8RV4JGpBaTOwFtSbrLKXjktr8nq8U-HbNz1fNOhLYmr8U_hqNODHTD3LVwFLI2t-n6rpoqJ5Rp0_V9_LOcVIqMlBJavGZ0dE4'
const INTEGRATION_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA_HklNbHfV5pjYCcP1boJr7gOcfraWpYgq9fem1ThSun-Z-Q2fw7a2XV7JqCiVAxZYp3UdFpp8elhcPy_E8rv3ptGMW9uFntZ00kTawbMIaRV3Wd0FzzsgQScglMx9okBur2u_P5XK7AuzrtjBhEHT0s8MEbF2Xcby45KlRkiqHH-1fNw2agJocv3edAnw_GUv8UOaDG5b8YZaIKBRTY5n5qcwwQSsnDp_qlzd3xDHalJVOd8h1RcHNCpHUcdD-3OQzEmpgcb2SzY'

function RevealCard({ className = '', children }) {
  return (
    <div
      data-reveal
      className={`transition-all duration-700 opacity-0 translate-y-8 ${className}`}
    >
      {children}
    </div>
  )
}

export default function FeaturesGrid() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="text-center mb-16">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">
            Fitur Enterprise
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
            Dirancang untuk lingkungan keamanan yang paling ketat, menggabungkan
            registrasi cepat dengan perlindungan data yang kokoh.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {/* Registrasi Digital */}
          <RevealCard className="md:col-span-2 bg-surface-container-lowest p-10 rounded-3xl border border-outline-variant shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-xl flex items-center justify-center mb-6">
                <Icon name="how_to_reg" />
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3">
                Registrasi Digital
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                Proses check-in berbasis tablet yang mulus. Ambil foto, tanda
                tangani NDA, dan cetak kartu tamu dalam kurang dari 60 detik.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-label-md">
                  <Icon name="check_circle" className="text-secondary text-[20px]" />
                  <span>Notifikasi Tuan Rumah Instan</span>
                </li>
                <li className="flex items-center gap-2 text-label-md">
                  <Icon name="check_circle" className="text-secondary text-[20px]" />
                  <span>Pra-registrasi Kode QR</span>
                </li>
              </ul>
            </div>
            <div className="w-full md:w-64 h-64 rounded-2xl overflow-hidden shadow-inner bg-surface-container-high">
              <img
                className="w-full h-full object-cover"
                src={REG_IMAGE}
                alt="Registrasi digital"
              />
            </div>
          </RevealCard>

          {/* Keamanan Data */}
          <RevealCard className="bg-surface-container-lowest p-10 rounded-3xl border border-outline-variant shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-surface-container-highest text-on-primary-fixed-variant rounded-xl flex items-center justify-center mb-6">
              <Icon name="security" />
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-3">
              Keamanan Data
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              Enkripsi tingkat militer untuk semua data pengunjung. Penyimpanan
              patuh GDPR dan SOC2 serta kebijakan penghapusan data otomatis.
            </p>
            <div className="h-32 bg-surface-container rounded-xl flex items-center justify-center p-4">
              <Icon name="lock" className="text-[64px] text-outline-variant opacity-50" />
            </div>
          </RevealCard>

          {/* Laporan Real-time */}
          <RevealCard className="bg-primary-container text-on-primary p-10 rounded-3xl border border-outline-variant shadow-sm hover:shadow-md transition-all md:col-span-1">
            <div className="w-12 h-12 bg-secondary text-on-secondary rounded-xl flex items-center justify-center mb-6">
              <Icon name="analytics" />
            </div>
            <h3 className="font-headline-md text-headline-md text-white mb-3">
              Laporan Real-time
            </h3>
            <p className="font-body-md text-body-md text-surface-variant mb-6">
              Dashboard okupansi langsung dan log riwayat terperinci. Ekspor
              laporan secara instan untuk kebutuhan audit dan kepatuhan.
            </p>
            <div className="flex items-end gap-1 h-24">
              <div className="w-full bg-secondary h-[40%] rounded-t-sm"></div>
              <div className="w-full bg-secondary h-[70%] rounded-t-sm"></div>
              <div className="w-full bg-secondary h-[55%] rounded-t-sm"></div>
              <div className="w-full bg-secondary h-[90%] rounded-t-sm"></div>
              <div className="w-full bg-secondary h-[65%] rounded-t-sm"></div>
            </div>
          </RevealCard>

          {/* Integrasi */}
          <RevealCard className="md:col-span-2 bg-surface-container-high p-10 rounded-3xl border border-outline-variant shadow-sm hover:shadow-md transition-all flex items-center">
            <div className="flex-1">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3">
                Terintegrasi dengan Sistem Anda
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                Hubungkan E-Tamu dengan Slack, Microsoft Teams, dan perangkat
                keras kontrol akses Anda yang sudah ada secara mulus.
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <Icon name="terminal" className="text-on-surface-variant" />
                </div>
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <Icon name="webhook" className="text-on-surface-variant" />
                </div>
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <Icon name="sync" className="text-on-surface-variant" />
                </div>
              </div>
            </div>
            <div className="hidden lg:block w-1/3">
              <div
                className="w-full h-40 rounded-xl bg-cover bg-center"
                style={{ backgroundImage: `url('${INTEGRATION_IMAGE}')` }}
              />
            </div>
          </RevealCard>
        </div>
      </div>
    </section>
  )
}

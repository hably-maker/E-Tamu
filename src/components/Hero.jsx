import Icon from './Icon.jsx'

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCNc6k0dBr0lnA31b6QZiwAxY-0S-amflEhT6VxQaJFHWOd4OeJUlnLtyk4wRlF0nQeicJtG0BHK66kMX3_3HnDLDuM1AqiMEga3m4f5kJdn7x9Mkf-5wBUI--CYnFK7EgbOejo7Vws1RyyUBKprLi1cNBxzD4F7qcNkyoYLPuniaA2MDroWv6nSwYDS9gj7Nx-YoTZ2mX2JDYtjI5jBA7hUiEgZhLAPHQHFHNEgZO_iHOPnveGkFOzJlu7AYb1qhA0P9yrRkJ0brI'

export default function Hero() {
  return (
    <section className="relative min-h-[921px] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center brightness-75"
          style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
        />
      </div>
      <div className="container mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
        <div className="max-w-3xl glass-card p-10 md:p-16 rounded-3xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-6 leading-tight">
            Manajemen Pengunjung <br />
            <span className="text-secondary">Modern &amp; Aman.</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-xl">
            Sederhanakan operasional resepsionis Anda dengan buku tamu digital
            kelas enterprise kami. Tingkatkan keamanan sekaligus berikan
            pengalaman premium bagi setiap tamu.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="px-8 py-4 bg-secondary text-on-primary rounded-xl font-headline-md text-label-md hover:shadow-lg hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2">
              <span>Daftar sebagai Pengunjung</span>
              <Icon name="arrow_forward" />
            </button>
            <a
              href="#"
              className="px-8 py-4 border border-outline text-on-surface rounded-xl font-label-md hover:bg-surface-container-high active:scale-95 transition-all flex items-center justify-center"
            >
              Login Admin
            </a>
          </div>
          <div className="mt-8 flex items-center gap-4 text-on-surface-variant">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-container-highest flex items-center justify-center text-[10px] font-bold">
                JD
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-secondary-container flex items-center justify-center text-[10px] font-bold">
                AS
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-variant flex items-center justify-center text-[10px] font-bold">
                +12
              </div>
            </div>
            <span className="font-label-sm text-label-sm">
              Dipercaya oleh 500+ Kantor Korporat
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

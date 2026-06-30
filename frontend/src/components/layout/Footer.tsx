import Link from 'next/link';

const FOOTER_LINKS = {
  Categorías: [
    { label: 'Hombre', href: '/products/hombre' },
    { label: 'Mujer', href: '/products/mujer' },
    { label: 'Standard', href: '/products/hombre/standard' },
    { label: 'Latin', href: '/products/mujer/latin' },
  ],
  Soporte: [
    { label: 'Contacto', href: '/contact' },
    { label: 'Envíos', href: '/shipping' },
    { label: 'Cambios y Devoluciones', href: '/returns' },
    { label: 'FAQ', href: '/faq' },
  ],
  Premium: [
    { label: 'Sobre Nosotros', href: '/about' },
    { label: 'Colaborá', href: '/collaborate' },
    { label: 'Marcas', href: '/brands' },
    { label: 'Press', href: '/press' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="font-display text-xl font-bold tracking-tight">
              Premium Ballroom
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-cream/40">
              La colección definitiva de las marcas más prestigiosas del mundo,
              unificada en un solo lugar.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-cream/40 transition-colors hover:text-cream"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-cream/10 pt-8 text-[11px] text-cream/25 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Premium Ballroom. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition-colors hover:text-cream">
              Privacidad
            </Link>
            <Link href="/terms" className="transition-colors hover:text-cream">
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

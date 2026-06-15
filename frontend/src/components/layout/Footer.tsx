import Link from 'next/link';

const FOOTER_LINKS = {
  Shop: [
    { label: 'All Products', href: '/products' },
    { label: 'New Arrivals', href: '/products?sort=newest' },
    { label: 'Best Sellers', href: '/products?sort=bestsellers' },
    { label: 'Sale', href: '/products?sale=true' },
  ],
  Support: [
    { label: 'Contact', href: '/contact' },
    { label: 'Shipping', href: '/shipping' },
    { label: 'Returns', href: '/returns' },
    { label: 'FAQ', href: '/faq' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Sustainability', href: '/sustainability' },
    { label: 'Press', href: '/press' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-cream-200 bg-brand text-cream-50">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="font-display text-2xl font-bold tracking-tight">
              STORE
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-cream-300/70">
              Premium clothing crafted for those who demand more. Quality, comfort, and style — redefined.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-cream-300/70 transition-colors hover:text-cream-50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-cream-300/10 pt-8 text-[11px] text-cream-300/50 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} STORE. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-cream-50 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-cream-50 transition-colors">Terms</Link>
            <Link href="/accessibility" className="hover:text-cream-50 transition-colors">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

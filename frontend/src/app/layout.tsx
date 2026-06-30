import type { Metadata } from 'next';
import './globals.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Premium Ballroom — Vanguardia en Danza',
  description:
    'Indumentaria de baile de salón con visión high-fashion. Para competidores que entienden que el estilo es parte de la performance.',
  keywords: 'ballroom, baile de salón, vestidos de competencia, ropa de baile, latin, standard, danza',
  icons: { icon: '/favicon.svg' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Premium Ballroom — Vanguardia en Danza',
    description: 'Indumentaria de baile de salón con visión high-fashion.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-cream text-ink antialiased">
        <GoogleOAuthProvider clientId={googleClientId}>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}

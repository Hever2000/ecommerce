import type { Metadata } from 'next';
import './globals.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'STORE — Premium Apparel',
  description: 'Premium clothing crafted for those who demand more. Quality, comfort, and style — redefined.',
  keywords: 'clothing, apparel, premium, fashion, style',
  openGraph: {
    title: 'STORE — Premium Apparel',
    description: 'Premium clothing crafted for those who demand more.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  return (
    <html lang="en">
      <body className="min-h-screen bg-cream-50 text-ink antialiased">
        <GoogleOAuthProvider clientId={googleClientId}>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}

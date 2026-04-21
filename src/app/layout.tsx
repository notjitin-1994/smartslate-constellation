import { Quicksand, Lato } from 'next/font/google';
import "./globals.css";
import type { Metadata } from 'next';
import ClientLayout from '@/components/layout/ClientLayout';

const quicksand = Quicksand({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-quicksand',
});

const lato = Lato({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lato',
});

export const metadata: Metadata = {
  title: "Smartslate Constellation",
  description: "The Architectural Bridge for Solara",
  icons: {
    icon: '/favicon.ico',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${quicksand.variable} ${lato.variable}`}>
      <body className="antialiased bg-background-dark font-sans">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}

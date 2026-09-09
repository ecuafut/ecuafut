import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'EcuaFut | Noticias del Fútbol Ecuatoriano, LigaPro y La Tri',
    template: '%s | EcuaFut',
  },
  description: 'Portal de noticias, crónicas tácticas y cobertura exclusiva del fútbol ecuatoriano, LigaPro, Copa Libertadores y legionarios.',
  keywords: [
    'fútbol ecuatoriano',
    'LigaPro',
    'La Tri',
    'legionarios ecuatorianos',
    'noticias de fútbol',
    'EcuaFut',
  ],
  authors: [{ name: 'Miguel Araujo', url: 'https://ecuafut.com/autor/miguel-araujo' }],
  creator: 'Miguel Araujo',
  publisher: 'EcuaFut',
  metadataBase: new URL('https://ecuafut.com'),
  openGraph: {
    type: 'website',
    locale: 'es_EC',
    url: 'https://ecuafut.com',
    siteName: 'EcuaFut',
    title: 'EcuaFut | Noticias del Fútbol Ecuatoriano, LigaPro y La Tri',
    description: 'Crónicas, análisis táctico y cobertura del balompié ecuatoriano e internacional.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'EcuaFut - Fútbol Ecuatoriano',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@EcuaFutCom',
    creator: '@EcuaFutCom',
    title: 'EcuaFut | Noticias del Fútbol Ecuatoriano',
    description: 'Sigue la actualidad de la LigaPro, La Tri y nuestros legionarios.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
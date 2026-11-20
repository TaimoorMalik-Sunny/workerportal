import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'HEC Portal | Higher Education Commission Pakistan',
  description:
    'Digital Degree Verification & Attestation Ecosystem — National Academic Accreditation & Biometric Scrutiny Portal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-[#FFFFFF] text-slate-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

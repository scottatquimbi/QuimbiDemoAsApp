import './globals.css';
import { Inter, Roboto_Mono } from 'next/font/google';
import type { Metadata } from "next";
import ElectronStyleProvider from './components/ElectronStyleProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
});

export const metadata: Metadata = {
  title: 'Game of Thrones Support',
  description: 'A RAG-powered support system for GoT',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased`}
      >
        <ElectronStyleProvider />
        {children}
      </body>
    </html>
  );
}

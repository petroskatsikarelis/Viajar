import type { Metadata } from "next";
import "./globals.css";
import localFont from 'next/font/local';

export const metadata: Metadata = {
  title: "Viajar",
  description: "Community Based Tourist App",
};

// Sans serif variable font
const geistSans = localFont({
  src: './fonts/Geist[wght].woff2',
  variable: '--font-geist-sans',
  weight: '100 900',    // range supported by the variable font
  display: 'swap',
});

// Mono variable font (if you copied it)
const geistMono = localFont({
  src: './fonts/GeistMono[wght].woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}



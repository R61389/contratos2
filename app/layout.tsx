import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eventos CBBA — Todo tu evento en un solo lugar",
  description:
    "Contrata músicos, DJs, catering, bebidas, decoración y mucho más desde una sola plataforma. La forma moderna de organizar eventos en Cochabamba.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${geist.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}

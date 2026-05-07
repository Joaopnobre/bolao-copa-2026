import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bolão Copa do Mundo 2026",
  description: "Bolão privado Copa do Mundo 2026",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable}`}>
      <body className="min-h-screen antialiased">{
        <Providers>{children}</Providers>
      }</body>
    </html>
  );
}

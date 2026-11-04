import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { OfflineBanner } from "@/components/shell/offline-banner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["500", "600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Empiric Imob", template: "%s · Empiric Imob" },
  description: "Portal de gestão imobiliária da Empiric Negócios Imobiliários — administração, proprietários e inquilinos.",
  icons: { icon: "/brand/empiric-icon.png", apple: "/brand/empiric-icon.png" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#580d26", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="min-h-dvh">
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}

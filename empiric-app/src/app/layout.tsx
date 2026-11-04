import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { OfflineBanner } from "@/components/shell/offline-banner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", weight: ["500", "600"], display: "swap" });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"], variable: "--font-instrument-serif", weight: "400", style: ["normal", "italic"], display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Empiric Imob", template: "%s · Empiric Imob" },
  description: "Portal de gestão imobiliária da Empiric Negócios Imobiliários — administração, proprietários e inquilinos.",
  icons: { icon: "/brand/empiric-icon.png", apple: "/brand/empiric-icon.png" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#580d26", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${interTight.variable} ${instrumentSerif.variable}`}>
      <body className="min-h-dvh">
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}

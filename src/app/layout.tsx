import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SITE } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Ondernemers van de Kamp Amersfoort | De Kamp leeft",
    template: "%s | Ondernemers van de Kamp",
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.name }],
  keywords: [
    "De Kamp Amersfoort",
    "ondernemers De Kamp",
    "winkels De Kamp Amersfoort",
    "restaurants De Kamp Amersfoort",
    "eten op De Kamp",
    "Kamperbinnenpoort",
    "winkelen binnenstad Amersfoort",
    "Grote Sint Jansstraat",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: SITE.url,
    siteName: SITE.name,
    title: "Ondernemers van de Kamp Amersfoort | De Kamp leeft",
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Ondernemers van de Kamp Amersfoort",
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  category: "local guide",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f0e2" },
    { media: "(prefers-color-scheme: dark)", color: "#163a29" },
  ],
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className="h-full antialiased">
      <body className={`${inter.variable} ${playfair.variable} flex min-h-full flex-col font-sans`}>
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

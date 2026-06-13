import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ondernemers van de Kamp Amersfoort | De Kamp Leeft",
  description: "Een straat vol eten, makers, winkels, verhalen en lokale ondernemers in hartje Amersfoort. Ontdek de mensen en zaken die De Kamp karakter geven.",
  keywords: ["De Kamp Amersfoort", "ondernemers De Kamp", "winkels De Kamp Amersfoort", "restaurants De Kamp Amersfoort", "eten op De Kamp", "Kamperbinnenpoort", "historische binnenstad Amersfoort"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="h-full antialiased">
      <body className={`${inter.variable} ${playfair.variable} min-h-full flex flex-col font-sans`}>
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

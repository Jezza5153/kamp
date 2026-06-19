"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Send, MapPin } from "lucide-react";
import NewsletterSignup from "@/components/NewsletterSignup";
import { t, localizedHref } from "@/lib/dict";

const Footer = () => {
  const pathname = usePathname() || "/";
  const locale = pathname === "/en" || pathname.startsWith("/en/") ? "en" : "nl";
  const home = locale === "en" ? "/en" : "/";

  const navLinks = [
    { href: `${home}#ondernemers`, key: "nav.businesses" },
    { href: "/kaart", key: "nav.map" },
    { href: "/agenda", key: "nav.events" },
    { href: "/verhalen", key: "nav.stories" },
    { href: "/cadeaukaart", key: "nav.giftcard" },
    { href: "/loop-de-kamp", key: "nav.walk" },
    { href: "/praktisch", key: "footer.practical" },
    { href: "/over-de-kamp", key: "nav.about" },
    { href: "/aanmelden", key: "nav.register" },
  ];

  return (
    <footer className="bg-charcoal text-stone border-t border-stone/10 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8">
          {/* Brand Section */}
          <div className="md:col-span-4 space-y-8">
            <Link href={home} className="text-3xl font-serif font-black text-background tracking-tighter">
              De Kamp <span className="text-amber">{t(locale, "brand.leeft")}</span>
            </Link>
            <p className="text-stone/70 text-lg leading-relaxed max-w-sm">{t(locale, "footer.tagline")}</p>
            <div className="flex gap-4">
              <a href="mailto:info@ondernemersvandekamp.nl" aria-label="Mail ons" className="w-12 h-12 rounded-full border border-stone/20 flex items-center justify-center hover:bg-amber hover:border-amber hover:text-white transition-all group">
                <Send className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>

          {/* Links Section */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber">{t(locale, "footer.nav")}</h3>
            <ul className="space-y-4">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link href={localizedHref(locale, l.href)} className="text-stone/60 hover:text-white transition-colors flex items-center gap-2 group">
                    <span className="w-0 group-hover:w-2 h-px bg-amber transition-all" />
                    {t(locale, l.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Area Section */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber">{t(locale, "footer.area")}</h3>
            <ul className="space-y-4 text-stone/40">
              {["Kamp", "Achter de Kamp", "Zuidsingel", "Grote Sint Jansstraat"].map((a) => (
                <li key={a} className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-stone/20" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-4 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber">{t(locale, "footer.stayUpdated")}</h3>
            <p className="text-stone/60 text-sm">{t(locale, "footer.newsletterText")}</p>
            <NewsletterSignup variant="dark" />
          </div>
        </div>

        <div className="mt-24 pt-12 border-t border-stone/10 flex flex-col md:flex-row justify-between items-center gap-8 border-stone/5">
          <p className="text-stone/30 text-xs font-bold uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Ondernemers van de Kamp Amersfoort
          </p>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-stone/20">
            <Link href="/login" className="hover:text-stone transition-colors">{t(locale, "footer.manage")}</Link>
            <Link href="/privacy" className="hover:text-stone transition-colors">{t(locale, "footer.privacy")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

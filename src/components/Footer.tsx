import Link from "next/link";
import { Send, MapPin, Camera } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-charcoal text-stone border-t border-stone/10 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8">
          {/* Brand Section */}
          <div className="md:col-span-4 space-y-8">
            <Link href="/" className="text-3xl font-serif font-black text-background tracking-tighter">
              De Kamp <span className="text-amber">leeft.</span>
            </Link>
            <p className="text-stone/70 text-lg leading-relaxed max-w-sm">
              Een levend straatportret van de meest karakteristieke ondernemersas in Amersfoort.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-12 h-12 rounded-full border border-stone/20 flex items-center justify-center hover:bg-amber hover:border-amber hover:text-white transition-all group">
                <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a href="mailto:info@ondernemersvandekamp.nl" className="w-12 h-12 rounded-full border border-stone/20 flex items-center justify-center hover:bg-amber hover:border-amber hover:text-white transition-all group">
                <Send className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>

          {/* Links Section */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber">Navigatie</h3>
            <ul className="space-y-4">
              <li><Link href="/" className="text-stone/60 hover:text-white transition-colors flex items-center gap-2 group">
                <span className="w-0 group-hover:w-2 h-px bg-amber transition-all" />
                Ondernemers
              </Link></li>
              <li><Link href="/loop-de-kamp" className="text-stone/60 hover:text-white transition-colors flex items-center gap-2 group">
                <span className="w-0 group-hover:w-2 h-px bg-amber transition-all" />
                de Route
              </Link></li>
              <li><Link href="/over-de-kamp" className="text-stone/60 hover:text-white transition-colors flex items-center gap-2 group">
                <span className="w-0 group-hover:w-2 h-px bg-amber transition-all" />
                Story
              </Link></li>
              <li><Link href="/aanmelden" className="text-stone/60 hover:text-white transition-colors flex items-center gap-2 group">
                <span className="w-0 group-hover:w-2 h-px bg-amber transition-all" />
                Aanmelden
              </Link></li>
            </ul>
          </div>

          {/* Area Section */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber">Het Gebied</h3>
            <ul className="space-y-4 text-stone/40">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-stone/20" />
                <span>Kamp</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-stone/20" />
                <span>Achter de Kamp</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-stone/20" />
                <span>Zuidsingel</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-stone/20" />
                <span>Grote Sint Jansstraat</span>
              </li>
            </ul>
          </div>

          {/* Newsletter Section placeholder */}
          <div className="md:col-span-4 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber">Blijf op de hoogte</h3>
            <div className="space-y-4">
              <p className="text-stone/60 text-sm">Ontvang updates over nieuwe ondernemers en events op De Kamp.</p>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="E-mailadres"
                  className="w-full bg-stone/5 border border-stone/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-amber transition-colors"
                />
                <button className="absolute right-2 top-2 bottom-2 px-4 bg-amber text-charcoal font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-stone hover:text-deep-green transition-all">
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 pt-12 border-t border-stone/10 flex flex-col md:flex-row justify-between items-center gap-8 border-stone/5">
          <p className="text-stone/30 text-xs font-bold uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Ondernemers van de Kamp Amersfoort
          </p>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-stone/20">
            <Link href="#" className="hover:text-stone transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-stone transition-colors">Cookiestatements</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

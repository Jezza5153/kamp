"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, X, PlusCircle } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { scrollY } = useScroll();
  
  const backgroundColor = useTransform(
    scrollY,
    [0, 100],
    ["rgba(247, 241, 230, 0)", "rgba(247, 241, 230, 0.8)"]
  );
  
  const backdropBlur = useTransform(
    scrollY,
    [0, 100],
    ["blur(0px)", "blur(12px)"]
  );

  const shadow = useTransform(
    scrollY,
    [0, 100],
    ["none", "0 4px 20px -5px rgba(24, 61, 43, 0.1)"]
  );

  return (
    <motion.nav 
      style={{ backgroundColor, backdropFilter: backdropBlur, boxShadow: shadow }}
      className="sticky top-0 z-50 w-full transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 sm:h-24 items-center">
          <div className="flex-shrink-0">
            <Link href="/" className="group flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-serif font-black text-deep-green tracking-tighter leading-none">
                De Kamp <br className="hidden" />
                <span className="text-amber group-hover:italic transition-all">leeft.</span>
              </span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            <div className="flex space-x-6">
              <Link href="/#ondernemers" className="text-[13px] uppercase tracking-widest font-black text-deep-green/60 hover:text-amber-ink transition-colors">
                Ondernemers
              </Link>
              <Link href="/kaart" className="text-[13px] uppercase tracking-widest font-black text-deep-green/60 hover:text-amber-ink transition-colors">
                Kaart
              </Link>
              <Link href="/loop-de-kamp" className="text-[13px] uppercase tracking-widest font-black text-deep-green/60 hover:text-amber-ink transition-colors">
                Wandel
              </Link>
              <Link href="/agenda" className="text-[13px] uppercase tracking-widest font-black text-deep-green/60 hover:text-amber-ink transition-colors">
                Agenda
              </Link>
              <Link href="/cadeaukaart" className="text-[13px] uppercase tracking-widest font-black text-deep-green/60 hover:text-amber-ink transition-colors">
                Cadeaukaart
              </Link>
              <Link href="/over-de-kamp" className="text-[13px] uppercase tracking-widest font-black text-deep-green/60 hover:text-amber-ink transition-colors">
                Over
              </Link>
            </div>
            
            <Link href="/aanmelden" className="group relative inline-flex items-center gap-2 px-6 py-2.5 bg-deep-green text-white text-[13px] font-black uppercase tracking-widest rounded-full overflow-hidden transition-all shadow-lg hover:shadow-deep-green/20 hover:scale-105 active:scale-95">
              <span className="relative z-10 flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                Aanmelden
              </span>
              <div className="absolute inset-0 bg-amber translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Link>
          </div>

          <div className="md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-deep-green hover:text-amber transition-colors"
            >
              {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div 
        initial={false}
        animate={isOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        className="md:hidden overflow-hidden bg-background border-t border-stone/10"
      >
        <div className="px-4 pt-4 pb-8 space-y-4">
          <Link
            href="/#ondernemers"
            onClick={() => setIsOpen(false)}
            className="block text-2xl font-serif font-bold text-deep-green py-2"
          >
            Ondernemers
          </Link>
          <Link
            href="/kaart"
            onClick={() => setIsOpen(false)}
            className="block text-2xl font-serif font-bold text-deep-green py-2"
          >
            Kaart
          </Link>
          <Link
            href="/agenda"
            onClick={() => setIsOpen(false)}
            className="block text-2xl font-serif font-bold text-deep-green py-2"
          >
            Agenda
          </Link>
          <Link
            href="/cadeaukaart"
            onClick={() => setIsOpen(false)}
            className="block text-2xl font-serif font-bold text-deep-green py-2"
          >
            Cadeaukaart
          </Link>
          <Link
            href="/loop-de-kamp"
            onClick={() => setIsOpen(false)}
            className="block text-2xl font-serif font-bold text-deep-green py-2"
          >
            Wandel de Kamp
          </Link>
          <Link
            href="/over-de-kamp"
            onClick={() => setIsOpen(false)}
            className="block text-2xl font-serif font-bold text-deep-green py-2"
          >
            Over
          </Link>
          <Link 
            href="/aanmelden" 
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center gap-2 w-full px-6 py-4 bg-deep-green text-white font-bold rounded-2xl"
          >
            <PlusCircle className="w-5 h-5" />
            Zit jouw zaak er nog niet bij?
          </Link>
        </div>
      </motion.div>
    </motion.nav>
  );
};

export default Navbar;

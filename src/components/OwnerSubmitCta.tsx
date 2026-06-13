"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, UserPlus } from "lucide-react";

const OwnerSubmitCta = () => {
  return (
    <section className="bg-white py-24 sm:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative bg-deep-green rounded-[3rem] p-12 md:p-20 shadow-2xl overflow-hidden"
        >
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber/10 text-amber text-xs font-black uppercase tracking-widest mb-8 border border-amber/20">
                <UserPlus className="w-4 h-4" />
                Community
              </div>
              <h2 className="text-4xl md:text-6xl font-serif font-black text-white leading-[0.9] mb-8">
                Zie jij jouw zaak al staan?
              </h2>
              <p className="text-stone/60 text-xl font-medium leading-relaxed mb-12 max-w-md">
                We bouwen aan de meest complete gids van De Kamp. Jouw verhaal, logo en gezicht maken het portret van de straat compleet.
              </p>
              <Link
                href="/aanmelden"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-amber text-white font-black uppercase tracking-widest text-xs rounded-full hover:bg-stone hover:text-deep-green transition-all shadow-xl hover:scale-105 active:scale-95"
              >
                Mijn zaak aanmelden
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ 
                      y: [0, -10, 0],
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity, 
                      delay: i * 0.5,
                      ease: "easeInOut" 
                    }}
                    className="aspect-square rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center text-4xl"
                  >
                    <div className="w-12 h-12 rounded-full bg-amber/20" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Background Text */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30vw] font-serif font-black text-white/[0.02] select-none pointer-events-none whitespace-nowrap">
            KAMP
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default OwnerSubmitCta;

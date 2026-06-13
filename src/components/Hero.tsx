"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";

const Hero = () => {
  return (
    <div className="relative bg-background overflow-hidden py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-deep-green/5 text-deep-green text-xs font-bold uppercase tracking-[0.2em] border border-deep-green/10">
              <MapPin className="w-3.5 h-3.5" />
              Historisch Amersfoort
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-8xl font-serif font-bold text-deep-green tracking-tight leading-[0.9]"
          >
            De Kamp <br />
            <span className="italic text-amber relative">
              leeft.
              <motion.span 
                className="absolute -bottom-2 left-0 w-full h-1 bg-amber/30 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              />
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 max-w-2xl mx-auto text-xl text-warm-brown/80 font-medium leading-relaxed"
          >
            Een straat vol eten, makers, winkels en verhalen. <br className="hidden md:block" />
            Ontdek de mensen die De Kamp karakter geven.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="#ondernemers"
              className="group inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-full text-white bg-deep-green hover:bg-deep-green/90 transition-all shadow-xl hover:scale-105 active:scale-95"
            >
              Ontdek de ondernemers
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/loop-de-kamp"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-deep-green text-base font-bold rounded-full text-deep-green hover:bg-deep-green hover:text-white transition-all shadow-sm active:scale-95"
            >
              Loop de Kamp
            </Link>
          </motion.div>
        </div>
      </div>
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden -z-10 bg-[radial-gradient(#C9822B_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03]"></div>
      
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.05, 0.08, 0.05] 
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber rounded-full blur-[120px] -z-10"
      />
      
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.03, 0.06, 0.03] 
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-deep-green rounded-full blur-[120px] -z-10"
      />
    </div>
  );
};

export default Hero;

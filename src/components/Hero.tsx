"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { useRef } from "react";

const Hero = () => {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <section ref={targetRef} className="relative h-[90vh] min-h-[700px] flex items-center justify-center overflow-hidden bg-charcoal">
      {/* Immersive Background Image */}
      <motion.div 
        style={{ scale }}
        className="absolute inset-0 z-0"
      >
        <img 
          src="/images/de-tafelaar.png" 
          alt="De Kamp Amersfoort" 
          className="w-full h-full object-cover opacity-60 grayscale-[0.3] brightness-[0.7]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/20 via-transparent to-charcoal/80" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <motion.div 
          style={{ opacity, y }}
          className="max-w-4xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-amber text-xs font-bold uppercase tracking-[0.3em] border border-white/20 mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Amersfoorts mooiste straat
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-[12vw] md:text-[10vw] font-serif font-black text-white tracking-tighter leading-[0.8] mix-blend-difference"
          >
            DE KAMP <br />
            <span className="text-amber italic">LEEFT.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mt-12 text-2xl md:text-3xl text-stone/80 font-medium leading-tight max-w-2xl"
          >
            Een straatportret van makers, smaken en ondernemersgeest in hartje Amersfoort.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-12 flex flex-wrap gap-6"
          >
            <Link
              href="#ondernemers"
              className="group relative inline-flex items-center gap-4 px-10 py-5 bg-white text-deep-green font-black uppercase tracking-widest text-xs rounded-full overflow-hidden transition-all shadow-2xl hover:scale-105 active:scale-95"
            >
              <span className="relative z-10">Ontdek de ondernemers</span>
              <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-2 transition-transform" />
              <div className="absolute inset-0 bg-amber translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Link>
            <Link
              href="/loop-de-kamp"
              className="inline-flex items-center gap-4 px-10 py-5 border-2 border-white/30 text-white font-black uppercase tracking-widest text-xs rounded-full backdrop-blur-sm hover:bg-white hover:text-deep-green transition-all shadow-xl"
            >
              Loop de route
              <MapPin className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Side Label */}
      <div className="absolute right-8 bottom-24 hidden lg:block vertical-text">
        <span className="text-[10px] font-black uppercase tracking-[1em] text-white/30 rotate-180">
          Scroll to explore
        </span>
      </div>
      
      {/* Bottom indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 w-6 h-10 rounded-full border-2 border-white/20 flex justify-center p-2"
      >
        <div className="w-1 h-2 bg-amber rounded-full" />
      </motion.div>
    </section>
  );
};

export default Hero;

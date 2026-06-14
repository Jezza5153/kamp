"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { useRef } from "react";

const Hero = () => {
  const targetRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start start", "end start"] });
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const contentY = useTransform(scrollYProgress, [0, 0.6], [0, 80]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  return (
    <section ref={targetRef} className="relative flex min-h-[88vh] items-end overflow-hidden bg-charcoal">
      {/* Image */}
      <motion.div style={{ scale: imgScale }} className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/de-tafelaar.png" alt="Sfeerbeeld van De Kamp, Amersfoort" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/55 to-charcoal/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/70 to-transparent" />
      </motion.div>

      {/* Content (rendered instantly — no entrance fade that leaves it blank) */}
      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-gold backdrop-blur-md">
            <Sparkles className="h-4 w-4" /> Het kloppend hart van historisch Amersfoort
          </span>

          <h1 className="font-serif text-[15vw] font-black leading-[0.82] tracking-tighter text-white sm:text-[10rem]">
            De Kamp <span className="italic text-gold">leeft.</span>
          </h1>

          <p className="mt-8 max-w-2xl text-xl font-medium leading-snug text-stone/90 sm:text-2xl">
            Een straatportret van makers, smaken en ondernemersgeest — van de middeleeuwse Kamperbinnenpoort tot aan de
            singels.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/#ondernemers"
              className="group inline-flex items-center gap-3 rounded-full bg-white px-9 py-4 text-xs font-black uppercase tracking-widest text-deep-green shadow-2xl transition hover:bg-gold active:scale-95"
            >
              Ontdek de ondernemers
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/kaart"
              className="inline-flex items-center gap-3 rounded-full border-2 border-white/30 px-9 py-4 text-xs font-black uppercase tracking-widest text-white backdrop-blur-sm transition hover:bg-white hover:text-deep-green"
            >
              Bekijk de kaart <MapPin className="h-5 w-5" />
            </Link>
          </div>

          {/* Stat strip */}
          <div className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/15 pt-7 text-white/80">
            {[
              { v: "67", l: "ondernemers" },
              { v: "5", l: "straten" },
              { v: "13e eeuw", l: "stadspoort" },
            ].map((s) => (
              <div key={s.l}>
                <span className="font-serif text-2xl font-black text-white">{s.v}</span>
                <span className="ml-2 text-[11px] font-bold uppercase tracking-widest text-white/50">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;

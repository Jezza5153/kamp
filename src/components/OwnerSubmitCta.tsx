"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, UserPlus } from "lucide-react";
import { businesses } from "@/data/businesses";

const OwnerSubmitCta = () => {
  const collage = businesses
    .filter((b) => b.status !== "closed" && b.imageUrl && b.imageFit !== "contain")
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.sortOrder - b.sortOrder)
    .slice(0, 4);

  return (
    <section className="overflow-hidden bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-[var(--radius-xl)] bg-deep-green p-12 shadow-2xl md:p-20"
        >
          <div className="relative z-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-amber/20 bg-amber/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-gold">
                <UserPlus className="h-4 w-4" /> Voor ondernemers
              </div>
              <h2 className="mb-8 font-serif text-4xl font-black leading-[0.95] text-white md:text-6xl">
                Zie jij jouw zaak al staan?
              </h2>
              <p className="mb-12 max-w-md text-xl font-medium leading-relaxed text-stone/70">
                We bouwen aan de meest complete gids van De Kamp. Jouw verhaal, foto&apos;s en openingstijden maken het
                portret van de straat compleet — gratis.
              </p>
              <Link
                href="/aanmelden"
                className="group inline-flex items-center gap-3 rounded-full bg-amber px-8 py-4 text-xs font-black uppercase tracking-widest text-charcoal shadow-xl transition hover:bg-gold active:scale-95"
              >
                Mijn zaak aanmelden
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Real photo collage */}
            <div className="grid grid-cols-2 gap-4">
              {collage.map((b, i) => (
                <motion.div
                  key={b.id}
                  animate={{ y: [0, i % 2 ? 10 : -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
                  className={`relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-white/10 ${i % 2 ? "translate-y-6" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.imageUrl} alt={b.name} referrerPolicy="no-referrer" loading="lazy" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-2 left-3 font-serif text-sm font-black text-white">{b.name}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Background wordmark */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap font-serif text-[30vw] font-black text-white/[0.02]">
            KAMP
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default OwnerSubmitCta;

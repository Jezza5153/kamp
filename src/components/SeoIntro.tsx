"use client";

import { motion } from "framer-motion";
import { businesses } from "@/data/businesses";
import { CATEGORIES } from "@/lib/categories";

export default function SeoIntro() {
  const active = businesses.filter((b) => b.status !== "closed");
  const stats = [
    { value: `${active.length}`, label: "ondernemers" },
    { value: `${CATEGORIES.length}`, label: "categorieën" },
    { value: "5", label: "straten" },
    { value: "13e eeuw", label: "sinds de stadspoort" },
  ];

  return (
    <section className="overflow-hidden bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-amber-ink">Over De Kamp</p>
            <h2 className="font-serif text-4xl font-black leading-[0.95] text-deep-green sm:text-6xl">
              Historie <br /> & ambacht
            </h2>
            <div className="mt-8 h-1.5 w-20 rounded-full bg-amber" />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.15 }} className="space-y-6">
            <p className="font-serif text-2xl font-bold italic leading-snug text-warm-brown">
              De Kamp is niet zomaar een straat — het is de onafhankelijke, levende as die de historische binnenstad van
              Amersfoort haar karakter geeft.
            </p>
            <div className="space-y-5 leading-relaxed text-warm-brown/75">
              <p>
                De route begint bij de <strong className="text-deep-green">Kamperbinnenpoort</strong>, de oudste nog
                bestaande stadspoort van Amersfoort uit de 13e eeuw. Daarachter loopt de circa 350 meter lange straat de
                oude stad in — langs tientallen rijksmonumenten vol eigenzinnige winkels, makers, wereldkeukens en
                vertrouwde vakzaken.
              </p>
              <p>
                Van een ambachtelijke schoenmaker en een Ethiopisch restaurant tot een goudsmid, een wijnkoper en een
                interieurstylist: achter elke gevel zit een ondernemer met een eigen verhaal. Deze gids brengt ze samen —
                niet als snelle winkelstraat, maar als een verzameling verhalen op loopafstand van elkaar.
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-8 gap-y-6 border-t border-stone/40 pt-8 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="font-serif text-3xl font-black text-deep-green">{s.value}</dt>
                  <dd className="mt-1 text-[11px] font-bold uppercase tracking-wider text-warm-brown/50">{s.label}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

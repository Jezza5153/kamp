"use client";

import { businesses } from "@/data/businesses";
import BusinessCard from "./BusinessCard";
import { motion } from "framer-motion";

const FeaturedHorizontal = () => {
  const featured = businesses.filter((b) => b.featured && b.status !== "closed").slice(0, 8);

  return (
    <section className="overflow-hidden bg-background py-24">
      <div className="mx-auto mb-16 flex max-w-7xl items-end justify-between px-4 sm:px-6 lg:px-8">
        <div>
          <h2 className="mb-4 text-xs font-black uppercase tracking-[0.4em] text-amber-ink italic">Spotlight</h2>
          <h3 className="font-serif text-4xl font-black leading-none tracking-tighter text-deep-green md:text-6xl">
            In de spotlights
          </h3>
        </div>
        <div className="hidden text-[10px] font-black uppercase tracking-widest text-warm-brown/40 md:block">
          Scroll horizontaal &rarr;
        </div>
      </div>

      <div className="no-scrollbar w-full overflow-x-auto pb-12">
        <div className="flex w-max gap-8 px-4 sm:px-6 lg:px-8">
          {featured.map((business, index) => (
            <motion.div
              key={business.id}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.08 }}
              className="w-[300px] sm:w-[420px]"
            >
              <BusinessCard business={business} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedHorizontal;

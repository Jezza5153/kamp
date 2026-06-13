"use client";

import { useRef } from "react";
import { businesses } from "@/data/businesses";
import BusinessCard from "./BusinessCard";
import { motion, useScroll, useTransform } from "framer-motion";

const FeaturedHorizontal = () => {
  const targetRef = useRef(null);
  const { scrollXProgress } = useScroll({
    target: targetRef,
    axis: "x"
  });

  const featured = businesses.filter(b => b.featured).slice(0, 8);

  return (
    <section className="py-24 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 flex justify-between items-end">
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-amber mb-4 italic">Spotlight</h2>
          <h3 className="text-4xl md:text-6xl font-serif font-black text-deep-green tracking-tighter leading-none">
            In de spotlights
          </h3>
        </div>
        <div className="hidden md:block text-stone/40 text-[10px] font-black uppercase tracking-widest">
          Scroll horizontaal &rarr;
        </div>
      </div>

      <div 
        ref={targetRef}
        className="w-full overflow-x-auto no-scrollbar pb-12"
      >
        <div className="flex gap-8 px-4 sm:px-6 lg:px-8 w-max">
          {featured.map((business, index) => (
            <motion.div 
              key={business.id}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="w-[300px] sm:w-[450px]"
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

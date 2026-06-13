"use client";

import { motion } from "framer-motion";

const SeoIntro = () => {
  return (
    <section className="py-24 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-6xl font-serif font-black text-deep-green leading-[0.9] mb-8">
              Historie <br /> & Ambacht
            </h2>
            <div className="w-20 h-2 bg-amber rounded-full" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <p className="text-2xl font-serif font-bold text-warm-brown leading-snug italic">
              De Kamp is niet zomaar een straat; het is de levendige as die historisch Amersfoort zijn karakter geeft.
            </p>
            <div className="prose prose-lg text-warm-brown/70 leading-relaxed space-y-6">
              <p>
                Aan De Kamp in Amersfoort vind je een unieke verzameling van meer dan 50 lokale ondernemers. Van authentieke toko’s en ambachtelijke makers tot verfijnde restaurants en boutique hotels. Het is de plek waar historie en vernieuwing hand in hand gaan. 
              </p>
              <p>
                Deze gids is een eerbetoon aan de gezichten achter de etalages. We nodigen je uit om de straat te ontdekken, niet als een snelle winkelstraat, maar als een verzameling verhalen.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SeoIntro;

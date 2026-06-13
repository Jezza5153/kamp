"use client";

import Link from "next/link";
import { Business } from "@/data/businesses";
import { motion } from "framer-motion";
import { ArrowUpRight, Star } from "lucide-react";

interface BusinessCardProps {
  business: Business;
}

const BusinessCard = ({ business }: BusinessCardProps) => {
  return (
    <Link 
      href={`/ondernemers/${business.id}`}
      className="group flex flex-col h-full perspective-1000"
    >
      <motion.div 
        whileHover={{ rotateY: 5, rotateX: -5, scale: 1.02 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative aspect-[4/5] bg-stone/20 rounded-[2.5rem] overflow-hidden shadow-sm group-hover:shadow-[0_40px_80px_-20px_rgba(24,61,43,0.3)] transition-all duration-500 border border-white/40"
      >
        {business.imageUrl ? (
          <img 
            src={business.imageUrl} 
            alt={business.name}
            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700 ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-stone/40 font-serif italic p-6 text-center">
            {business.imageStatus === "placeholder" ? "Beeld volgt" : "Beeld in aanvraag"}
          </div>
        )}
        
        {/* Mirror/Glass Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 opacity-60 group-hover:opacity-20 transition-opacity duration-700" />
        
        {/* Floating elements */}
        <div className="absolute inset-x-6 top-6 flex justify-between items-start">
          <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">
              {business.category}
            </span>
          </div>
          {business.featured && (
            <div className="w-10 h-10 rounded-full bg-amber/90 backdrop-blur-md flex items-center justify-center text-white shadow-xl">
              <Star className="w-4 h-4 fill-current" />
            </div>
          )}
        </div>

        {/* Bottom Glass Card - Reveals on Hover */}
        <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 to-transparent translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <div className="flex justify-between items-end">
            <div className="max-w-[80%]">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber mb-2">{business.address.replace(', Amersfoort', '')}</p>
              <h3 className="text-2xl font-serif font-black text-white leading-tight">
                {business.name}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-deep-green opacity-0 group-hover:opacity-100 transition-opacity delay-100 duration-300">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Short Story below (optional, removed for "Visionary" grid feel) */}
      <div className="mt-6 px-4 group-hover:opacity-60 transition-opacity">
        <p className="text-sm text-foreground/70 font-medium line-clamp-1 italic font-serif">
          &quot;{business.shortDescription}&quot;
        </p>
      </div>
    </Link>
  );
};

export default BusinessCard;

"use client";

import Link from "next/link";
import { Business } from "@/data/businesses";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

interface BusinessCardProps {
  business: Business;
}

const BusinessCard = ({ business }: BusinessCardProps) => {
  return (
    <Link 
      href={`/ondernemers/${business.id}`}
      className="group flex flex-col h-full"
    >
      <div className="relative aspect-[4/5] sm:aspect-square bg-stone/20 rounded-[2rem] overflow-hidden shadow-sm group-hover:shadow-2xl transition-all duration-500 border border-stone/10">
        {business.imageUrl ? (
          <img 
            src={business.imageUrl} 
            alt={business.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-stone/40 font-serif italic p-6 text-center">
            {business.imageStatus === "placeholder" ? "Beeld volgt" : "Beeld in aanvraag"}
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Floating elements */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
          <span className="px-4 py-1.5 bg-white/95 backdrop-blur-md text-deep-green text-[10px] font-bold rounded-full uppercase tracking-widest shadow-lg border border-white/20">
            {business.category}
          </span>
          <div className="w-10 h-10 rounded-full bg-white opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all duration-500 flex items-center justify-center text-deep-green shadow-xl">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>
      
      <div className="mt-6 px-2">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="text-2xl font-serif font-bold text-deep-green leading-tight group-hover:text-amber transition-colors duration-300">
            {business.name}
          </h3>
          {business.featured && (
            <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-amber shadow-[0_0_8px_rgba(201,130,43,0.6)]" />
          )}
        </div>
        <p className="text-sm text-warm-brown/60 font-bold mb-4 tracking-wide uppercase">
          {business.address.replace(', Amersfoort', '')}
        </p>
        <p className="text-base text-foreground/75 line-clamp-2 mb-6 font-medium leading-relaxed">
          {business.shortDescription}
        </p>
        
        <div className="flex items-center gap-3 text-sm font-bold text-deep-green/40 group-hover:text-amber transition-colors mt-auto">
          <span className="w-8 h-px bg-current opacity-20 group-hover:w-12 transition-all duration-500" />
          ONTDEK HET VERHAAL
        </div>
      </div>
    </Link>
  );
};

export default BusinessCard;

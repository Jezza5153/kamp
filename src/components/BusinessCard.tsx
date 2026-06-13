import Link from "next/link";
import { Business } from "@/data/businesses";

interface BusinessCardProps {
  business: Business;
}

const BusinessCard = ({ business }: BusinessCardProps) => {
  return (
    <Link 
      href={`/ondernemers/${business.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-stone/30 flex flex-col h-full"
    >
      <div className="relative h-48 sm:h-56 bg-stone/20 overflow-hidden">
        {/* Placeholder for images */}
        <div className="absolute inset-0 flex items-center justify-center text-stone/40 font-serif italic p-6 text-center">
          {business.imageStatus === "placeholder" ? "Foto volgt binnenkort" : "Beeld in aanvraag"}
        </div>
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-deep-green text-xs font-bold rounded-full uppercase tracking-wider shadow-sm">
            {business.category}
          </span>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-serif font-bold text-deep-green group-hover:text-amber transition-colors">
          {business.name}
        </h3>
        <p className="text-sm text-warm-brown/60 font-medium mb-3">
          {business.address}, Amersfoort
        </p>
        <p className="text-sm text-foreground/80 line-clamp-3 mb-4 flex-grow">
          {business.shortDescription}
        </p>
        
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-stone/20">
          <span className="text-xs font-bold text-amber group-hover:translate-x-1 transition-transform inline-flex items-center">
            Bekijk verhaal
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
          {business.publicPersonName && (
            <span className="text-[10px] text-stone font-medium uppercase tracking-widest">
              Lokaal gezicht
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default BusinessCard;

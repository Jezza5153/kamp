import Link from "next/link";
import { Star, ArrowUpRight, MapPin } from "lucide-react";
import type { Business } from "@/data/businesses";
import BusinessImage from "./BusinessImage";
import OpenBadge from "./OpenBadge";

interface BusinessCardProps {
  business: Business;
  priority?: boolean;
}

export default function BusinessCard({ business, priority }: BusinessCardProps) {
  const specialties = (business.specialties ?? business.tags ?? []).slice(0, 2);

  return (
    <Link
      href={`/ondernemers/${business.id}`}
      className="group flex h-full flex-col rounded-[var(--radius-lg)] outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)] bg-stone/30 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-[var(--shadow-float)]">
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.05]">
          <BusinessImage
            business={business}
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>

        {/* legibility gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/15" />

        {/* top chips */}
        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-md">
            {business.category}
          </span>
          {business.featured && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber text-white shadow-lg" title="Uitgelicht">
              <Star className="h-4 w-4 fill-current" />
            </span>
          )}
        </div>

        {/* bottom text */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-amber-200/90">
            <MapPin className="h-3 w-3" /> {business.address}
          </p>
          <div className="flex items-end justify-between gap-3">
            <h3 className="font-serif text-2xl font-black leading-[0.95] text-white">{business.name}</h3>
            <span className="flex h-10 w-10 flex-shrink-0 translate-y-1 items-center justify-center rounded-full bg-white text-deep-green opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </div>
        </div>
      </div>

      {/* meta row */}
      <div className="mt-3 flex items-center justify-between gap-2 px-1">
        <OpenBadge hours={business.hours} />
        {business.priceRange && (
          <span className="text-xs font-bold text-warm-brown/70">{business.priceRange}</span>
        )}
      </div>

      {specialties.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 px-1">
          {specialties.map((s) => (
            <span key={s} className="rounded-full bg-stone/40 px-2.5 py-0.5 text-[11px] font-semibold text-warm-brown/70">
              {s}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

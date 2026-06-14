"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, FilterX, Map as MapIcon, LayoutGrid, Clock } from "lucide-react";
import type { Business } from "@/data/businesses";
import { CATEGORIES } from "@/lib/categories";
import { getOpenState, nowInAmsterdam, type NowAmsterdam } from "@/lib/hours";
import BusinessCard from "./BusinessCard";
import DistrictMap from "./DistrictMap";

export default function BusinessExplorer({ businesses }: { businesses: Business[] }) {
  const [category, setCategory] = useState<string>("Alles");
  const [query, setQuery] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [now, setNow] = useState<NowAmsterdam | null>(null);

  useEffect(() => {
    setNow(nowInAmsterdam());
    const t = setInterval(() => setNow(nowInAmsterdam()), 60_000);
    return () => clearInterval(t);
  }, []);

  const active = useMemo(() => businesses.filter((b) => b.status !== "closed"), [businesses]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return active
      .filter((b) => {
        if (category !== "Alles" && b.category !== category) return false;
        if (openNow) {
          if (!now) return false;
          const s = getOpenState(b.hours, now);
          if (!(s.status === "open" || s.status === "closing_soon")) return false;
        }
        if (q) {
          const hay = `${b.name} ${b.tags.join(" ")} ${(b.specialties ?? []).join(" ")} ${(b.perfectFor ?? []).join(" ")} ${b.address} ${b.publicPersonName ?? ""} ${b.subcategory}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.sortOrder - b.sortOrder);
  }, [active, category, query, openNow, now]);

  const highlightIds = useMemo(() => new Set(filtered.map((b) => b.id)), [filtered]);
  const isFiltering = category !== "Alles" || query.trim() !== "" || openNow;
  const reset = () => {
    setCategory("Alles");
    setQuery("");
    setOpenNow(false);
  };

  return (
    <div>
      {/* Sticky control bar */}
      <div className="sticky top-[72px] z-30 -mx-4 mb-10 border-y border-stone/40 bg-background/85 px-4 py-4 backdrop-blur-xl sm:top-[88px] sm:rounded-[var(--radius)] sm:border sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* search */}
          <div className="relative lg:w-80 lg:flex-shrink-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-brown/40" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek zaak, product of straat…"
              aria-label="Zoek ondernemer"
              className="w-full rounded-full border border-stone/50 bg-paper py-3 pl-11 pr-10 text-sm font-medium shadow-sm outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/30"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Wis zoekopdracht" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-warm-brown/50 hover:text-amber">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* category chips */}
          <div className="-mx-1 flex flex-1 gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
            <Chip active={category === "Alles"} onClick={() => setCategory("Alles")}>
              Alles
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip key={c.slug} active={category === c.name} onClick={() => setCategory(c.name)}>
                {c.short}
              </Chip>
            ))}
          </div>
        </div>

        {/* second row: toggles + count */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-stone/30 pt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpenNow((v) => !v)}
              aria-pressed={openNow}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition ${
                openNow ? "bg-emerald-500/15 text-emerald-700 ring-emerald-600/30" : "bg-paper text-warm-brown/70 ring-stone/50 hover:ring-amber/50"
              }`}
            >
              <Clock className="h-3.5 w-3.5" /> Nu open
            </button>
            <button
              onClick={() => setShowMap((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3.5 py-1.5 text-xs font-bold text-warm-brown/70 ring-1 ring-stone/50 transition hover:ring-amber/50"
            >
              {showMap ? <LayoutGrid className="h-3.5 w-3.5" /> : <MapIcon className="h-3.5 w-3.5" />}
              {showMap ? "Verberg kaart" : "Toon kaart"}
            </button>
            {isFiltering && (
              <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-amber-ink hover:underline">
                <FilterX className="h-3.5 w-3.5" /> Wis filters
              </button>
            )}
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-warm-brown/50">
            {filtered.length} {filtered.length === 1 ? "ondernemer" : "ondernemers"}
          </p>
        </div>
      </div>

      {/* Map */}
      <AnimatePresence initial={false}>
        {showMap && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-12 overflow-hidden"
          >
            <DistrictMap businesses={active} highlightIds={isFiltering ? highlightIds : undefined} />
            <p className="mt-3 text-center text-xs font-medium text-warm-brown/50">
              Elke stip is een ondernemer · beweeg eroverheen voor details · klik om de zaak te bekijken
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <motion.div layout className="grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            filtered.map((b) => (
              <motion.div key={b.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }}>
                <BusinessCard business={b} />
              </motion.div>
            ))
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full rounded-[var(--radius-lg)] border-2 border-dashed border-stone/50 bg-paper py-24 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-stone/40 text-warm-brown/50">
                <FilterX className="h-8 w-8" />
              </div>
              <h3 className="mb-2 font-serif text-2xl font-black text-deep-green">Niets gevonden</h3>
              <p className="mx-auto mb-8 max-w-sm text-warm-brown/60">Probeer een andere categorie of zoekterm — of zet “Nu open” uit.</p>
              <button onClick={reset} className="rounded-full bg-deep-green px-8 py-3 font-bold text-white shadow-lg transition hover:bg-amber active:scale-95">
                Alle filters wissen
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold transition ${
        active ? "border-deep-green bg-deep-green text-white shadow-md" : "border-stone/50 bg-paper text-deep-green hover:border-amber hover:text-amber"
      }`}
    >
      {children}
    </button>
  );
}

"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, FilterX, Map as MapIcon, LayoutGrid, Clock } from "lucide-react";
import type { Business } from "@/data/businesses";
import { CATEGORIES } from "@/lib/categories";
import { getOpenState } from "@/lib/hours";
import { useNow } from "@/lib/useNow";
import BusinessCard from "./BusinessCard";
import DistrictMap from "./DistrictMap";
import { t } from "@/lib/dict";
import type { Locale } from "@/lib/i18n";

export default function BusinessExplorer({ businesses, locale = "nl" }: { businesses: Business[]; locale?: Locale }) {
  const [category, setCategory] = useState<string>("Alles");
  const [query, setQuery] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [useCase, setUseCase] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const now = useNow();

  // Most common "perfect voor" tags present in the data (for the quick filter).
  const useCases = useMemo(() => {
    const count: Record<string, number> = {};
    for (const b of businesses) for (const p of b.perfectFor ?? []) count[p] = (count[p] || 0) + 1;
    return Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k]) => k);
  }, [businesses]);

  const active = useMemo(() => businesses.filter((b) => b.status !== "closed"), [businesses]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return active
      .filter((b) => {
        if (category !== "Alles" && b.category !== category) return false;
        if (useCase && !(b.perfectFor ?? []).includes(useCase)) return false;
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
  }, [active, category, query, openNow, useCase, now]);

  const highlightIds = useMemo(() => new Set(filtered.map((b) => b.id)), [filtered]);
  const isFiltering = category !== "Alles" || query.trim() !== "" || openNow || !!useCase;
  const reset = () => {
    setCategory("Alles");
    setQuery("");
    setOpenNow(false);
    setUseCase(null);
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
              placeholder={t(locale, "explorer.searchPlaceholder")}
              aria-label={t(locale, "explorer.searchAria")}
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
              {t(locale, "explorer.all")}
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip key={c.slug} active={category === c.name} onClick={() => setCategory(c.name)}>
                {locale === "en" ? c.shortEn : c.short}
              </Chip>
            ))}
          </div>
        </div>

        {/* perfect-voor quick filter */}
        <div className="mt-3 -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
          <span className="self-center whitespace-nowrap text-[11px] font-black uppercase tracking-widest text-warm-brown/40">{t(locale, "explorer.perfectFor")}</span>
          {useCases.map((u) => (
            <button
              key={u}
              onClick={() => setUseCase(useCase === u ? null : u)}
              aria-pressed={useCase === u}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold transition ${
                useCase === u ? "border-amber bg-amber/15 text-amber-ink" : "border-stone/40 bg-paper text-warm-brown/70 hover:border-amber/50"
              }`}
            >
              {u}
            </button>
          ))}
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
              <Clock className="h-3.5 w-3.5" /> {t(locale, "explorer.openNow")}
            </button>
            <button
              onClick={() => setShowMap((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3.5 py-1.5 text-xs font-bold text-warm-brown/70 ring-1 ring-stone/50 transition hover:ring-amber/50"
            >
              {showMap ? <LayoutGrid className="h-3.5 w-3.5" /> : <MapIcon className="h-3.5 w-3.5" />}
              {showMap ? t(locale, "explorer.hideMap") : t(locale, "explorer.showMap")}
            </button>
            {isFiltering && (
              <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-amber-ink hover:underline">
                <FilterX className="h-3.5 w-3.5" /> {t(locale, "explorer.clear")}
              </button>
            )}
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-warm-brown/50">
            {filtered.length} {filtered.length === 1 ? t(locale, "explorer.resultOne") : t(locale, "explorer.results")}
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
              {t(locale, "explorer.mapHint")}
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
              <h3 className="mb-2 font-serif text-2xl font-black text-deep-green">{t(locale, "explorer.nothingFound")}</h3>
              <p className="mx-auto mb-8 max-w-sm text-warm-brown/60">{t(locale, "explorer.nothingHint")}</p>
              <button onClick={reset} className="rounded-full bg-deep-green px-8 py-3 font-bold text-white shadow-lg transition hover:bg-amber active:scale-95">
                {t(locale, "explorer.clearAll")}
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

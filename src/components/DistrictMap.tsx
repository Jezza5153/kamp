"use client";

/**
 * Bespoke, key-free map of the De Kamp district. Plots every business along the
 * real (curving) line of the street using geocoded/interpolated coordinates.
 * No third-party tiles — fully on-brand, fast, and works offline.
 */

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import type { Business } from "@/data/businesses";
import { coordsFor, project, KAMPERBINNENPOORT, DISTRICT_CENTER } from "@/lib/geo";
import { categoryArt } from "@/lib/placeholder";
import { getOpenState, nowInAmsterdam, openLabel, type NowAmsterdam } from "@/lib/hours";

const VB_W = 1000;
const VB_H = 720;

interface Placed {
  b: Business;
  /** normalized 0..1 within the map canvas */
  nx: number;
  ny: number;
}

function norm(b: Business): Placed {
  const c = coordsFor({ streetSegment: b.streetSegment, address: b.address, lat: b.lat, lng: b.lng });
  const p = project(c, 1, 1, 0.06); // 6% padding inside the canvas
  return { b, nx: p.x, ny: p.y };
}

interface DistrictMapProps {
  businesses: Business[];
  /** ids to emphasise; others dim. When undefined, all are full strength. */
  highlightIds?: Set<string>;
  className?: string;
}

export default function DistrictMap({ businesses, highlightIds, className = "" }: DistrictMapProps) {
  const [hover, setHover] = useState<string | null>(null);
  const [now, setNow] = useState<NowAmsterdam | null>(null);

  // Compute "now" only on the client to avoid hydration mismatch.
  useEffect(() => setNow(nowInAmsterdam()), []);

  const placed = useMemo(() => businesses.map(norm), [businesses]);

  // Static base geometry (street spine, gate, canals) in viewBox space.
  const gate = project(KAMPERBINNENPOORT, 1, 1, 0.06);
  const spine = useMemo(() => {
    const kamp = businesses
      .filter((b) => b.streetSegment === "Kamp")
      .map((b) => ({ b, p: norm(b) }))
      .sort((a, b) => num(a.b.address) - num(b.b.address))
      .map(({ p }) => `${(p.nx * VB_W).toFixed(1)},${(p.ny * VB_H).toFixed(1)}`);
    return [`${(gate.x * VB_W).toFixed(1)},${(gate.y * VB_H).toFixed(1)}`, ...kamp].join(" ");
  }, [businesses, gate.x, gate.y]);

  const hovered = placed.find((p) => p.b.id === hover);

  return (
    <div className={`relative w-full overflow-hidden rounded-[var(--radius-lg)] bg-deep-green text-white ${className}`}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="block w-full h-auto" role="img" aria-label="Kaart van ondernemers op De Kamp in Amersfoort">
        <defs>
          <radialGradient id="mapglow" cx="50%" cy="38%" r="75%">
            <stop offset="0" stopColor="#1f4d38" />
            <stop offset="1" stopColor="#0f2a1d" />
          </radialGradient>
        </defs>
        <rect width={VB_W} height={VB_H} fill="url(#mapglow)" />

        {/* faint cartographic grid */}
        <g stroke="#ffffff" strokeOpacity="0.05">
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`v${i}`} x1={(i * VB_W) / 10} y1="0" x2={(i * VB_W) / 10} y2={VB_H} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={(i * VB_H) / 7} x2={VB_W} y2={(i * VB_H) / 7} />
          ))}
        </g>

        {/* canals (Zuidsingel / Weverssingel) — soft water tone */}
        <g stroke="#7fb0c9" strokeOpacity="0.28" strokeWidth="9" fill="none" strokeLinecap="round">
          <path d={`M ${0.5 * VB_W} ${0.74 * VB_H} Q ${0.72 * VB_W} ${0.82 * VB_H} ${0.96 * VB_W} ${0.7 * VB_H}`} />
          <path d={`M ${0.46 * VB_W} ${0.66 * VB_H} Q ${0.3 * VB_W} ${0.74 * VB_H} ${0.08 * VB_W} ${0.7 * VB_H}`} />
        </g>

        {/* the Kamp spine */}
        <polyline points={spine} fill="none" stroke="#d9a86a" strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={spine} fill="none" stroke="#d9a86a" strokeOpacity="0.18" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />

        {/* Kamperbinnenpoort landmark */}
        <g transform={`translate(${gate.x * VB_W} ${gate.y * VB_H})`}>
          <rect x="-11" y="-16" width="22" height="28" rx="3" fill="#f6f0e2" opacity="0.9" />
          <rect x="-11" y="-16" width="22" height="9" rx="3" fill="#c9822b" />
        </g>
      </svg>

      {/* Business pins as real, focusable links positioned by % */}
      {placed.map(({ b, nx, ny }) => {
        const art = categoryArt(b.category);
        const dim = highlightIds && !highlightIds.has(b.id);
        const open = now ? getOpenState(b.hours, now) : null;
        const isOpen = open?.status === "open" || open?.status === "closing_soon";
        return (
          <Link
            key={b.id}
            href={`/ondernemers/${b.id}`}
            aria-label={`${b.name}, ${b.category}, ${b.address}`}
            onMouseEnter={() => setHover(b.id)}
            onMouseLeave={() => setHover((h) => (h === b.id ? null : h))}
            onFocus={() => setHover(b.id)}
            onBlur={() => setHover((h) => (h === b.id ? null : h))}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
            style={{
              left: `${nx * 100}%`,
              top: `${ny * 100}%`,
              opacity: dim ? 0.25 : 1,
              zIndex: hover === b.id ? 30 : 10,
            }}
          >
            <span
              className="block rounded-full ring-2 ring-white/70 shadow-md transition-transform duration-300 hover:scale-150"
              style={{
                width: hover === b.id ? 18 : 13,
                height: hover === b.id ? 18 : 13,
                background: art.accent,
              }}
            />
            {isOpen && (
              <span className="absolute -right-0.5 -top-0.5 block h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-deep-green" />
            )}
          </Link>
        );
      })}

      {/* Hover tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute z-40 w-56 -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-2xl bg-paper p-4 text-foreground shadow-[var(--shadow-float)]"
          style={{ left: `${hovered.nx * 100}%`, top: `${hovered.ny * 100}%` }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-ink">{hovered.b.category}</p>
          <p className="font-serif text-lg font-black leading-tight text-deep-green">{hovered.b.name}</p>
          <p className="mt-1 text-xs font-medium text-warm-brown/70">{hovered.b.address}</p>
          {now && hovered.b.hours && (
            <p className="mt-2 text-xs font-bold text-deep-green-600">{openLabel(getOpenState(hovered.b.hours, now))}</p>
          )}
        </div>
      )}

      {/* Compass / label */}
      <div className="pointer-events-none absolute left-5 top-5 text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
        De Kamp · Amersfoort
      </div>
      <div className="pointer-events-none absolute bottom-4 right-5 text-[10px] font-medium text-white/40">
        {businesses.length} ondernemers · {DISTRICT_CENTER.lat.toFixed(3)}, {DISTRICT_CENTER.lng.toFixed(3)}
      </div>
    </div>
  );
}

function num(address: string): number {
  const m = address.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

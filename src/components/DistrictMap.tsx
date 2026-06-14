"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Business } from "@/data/businesses";
import { coordsFor, DISTRICT_CENTER } from "@/lib/geo";
import { categoryArt } from "@/lib/placeholder";
import { getOpenState, nowInAmsterdam, openLabel } from "@/lib/hours";

/** CARTO Voyager raster basemap — free, no API key, clean labels. */
const STYLE = {
  version: 8 as const,
  sources: {
    carto: {
      type: "raster" as const,
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [{ id: "carto", type: "raster" as const, source: "carto" }],
};

interface DistrictMapProps {
  businesses: Business[];
  /** ids to emphasise; others dim. */
  highlightIds?: Set<string>;
  className?: string;
  /** map height (css). */
  height?: string;
}

export default function DistrictMap({ businesses, highlightIds, className = "", height = "min(68vh, 560px)" }: DistrictMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ id: string; el: HTMLElement }[]>([]);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !containerRef.current) return;

      const now = nowInAmsterdam();
      const pts = businesses.map((b) => ({
        b,
        c: coordsFor({ streetSegment: b.streetSegment, address: b.address, lat: b.lat, lng: b.lng }),
      }));

      map = new maplibregl.Map({
        container: containerRef.current,
        style: STYLE as never,
        center: [DISTRICT_CENTER.lng, DISTRICT_CENTER.lat],
        zoom: 16,
        attributionControl: false,
        preserveDrawingBuffer: true,
      });
      map.addControl(new maplibregl.AttributionControl({ compact: true }));
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      // Markers are DOM overlays — add immediately (no need to wait for style load).
      {
        const bounds = new maplibregl.LngLatBounds();
        markersRef.current = [];

        for (const { b, c } of pts) {
          bounds.extend([c.lng, c.lat]);
          const art = categoryArt(b.category);
          const open = getOpenState(b.hours, now);
          const isOpen = open.status === "open" || open.status === "closing_soon";

          const el = document.createElement("button");
          el.type = "button";
          el.setAttribute("aria-label", `${b.name}, ${b.category}, ${b.address}`);
          el.style.cssText = `width:22px;height:22px;border-radius:9999px;background:${art.accent};border:2.5px solid #fff;box-shadow:0 2px 8px rgba(22,58,41,.45);cursor:pointer;transition:transform .15s ease;padding:0;display:block`;
          if (isOpen) {
            const dot = document.createElement("span");
            dot.style.cssText = "position:absolute;top:-3px;right:-3px;width:10px;height:10px;border-radius:9999px;background:#10b981;border:2px solid #fff";
            el.style.position = "relative";
            el.appendChild(dot);
          }

          const img = b.imageUrl
            ? `<img src="${b.imageUrl}" referrerpolicy="no-referrer" alt="" style="width:100%;height:104px;object-fit:${b.imageFit === "contain" ? "contain" : "cover"};border-radius:12px;margin-bottom:8px;background:#eee" />`
            : "";
          const openLine = b.hours ? `<div style="font:700 12px Inter,sans-serif;color:#1f4d38;margin-top:4px">${openLabel(getOpenState(b.hours, now))}</div>` : "";
          const html = `<div style="width:208px;font-family:Inter,system-ui,sans-serif">${img}<div style="font:800 10px Inter;letter-spacing:.12em;text-transform:uppercase;color:#8a5a16">${b.category}</div><div style="font:800 17px/1.1 'Playfair Display',Georgia,serif;color:#163a29;margin:2px 0 3px">${b.name}</div><div style="font-size:12px;color:#7a6a58">${b.address}</div>${openLine}<div style="font:700 11px Inter;color:#b3701f;margin-top:6px">Bekijk →</div></div>`;
          const popup = new maplibregl.Popup({ offset: 16, closeButton: false, className: "kamp-popup" }).setHTML(html).setLngLat([c.lng, c.lat]);

          el.addEventListener("mouseenter", () => {
            el.style.transform = "scale(1.35)";
            el.style.zIndex = "10";
            popup.addTo(map);
          });
          el.addEventListener("mouseleave", () => {
            el.style.transform = "scale(1)";
            el.style.zIndex = "";
            popup.remove();
          });
          el.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/ondernemers/${b.id}`);
          });

          new maplibregl.Marker({ element: el }).setLngLat([c.lng, c.lat]).addTo(map);
          markersRef.current.push({ id: b.id, el });
        }

        if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 64, maxZoom: 17, duration: 0 });
        applyHighlight();
      }
    })();

    function applyHighlight() {
      for (const m of markersRef.current) {
        m.el.style.opacity = !highlightIds || highlightIds.has(m.id) ? "1" : "0.2";
      }
    }

    return () => {
      cancelled = true;
      markersRef.current = [];
      if (map) map.remove();
    };
  }, [businesses, router]); // eslint-disable-line react-hooks/exhaustive-deps

  // dim non-matching markers when the filter changes
  useEffect(() => {
    for (const m of markersRef.current) {
      m.el.style.opacity = !highlightIds || highlightIds.has(m.id) ? "1" : "0.2";
    }
  }, [highlightIds]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Interactieve kaart van ondernemers op De Kamp in Amersfoort"
      className={`w-full overflow-hidden rounded-[var(--radius-lg)] ring-1 ring-deep-green/20 shadow-[var(--shadow-card)] ${className}`}
      style={{ height, backgroundColor: "#0d1712" }}
    />
  );
}

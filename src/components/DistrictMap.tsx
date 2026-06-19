"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Business } from "@/data/businesses";
import { coordsFor, DISTRICT_CENTER } from "@/lib/geo";
import { categoryArt } from "@/lib/placeholder";
import { getOpenState, nowInAmsterdam, openLabel } from "@/lib/hours";

/** Free vector basemap (OpenFreeMap, no API key) — retinted to the brand on load. */
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

/** Warm editorial palette for the retint. */
const C = {
  land: "#f4ecdb",
  water: "#a9c7d4",
  green: "#dbe3d2",
  building: "#e8dec9",
  road: "#fcf8ef",
  roadCasing: "#e3d7bf",
  ink: "#5d4a37",
  halo: "#f6f0e2",
};

/** Minimal shape we read off each vector style layer during the retint. */
type StyleLayer = { id: string; type: string; "source-layer"?: string };

/** Retint any OpenMapTiles-schema vector style to the brand palette. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function retint(map: any) {
  let layers: StyleLayer[] = [];
  try {
    layers = map.getStyle().layers || [];
  } catch {
    return;
  }
  for (const l of layers) {
    const id = l.id as string;
    const sl = (l["source-layer"] as string) || "";
    try {
      if (l.type === "background") {
        map.setPaintProperty(id, "background-color", C.land);
      } else if (l.type === "fill") {
        if (sl === "water" || /water|ocean|sea/.test(id)) map.setPaintProperty(id, "fill-color", C.water);
        else if (/park|wood|forest|grass|landcover|landuse|cemetery|pitch|green/.test(sl + id)) map.setPaintProperty(id, "fill-color", C.green);
        else if (sl === "building") {
          map.setPaintProperty(id, "fill-color", C.building);
          map.setPaintProperty(id, "fill-opacity", 0.8);
        } else map.setPaintProperty(id, "fill-color", C.land);
      } else if (l.type === "line") {
        if (sl === "waterway") map.setPaintProperty(id, "line-color", C.water);
        else if (sl === "transportation" || /road|bridge|tunnel|street/.test(id)) {
          map.setPaintProperty(id, "line-color", /casing|outline/.test(id) ? C.roadCasing : C.road);
        } else if (/boundary|admin/.test(sl + id)) map.setPaintProperty(id, "line-color", C.roadCasing);
      } else if (l.type === "symbol") {
        try { map.setPaintProperty(id, "text-color", C.ink); } catch {}
        try { map.setPaintProperty(id, "text-halo-color", C.halo); } catch {}
        try { map.setPaintProperty(id, "text-halo-width", 1.4); } catch {}
      }
    } catch {
      /* layer doesn't support this property — skip */
    }
  }
}

interface DistrictMapProps {
  businesses: Business[];
  highlightIds?: Set<string>;
  className?: string;
  height?: string;
}

export default function DistrictMap({ businesses, highlightIds, className = "", height = "min(68vh, 560px)" }: DistrictMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ id: string; el: HTMLElement }[]>([]);
  // Dim non-matching markers. The closure is created inside the build effect
  // (which owns markersRef) so the highlight effect only has to invoke it —
  // mutating markersRef directly from a second effect is what React's
  // immutability rule forbids.
  const applyHighlightRef = useRef<(ids?: Set<string>) => void>(() => {});
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any;
    let retinted = false;
    const doRetint = () => {
      if (retinted || !map) return;
      try {
        if (map.isStyleLoaded()) {
          retint(map);
          retinted = true;
        }
      } catch {}
    };

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
        style: STYLE_URL,
        center: [DISTRICT_CENTER.lng, DISTRICT_CENTER.lat],
        zoom: 16,
        attributionControl: false,
      });
      map.addControl(new maplibregl.AttributionControl({ compact: true }));
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.on("load", doRetint);
      map.on("styledata", doRetint);
      map.on("idle", doRetint);

      // Markers (DOM overlays — added immediately).
      const bounds = new maplibregl.LngLatBounds();
      markersRef.current = [];
      for (const { b, c } of pts) {
        bounds.extend([c.lng, c.lat]);
        const art = categoryArt(b.category);
        const open = getOpenState(b.hours, now);
        const isOpen = open.status === "open" || open.status === "closing_soon";

        // Wrapper button: MapLibre owns its transform (translate) — never set transform on it.
        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", `${b.name}, ${b.category}, ${b.address}`);
        el.style.cssText = "width:22px;height:22px;padding:0;border:0;background:transparent;cursor:pointer;display:block";
        // Inner dot: we scale THIS on hover (so the pin doesn't jump/disappear).
        const dot = document.createElement("span");
        dot.style.cssText = `display:block;width:22px;height:22px;border-radius:9999px;background:${art.accent};border:2.5px solid #fff;box-shadow:0 1px 3px rgba(22,58,41,.5),0 0 0 1px rgba(22,58,41,.25);transition:transform .15s ease;transform-origin:center`;
        el.appendChild(dot);
        if (isOpen) {
          const g = document.createElement("span");
          g.style.cssText = "position:absolute;top:-3px;right:-3px;width:10px;height:10px;border-radius:9999px;background:#10b981;border:2px solid #fff";
          dot.style.position = "relative";
          dot.appendChild(g);
        }

        const img = b.imageUrl
          ? `<img src="${b.imageUrl}" referrerpolicy="no-referrer" alt="" style="width:100%;height:104px;object-fit:${b.imageFit === "contain" ? "contain" : "cover"};border-radius:12px;margin-bottom:8px;background:#eee" />`
          : "";
        const openLine = b.hours ? `<div style="font:700 12px Inter,sans-serif;color:#1f4d38;margin-top:4px">${openLabel(getOpenState(b.hours, now))}</div>` : "";
        const html = `<div style="width:208px;font-family:Inter,system-ui,sans-serif">${img}<div style="font:800 10px Inter;letter-spacing:.12em;text-transform:uppercase;color:#8a5a16">${b.category}</div><div style="font:800 17px/1.1 'Playfair Display',Georgia,serif;color:#163a29;margin:2px 0 3px">${b.name}</div><div style="font-size:12px;color:#7a6a58">${b.address}</div>${openLine}<div style="font:700 11px Inter;color:#b3701f;margin-top:6px">Bekijk →</div></div>`;
        const popup = new maplibregl.Popup({ offset: 16, closeButton: false, className: "kamp-popup" }).setHTML(html).setLngLat([c.lng, c.lat]);

        el.addEventListener("mouseenter", () => {
          dot.style.transform = "scale(1.45)";
          el.style.zIndex = "10";
          popup.addTo(map);
        });
        el.addEventListener("mouseleave", () => {
          dot.style.transform = "scale(1)";
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
      applyHighlightRef.current = (ids) => {
        for (const m of markersRef.current) m.el.style.opacity = !ids || ids.has(m.id) ? "1" : "0.2";
      };
      applyHighlightRef.current(highlightIds);
    })();

    return () => {
      cancelled = true;
      markersRef.current = [];
      if (map) map.remove();
    };
  }, [businesses, router]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    applyHighlightRef.current(highlightIds);
  }, [highlightIds]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Interactieve kaart van ondernemers op De Kamp in Amersfoort"
      className={`w-full overflow-hidden rounded-[var(--radius-lg)] ring-1 ring-stone/50 shadow-[var(--shadow-card)] ${className}`}
      style={{ height, backgroundColor: C.land }}
    />
  );
}

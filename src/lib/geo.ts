/**
 * Geography of the De Kamp district, Amersfoort.
 *
 * Anchor coordinates were geocoded (OSM/Nominatim) against real businesses at
 * those addresses; the Kamp spine curves, so we interpolate piecewise (gate →
 * Kamp 40 → Kamp 88) rather than along a single straight chord. A business with
 * its own verified lat/lng always overrides interpolation.
 *
 * Coordinates feed a bespoke, key-free SVG map of the district — no third-party
 * tiles, fully on-brand and great for performance.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/** District-level anchors (WGS84). */
export const KAMPERBINNENPOORT: LatLng = { lat: 52.15715, lng: 5.39298 };
export const DISTRICT_CENTER: LatLng = { lat: 52.1578, lng: 5.3948 };

/** Verified anchor points along the Kamp spine, by house number. */
const KAMP_ANCHORS: { n: number; lat: number; lng: number }[] = [
  { n: 1, lat: 52.15718, lng: 5.39326 },
  { n: 40, lat: 52.15778, lng: 5.39478 },
  { n: 88, lat: 52.15866, lng: 5.39692 },
];

/** Approximate anchors for the adjacent streets in the cluster. */
const SEGMENT_ANCHORS: Record<string, { base: LatLng; perHouse: LatLng }> = {
  // Achter de Kamp runs parallel just south of Kamp (nrs ~30 near the centre).
  "Achter de Kamp": { base: { lat: 52.15742, lng: 5.39452 }, perHouse: { lat: 0.0000075, lng: 0.0000175 } },
  // Grote Sint Jansstraat connects toward Kamp near the gate end.
  "Grote Sint Jansstraat": { base: { lat: 52.15705, lng: 5.39455 }, perHouse: { lat: -0.0000125, lng: 0.0000125 } },
  // Zuidsingel — tree-lined canal at the SE/south edge.
  "Zuidsingel": { base: { lat: 52.15672, lng: 5.39545 }, perHouse: { lat: 0.0000065, lng: 0.0000065 } },
  // Weverssingel — canal near the centre, by nr 2.
  "Weverssingel": { base: { lat: 52.15695, lng: 5.39455 }, perHouse: { lat: 0.0000125, lng: 0.0000125 } },
};

function parseHouseNumber(address: string): number {
  const m = address.match(/\d+/);
  return m ? parseInt(m[0], 10) : 1;
}

/** Piecewise-linear interpolation along the curving Kamp spine. */
function interpolateKamp(houseNumber: number): LatLng {
  const a = KAMP_ANCHORS;
  if (houseNumber <= a[0].n) return { lat: a[0].lat, lng: a[0].lng };
  if (houseNumber >= a[a.length - 1].n) return { lat: a[a.length - 1].lat, lng: a[a.length - 1].lng };
  for (let i = 0; i < a.length - 1; i++) {
    if (houseNumber >= a[i].n && houseNumber <= a[i + 1].n) {
      const t = (houseNumber - a[i].n) / (a[i + 1].n - a[i].n);
      return {
        lat: a[i].lat + t * (a[i + 1].lat - a[i].lat),
        lng: a[i].lng + t * (a[i + 1].lng - a[i].lng),
      };
    }
  }
  return { lat: a[0].lat, lng: a[0].lng };
}

export interface GeoInput {
  streetSegment: string;
  address: string;
  lat?: number;
  lng?: number;
}

/** Best coordinate for a business: verified lat/lng wins, else interpolate. */
export function coordsFor(b: GeoInput): LatLng {
  if (typeof b.lat === "number" && typeof b.lng === "number" && b.lat !== 0) {
    return { lat: b.lat, lng: b.lng };
  }
  const house = parseHouseNumber(b.address);
  if (b.streetSegment === "Kamp") {
    const base = interpolateKamp(house);
    // nudge odd/even house numbers to opposite sides of the street for legibility
    const side = house % 2 === 0 ? 1 : -1;
    return { lat: base.lat + side * 0.00004, lng: base.lng - side * 0.00002 };
  }
  const seg = SEGMENT_ANCHORS[b.streetSegment];
  if (seg) {
    const idx = house - (b.streetSegment === "Zuidsingel" ? 60 : 0);
    return { lat: seg.base.lat + idx * seg.perHouse.lat, lng: seg.base.lng + idx * seg.perHouse.lng };
  }
  return DISTRICT_CENTER;
}

/** Bounding box of the district for projecting to a drawing canvas (with padding). */
export const MAP_BOUNDS = {
  minLat: 52.1563,
  maxLat: 52.1590,
  minLng: 5.39235,
  maxLng: 5.39760,
};

/**
 * Project a lat/lng into an SVG/box coordinate space [0..width] x [0..height].
 * Latitude is inverted (north = up). A simple equirectangular projection with a
 * cos(lat) correction is accurate enough at this ~400 m scale.
 */
export function project(
  point: LatLng,
  width: number,
  height: number,
  pad = 0,
): { x: number; y: number } {
  const { minLat, maxLat, minLng, maxLng } = MAP_BOUNDS;
  const cos = Math.cos((DISTRICT_CENTER.lat * Math.PI) / 180);
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const x = pad + ((point.lng - minLng) * cos) / ((maxLng - minLng) * cos) * innerW;
  const y = pad + (maxLat - point.lat) / (maxLat - minLat) * innerH;
  return { x, y };
}

/** Haversine distance in metres between two points. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/** Approx walking time in whole minutes from the Kamperbinnenpoort gate (~80 m/min). */
export function walkMinutesFromGate(point: LatLng): number {
  return Math.max(1, Math.round(distanceMeters(KAMPERBINNENPOORT, point) / 80));
}

/** Google Maps directions deep-link to a business address. */
export function directionsUrl(address: string, postalCode?: string): string {
  const q = encodeURIComponent(`${address}, ${postalCode ?? "3811"} Amersfoort, Netherlands`);
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}

/** Google Maps search/pin link for a business. */
export function mapsUrl(address: string, postalCode?: string): string {
  const q = encodeURIComponent(`${address}, ${postalCode ?? "3811"} Amersfoort, Netherlands`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/** No-key Google Street View deep-link to the panorama at a point. */
export function streetViewUrl(point: LatLng): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${point.lat},${point.lng}`;
}

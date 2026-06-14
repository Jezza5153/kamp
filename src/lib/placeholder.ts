/**
 * Generative SVG placeholder art for business listings.
 *
 * Every business gets a deterministic, editorial cover image derived from its
 * id + category, so the grid looks intentional and premium even when an owner
 * photo has not been supplied yet. No external/scraped imagery, fully themeable,
 * crisp at any size, zero network cost (great for Core Web Vitals).
 *
 * Pure module (no React) so it works in Server and Client Components.
 */

import type { BusinessCategory } from "@/data/businesses";

export interface CategoryArt {
  /** gradient start (deep) */
  from: string;
  /** gradient end (lighter) */
  to: string;
  /** accent used for the monogram + motif */
  accent: string;
  /** ink colour for small labels */
  ink: string;
  /** abstract motif keyword (varied per business via the hash) */
  glyph: string;
}

/**
 * A cohesive earth-tone family with one distinct accent per category, so the
 * overview reads as varied-but-related rather than a wall of identical tiles.
 */
const CATEGORY_ART: Record<BusinessCategory, CategoryArt> = {
  "Eten & drinken": { from: "#3A2417", to: "#6E4427", accent: "#E0A45B", ink: "#F7EFE2", glyph: "arc" },
  "Koffie, lunch & zoet": { from: "#4A3326", to: "#7A5A3C", accent: "#D9A86A", ink: "#F7EFE2", glyph: "ring" },
  "Winkels & makers": { from: "#1F3A2B", to: "#3C6048", accent: "#CBD8B6", ink: "#F4F7EE", glyph: "grid" },
  "Mode & sieraden": { from: "#2E2333", to: "#5A4364", accent: "#D8B6D0", ink: "#F6F0F4", glyph: "wave" },
  "Interieur & kunst": { from: "#1E3338", to: "#3D5C63", accent: "#A9CBD0", ink: "#EEF6F7", glyph: "frame" },
  "Beauty & verzorging": { from: "#3D2630", to: "#6E4350", accent: "#E6B8C2", ink: "#F8EFF2", glyph: "ring" },
  "Services & praktisch": { from: "#2A2E2C", to: "#4C5651", accent: "#C2CAB8", ink: "#F1F4EE", glyph: "diagonal" },
  "Slapen": { from: "#1B2236", to: "#374264", accent: "#B7C2E6", ink: "#EEF1FA", glyph: "moon" },
  "Keten / anker": { from: "#33291C", to: "#5C4A30", accent: "#CDB089", ink: "#F6F0E6", glyph: "dots" },
};

const DUTCH_STOPWORDS = new Set(["de", "het", "een", "van", "der", "den", "'t", "the", "&", "en"]);

/** 1–2 letter editorial monogram from the significant words of the name. */
export function monogram(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s'&-]/gu, " ")
    .split(/[\s-]+/)
    .filter((w) => w && !DUTCH_STOPWORDS.has(w.toLowerCase()));
  const src = words.length ? words : name.split(/\s+/).filter(Boolean);
  const first = src[0]?.[0] ?? "K";
  const second = src[1]?.[0] ?? "";
  return (first + second).toUpperCase().slice(0, 2);
}

/** Tiny deterministic string hash (FNV-1a-ish) → unsigned int. */
function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

export function categoryArt(category: BusinessCategory): CategoryArt {
  return CATEGORY_ART[category] ?? CATEGORY_ART["Winkels & makers"];
}

function motif(glyph: string, accent: string, h: number): string {
  const a = (n: number) => (((h >> n) & 0xff) / 255);
  const op = (v: number) => v.toFixed(3);
  switch (glyph) {
    case "arc":
      return `<g fill="none" stroke="${accent}" stroke-width="1.4" opacity="0.5">
        <circle cx="${60 + a(2) * 40}" cy="${70 + a(5) * 60}" r="${130 + a(3) * 60}" stroke-opacity="${op(0.18)}"/>
        <circle cx="${60 + a(2) * 40}" cy="${70 + a(5) * 60}" r="${190 + a(7) * 50}" stroke-opacity="${op(0.12)}"/>
      </g>`;
    case "ring":
      return `<g fill="none" stroke="${accent}">
        <circle cx="${230 + a(4) * 50}" cy="${110 + a(2) * 40}" r="86" stroke-width="2" stroke-opacity="0.18"/>
        <circle cx="${230 + a(4) * 50}" cy="${110 + a(2) * 40}" r="54" stroke-width="1.2" stroke-opacity="0.14"/>
      </g>`;
    case "grid": {
      let r = "";
      for (let i = 0; i < 5; i++)
        for (let j = 0; j < 6; j++)
          r += `<circle cx="${40 + i * 56}" cy="${60 + j * 56}" r="2.4" fill="${accent}" opacity="${op(0.1 + ((i + j) % 3) * 0.05)}"/>`;
      return `<g>${r}</g>`;
    }
    case "wave":
      return `<g fill="none" stroke="${accent}" opacity="0.16">
        <path d="M-10 ${250 + a(2) * 40} C 80 ${200 + a(3) * 40}, 160 ${300 + a(4) * 30}, 330 ${240}" stroke-width="2"/>
        <path d="M-10 ${300 + a(5) * 30} C 90 ${260}, 200 ${340}, 330 ${290}" stroke-width="1.4" opacity="0.7"/>
      </g>`;
    case "frame":
      return `<g fill="none" stroke="${accent}" opacity="0.2">
        <rect x="56" y="86" width="208" height="240" stroke-width="1.4"/>
        <rect x="78" y="108" width="164" height="196" stroke-width="1"/>
      </g>`;
    case "diagonal": {
      let r = "";
      for (let i = -2; i < 8; i++)
        r += `<line x1="${i * 60}" y1="0" x2="${i * 60 + 180}" y2="400" stroke="${accent}" stroke-width="14" opacity="0.05"/>`;
      return `<g>${r}</g>`;
    }
    case "moon":
      return `<g>
        <circle cx="240" cy="96" r="46" fill="${accent}" opacity="0.16"/>
        <circle cx="222" cy="88" r="42" fill="#1B2236" opacity="0.9"/>
      </g>`;
    case "dots":
    default: {
      let r = "";
      for (let i = 0; i < 7; i++)
        r += `<circle cx="${48 + (a(i) * 230)}" cy="${48 + (a(i + 3) * 300)}" r="${3 + a(i + 1) * 6}" fill="${accent}" opacity="0.1"/>`;
      return `<g>${r}</g>`;
    }
  }
}

export interface PlaceholderOpts {
  id: string;
  name: string;
  category: BusinessCategory;
  /** tiny tagline shown bottom-left, e.g. street segment. Defaults to "DE KAMP". */
  tag?: string;
}

/** Returns a self-contained SVG string (unique ids per business). */
export function placeholderSvg({ id, name, category, tag = "DE KAMP" }: PlaceholderOpts): string {
  const art = categoryArt(category);
  const h = hash(id || name);
  const uid = (h % 0xffffff).toString(16).padStart(6, "0");
  const mono = monogram(name);
  const angle = 25 + (h % 40);

  return `<svg viewBox="0 0 320 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(name)}">
  <defs>
    <linearGradient id="bg-${uid}" gradientTransform="rotate(${angle})">
      <stop offset="0" stop-color="${art.from}"/>
      <stop offset="1" stop-color="${art.to}"/>
    </linearGradient>
    <radialGradient id="gl-${uid}" cx="0.3" cy="0.25" r="0.9">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.10"/>
      <stop offset="0.6" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="320" height="400" fill="url(#bg-${uid})"/>
  ${motif(art.glyph, art.accent, h)}
  <rect width="320" height="400" fill="url(#gl-${uid})"/>
  <text x="160" y="232" text-anchor="middle" font-family="Playfair Display, Georgia, serif" font-weight="800" font-size="180" fill="${art.accent}" opacity="0.16">${mono}</text>
  <rect x="16" y="16" width="288" height="368" fill="none" stroke="${art.ink}" stroke-opacity="0.12" rx="2"/>
  <text x="28" y="372" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="12" letter-spacing="3" fill="${art.ink}" opacity="0.6">${escapeXml(tag.toUpperCase())}</text>
  <circle cx="296" cy="30" r="3" fill="${art.accent}" opacity="0.8"/>
</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c] as string));
}

/** Encoded data URI variant (for CSS background / <img src> / next/image with unoptimized). */
export function placeholderDataUri(opts: PlaceholderOpts): string {
  return `data:image/svg+xml,${encodeURIComponent(placeholderSvg(opts))}`;
}

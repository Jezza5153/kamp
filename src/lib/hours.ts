/**
 * Opening-hours utilities: "open now" status, human display, and schema.org
 * OpeningHoursSpecification. All "now" calculations are anchored to Amersfoort
 * local time (Europe/Amsterdam) so the badge is correct for any visitor.
 */

import type { DayHours, HoursPeriod, Weekday } from "@/data/businesses";

export const WEEKDAYS: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DUTCH_SHORT: Record<Weekday, string> = {
  monday: "Ma",
  tuesday: "Di",
  wednesday: "Wo",
  thursday: "Do",
  friday: "Vr",
  saturday: "Za",
  sunday: "Zo",
};

const DUTCH_LONG: Record<Weekday, string> = {
  monday: "Maandag",
  tuesday: "Dinsdag",
  wednesday: "Woensdag",
  thursday: "Donderdag",
  friday: "Vrijdag",
  saturday: "Zaterdag",
  sunday: "Zondag",
};

/** schema.org day URIs keyed by our weekday. */
const SCHEMA_DAY: Record<Weekday, string> = {
  monday: "https://schema.org/Monday",
  tuesday: "https://schema.org/Tuesday",
  wednesday: "https://schema.org/Wednesday",
  thursday: "https://schema.org/Thursday",
  friday: "https://schema.org/Friday",
  saturday: "https://schema.org/Saturday",
  sunday: "https://schema.org/Sunday",
};

export interface NowAmsterdam {
  day: Weekday;
  /** minutes since midnight */
  minutes: number;
}

/** Current weekday + minutes-since-midnight in Europe/Amsterdam. */
export function nowInAmsterdam(date: Date = new Date()): NowAmsterdam {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Amsterdam",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const wd = (parts.find((p) => p.type === "weekday")?.value ?? "Monday").toLowerCase() as Weekday;
  let hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  if (hour === 24) hour = 0; // some environments emit "24"
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  return { day: wd, minutes: hour * 60 + minute };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

function fmtTime(hhmm: string): string {
  // Dutch convention: "9:00", "17:30"
  const [h, m] = hhmm.split(":");
  return `${parseInt(h, 10)}:${m ?? "00"}`;
}

function prevDay(day: Weekday): Weekday {
  const i = WEEKDAYS.indexOf(day);
  return WEEKDAYS[(i + 6) % 7];
}

export interface OpenState {
  status: "open" | "closing_soon" | "closed" | "opens_later" | "unknown";
  /** "HH:MM" the business closes (when open) */
  until?: string;
  /** "HH:MM" the business next opens (when closed) */
  opensAt?: string;
  /** weekday the next opening falls on, if not today */
  opensDay?: Weekday;
}

/**
 * Compute open/closed state from structured hours. Handles periods that cross
 * midnight (e.g. a bar open until 02:00). Returns "unknown" when no hours data.
 */
export function getOpenState(hours: DayHours[] | undefined, now: NowAmsterdam): OpenState {
  if (!hours || hours.length === 0) return { status: "unknown" };

  const byDay = new Map<Weekday, DayHours>();
  for (const d of hours) byDay.set(d.day, d);

  // Check a period from the previous day that crosses midnight into today.
  const yesterday = byDay.get(prevDay(now.day));
  if (yesterday && !yesterday.closed) {
    for (const p of yesterday.periods) {
      const o = toMinutes(p.open);
      const c = toMinutes(p.close);
      if (c <= o) {
        // crosses midnight; now.minutes is in the early-morning tail
        if (now.minutes < c) {
          return closingInfo(p, now.minutes + 24 * 60, c + 24 * 60, p.close);
        }
      }
    }
  }

  const today = byDay.get(now.day);
  if (today && !today.closed) {
    for (const p of today.periods) {
      const o = toMinutes(p.open);
      let c = toMinutes(p.close);
      if (c <= o) c += 24 * 60; // crosses midnight
      if (now.minutes >= o && now.minutes < c) {
        return closingInfo(p, now.minutes, c, p.close);
      }
    }
  }

  // Closed now — find the next opening within the next 7 days.
  for (let i = 0; i < 7; i++) {
    const day = WEEKDAYS[(WEEKDAYS.indexOf(now.day) + i) % 7];
    const dh = byDay.get(day);
    if (!dh || dh.closed) continue;
    for (const p of dh.periods) {
      const o = toMinutes(p.open);
      if (i === 0 && o <= now.minutes) continue;
      return { status: "opens_later", opensAt: p.open, opensDay: i === 0 ? undefined : day };
    }
  }
  return { status: "closed" };
}

function closingInfo(p: HoursPeriod, nowMin: number, closeMin: number, closeStr: string): OpenState {
  const minsLeft = closeMin - nowMin;
  return { status: minsLeft <= 45 ? "closing_soon" : "open", until: closeStr };
}

/** Short Dutch label for the open badge. */
export function openLabel(state: OpenState, locale: "nl" | "en" = "nl"): string {
  const en = locale === "en";
  switch (state.status) {
    case "open":
      return state.until ? `${en ? "Open now · until" : "Nu open · tot"} ${fmtTime(state.until)}` : en ? "Open now" : "Nu open";
    case "closing_soon":
      return state.until ? `${en ? "Closing soon ·" : "Sluit binnenkort ·"} ${fmtTime(state.until)}` : en ? "Closing soon" : "Sluit binnenkort";
    case "opens_later":
      return state.opensAt ? `${en ? "Closed · opens" : "Gesloten · opent"} ${fmtTime(state.opensAt)}` : en ? "Closed" : "Gesloten";
    case "closed":
      return en ? "Closed" : "Gesloten";
    default:
      return "";
  }
}

export interface HoursLine {
  label: string;
  value: string;
  isToday: boolean;
}

/** Grouped, human-readable week schedule (one line per day, today flagged). */
export function formatWeek(hours: DayHours[] | undefined, today?: Weekday): HoursLine[] {
  if (!hours || hours.length === 0) return [];
  const byDay = new Map<Weekday, DayHours>();
  for (const d of hours) byDay.set(d.day, d);
  return WEEKDAYS.map((day) => {
    const dh = byDay.get(day);
    let value = "Gesloten";
    if (dh && !dh.closed && dh.periods.length) {
      value = dh.periods.map((p) => `${fmtTime(p.open)}–${fmtTime(p.close)}`).join(", ");
    }
    return { label: DUTCH_LONG[day], value, isToday: day === today };
  });
}

export function dayShort(day: Weekday): string {
  return DUTCH_SHORT[day];
}

/** schema.org OpeningHoursSpecification[] for JSON-LD. */
export function toOpeningHoursSpec(
  hours: DayHours[] | undefined,
): Array<Record<string, unknown>> | undefined {
  if (!hours || hours.length === 0) return undefined;
  const spec: Array<Record<string, unknown>> = [];
  for (const d of hours) {
    if (d.closed || !d.periods.length) continue;
    for (const p of d.periods) {
      spec.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: SCHEMA_DAY[d.day],
        opens: p.open,
        closes: p.close,
      });
    }
  }
  return spec.length ? spec : undefined;
}

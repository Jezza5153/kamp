"use client";

import type { DayHours } from "@/data/businesses";
import { formatWeek, type HoursLine } from "@/lib/hours";
import { useNow } from "@/lib/useNow";

export default function HoursTable({ hours, note }: { hours?: DayHours[]; note?: string }) {
  const today = useNow()?.day;

  const lines: HoursLine[] = formatWeek(hours, today);

  if (lines.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-white/70">
        {note || "Openingstijden op aanvraag — neem contact op of bekijk de website voor de actuele tijden."}
      </p>
    );
  }

  return (
    <div>
      <dl className="space-y-1">
        {lines.map((l) => (
          <div
            key={l.label}
            className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm ${
              l.isToday ? "bg-white/10 font-bold text-white" : "text-white/75"
            }`}
          >
            <dt>
              {l.label}
              {l.isToday && <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-amber">vandaag</span>}
            </dt>
            <dd className={l.value === "Gesloten" ? "text-white/40" : ""}>{l.value}</dd>
          </div>
        ))}
      </dl>
      {note && <p className="mt-3 text-xs leading-relaxed text-white/45">{note}</p>}
    </div>
  );
}

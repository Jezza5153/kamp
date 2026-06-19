"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";
import type { DayHours } from "@/data/businesses";
import { getOpenState, openLabel, type OpenState } from "@/lib/hours";
import { useNow } from "@/lib/useNow";

interface OpenBadgeProps {
  hours?: DayHours[];
  /** "pill" (default) for cards, "inline" for detail header */
  variant?: "pill" | "inline";
  /** show a neutral chip when no hours data exists */
  showUnknown?: boolean;
  className?: string;
}

const TONE: Record<OpenState["status"], string> = {
  open: "bg-emerald-500/15 text-emerald-700 ring-emerald-600/20",
  closing_soon: "bg-amber-500/15 text-amber-700 ring-amber-600/25",
  opens_later: "bg-stone/40 text-warm-brown ring-warm-brown/15",
  closed: "bg-stone/40 text-warm-brown ring-warm-brown/15",
  unknown: "bg-stone/40 text-warm-brown/70 ring-warm-brown/10",
};

/**
 * Live "open now" pill. Computed on the client (Amersfoort time) after mount to
 * avoid hydration mismatch; renders nothing until then unless showUnknown.
 */
export default function OpenBadge({ hours, variant = "pill", showUnknown = false, className = "" }: OpenBadgeProps) {
  const now = useNow();
  const state: OpenState | null = useMemo(() => (now ? getOpenState(hours, now) : null), [hours, now]);

  if (!state) {
    // SSR / pre-mount: reserve nothing (avoids layout shift) unless unknown chip wanted
    if (showUnknown) {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${TONE.unknown} ${className}`}>
          <Clock className="h-3.5 w-3.5" /> Tijden op aanvraag
        </span>
      );
    }
    return null;
  }

  if (state.status === "unknown") {
    if (!showUnknown) return null;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${TONE.unknown} ${className}`}>
        <Clock className="h-3.5 w-3.5" /> Tijden op aanvraag
      </span>
    );
  }

  const dot = state.status === "open" || state.status === "closing_soon";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${
        variant === "inline" ? "px-3 py-1.5 text-sm" : "px-3 py-1 text-xs"
      } font-bold ring-1 ${TONE[state.status]} ${className}`}
    >
      {dot ? (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      ) : (
        <Clock className="h-3.5 w-3.5" />
      )}
      {openLabel(state)}
    </span>
  );
}

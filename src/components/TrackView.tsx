"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

/** Fires a single analytics event on mount (e.g. a story view). Renders nothing. */
export default function TrackView({ type, id, detail }: { type: string; id?: string; detail?: unknown }) {
  useEffect(() => {
    track(type, id, detail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

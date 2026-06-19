"use client";

import { useSyncExternalStore } from "react";
import { nowInAmsterdam, type NowAmsterdam } from "@/lib/hours";

/**
 * Shared "now" store for Amersfoort local time.
 *
 * Time-based UI ("open nu" badges, today's row) must be computed on the client:
 * the server has no notion of the visitor's clock, and rendering a wall-clock
 * value during SSR causes hydration mismatches. `useSyncExternalStore` is the
 * React-blessed way to express this — `getServerSnapshot` returns `null` so SSR
 * and the first client render agree, then React swaps in the live value right
 * after hydration without a mismatch warning.
 *
 * A single module-level interval drives every subscriber, so any number of
 * badges/tables refresh together once a minute instead of each owning a timer.
 */
let current: NowAmsterdam | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(onChange: () => void): () => void {
  if (listeners.size === 0) {
    current = nowInAmsterdam();
    timer = setInterval(() => {
      current = nowInAmsterdam();
      for (const l of listeners) l();
    }, 60_000);
  }
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

// Returns a stable reference between ticks, as useSyncExternalStore requires.
function getSnapshot(): NowAmsterdam | null {
  return current;
}

function getServerSnapshot(): NowAmsterdam | null {
  return null;
}

/** Current Amersfoort time, or `null` until mounted on the client. */
export function useNow(): NowAmsterdam | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

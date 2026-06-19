"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

interface Review {
  author: string;
  authorUrl?: string;
  photoUrl?: string;
  rating: number;
  text: string;
  relativeTime?: string;
}
interface Data {
  rating: number | null;
  total: number | null;
  reviews: Review[];
  mapsUrl: string | null;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex" aria-label={`${rating} van 5 sterren`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= Math.round(rating) ? "fill-amber text-amber" : "text-stone/40"}`}
        />
      ))}
    </span>
  );
}

/**
 * Live Google reviews, fetched client-side from /api/reviews/[id] so the content
 * never enters the ISR cache (Places API ToS). Renders attribution + a link back
 * to Google Maps as required; emits NO AggregateRating schema (self-serving).
 * Renders nothing until/unless there are reviews to show.
 */
export default function GoogleReviews({ businessId }: { businessId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/reviews/${businessId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Data | null) => {
        if (!active) return;
        setData(d);
        setLoaded(true);
      })
      .catch(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [businessId]);

  if (!loaded || !data || data.reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-[var(--radius-lg)] border border-stone/30 bg-paper p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl font-black text-deep-green">Reviews via Google</h2>
          {data.rating != null && (
            <div className="flex items-center gap-2 text-sm text-warm-brown">
              <span className="text-lg font-black text-deep-green">{data.rating.toFixed(1)}</span>
              <Stars rating={data.rating} />
              {data.total != null && <span className="text-warm-brown/70">({data.total})</span>}
            </div>
          )}
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {data.reviews.map((r, i) => (
            <li key={i} className="rounded-2xl border border-stone/25 bg-white p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-bold text-deep-green">{r.author}</span>
                <Stars rating={r.rating} />
              </div>
              {r.text && <p className="line-clamp-5 text-sm leading-relaxed text-warm-brown/85">{r.text}</p>}
              {r.relativeTime && <p className="mt-2 text-xs text-warm-brown/50">{r.relativeTime}</p>}
            </li>
          ))}
        </ul>

        {/* Required Places API attribution + link back to Google Maps. */}
        {data.mapsUrl && (
          <p className="mt-6 text-xs text-warm-brown/60">
            <a href={data.mapsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-amber-ink hover:underline">
              Bekijk alle reviews op Google Maps
            </a>{" "}
            — reviews aangeleverd door Google.
          </p>
        )}
      </div>
    </section>
  );
}

import type { Business } from "@/data/businesses";
import BusinessCard from "./BusinessCard";

/**
 * "In de spotlights" rail. Receives the already-resolved featured subset from the
 * page (computed from getActiveBusinesses(), so approved D1 overrides + closures
 * are reflected and it stays in sync with the rest of the site). Renders nothing
 * when there is nothing to feature, so the big heading never sits above an empty
 * scroller. Accessible: a labelled, keyboard-scrollable list with scroll-snap.
 */
const FeaturedHorizontal = ({ featured }: { featured: Business[] }) => {
  const list = featured.slice(0, 8);
  if (!list.length) return null;

  return (
    <section aria-labelledby="spotlight-heading" className="overflow-hidden bg-background py-24">
      <div className="mx-auto mb-16 flex max-w-7xl items-end justify-between px-4 sm:px-6 lg:px-8">
        <div>
          <p className="mb-4 text-xs font-black uppercase italic tracking-[0.4em] text-amber-ink">Spotlight</p>
          <h2 id="spotlight-heading" className="font-serif text-4xl font-black leading-none tracking-tighter text-deep-green md:text-6xl">
            In de spotlights
          </h2>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-warm-brown/40" aria-hidden="true">
          <span className="hidden md:inline">Scroll horizontaal </span>&rarr;
        </p>
      </div>

      <ul
        className="no-scrollbar flex w-full snap-x snap-mandatory gap-8 overflow-x-auto px-4 pb-12 sm:px-6 lg:px-8"
        aria-label="Uitgelichte ondernemers op De Kamp"
        tabIndex={0}
      >
        {list.map((business) => (
          <li key={business.id} className="w-[300px] flex-shrink-0 snap-start sm:w-[420px]">
            <BusinessCard business={business} />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default FeaturedHorizontal;

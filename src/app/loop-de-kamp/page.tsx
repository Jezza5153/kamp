import { businesses } from "@/data/businesses";
import Link from "next/link";

export const metadata = {
  title: "Loop de Kamp | Wandelroute langs ondernemers in Amersfoort",
  description: "Ontdek de route langs de ondernemers op De Kamp in Amersfoort. Een wandeling vol eten, winkels en verhalen.",
};

export default function RoutePage() {
  // Walking order along the route (gate → street → singels), excluding closed.
  const sortedByAddress = businesses
    .filter((b) => b.status !== "closed")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="bg-background min-h-screen py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-deep-green mb-6">
            Loop de Kamp
          </h1>
          <p className="text-xl text-warm-brown/80 font-medium leading-relaxed">
            Ontdek de ondernemers in hartje Amersfoort. Van de Kamperbinnenpoort tot aan de Weverssingel: volg deze route en leer de gezichten van de straat kennen.
          </p>
        </div>

        <div className="relative border-l-4 border-amber/30 ml-4 md:ml-8 pl-8 md:pl-16 space-y-16 py-8">
          {/* Start marker */}
          <div className="absolute -left-[14px] top-0 w-6 h-6 rounded-full bg-amber border-4 border-white shadow-md"></div>
          
          <div className="relative">
            <h2 className="text-2xl font-serif font-bold text-deep-green mb-4">Start: Kamperbinnenpoort</h2>
            <p className="text-warm-brown/70 leading-relaxed max-w-2xl">
              Begin je ontdekkingstocht bij de historische stadspoort. Vanaf hier loopt de route diep de Amersfoortse binnenstad in.
            </p>
          </div>

          {sortedByAddress.map((business, index) => (
            <div key={business.id} className="relative group">
              {/* Timeline marker */}
              <div className="absolute -left-[42px] md:-left-[74px] top-4 w-4 h-4 rounded-full bg-white border-2 border-amber group-hover:bg-amber transition-colors shadow-sm"></div>
              
              <div className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-white rounded-3xl border border-stone/20 shadow-sm hover:shadow-md transition-all group-hover:-translate-y-1 group-hover:border-amber/30">
                <div className="flex-grow">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber block mb-1">
                    Stop #{index + 1}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-deep-green">
                    {business.name}
                  </h3>
                  <p className="text-sm text-warm-brown/60 mb-2 font-medium">{business.address}</p>
                  <p className="text-sm text-foreground/80 line-clamp-2">{business.shortDescription}</p>
                </div>
                <div>
                  <Link 
                    href={`/ondernemers/${business.id}`}
                    className="inline-flex items-center px-6 py-3 bg-stone/20 text-deep-green text-sm font-bold rounded-full hover:bg-amber hover:text-white transition-all whitespace-nowrap"
                  >
                    Bekijk details
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* End marker */}
          <div className="absolute -left-[14px] bottom-0 w-6 h-6 rounded-full bg-deep-green border-4 border-white shadow-md"></div>
        </div>

        <div className="mt-20 text-center bg-deep-green text-white p-12 rounded-3xl shadow-xl">
          <h2 className="text-3xl font-serif font-bold mb-6">Een compleet dagje uit</h2>
          <p className="text-stone/80 text-lg mb-8 max-w-2xl mx-auto">
            Combineer de beste winkels, makers en restaurants op De Kamp voor een unieke Amersfoortse ervaring.
          </p>
          <Link href="/" className="inline-flex items-center px-8 py-4 bg-amber text-charcoal font-bold rounded-full hover:bg-stone hover:text-deep-green transition-all shadow-lg">
            Terug naar het overzicht
          </Link>
        </div>
      </div>
    </div>
  );
}

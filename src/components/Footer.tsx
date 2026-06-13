import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-charcoal text-stone border-t border-stone/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-2xl font-serif font-bold text-background tracking-tight">
              De Kamp <span className="text-amber">leeft.</span>
            </Link>
            <p className="mt-4 text-stone/70 max-w-xs">
              Een initiatief om lokale ondernemers op de Kamp in Amersfoort beter zichtbaar en vindbaar te maken.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-serif font-semibold text-background mb-4">Navigatie</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-amber transition-colors">Ondernemers</Link></li>
              <li><Link href="/loop-de-kamp" className="hover:text-amber transition-colors">Route</Link></li>
              <li><Link href="/over-de-kamp" className="hover:text-amber transition-colors">Over de Kamp</Link></li>
              <li><Link href="/aanmelden" className="hover:text-amber transition-colors">Mijn zaak aanmelden</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-serif font-semibold text-background mb-4">Gebieden</h3>
            <ul className="space-y-2 text-stone/70">
              <li>Kamp</li>
              <li>Achter de Kamp</li>
              <li>Grote Sint Jansstraat</li>
              <li>Zuidsingel</li>
              <li>Weverssingel</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-stone/10 text-center text-stone/50 text-sm">
          <p>&copy; {new Date().getFullYear()} Ondernemers van de Kamp Amersfoort. Alle rechten voorbehouden.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

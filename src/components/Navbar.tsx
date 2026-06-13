import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-stone/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-serif font-bold text-deep-green tracking-tight">
              De Kamp <span className="text-amber">leeft.</span>
            </Link>
          </div>
          <div className="hidden md:ml-6 md:flex md:space-x-8">
            <Link href="/" className="text-foreground hover:text-amber font-medium transition-colors">
              Ondernemers
            </Link>
            <Link href="/loop-de-kamp" className="text-foreground hover:text-amber font-medium transition-colors">
              Route
            </Link>
            <Link href="/over-de-kamp" className="text-foreground hover:text-amber font-medium transition-colors">
              Over de Kamp
            </Link>
          </div>
          <div className="flex items-center">
            <Link href="/aanmelden" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-deep-green hover:bg-amber transition-all shadow-sm">
              Mijn zaak aanmelden
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

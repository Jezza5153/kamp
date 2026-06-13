import Link from "next/link";

const Hero = () => {
  return (
    <div className="relative bg-background overflow-hidden py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-deep-green tracking-tight transition-all duration-700 ease-out animate-in fade-in slide-in-from-bottom-4">
            De Kamp <span className="italic text-amber underline decoration-amber/30 underline-offset-8">leeft.</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-warm-brown/80 font-medium leading-relaxed">
            Een historische straat vol eten, makers, winkels, verhalen en lokale ondernemers in hartje Amersfoort.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="#ondernemers"
              className="inline-flex items-center px-8 py-4 border border-transparent text-base font-semibold rounded-full text-white bg-deep-green hover:bg-deep-green/90 transition-all shadow-lg hover:scale-105"
            >
              Ontdek de ondernemers
            </Link>
            <Link
              href="/loop-de-kamp"
              className="inline-flex items-center px-8 py-4 border-2 border-deep-green text-base font-semibold rounded-full text-deep-green hover:bg-deep-green hover:text-white transition-all shadow-sm"
            >
              Loop de Kamp
            </Link>
          </div>
        </div>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-deep-green rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default Hero;

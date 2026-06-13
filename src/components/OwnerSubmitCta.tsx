import Link from "next/link";

const OwnerSubmitCta = () => {
  return (
    <section className="bg-deep-green py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-amber rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">
              Ben jij ondernemer op De Kamp?
            </h2>
            <p className="text-white/90 text-xl mb-10 leading-relaxed font-medium">
              Staat jouw zaak er nog niet goed tussen? Stuur je logo, foto en verhaal door. Dan maken we samen de gids completer, persoonlijker en beter vindbaar.
            </p>
            <Link
              href="/aanmelden"
              className="inline-flex items-center px-8 py-4 bg-white text-deep-green font-bold rounded-full hover:bg-stone transition-all transform hover:scale-105 shadow-lg"
            >
              Mijn zaak aanmelden
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
          
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-deep-green/10 rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default OwnerSubmitCta;

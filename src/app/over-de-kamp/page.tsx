export const metadata = {
  title: "Over De Kamp in Amersfoort | Historie & Ondernemerschap",
  description: "Leer meer over de geschiedenis en de unieke karakter van De Kamp in Amersfoort. De plek waar historie en lokale makers samenkomen.",
};

export default function AboutPage() {
  return (
    <div className="bg-background min-h-screen py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-deep-green mb-6">
            Over De Kamp
          </h1>
          <p className="text-xl text-warm-brown/80 font-medium leading-relaxed italic">
            &quot;Waar de historie van Amersfoort de ondernemerslust van vandaag ontmoet.&quot;
          </p>
        </div>

        <div className="space-y-12 prose prose-lg prose-stone max-w-none text-warm-brown/90 leading-relaxed">
          <section>
            <h2 className="text-3xl font-serif font-bold text-deep-green border-b-2 border-amber/20 pb-4 inline-block mb-8">Een straat met een verhaal</h2>
            <p>
              De Kamp is een van de meest karakteristieke straten van de Amersfoortse binnenstad. Met de iconische Kamperbinnenpoort als startpunt, ademt de straat een sfeer uit die je nergens anders vindt. Ooit een belangrijke toegangsweg voor handelaren en reizigers, is het vandaag de dag het kloppend hart voor onafhankelijke winkeliers, ambachtelijke makers en culinaire pioniers.
            </p>
          </section>

          <section className="bg-stone/20 p-8 md:p-12 rounded-3xl border border-stone/30 transform -rotate-1 shadow-sm">
            <h2 className="text-3xl font-serif font-bold text-deep-green mb-6">Waarom deze website?</h2>
            <p>
              In een wereld die steeds sneller digitaliseert, dreigt de menselijke maat soms verloren te gaan. De Kamp bewijst het tegendeel. Achter elke deur op De Kamp zit een ondernemer met een passie, een vakmanschap en een verhaal. Deze website is er om die verhalen een podium te geven.
            </p>
            <p>
              Ons doel is simpel: De Kamp beter vindbaar maken voor iedereen die op zoek is naar datgene wat een stad echt bijzonder maakt. Of je nu een inwoner van Amersfoort bent of een bezoeker: we willen je helpen om de ondernemers, de makers en de smaakmakers van deze bijzondere straat te ontdekken.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-serif font-bold text-deep-green border-b-2 border-amber/20 pb-4 inline-block mb-8">Kamperbinnenpoort & Meer</h2>
            <p>
              Hoewel de naam De Kamp centraal staat, reikt de sfeer van dit gebied verder. De Grote Sint Jansstraat, de Zuidsingel, de Weverssingel en Achter de Kamp horen onlosmakelijk bij deze route. Samen vormen zij een uniek winkel- en horecagebied dat de historische kern van Amersfoort zijn karakter geeft.
            </p>
          </section>

          <section className="text-center py-12">
            <h2 className="text-2xl font-serif font-bold text-deep-green mb-6 italic">Tot ziens op De Kamp!</h2>
            <div className="w-16 h-1 bg-amber mx-auto rounded-full"></div>
          </section>
        </div>
        
        <div className="mt-16 text-xs text-stone/50 border-t border-stone/20 pt-8">
          <p>Disclaimer: De informatie op deze website is verzameld uit publieke bronnen en via directe opgave van ondernemers. Ondanks onze zorgvuldigheid kan het zijn dat informatie verouderd is. Mis je iets of klopt er iets niet? Laat het ons weten.</p>
        </div>
      </div>
    </div>
  );
}

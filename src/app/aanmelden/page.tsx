export const metadata = {
  title: "Aanmelden | Word onderdeel van Ondernemers van de Kamp",
  description: "Ben jij een ondernemer op De Kamp in Amersfoort? Meld je zaak aan, stuur je foto's en verhaal door en word beter vindbaar.",
};

export default function RegisterPage() {
  return (
    <div className="bg-background min-h-screen py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-deep-green mb-6">
            Meld je zaak aan
          </h1>
          <p className="text-xl text-warm-brown/80 font-medium leading-relaxed max-w-2xl mx-auto">
            Help ons de gids van De Kamp completer en persoonlijker te maken. Deel je verhaal, je foto&apos;s en je passie.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-stone/20">
          <form className="space-y-8" action="#" method="POST">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label htmlFor="business-name" className="text-sm font-bold text-deep-green uppercase tracking-wider">Naam van de zaak</label>
                <input 
                  type="text" 
                  id="business-name" 
                  name="business-name" 
                  required 
                  placeholder="Bijv. De Kamp Guide"
                  className="w-full px-6 py-4 rounded-2xl border border-stone/30 focus:ring-2 focus:ring-amber focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="contact-person" className="text-sm font-bold text-deep-green uppercase tracking-wider">Contactpersoon</label>
                <input 
                  type="text" 
                  id="contact-person" 
                  name="contact-person" 
                  required 
                  placeholder="Jouw naam"
                  className="w-full px-6 py-4 rounded-2xl border border-stone/30 focus:ring-2 focus:ring-amber focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-bold text-deep-green uppercase tracking-wider">E-mailadres</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  required 
                  placeholder="naam@uwdomein.nl"
                  className="w-full px-6 py-4 rounded-2xl border border-stone/30 focus:ring-2 focus:ring-amber focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-bold text-deep-green uppercase tracking-wider">Telefoonnummer</label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone" 
                  placeholder="033 - ..."
                  className="w-full px-6 py-4 rounded-2xl border border-stone/30 focus:ring-2 focus:ring-amber focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-bold text-deep-green uppercase tracking-wider">Adres op De Kamp</label>
              <input 
                type="text" 
                id="address" 
                name="address" 
                required 
                placeholder="Kamp ..."
                className="w-full px-6 py-4 rounded-2xl border border-stone/30 focus:ring-2 focus:ring-amber focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="story" className="text-sm font-bold text-deep-green uppercase tracking-wider">Het verhaal achter de zaak (of korte omschrijving)</label>
              <textarea 
                id="story" 
                name="story" 
                rows={6} 
                placeholder="Vertel ons wat jouw zaak uniek maakt, wie de gezichten zijn en wat klanten kunnen verwachten."
                className="w-full px-6 py-4 rounded-2xl border border-stone/30 focus:ring-2 focus:ring-amber focus:outline-none transition-all resize-none"
              ></textarea>
            </div>

            <div className="p-8 bg-stone/20 rounded-2xl border border-dashed border-stone/40">
              <h3 className="text-lg font-serif font-bold text-deep-green mb-4">Beelden & Media</h3>
              <p className="text-sm text-warm-brown/70 mb-6 font-medium">
                Voorlopig gebruiken we tijdelijke afbeeldingen. Stuur je eigen logo, gevel- en eigenaarsfoto&apos;s direct naar <strong>info@ondernemersvandekamp.nl</strong> of deel je Instagram handle zodat we contact kunnen opnemen.
              </p>
              <div className="space-y-2">
                <label htmlFor="instagram" className="text-sm font-bold text-deep-green uppercase tracking-wider">Instagram Handle</label>
                <input 
                  type="text" 
                  id="instagram" 
                  name="instagram" 
                  placeholder="@jouwzaak"
                  className="w-full px-6 py-4 rounded-2xl border border-stone/30 focus:ring-2 focus:ring-amber focus:outline-none bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex items-start gap-4">
              <input 
                type="checkbox" 
                id="permission" 
                name="permission" 
                required 
                className="mt-1 h-5 w-5 rounded border-stone/30 text-amber focus:ring-amber transition-all cursor-pointer"
              />
              <label htmlFor="permission" className="text-sm text-warm-brown/70 font-medium leading-relaxed">
                Ik geef toestemming om deze gegevens en aangeleverde beelden te gebruiken op Ondernemers van de Kamp. We nemen voor publicatie altijd even contact op voor de laatste check.
              </label>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                className="w-full sm:w-auto px-12 py-4 bg-deep-green text-white font-bold rounded-full hover:bg-amber transition-all shadow-lg transform hover:scale-[1.02] text-lg"
              >
                Meld mijn zaak aan
              </button>
            </div>
          </form>
        </div>

        <div className="mt-12 text-center text-stone/50 text-sm">
          <p>Deze gids is een initiatief voor en door ondernemers. Heb je andere vragen? Neem contact met ons op via info@ondernemersvandekamp.nl</p>
        </div>
      </div>
    </div>
  );
}

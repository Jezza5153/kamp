import { Send, Camera } from "lucide-react";
import { submitLeadAction } from "@/app/aanmelden/actions";
import SubmitButton from "@/components/SubmitButton";

const field =
  "w-full rounded-2xl border border-stone/40 bg-white px-6 py-4 text-base shadow-sm outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/30";
const label = "text-sm font-bold uppercase tracking-wider text-deep-green";

export default function AanmeldenForm({ error }: { error?: string }) {
  return (
    <form
      action={submitLeadAction}
      className="space-y-8 rounded-[var(--radius-lg)] border border-stone/30 bg-paper p-8 shadow-[var(--shadow-card)] sm:p-12"
    >
      {/* Honeypot — hidden from real users; bots that fill it are silently dropped. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {error === "consent" && (
        <p className="rounded-2xl bg-clay/15 px-4 py-3 text-sm font-medium text-clay">
          Vink even de toestemming aan zodat we je aanmelding mogen verwerken.
        </p>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="business" className={label}>Naam van de zaak</label>
          <input id="business" name="business" required placeholder="Bijv. Toko Tjin" className={field} />
        </div>
        <div className="space-y-2">
          <label htmlFor="contact" className={label}>Contactpersoon</label>
          <input id="contact" name="contact" required placeholder="Jouw naam" className={field} />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className={label}>E-mailadres</label>
          <input id="email" name="email" type="email" required placeholder="naam@uwdomein.nl" className={field} />
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className={label}>Telefoonnummer</label>
          <input id="phone" name="phone" type="tel" placeholder="033 - ..." className={field} />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="address" className={label}>Adres op De Kamp</label>
        <input id="address" name="address" required placeholder="Kamp ..." className={field} />
      </div>

      <div className="space-y-2">
        <label htmlFor="story" className={label}>Het verhaal achter de zaak</label>
        <textarea id="story" name="story" rows={6} placeholder="Vertel ons wat jouw zaak uniek maakt, wie de gezichten zijn en wat klanten kunnen verwachten." className={`${field} resize-none`} />
      </div>

      <div className="rounded-2xl border border-dashed border-stone/50 bg-stone/15 p-8">
        <h3 className="mb-3 flex items-center gap-2 font-serif text-lg font-black text-deep-green">
          <Camera className="h-5 w-5 text-amber-ink" /> Beelden & media
        </h3>
        <p className="mb-6 text-sm font-medium leading-relaxed text-warm-brown/75">
          We tonen voorlopig een stijlvolle tijdelijke afbeelding. Na je aanmelding nemen we contact op om je logo,
          gevel- en eigenaarsfoto&apos;s veilig te ontvangen. Foto&apos;s plaatsen we pas na jouw akkoord.
        </p>
        <div className="space-y-2">
          <label htmlFor="instagram" className={label}>Instagram</label>
          <input id="instagram" name="instagram" placeholder="@jouwzaak" className={`${field} bg-white`} />
        </div>
      </div>

      <div className="flex items-start gap-4">
        <input id="permission" name="permission" type="checkbox" required className="mt-1 h-5 w-5 cursor-pointer rounded border-stone/40 text-amber focus:ring-amber" />
        <label htmlFor="permission" className="text-sm font-medium leading-relaxed text-warm-brown/75">
          Ik geef toestemming om deze gegevens en aangeleverde beelden te gebruiken op Ondernemers van de Kamp. Voor
          publicatie nemen we altijd even contact op voor de laatste check.
        </label>
      </div>

      <div className="pt-2">
        <SubmitButton
          pendingLabel="Bezig met versturen…"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-deep-green px-12 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-amber hover:text-charcoal active:scale-[0.99] disabled:opacity-70 sm:w-auto"
        >
          <Send className="h-4 w-4" /> Meld mijn zaak aan
        </SubmitButton>
      </div>
    </form>
  );
}

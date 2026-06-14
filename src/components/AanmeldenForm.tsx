"use client";

import { useState } from "react";
import { Send, Camera, CheckCircle2 } from "lucide-react";
import { SITE } from "@/lib/site";

const field =
  "w-full rounded-2xl border border-stone/40 bg-white px-6 py-4 text-base shadow-sm outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/30";
const label = "text-sm font-bold uppercase tracking-wider text-deep-green";

export default function AanmeldenForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const lines = [
      `Naam van de zaak: ${get("business")}`,
      `Contactpersoon: ${get("contact")}`,
      `E-mail: ${get("email")}`,
      `Telefoon: ${get("phone")}`,
      `Adres op De Kamp: ${get("address")}`,
      `Instagram: ${get("instagram")}`,
      "",
      "Verhaal / omschrijving:",
      get("story"),
      "",
      "(Vergeet niet je logo, gevel- en eigenaarsfoto's als bijlage mee te sturen.)",
    ].join("\n");
    const subject = `Aanmelding ondernemer: ${get("business") || "De Kamp"}`;
    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines)}`;
    setSent(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-[var(--radius-lg)] border border-stone/30 bg-paper p-8 shadow-[var(--shadow-card)] sm:p-12">
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
          We tonen voorlopig een stijlvolle tijdelijke afbeelding. Stuur je eigen logo, gevel- en eigenaarsfoto&apos;s mee
          als bijlage in de e-mail, of deel je Instagram zodat we contact kunnen opnemen. Foto&apos;s plaatsen we pas na
          jouw akkoord.
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
        <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-deep-green px-12 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-amber hover:text-charcoal active:scale-[0.99] sm:w-auto">
          <Send className="h-4 w-4" /> Meld mijn zaak aan
        </button>
        {sent && (
          <p className="mt-4 flex items-center gap-2 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Je e-mailprogramma opent met je aanmelding — controleer en verstuur de mail (vergeet de foto&apos;s niet).
          </p>
        )}
      </div>
    </form>
  );
}

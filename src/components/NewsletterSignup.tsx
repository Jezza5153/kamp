"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

type State = "idle" | "sending" | "sent" | "error";

export default function NewsletterSignup({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [state, setState] = useState<State>("idle");
  const muted = variant === "dark" ? "text-stone/50" : "text-warm-brown/60";
  const sent = variant === "dark" ? "text-stone/80" : "text-warm-brown/80";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setState("sending");
    try {
      const res = await fetch("/api/newsletter/subscribe", { method: "POST", body: new FormData(form) });
      const data = (await res.json().catch(() => ({ ok: false }))) as { ok?: boolean };
      if (res.ok && data.ok) {
        form.reset();
        setState("sent");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p role="status" aria-live="polite" className={`flex items-start gap-2 text-sm ${sent}`}>
        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber" />
        Check je mailbox en bevestig je inschrijving via de link.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {/* Honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <div className="flex gap-2">
        <label htmlFor="nl-email" className="sr-only">
          E-mailadres
        </label>
        <input
          id="nl-email"
          type="email"
          name="email"
          required
          placeholder="jouw@email.nl"
          className="min-w-0 flex-1 rounded-full border border-stone/40 bg-white px-4 py-3 text-sm text-foreground outline-none placeholder:text-warm-brown/40 focus:border-amber"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="inline-flex items-center gap-2 rounded-full bg-amber px-5 py-3 text-xs font-black uppercase tracking-widest text-charcoal transition hover:bg-gold disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      {state === "error" && <p role="alert" className="text-xs text-clay">Er ging iets mis — probeer het opnieuw.</p>}
      <p className={`text-xs ${muted}`}>Dubbele opt-in. Je kunt je altijd weer uitschrijven.</p>
    </form>
  );
}

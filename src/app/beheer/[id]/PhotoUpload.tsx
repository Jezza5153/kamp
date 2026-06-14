"use client";

import { useState } from "react";

/**
 * Owner photo uploader. Shows the current/pending hero photo and a file input
 * with a local preview. The upload posts a bound Server Action (multipart);
 * all validation is authoritative on the server (src/lib/media.ts).
 */
export default function PhotoUpload({
  action,
  currentUrl,
  status,
}: {
  action: (formData: FormData) => void;
  currentUrl?: string | null;
  status?: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const shown = preview ?? currentUrl ?? null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-stone">
          {shown ? (
            // plain img: pending bytes need the owner's cookie; next/image would fetch cookieless
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="Huidige foto" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-warm-brown">
              Geen foto
            </div>
          )}
        </div>
        <p className="text-xs text-warm-brown">
          {status === "pending"
            ? "Je geüploade foto wacht op goedkeuring."
            : status === "approved"
              ? "Deze foto staat live."
              : "Nog geen eigen foto — upload er een."}
        </p>
      </div>

      <form action={action} className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          required
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
          className="text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-deep-green file:px-4 file:py-2 file:font-medium file:text-background"
        />
        <button
          type="submit"
          className="rounded-xl bg-deep-green px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
        >
          Foto uploaden
        </button>
      </form>
      <p className="text-xs text-warm-brown">
        JPG, PNG, WebP of AVIF · max 5 MB · verschijnt na goedkeuring door de redactie.
      </p>
    </div>
  );
}

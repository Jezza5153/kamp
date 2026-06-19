"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button that disables itself + shows a busy label while the enclosing
 * server-action form is pending (React 19 / Next 16 useFormStatus). Prevents
 * double-submits and gives the user feedback during the round trip.
 */
export default function SubmitButton({
  children,
  className,
  pendingLabel = "Bezig…",
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}

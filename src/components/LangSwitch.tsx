"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasEnVersion } from "@/lib/dict";

/**
 * NL ⇄ EN switcher. EN versions exist for the home and business-detail pages;
 * for other routes (no EN yet) it points at the EN home, never a 404.
 */
export default function LangSwitch() {
  const pathname = usePathname() || "/";
  const isEn = pathname === "/en" || pathname.startsWith("/en/");

  let target: string;
  if (isEn) {
    target = pathname === "/en" ? "/" : pathname.replace(/^\/en/, "") || "/";
  } else if (pathname === "/") {
    target = "/en";
  } else if (hasEnVersion(pathname)) {
    target = `/en${pathname}`;
  } else {
    target = "/en";
  }

  return (
    <Link
      href={target}
      hrefLang={isEn ? "nl" : "en"}
      aria-label={isEn ? "Schakel naar Nederlands" : "Switch to English"}
      className="rounded-full border border-deep-green/30 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-deep-green/70 transition hover:border-amber hover:text-amber-ink"
    >
      {isEn ? "NL" : "EN"}
    </Link>
  );
}

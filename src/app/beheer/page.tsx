import Link from "next/link";
import { ownedBusinessIds, requireUser } from "@/lib/auth";
import { allBusinessesSeed } from "@/lib/businessData";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mijn vermeldingen", robots: { index: false } };

export default async function BeheerPage() {
  const user = await requireUser();
  const ids =
    user.role === "admin"
      ? allBusinessesSeed.map((b) => b.id)
      : await ownedBusinessIds(user.id);
  const mine = allBusinessesSeed
    .filter((b) => ids.includes(b.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-deep-green">Mijn vermeldingen</h1>
          <p className="mt-1 text-sm text-warm-brown">
            Ingelogd als {user.email}
            {user.role === "admin" ? " · beheerder" : ""}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          {user.role === "admin" ? (
            <Link href="/admin" className="font-medium text-amber-ink underline">
              Moderatie
            </Link>
          ) : null}
          <a href="/logout" className="text-warm-brown underline">
            Uitloggen
          </a>
        </div>
      </div>

      {mine.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-paper p-6 text-sm text-warm-brown shadow-[var(--shadow-card)]">
          Je login is nog niet aan een zaak gekoppeld.{" "}
          <a className="font-medium text-amber-ink underline" href="mailto:info@ondernemersvandekamp.nl">
            Mail ons je zaaknaam
          </a>{" "}
          en we zetten het klaar.
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {mine.map((b) => (
            <li key={b.id}>
              <Link
                href={`/beheer/${b.id}`}
                className="flex items-center justify-between rounded-2xl bg-paper px-5 py-4 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-float)]"
              >
                <span>
                  <span className="block font-medium text-deep-green">{b.name}</span>
                  <span className="block text-xs text-warm-brown">{b.address}</span>
                </span>
                <span className="text-sm text-amber-ink">Bewerken →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

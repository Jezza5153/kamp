export type EventCategory = "Markt" | "Koopzondag" | "Festival" | "Cultuur" | "Seizoen" | "De Kamp";

export interface KampEvent {
  id: string;
  title: string;
  category: EventCategory;
  /** Recurrence pattern in Dutch, e.g. "Elke vrijdag en zaterdag". Empty for one-offs. */
  recurring?: string;
  /** Short Dutch when-description for display. */
  whenText: string;
  /** ISO date for a concrete one-off occurrence (drives Event JSON-LD). */
  startDate?: string;
  endDate?: string;
  where: string;
  description: string;
  url?: string;
}

/**
 * Curated agenda of real, verifiable happenings for the De Kamp / binnenstad
 * Amersfoort area. Recurring evergreen items are preferred over uncertain dates;
 * sources are tracked per entry. Ondernemers can submit events via /aanmelden.
 */
export const events: KampEvent[] = [
  {
    id: "warenmarkt-hof",
    title: "Warenmarkt op de Hof",
    category: "Markt",
    recurring: "Elke vrijdag en zaterdag",
    whenText: "Vrijdag 8.00–13.00, zaterdag 9.00–17.00 uur",
    where: "De Hof, binnenstad Amersfoort",
    description:
      "De wekelijkse warenmarkt op de Hof met verse producten, kleding en streekwaren, op een paar minuten lopen van De Kamp. Op zaterdag staan de waren- en bloemenmarkt samen op de Hof.",
    url: "https://www.amersfoort.nl/markten",
  },
  {
    id: "bloemenmarkt-lvk",
    title: "Bloemenmarkt op het Lieve Vrouwekerkhof",
    category: "Markt",
    recurring: "Elke vrijdag",
    whenText: "Vrijdag 8.00–13.00 uur",
    where: "Lieve Vrouwekerkhof, binnenstad Amersfoort",
    description:
      "Elke vrijdag kleurt het Lieve Vrouwekerkhof bij de Onze Lieve Vrouwetoren met een sfeervolle bloemenmarkt. Op zaterdag verhuist de bloemenmarkt naar de Hof.",
    url: "https://www.amersfoort.nl/markten",
  },
  {
    id: "koopzondag",
    title: "Koopzondag in de binnenstad",
    category: "Koopzondag",
    recurring: "Elke zondag",
    whenText: "Winkels meestal open 12.00–17.00 uur",
    where: "Binnenstad Amersfoort, waaronder De Kamp",
    description:
      "In Amersfoort is het in principe iedere zondag koopzondag; winkeliers in de binnenstad mogen elke zondag open, meestal van 12.00 tot 17.00 uur. Controleer altijd de openingstijden van de zaak zelf.",
    url: "https://www.stadindex.nl/koopzondag/amersfoort",
  },
  {
    id: "musica-mundo-2026",
    title: "Musica Mundo",
    category: "Festival",
    recurring: "Jaarlijks in juni",
    whenText: "25 t/m 28 juni 2026",
    startDate: "2026-06-25",
    endDate: "2026-06-28",
    where: "Binnenstad Amersfoort",
    description:
      "Een bruisend zomerfestival met wereldmuziek, een optocht door de stad, openluchtbioscoop en optredens op verschillende plekken in de binnenstad.",
    url: "https://www.vvvamersfoort.nl/nl/festivals-en-events-2026",
  },
  {
    id: "dias-latinos-2026",
    title: "Dias Latinos",
    category: "Festival",
    recurring: "Jaarlijks begin juli",
    whenText: "2 t/m 5 juli 2026",
    startDate: "2026-07-02",
    endDate: "2026-07-05",
    where: "Historische binnenstad Amersfoort",
    description:
      "Het grootste gratis Latijns-Amerikaanse en Caribische festival van Nederland tovert met meerdere podia, een mercado en foodstands de hele middeleeuwse binnenstad om. Trekt jaarlijks zo'n 100.000 bezoekers.",
    url: "https://www.diaslatinos.nl/",
  },
  {
    id: "stadsfestival-2026",
    title: "Stadsfestival Amersfoort",
    category: "Festival",
    recurring: "Jaarlijks eind augustus",
    whenText: "28 en 29 augustus 2026",
    startDate: "2026-08-28",
    endDate: "2026-08-29",
    where: "Binnenstad Amersfoort",
    description: "Twee dagen muziek met meerdere podia, foodtrucks en een feestelijke sfeer door de hele stad.",
    url: "https://www.tijdvooramersfoort.nl/nl/evenementen/festivals/stadsfestival",
  },
  {
    id: "intocht-sinterklaas",
    title: "Intocht van Sinterklaas",
    category: "Seizoen",
    recurring: "Jaarlijks in november",
    whenText: "Een zaterdag medio november",
    where: "Eemhaven en binnenstad, eindigend bij de SPAR op De Kamp",
    description:
      "Sinterklaas arriveert per stoomboot in de Eemhaven en rijdt door de binnenstad, met als eindpunt een Meet & Greet bij de SPAR op De Kamp — een vertrouwd hoogtepunt voor gezinnen.",
    url: "https://sinterklaasstad.nl/programma/",
  },
  {
    id: "kerstsfeer-binnenstad",
    title: "Kerstsfeer en kerstmarkten",
    category: "Seizoen",
    recurring: "Jaarlijks in december",
    whenText: "December, rond de feestdagen",
    where: "Binnenstad Amersfoort en omgeving",
    description:
      "In december is de monumentale binnenstad sfeervol versierd, met kerstmarkten en winteractiviteiten met glühwein en streeklekkernijen. Combineer met de wekelijkse koopzondag voor je kerstinkopen.",
    url: "https://www.tijdvooramersfoort.nl/nl/feestdagen/kerstmarkten-in-amersfoort-v1",
  },
];


export type BusinessCategory =
  | "Eten & drinken"
  | "Koffie, lunch & zoet"
  | "Winkels & makers"
  | "Mode & sieraden"
  | "Interieur & kunst"
  | "Beauty & verzorging"
  | "Services & praktisch"
  | "Slapen"
  | "Keten / anker";

export type VerificationStatus =
  | "verified_public_source"
  | "needs_owner_verification"
  | "verify_active"
  | "owner_approved";

export type PermissionStatus =
  | "placeholder_only"
  | "public_business_info"
  | "owner_photo_needed"
  | "owner_approved";

/** Operational status used for the "open now" / closed badges. */
export type BusinessStatus = "open" | "seasonal" | "temporarily_closed" | "closed" | "unknown";

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface HoursPeriod {
  /** 24h "HH:MM" */
  open: string;
  /** 24h "HH:MM" */
  close: string;
}

export interface DayHours {
  day: Weekday;
  /** true when the business is closed all day */
  closed?: boolean;
  periods: HoursPeriod[];
}

export interface KeyFact {
  label: string;
  value: string;
}

/**
 * schema.org subtype used in JSON-LD (LocalBusiness specialisations improve
 * rich-result eligibility). Defaults to "LocalBusiness".
 */
export type SchemaType =
  | "LocalBusiness"
  | "Restaurant"
  | "CafeOrCoffeeShop"
  | "Store"
  | "ClothingStore"
  | "JewelryStore"
  | "FurnitureStore"
  | "HomeGoodsStore"
  | "Florist"
  | "HairSalon"
  | "BeautySalon"
  | "Hotel"
  | "RealEstateAgent"
  | "WineStore"
  | "ArtGallery"
  | "EntertainmentBusiness";

/** 7-group taxonomy used by the De Kamp guide directory. */
export type CategoryGroup =
  | "eten-drinken"
  | "winkels"
  | "speciaalzaken"
  | "diensten"
  | "beauty-wellness"
  | "cultuur-vrije-tijd"
  | "overig";

export interface Business {
  id: string;
  name: string;
  category: BusinessCategory;
  subcategory: string;
  address: string;
  postalCode?: string;
  city: "Amersfoort";
  streetSegment: "Kamp" | "Achter de Kamp" | "Grote Sint Jansstraat" | "Zuidsingel" | "Weverssingel";
  publicPersonName: string | null;
  publicPersonRole: string | null;
  shortDescription: string;
  longDescription: string;
  tags: string[];
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  phone?: string;
  email?: string;
  sourceUrls: string[];
  verificationStatus: VerificationStatus;
  permissionStatus: PermissionStatus;
  imageStatus: "placeholder" | "shopfront_needed" | "owner_photo_needed" | "approved";
  imageUrl?: string;
  featured?: boolean;
  sortOrder: number;
  notes?: string;

  // ---- Enriched fields (optional; populated from public-source research) ----
  /** WGS84 latitude. When absent, coordinates are interpolated from the address. */
  lat?: number;
  /** WGS84 longitude. */
  lng?: number;
  geoConfidence?: "high" | "medium" | "low";
  /** Operational status; drives the open/closed badges. */
  status?: BusinessStatus;
  /** Structured opening hours — machine-readable, drives "open now" + schema. */
  hours?: DayHours[];
  /** Free-text note about hours (e.g. "Alleen op afspraak"). */
  hoursNote?: string;
  /** "€" | "€€" | "€€€" | "€€€€" or a concrete range like "€10–20". */
  priceRange?: string;
  /** Short, scannable highlights (e.g. "Vegan", "Terras", "Sinds 1973"). */
  specialties?: string[];
  /** Label/value facts shown on the detail page. */
  keyFacts?: KeyFact[];
  /** "Good for" tags (e.g. "Kindvriendelijk", "Pinnen", "Glutenvrij"). */
  goodFor?: string[];
  /** For restaurants: cuisine, used by schema servesCuisine. */
  servesCuisine?: string;
  acceptsReservations?: boolean;
  menuUrl?: string;
  /** Deep link to the Google Maps listing (when it exists). */
  googleMapsUrl?: string;
  /** True if the business has public Google reviews (we link out; we never fabricate ratings). */
  hasGoogleReviews?: boolean;
  /** schema.org subtype for richer JSON-LD. */
  schemaType?: SchemaType;
  /** Owner-supplied or public-source gallery images (relative or absolute). */
  gallery?: string[];
  /** Candidate cover image found in public sources (e.g. the shop's own og:image).
   *  NOT auto-published — surfaced in the owner onboarding flow for confirmation. */
  imageCandidateUrl?: string;
  imageCandidateSource?: string;
  /** How to fit the image: "cover" for photos, "contain" for logos/marks. */
  imageFit?: "cover" | "contain";
  /** ISO date of the last data review, for freshness signals. */
  updatedAt?: string;

  // ---- De Kamp guide schema (richer model; optional, populated by research) ----
  /** 7-group taxonomy for the directory (eten-drinken, winkels, …). */
  categoryGroup?: CategoryGroup;
  /** URL slug (defaults to id). */
  slug?: string;
  /** Display name if it differs from the legal/listing name. */
  displayName?: string;
  socials?: { instagram?: string; facebook?: string; tiktok?: string; linkedin?: string };
  bookingUrl?: string;
  orderUrl?: string;
  /** "Perfect voor …" use-case tags (e.g. "Lunch met vrienden", "Cadeau zoeken"). */
  perfectFor?: string[];
  priceLevel?: "budget" | "mid" | "premium" | "unknown";
  /** Dieet-tags (vegan, vegetarisch, glutenvrij, halal …). */
  dietaryTags?: string[];
  accessibilityNotes?: string;
  paymentNotes?: string;
  ownerOrStoryNotes?: string;
  /** Short scannable highlight bullets for the detail page. */
  highlights?: string[];
  /** Inclusion classification against the De Kamp boundary. */
  inclusionStatus?: "confirmed_core" | "confirmed_edge" | "needs_confirmation";
  inclusionReason?: string;
  /** Fields still missing/unverified, surfaced for maintenance. */
  missingFields?: string[];
  /** ISO date this record was last researched/checked. */
  lastChecked?: string;
}

export const businesses: Business[] = [
  {
    "id": "atelier-misura-sartoria",
    "name": "Atelier Misura Sartoria",
    "category": "Mode & sieraden",
    "subcategory": "Maatpakken en maatkleding",
    "address": "Kamp 1",
    "postalCode": "3811 AM",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": "Jimmy Karaaslan",
    "publicPersonRole": "eigenaar, publiek genoemd in blog",
    "shortDescription": "Atelier voor maatpakken, trouwpakken en maatshirts tegenover de Kamperbinnenpoort. Persoonlijk styling­advies en Italiaans vakmanschap sinds 2012.",
    "longDescription": "Atelier Misura Sartoria maakt aan de Kamp 1, recht tegenover de Kamperbinnenpoort, sinds 2012 maatpakken, trouwpakken, maatshirts en bedrijfskleding voor man én vrouw. Oprichter Jimmy Karaaslan zet een familietraditie in vakmanschap voort: je kiest samen met het team uit fijne stoffen en krijgt een pak met een perfecte pasvorm dat bij je persoonlijkheid past. Langskomen kan op afspraak via afspraak.misurasartoria.nl; donderdag is er koopavond tot 21.00 uur.",
    "tags": [
      "maatpak",
      "trouwpak",
      "mode",
      "ambacht",
      "Kamp Amersfoort",
      "Maatpakken",
      "Trouwpakken",
      "Maatshirts"
    ],
    "websiteUrl": "https://www.misurasartoria.nl",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/109654734/atelier-misura-sartoria-amersfoort",
      "https://www.misurasartoria.nl",
      "https://www.misurasartoria.nl/atelier-amersfoort/",
      "https://www.misurasartoria.nl/over-ons/",
      "https://afspraak.misurasartoria.nl",
      "https://wanderlog.com/place/details/13546397/misura-sartoria-suits-m--f"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09121_375202506.jpg",
    "featured": false,
    "sortOrder": 1,
    "status": "open",
    "lat": 52.157183,
    "lng": 5.393263,
    "geoConfidence": "high",
    "priceRange": "Maatpakken vanaf ca. €499 (Business Suit)",
    "specialties": [
      "Maatpakken",
      "Trouwpakken",
      "Maatshirts",
      "Bedrijfskleding op maat",
      "Damesmaatkleding (Donna)"
    ],
    "keyFacts": [
      {
        "label": "Sinds",
        "value": "2012"
      },
      {
        "label": "Type",
        "value": "Maatkleding / kleermakerij"
      },
      {
        "label": "Oprichter",
        "value": "Jimmy Karaaslan"
      },
      {
        "label": "Specialisme",
        "value": "Maatpakken & trouwpakken"
      },
      {
        "label": "Vestigingen",
        "value": "Amersfoort & Rotterdam"
      },
      {
        "label": "Afspraak",
        "value": "afspraak.misurasartoria.nl"
      },
      {
        "label": "Telefoon",
        "value": "033 260 0308"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "09:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Misura%20Sartoria%20Kamp%201%20Amersfoort",
    "hasGoogleReviews": true,
    "instagramUrl": "https://www.instagram.com/misurasartoria/",
    "facebookUrl": "https://www.facebook.com/misurasartoria",
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09121_375202506.jpg",
    "imageCandidateSource": "tijdvooramersfoort.nl / assets.plaece.nl",
    "schemaType": "ClothingStore",
    "updatedAt": "2026-06-14",
    "imageFit": "cover",
    "perfectFor": [
      "Shoppen",
      "Cadeau zoeken",
      "Trouwen & gala"
    ],
    "priceLevel": "budget"
  },
  {
    "id": "k-wereldwinkel-amersfoort",
    "name": "Wereldwinkel Amersfoort",
    "category": "Winkels & makers",
    "subcategory": "Fair-trade gift shop",
    "address": "Kamperbinnenpoort 1",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Wereldwinkel Amersfoort — fair-trade gift shop op Kamperbinnenpoort 1 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Wereldwinkel Amersfoort is gevestigd op Kamperbinnenpoort 1 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Kamperbinnenpoort 1, in the historic gate building - explicitly in scope per brief. Active, volunteer-run, open daily. Edge because it is on the gate boundary.",
    "tags": [
      "fair-trade gift shop",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://www.wereldwinkelamersfoort.nl/",
    "sourceUrls": [
      "https://www.wereldwinkelamersfoort.nl/"
    ],
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 1,
    "status": "open",
    "schemaType": "Store",
    "inclusionStatus": "confirmed_edge",
    "inclusionReason": "On Kamperbinnenpoort 1, in the historic gate building - explicitly in scope per brief. Active, volunteer-run, open daily. Edge because it is on the gate boundary.",
    "imageUrl": "https://www.wereldwinkelamersfoort.nl/wp-content/uploads/2022/04/cropped-logo.png",
    "imageFit": "cover",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Shoppen",
      "Lokaal & ambachtelijk",
      "Cadeau zoeken"
    ]
  },
  {
    "id": "toko-tjin",
    "name": "Toko Tjin",
    "category": "Eten & drinken",
    "subcategory": "Aziatische toko en afhaal",
    "address": "Kamp 2",
    "postalCode": "3811 AR",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Aziatische toko en afhaal sinds 1973, tegenover de Kamperbinnenpoort. Verse kruiden, sauzen en dagverse Chinees-Indische maaltijden.",
    "longDescription": "Toko Tjin is sinds 1973 een begrip op de Kamp in Amersfoort, pal tegenover de Kamperbinnenpoort. In deze sfeervolle Aziatische supermarkt vind je verse groenten en kruiden, exotische sauzen en specerijen, talloze soorten rijst en noodles, plus een breed assortiment Indonesische en Surinaamse ingrediënten. Aan de toonbank worden dagvers Chinese en Indische maaltijden bereid, klaar om mee te nemen.",
    "tags": [
      "toko",
      "Aziatisch",
      "afhaal",
      "supermarkt",
      "Kamp Amersfoort",
      "Aziatische toko",
      "Chinees-Indische afhaalmaaltijden",
      "Indonesische ingrediënten"
    ],
    "websiteUrl": "https://tokotjin.nl",
    "phone": "+31 33 472 9300",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/2520133471/toko-tjin-de-kamp",
      "https://tokotjin.nl",
      "https://centrum.tokotjin.nl/",
      "https://www.openingstijden.com/open/toko-tjin/amersfoort/",
      "https://restaurantguru.com/Toko-Tjin-Amersfoort",
      "https://en.eet.nu/amersfoort/toko-tjin"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dsc00553_326045762.jpg",
    "featured": true,
    "sortOrder": 2,
    "status": "open",
    "lat": 52.157301,
    "lng": 5.393107,
    "geoConfidence": "high",
    "priceRange": "€€",
    "specialties": [
      "Aziatische toko",
      "Chinees-Indische afhaalmaaltijden",
      "Indonesische ingrediënten",
      "Surinaamse producten",
      "Verse kruiden & specerijen",
      "Rijst & noodles"
    ],
    "keyFacts": [
      {
        "label": "Sinds",
        "value": "1973"
      },
      {
        "label": "Type",
        "value": "Aziatische supermarkt & afhaal"
      },
      {
        "label": "Keuken",
        "value": "Chinees / Indisch / Indonesisch"
      },
      {
        "label": "Telefoon",
        "value": "+31 33 472 9300"
      },
      {
        "label": "Ligging",
        "value": "Tegenover de Kamperbinnenpoort"
      },
      {
        "label": "Postcode",
        "value": "3811 AR"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "12:00",
            "close": "20:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "20:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "20:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "20:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "20:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "20:00"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "12:00",
            "close": "20:00"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Toko%20Tjin%2C%20Kamp%202%2C%203811%20AR%20Amersfoort",
    "hasGoogleReviews": true,
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/dsc00553_326045762.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl listing)",
    "schemaType": "Restaurant",
    "updatedAt": "2026-06-14",
    "imageFit": "cover",
    "perfectFor": [
      "Uit eten",
      "Samen tafelen",
      "Snelle hap",
      "Afhalen"
    ],
    "priceLevel": "mid"
  },
  {
    "id": "k-van-der-woerd-optiek",
    "name": "Van der Woerd Optiek",
    "category": "Services & praktisch",
    "subcategory": "Optician",
    "address": "Kamperbinnenpoort 2",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Van der Woerd Optiek — optician op Kamperbinnenpoort 2 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Van der Woerd Optiek is gevestigd op Kamperbinnenpoort 2 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Kamperbinnenpoort 2, the gate that the brief explicitly includes as the De Kamp entrance. Independent optician in a monument 'practically next to the Kamperbinnenpoort' (033-4631380). Active. Edge only due to the gate-boundary location.",
    "tags": [
      "optician",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://vanderwoerdoptiek.nl/",
    "sourceUrls": [
      "https://vanderwoerdoptiek.nl/"
    ],
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 2,
    "status": "open",
    "schemaType": "Store",
    "inclusionStatus": "confirmed_edge",
    "inclusionReason": "On Kamperbinnenpoort 2, the gate that the brief explicitly includes as the De Kamp entrance. Independent optician in a monument 'practically next to the Kamperbinnenpoort' (033-4631380). Active. Edge only due to the gate-boundary location.",
    "imageUrl": "https://vanderwoerdoptiek.nl/wp-content/uploads/sites/23/2020/05/MG_9737-e1589487294737.jpg",
    "imageFit": "cover",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Praktisch geregeld"
    ]
  },
  {
    "id": "k-fashion-livy",
    "name": "Fashion Livy",
    "category": "Mode & sieraden",
    "subcategory": "Women's clothing boutique",
    "address": "Kamperbinnenpoort 3",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Fashion Livy — women's clothing boutique op Kamperbinnenpoort 3 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Fashion Livy is gevestigd op Kamperbinnenpoort 3 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Kamperbinnenpoort 3 - the gate that the brief explicitly includes as the De Kamp threshold. Active boutique, multiple directories and VVV confirm. Edge only because it sits on the gate boundary.",
    "tags": [
      "women's clothing boutique",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://www.fashionlivy.nl/",
    "sourceUrls": [
      "https://www.fashionlivy.nl/"
    ],
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 3,
    "status": "open",
    "schemaType": "ClothingStore",
    "inclusionStatus": "confirmed_edge",
    "inclusionReason": "On Kamperbinnenpoort 3 - the gate that the brief explicitly includes as the De Kamp threshold. Active boutique, multiple directories and VVV confirm. Edge only because it sits on the gate boundary.",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Shoppen",
      "Cadeau zoeken"
    ]
  },
  {
    "id": "k-theefeestje",
    "name": "Theefeestje",
    "category": "Koffie, lunch & zoet",
    "subcategory": "Tearoom / high tea / cake-decoration shop & workshops",
    "address": "Kamp 3",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Theefeestje — tearoom / high tea / cake-decoration shop & workshops op Kamp 3 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Theefeestje is gevestigd op Kamp 3 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Kamp 3, core De Kamp street. Active tea salon/experience shop (by reservation), own website and VVV listing confirm Kamp 3, 3811 AM. Candidates 2 and 16 are the same business, deduplicated.",
    "tags": [
      "tearoom",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://theefeestje.nl/",
    "sourceUrls": [
      "https://theefeestje.nl/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 3,
    "status": "open",
    "schemaType": "CafeOrCoffeeShop",
    "inclusionStatus": "confirmed_core",
    "inclusionReason": "On Kamp 3, core De Kamp street. Active tea salon/experience shop (by reservation), own website and VVV listing confirm Kamp 3, 3811 AM. Candidates 2 and 16 are the same business, deduplicated.",
    "imageUrl": "https://theefeestje.nl/content/uploads/2025/07/rozefotnieuw16-scaled.jpg",
    "imageFit": "cover",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Koffie & lunch",
      "Even bijkomen",
      "Zoete trek"
    ]
  },
  {
    "id": "flups",
    "name": "FLUPS",
    "category": "Mode & sieraden",
    "subcategory": "Duurzame fashion en upcycle store",
    "address": "Kamp 4",
    "postalCode": "3811 AR",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": "Marina",
    "publicPersonRole": "oprichter",
    "shortDescription": "Fashion Lending & Upcycle Store op de Kamp: leen of koop luxe tweedehands en vintage designerkleding, plus sieraden en tassen van Amersfoortse reststromen.",
    "longDescription": "FLUPS (Fashion Lending & Upcycle Store) van Marina Horseling op Kamp 4 maakt duurzaam shoppen makkelijk: je koopt of leent er luxe tweedehands en vintage designerkleding, waarbij je geleende stukken tot 25 dagen mag houden. Naast kleding vind je er sieraden, tassen en items gemaakt van (Amersfoortse) reststromen. De winkel is geopend van woensdag tot en met zaterdag, van 10:00 tot 18:00 uur.",
    "tags": [
      "duurzaam",
      "fashion",
      "vintage",
      "upcycle",
      "kleding lenen",
      "Vintage designerkleding",
      "Tweedehands mode",
      "Upcycling"
    ],
    "websiteUrl": "https://flupsonline.nl",
    "instagramUrl": "https://www.instagram.com/flupsamersfoort/",
    "phone": "033 785 4500",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/1312864435/flups",
      "https://flupsonline.nl",
      "https://flupsonline.nl/en/pages/locatie-en-openingstijden",
      "https://www.nieuwsplein33.nl/nieuws/3830634/video-ondernemer-marina-horseling-denkt-dat-winkelen-bewuster-en-duurzamer-kan",
      "https://evendo.com/locations/netherlands/amersfoort/shop/flups"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": true,
    "sortOrder": 4,
    "status": "open",
    "lat": 52.157321,
    "lng": 5.393191,
    "geoConfidence": "high",
    "specialties": [
      "Vintage designerkleding",
      "Kleding lenen",
      "Tweedehands mode",
      "Upcycling",
      "Duurzame mode",
      "Lokale reststromen"
    ],
    "keyFacts": [
      {
        "label": "Concept",
        "value": "Fashion Lending & Upcycle Store"
      },
      {
        "label": "Aanbod",
        "value": "Luxe tweedehands & vintage designerkleding"
      },
      {
        "label": "Lenen",
        "value": "Kleding tot 25 dagen lenen"
      },
      {
        "label": "Oprichter",
        "value": "Marina Horseling"
      },
      {
        "label": "Telefoon",
        "value": "033 785 4500"
      },
      {
        "label": "Geopend",
        "value": "Wo t/m za 10:00-18:00"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "closed": true,
        "periods": []
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=FLUPS%2C+Kamp+4%2C+3811+AR+Amersfoort",
    "hasGoogleReviews": false,
    "facebookUrl": "https://www.facebook.com/flupsonline/",
    "imageCandidateUrl": "https://flupsonline.nl/cdn/shop/files/Logo_voor_socials_1200x1200.png?v=1693930405",
    "imageCandidateSource": "flupsonline.nl",
    "schemaType": "ClothingStore",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09619-2-1_2268921719.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Shoppen",
      "Cadeau zoeken"
    ]
  },
  {
    "id": "keizerin",
    "name": "Keizerin",
    "category": "Mode & sieraden",
    "subcategory": "Damesmode",
    "address": "Kamp 4",
    "postalCode": "3811 AR",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Sfeervolle damesmodeboetiek aan de Kamp met unieke merken, persoonlijk advies en een shop-in-shop van het Amsterdamse label King Louie.",
    "longDescription": "Keizerin is een kleurrijke damesmodeboetiek in de historische Kampstraat in Amersfoort, waar unieke mode en persoonlijk advies centraal staan. De winkel hangt vol bijzondere merken en heeft sinds kort een 'shop in shop' van het Amsterdamse label King Louie. Geopend van dinsdag tot en met zaterdag van 10:00 tot 17:30 uur.",
    "tags": [
      "mode",
      "damesmode",
      "King Louie",
      "kleding",
      "Kamp",
      "Unieke merken",
      "King Louie shop-in-shop",
      "Persoonlijk advies"
    ],
    "websiteUrl": "https://keizerin.business.site",
    "phone": "033 752 16 30",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/2108216659/keizerin",
      "https://keizerin.business.site (officiele website - geeft HTTP 404, lijkt niet meer actief)",
      "https://www.cylex.nl/bedrijf/keizerin-amersfoort-13066931.html",
      "https://firmania.nl/amersfoort/keizerin-amersfoort-498580",
      "https://www.facebook.com/keizerin.amersfoort/",
      "https://www.instagram.com/keizerinamersfoort/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 4,
    "status": "open",
    "lat": 52.157321,
    "lng": 5.393191,
    "geoConfidence": "high",
    "specialties": [
      "Damesmode",
      "Unieke merken",
      "King Louie shop-in-shop",
      "Persoonlijk advies",
      "Boutique"
    ],
    "keyFacts": [
      {
        "label": "Type",
        "value": "Damesmodeboetiek"
      },
      {
        "label": "Adres",
        "value": "Kamp 4, 3811 AR Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "033 752 16 30"
      },
      {
        "label": "Merken",
        "value": "o.a. King Louie (shop-in-shop)"
      },
      {
        "label": "Wijk",
        "value": "De Kamp"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Keizerin+Kamp+4+Amersfoort",
    "hasGoogleReviews": true,
    "instagramUrl": "https://www.instagram.com/keizerinamersfoort/",
    "facebookUrl": "https://www.facebook.com/keizerin.amersfoort/",
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09116_4202787316.jpg",
    "imageCandidateSource": "assets.plaece.nl",
    "schemaType": "ClothingStore",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09116_4202787316.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Shoppen",
      "Cadeau zoeken"
    ]
  },
  {
    "id": "k-livingstone-bij-de-poort",
    "name": "Livingstone bij de Poort",
    "category": "Koffie, lunch & zoet",
    "subcategory": "Speciality-coffee bar / healthy & vegan lunchroom",
    "address": "Kamperbinnenpoort 4",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Livingstone bij de Poort — speciality-coffee bar / healthy & vegan lunchroom op Kamperbinnenpoort 4 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Livingstone bij de Poort is gevestigd op Kamperbinnenpoort 4 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Kamperbinnenpoort 4, literally named 'bij de Poort' (by the gate) - exactly the De Kamp threshold the brief calls out. Active speciality-coffee & vegan-friendly lunchroom, second Livingstone location. Edge due to gate-boundary location.",
    "tags": [
      "speciality-coffee bar",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://www.tijdvooramersfoort.nl/en/locations/1657593467/together-at-livingstone",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/en/locations/1657593467/together-at-livingstone"
    ],
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 4,
    "status": "open",
    "schemaType": "CafeOrCoffeeShop",
    "inclusionStatus": "confirmed_edge",
    "inclusionReason": "On Kamperbinnenpoort 4, literally named 'bij de Poort' (by the gate) - exactly the De Kamp threshold the brief calls out. Active speciality-coffee & vegan-friendly lunchroom, second Livingstone location. Edge due to gate-boundary location.",
    "imageUrl": "https://assets.plaece.nl/thumb/Kdy7dwzvpbi0ct-7v-7h0_TyIxWkuKnOsvZHVXlfGjs/resizing_type:fit/width:650/height:366/gravity:sm/aHR0cHM6Ly9hc3NldHMucGxhZWNlLm5sL29kcC11YmFzZS9pbWFnZS9kc2MwNzMxMl8xMTExMDQ1NDIyLmpwZw.jpg",
    "imageFit": "cover",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Koffie & lunch",
      "Even bijkomen",
      "Vegan",
      "Werkplek / koffie"
    ]
  },
  {
    "id": "wit-lof",
    "name": "Wit-Lof",
    "category": "Eten & drinken",
    "subcategory": "Gezonde afhaal en bezorgmaaltijden",
    "address": "Kamp 5",
    "postalCode": "3811 AM",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Verse, gezonde maaltijden om af te halen of te laten bezorgen — vega(n) én vlees, wisselend per seizoen. Sinds 2017 op de Kamp.",
    "longDescription": "Wit-Lof is een maaltijdwinkel op de Kamp waar elke dag verse, gezonde gerechten met liefde worden bereid om af te halen of te laten bezorgen. Het menu wisselt per seizoen en biedt voor iedereen iets, van stamppotten en stoofgerechten in de winter tot lichtere zomergerechten als gevuld Libanees flatbread en Thaise rode curry, met altijd vega(n)- én vleesopties. Milieubewust tot in de details: bezorging gaat met elektrische fietsen en je kunt kiezen voor herbruikbare bakjes.",
    "tags": [
      "gezond eten",
      "afhaal",
      "bezorgen",
      "maaltijden",
      "Kamp",
      "Verse maaltijdbezorging",
      "Afhalen",
      "Vega(n) gerechten"
    ],
    "websiteUrl": "https://wit-lof.com",
    "phone": "033 432 8367",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/3589594934/wit-lof",
      "http://wit-lof.com/",
      "https://bestellen.wit-lof.com/informatie",
      "https://wanderlog.com/place/details/16187615/wit-lof",
      "https://www.facebook.com/WitLofAmersfoort/",
      "https://en.eet.nu/amersfoort/wit-lof-amersfoort"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 5,
    "status": "open",
    "lat": 52.157189,
    "lng": 5.393476,
    "geoConfidence": "high",
    "priceRange": "€",
    "specialties": [
      "Verse maaltijdbezorging",
      "Afhalen",
      "Vega(n) gerechten",
      "Seizoenskeuken",
      "Catering",
      "Duurzaam"
    ],
    "keyFacts": [
      {
        "label": "Sinds",
        "value": "2012 (op de Kamp sinds 2017)"
      },
      {
        "label": "Type",
        "value": "Maaltijdwinkel — afhalen & bezorgen"
      },
      {
        "label": "Keuken",
        "value": "Gezond, vega(n) & vlees, seizoensgebonden"
      },
      {
        "label": "Bezorging",
        "value": "Elektrische fietsen, herbruikbare bakjes"
      },
      {
        "label": "Telefoon",
        "value": "033-4328367"
      },
      {
        "label": "Google",
        "value": "4,3 sterren (±72 reviews)"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "16:00",
            "close": "19:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "16:00",
            "close": "19:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "16:00",
            "close": "19:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "16:00",
            "close": "19:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "16:00",
            "close": "19:00"
          }
        ]
      },
      {
        "day": "saturday",
        "closed": true,
        "periods": []
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Wit-Lof%20Kamp%205%20Amersfoort",
    "hasGoogleReviews": true,
    "facebookUrl": "https://www.facebook.com/WitLofAmersfoort/",
    "imageCandidateUrl": "https://assets.plaece.nl/thumb/gNSFWNPVKne0x-w6xRZ3DxA76UCg4iymGBMYQnTcG5E/resizing_type:fit/width:650/height:366/gravity:sm/aHR0cHM6Ly9hc3NldHMucGxhZWNlLm5sL29kcC11YmFzZS9pbWFnZS9kc2MwOTEyN183OTI5MDYyOS5qcGc.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl listing)",
    "schemaType": "Restaurant",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09127_79290629.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Uit eten",
      "Samen tafelen",
      "Snelle hap",
      "Afhalen"
    ],
    "priceLevel": "budget"
  },
  {
    "id": "de-ruiter-makelaarshuis",
    "name": "De Ruiter Makelaarshuis",
    "category": "Services & praktisch",
    "subcategory": "Makelaar",
    "address": "Kamp 6",
    "postalCode": "3811 AR",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": "Roland de Ruiter",
    "publicPersonRole": "eigenaar Amersfoort",
    "shortDescription": "NVM-makelaar in een sfeervol rijksmonument aan de Kamp bij de Kamperbinnenpoort. Aankoop, verkoop, taxatie en verhuur in Amersfoort.",
    "longDescription": "De Ruiter Makelaarshuis is sinds 2005 gevestigd in een fraai rijksmonument aan de Kamp 6, op een steenworp van de Kamperbinnenpoort in de historische binnenstad van Amersfoort. Het ervaren NVM-team begeleidt je bij aankoop, verkoop, taxatie en verhuur en behoort tot de best verkopende kantoren van de stad. Doordeweeks geopend van 08:30 tot 17:30 uur; op zaterdag op afspraak.",
    "tags": [
      "makelaar",
      "woning verkopen",
      "taxatie",
      "huizenmarkt",
      "Kamp",
      "Verkoopmakelaar",
      "Aankoopmakelaar",
      "Taxaties"
    ],
    "websiteUrl": "https://www.deruitermakelaarshuis.nl",
    "phone": "033 470 27 00",
    "email": "info@deruitermakelaarshuis.nl",
    "sourceUrls": [
      "https://www.deruitermakelaarshuis.nl/contact/",
      "https://www.deruitermakelaarshuis.nl/medewerkers/roland-de-ruiter/",
      "https://www.deruitermakelaarshuis.nl/amersfoort/",
      "https://www.deruitermakelaarshuis.nl/",
      "https://www.openingstijden.com/o2028260/de-ruiter-makelaarshuis-kamp-6-amersfoort/",
      "https://huisassist.nl/taxateurs/utrecht/amersfoort/de-ruiter-makelaarshuis/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 6,
    "status": "open",
    "lat": 52.1573521,
    "lng": 5.393306,
    "geoConfidence": "high",
    "specialties": [
      "Verkoopmakelaar",
      "Aankoopmakelaar",
      "Taxaties",
      "Verhuur",
      "NVM-makelaar",
      "Funda"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Kamp 6, 3811 AR Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "033 - 470 27 00"
      },
      {
        "label": "Opgericht",
        "value": "Begin 2000 (Roland de Ruiter)"
      },
      {
        "label": "Op deze locatie sinds",
        "value": "2005"
      },
      {
        "label": "Pand",
        "value": "Rijksmonument bij de Kamperbinnenpoort"
      },
      {
        "label": "Aangesloten bij",
        "value": "NVM / Funda"
      },
      {
        "label": "Google-beoordeling",
        "value": "3,6 sterren (46 reviews)"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "08:30",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "08:30",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "08:30",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "08:30",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "08:30",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "13:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=De+Ruiter+Makelaarshuis+Kamp+6+3811+AR+Amersfoort",
    "hasGoogleReviews": true,
    "instagramUrl": "https://www.instagram.com/deruitermakelaarshuis/",
    "imageCandidateUrl": "https://www.deruitermakelaarshuis.nl/wp-content/uploads/2025/12/Abe-Van-Ancum-fotografie-25-min-1536x480.jpg",
    "imageCandidateSource": "deruitermakelaarshuis.nl",
    "schemaType": "RealEstateAgent",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://www.deruitermakelaarshuis.nl/wp-content/uploads/2024/11/Abe-Van-Ancum-fotografie-02-e1732185759484-960x720.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Praktisch geregeld"
    ]
  },
  {
    "id": "k-jewels-forever",
    "name": "Jewels Forever",
    "category": "Mode & sieraden",
    "subcategory": "Jeweller",
    "address": "Kamperbinnenpoort 7",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Jewels Forever — jeweller op Kamperbinnenpoort 7 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Jewels Forever is gevestigd op Kamperbinnenpoort 7 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Kamperbinnenpoort 7, on the gate beside the already-listed Heart & Arrow Trouwringen (no. 8). Active jeweller specialising in handmade wedding rings, own workshop (KvK 73618993). Distinct De Kamp address despite a second Krommestraat outlet. Edge due to gat",
    "tags": [
      "jeweller",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://www.jewelsareforever.nl/",
    "sourceUrls": [
      "https://www.jewelsareforever.nl/"
    ],
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 7,
    "status": "open",
    "schemaType": "JewelryStore",
    "inclusionStatus": "confirmed_edge",
    "inclusionReason": "On Kamperbinnenpoort 7, on the gate beside the already-listed Heart & Arrow Trouwringen (no. 8). Active jeweller specialising in handmade wedding rings, own workshop (KvK 73618993). Distinct De Kamp address despite a second Krommestraat outlet. Edge due to gate-boundary location.",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Shoppen",
      "Cadeau zoeken"
    ]
  },
  {
    "id": "k-speelpakhuis",
    "name": "Speelpakhuis",
    "category": "Winkels & makers",
    "subcategory": "Toy store",
    "address": "Kamp 7",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Speelpakhuis — toy store op Kamp 7 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Speelpakhuis is gevestigd op Kamp 7 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Kamp 7, core De Kamp street. Recently-opened toy shop confirmed at Kamp 7 by VVV, tijdvooramersfoort and the letting agent's move-in announcement; current opening hours listed.",
    "tags": [
      "toy store",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://speelpakhuis.nl/",
    "sourceUrls": [
      "https://speelpakhuis.nl/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 7,
    "status": "open",
    "schemaType": "Store",
    "inclusionStatus": "confirmed_core",
    "inclusionReason": "On Kamp 7, core De Kamp street. Recently-opened toy shop confirmed at Kamp 7 by VVV, tijdvooramersfoort and the letting agent's move-in announcement; current opening hours listed.",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Shoppen",
      "Lokaal & ambachtelijk",
      "Met kinderen"
    ]
  },
  {
    "id": "de-tafelaar",
    "name": "De Tafelaar",
    "category": "Eten & drinken",
    "subcategory": "Restaurant en shared dining",
    "address": "Kamp 8",
    "postalCode": "3811 AR",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Sfeervol shared-dining restaurant op de Kamp: kleine seizoensgerechten van lokale makers, borrel en diner. 4.8 op Google, 5 min van de Flint.",
    "longDescription": "De Tafelaar is een shared-dining restaurant aan Kamp 8 in het centrum van Amersfoort, op vijf minuten lopen van Theater de Flint. Je deelt er kleine, seizoensgebonden gerechten gemaakt met producten van lokale makers, van een uitgebreide borrel tot een compleet diner. Geopend van woensdag t/m zondag, met op vrijdag en zaterdag al vanaf 15:00 een borrelmoment; reserveren kan online of telefonisch, en er is een Chef's Choice arrangement vanaf 7 personen.",
    "tags": [
      "restaurant",
      "shared dining",
      "aanschuiftafel",
      "lokaal eten",
      "Kamp Amersfoort",
      "Lokale seizoensproducten",
      "Borrelplanken",
      "Diner"
    ],
    "websiteUrl": "https://www.tafelaaramersfoort.nl",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/2106189786/de-tafelaar",
      "https://www.tafelaaramersfoort.nl (officiële website, JSON-LD Restaurant schema: adres, geo, openingstijden, telefoon, priceRange, socials, og:image)",
      "https://www.tijdvooramersfoort.nl/nl/locaties/2106189786/de-tafelaar (referentie directory, geo 52.157376/5.393383)",
      "WebSearch: De Tafelaar Amersfoort openingstijden",
      "WebSearch: De Tafelaar Amersfoort Google reviews (4.8 rating bevestigd)"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "owner_approved",
    "imageStatus": "shopfront_needed",
    "imageUrl": "https://www.tafelaaramersfoort.nl/pics/homepage.png",
    "featured": true,
    "sortOrder": 8,
    "status": "open",
    "lat": 52.157376,
    "lng": 5.393383,
    "geoConfidence": "medium",
    "priceRange": "€€",
    "specialties": [
      "Shared dining",
      "Lokale seizoensproducten",
      "Borrelplanken",
      "Diner",
      "Weekendlunch",
      "Chef's Choice arrangement"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Kamp 8, 3811 AR Amersfoort"
      },
      {
        "label": "Keuken",
        "value": "Shared dining / seizoensgebonden"
      },
      {
        "label": "Geopend sinds",
        "value": "November 2025"
      },
      {
        "label": "Prijsklasse",
        "value": "€€"
      },
      {
        "label": "Google-beoordeling",
        "value": "4.8 (110 reviews)"
      },
      {
        "label": "Telefoon",
        "value": "+31 6 341 279 32"
      },
      {
        "label": "Reserveren",
        "value": "Online of telefonisch"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "closed": true,
        "periods": []
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "17:00",
            "close": "23:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "17:00",
            "close": "23:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "15:00",
            "close": "00:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "11:00",
            "close": "00:00"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "11:00",
            "close": "15:00"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://maps.google.com/?q=De+Tafelaar+Kamp+8+Amersfoort",
    "hasGoogleReviews": true,
    "instagramUrl": "https://instagram.com/tafelaaramersfoort",
    "facebookUrl": "https://www.facebook.com/people/Tafelaar-Amersfoort",
    "imageCandidateUrl": "https://tafelaaramersfoort.nl/pics/homepage.png",
    "imageCandidateSource": "tafelaaramersfoort.nl",
    "schemaType": "Restaurant",
    "updatedAt": "2026-06-14",
    "imageFit": "cover",
    "perfectFor": [
      "Uit eten",
      "Samen tafelen",
      "Date night"
    ],
    "priceLevel": "mid"
  },
  {
    "id": "new-heart-en-arrow-trouwringen",
    "name": "Heart & Arrow Trouwringen",
    "category": "Mode & sieraden",
    "subcategory": "Juwelier voor trouw- en verlovingsringen",
    "address": "Kamperbinnenpoort 8",
    "postalCode": "3811 AL",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Specialist in trouw- en verlovingsringen bij de Kamperbinnenpoort. Ruim 3000 ringen, persoonlijk advies en vakmanschap voor jullie ja-woord.",
    "longDescription": "Heart & Arrow is een sfeervolle juwelier aan de Kamperbinnenpoort, in het historische hart van Amersfoort. De boutique is volledig gespecialiseerd in trouwringen, verlovingsringen en vriendschapsringen, met een collectie van ruim 3000 modellen in goud, witgoud, rosé en platina. Onder het genot van persoonlijk advies helpen ze stellen hun perfecte ringen te kiezen; op maandag en dinsdag uitsluitend op afspraak.",
    "tags": [
      "trouwringen",
      "verlovingsringen",
      "juwelier",
      "sieraden",
      "ringen op maat",
      "bruiloft",
      "Kamperbinnenpoort",
      "Amersfoort centrum"
    ],
    "websiteUrl": "https://www.heartandarrow.nl",
    "instagramUrl": "https://www.instagram.com/heartandarrow.trouwringen/",
    "facebookUrl": "https://www.facebook.com/HeartandArrowTrouwringen/",
    "phone": "+31 6 84677204",
    "sourceUrls": [
      "https://www.heartandarrow.nl/",
      "https://www.heartandarrow.nl/contact/",
      "https://www.heartandarrow.nl/product/juwelier-kamperbinnenpoort-gate-amersfoort/",
      "https://www.openingstijden.nl/Heart-en-Arrow-Trouwringen-Verlovingsringen/Amersfoort/Kamperbinnenpoort-8/",
      "https://www.openingstijden.com/o2863606/heart-&-arrow-trouwringen-boutique-kamperbinnenpoort-8-amersfoort/",
      "https://www.telefoonboek.nl/bedrijven/t2863606/amersfoort/heart-&-arrow-trouwringen-boutique/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 8,
    "status": "open",
    "lat": 52.1571956,
    "lng": 5.3929036,
    "geoConfidence": "high",
    "specialties": [
      "Trouwringen",
      "Verlovingsringen",
      "Vriendschapsringen",
      "Ringen op maat",
      "Persoonlijk ringadvies",
      "Goud, witgoud, rosé & platina"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Kamperbinnenpoort 8, 3811 AL Amersfoort"
      },
      {
        "label": "Specialisme",
        "value": "Trouw- en verlovingsringen"
      },
      {
        "label": "Collectie",
        "value": "Ruim 3000 ringen"
      },
      {
        "label": "Telefoon",
        "value": "+31 6 84677204"
      },
      {
        "label": "Maandag & dinsdag",
        "value": "Alleen op afspraak"
      },
      {
        "label": "Beoordeling",
        "value": "4,08/5 (36 reviews) op openingstijden.nl; ook reviews op Google/Tripadvisor"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "09:00",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "09:00",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "11:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "11:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "11:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "11:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Heart+%26+Arrow+Trouwringen+Kamperbinnenpoort+8+Amersfoort",
    "hasGoogleReviews": true,
    "schemaType": "JewelryStore",
    "imageCandidateUrl": "https://www.heartandarrow.nl/wp-content/uploads/2023/11/IMG_2606.jpg",
    "imageCandidateSource": "heartandarrow.nl (eigen geüploade winkel-/productfoto, /wp-content/uploads/2023/11/IMG_2606.jpg)",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://www.heartandarrow.nl/wp-content/uploads/2023/11/IMG_2606.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Shoppen",
      "Cadeau zoeken",
      "Trouwen & gala"
    ]
  },
  {
    "id": "new-schoenmakerij-hartog",
    "name": "Schoenmakerij Hartog",
    "category": "Services & praktisch",
    "subcategory": "Ambachtelijke schoenmakerij & lederwarenreparatie",
    "address": "Kamp 9",
    "postalCode": "3811 AM",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": "Mario Hartog",
    "publicPersonRole": "Schoenmaker / eigenaar",
    "shortDescription": "Ambachtelijke schoenmaker aan de Kamp sinds de jaren 60: schoenreparaties, lederwaren herstellen en (fiets)sleutels kopiëren — klaar terwijl je wacht.",
    "longDescription": "Schoenmakerij Hartog is al sinds de jaren 60 te vinden aan de Kamp in het hart van Amersfoort, waar duurzaamheid de maat is. Je kunt er terecht voor schoenreparaties, het herstellen van lederwaren zoals tassen, en het kopiëren van fiets- en autosleutels, vaak klaar terwijl je wacht. Daarnaast verkoopt de winkel kwaliteitslederen handschoenen, riemen, tassen, portemonnees en schapenwollen pantoffels.",
    "tags": [
      "schoenmaker",
      "schoenmakerij",
      "ambachtelijk",
      "schoenreparatie",
      "lederwaren",
      "sleutelservice",
      "duurzaamheid",
      "De Kamp"
    ],
    "websiteUrl": "https://schoenmakerijhartog.nl",
    "facebookUrl": "https://www.facebook.com/p/Schoenmakerij-Hartog-Amersfoort-100063591729237/",
    "phone": "+31 6 31043773",
    "sourceUrls": [
      "https://schoenmakerijhartog.nl/",
      "https://schoenmakerijhartog.nl/?page_id=21",
      "https://schoenmakerijhartog.nl/?page_id=17",
      "https://schoenmakerijhartog.nl/?page_id=11",
      "https://www.tijdvooramersfoort.nl/nl/locaties/4282903185/schoenmakerij-hartog",
      "https://www.vvvamersfoort.nl/en/locations/2943/schoenmakerij-hartog"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 9,
    "status": "open",
    "lat": 52.157313,
    "lng": 5.393773,
    "geoConfidence": "medium",
    "specialties": [
      "Schoenreparaties",
      "Reparatie van lederwaren en tassen",
      "Kopiëren van (fiets)sleutels",
      "Schoenen oprekken",
      "Lederwaren: handschoenen, riemen, portemonnees",
      "Naamplaatjes / naamborden"
    ],
    "keyFacts": [
      {
        "label": "Op deze locatie sinds",
        "value": "Jaren 60 aan de Kamp"
      },
      {
        "label": "Openingstijden",
        "value": "Wo, vr & za 12:00–16:00"
      },
      {
        "label": "Adres",
        "value": "Kamp 9, 3811 AM Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "06-31043773"
      },
      {
        "label": "Let op",
        "value": "Niet altijd aanwezig (gezondheidsredenen) — bel vooraf"
      },
      {
        "label": "Niet meer",
        "value": "Zolen en hakken vervangen behoort niet meer tot het aanbod"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "closed": true,
        "periods": []
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "12:00",
            "close": "16:00"
          }
        ]
      },
      {
        "day": "thursday",
        "closed": true,
        "periods": []
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "12:00",
            "close": "16:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "12:00",
            "close": "16:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Kamp%209%203811%20AM%20Amersfoort",
    "hasGoogleReviews": false,
    "schemaType": "Store",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/thumb/onkBBXd4wUFTWzR7CHV2BLf0FcLMjqCCcvi3tASdEas/resizing_type:fit/width:1280/height:0/gravity:sm/enlarge:0/aHR0cHM6Ly9hc3NldHMucGxhZWNlLm5sL29kcC11YmFzZS9pbWFnZS9kc2MwOTEzMV8xMTg3MjI3MDQwLmpwZw.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Praktisch geregeld"
    ]
  },
  {
    "id": "k-kaldi-koffie-thee-amersfoort",
    "name": "Kaldi Koffie & Thee Amersfoort",
    "category": "Koffie, lunch & zoet",
    "subcategory": "Coffee & tea shop / tasting room / takeaway",
    "address": "Kamp 10",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Kaldi Koffie & Thee Amersfoort — coffee & tea shop / tasting room / takeaway op Kamp 10 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Kaldi Koffie & Thee Amersfoort is gevestigd op Kamp 10 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Kamp 10, the core street of De Kamp; past the Kamperbinnenpoort. Active coffee/tea shop in the historic 'D'Gekroonde Bye-Korf' building. Note: the 'recently reopened under new owner (Fred Homan)' event traces to 2017, not a recent reopening, but the bus",
    "tags": [
      "coffee & tea shop",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://kaldi.nl/winkelpopup/?winkel=Kaldi+Amersfoort",
    "sourceUrls": [
      "https://kaldi.nl/winkelpopup/?winkel=Kaldi+Amersfoort"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 10,
    "status": "open",
    "schemaType": "CafeOrCoffeeShop",
    "inclusionStatus": "confirmed_core",
    "inclusionReason": "On Kamp 10, the core street of De Kamp; past the Kamperbinnenpoort. Active coffee/tea shop in the historic 'D'Gekroonde Bye-Korf' building. Note: the 'recently reopened under new owner (Fred Homan)' event traces to 2017, not a recent reopening, but the business is currently listed and operating at Kamp 10.",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Koffie & lunch",
      "Even bijkomen",
      "Snelle hap",
      "Afhalen"
    ]
  },
  {
    "id": "bloembinderij-all-seasons",
    "name": "Bloembinderij All Seasons",
    "category": "Interieur & kunst",
    "subcategory": "Bloemist",
    "address": "Kamp 11",
    "postalCode": "3811 AM",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Veelzijdige bloemenwinkel aan de Kamp met dagelijks verse snijbloemen en planten, deskundig advies en eigen bezorgdienst in Amersfoort.",
    "longDescription": "Bloembinderij All Seasons aan Kamp 11 in de historische binnenstad van Amersfoort is een veelzijdige bloemenwinkel waar een enthousiast team u ontvangt met deskundig advies en dagelijks vers aangevoerde kwaliteitssnijbloemen en planten. U kunt er terecht voor boeketten op maat, rouw- en bruidsbloemen en (zakelijke) bloemabonnementen, met oog voor sfeer, beleving en vakmanschap. Bestellen kan in de winkel of via de webshop; met de eigen bezorgdienst leveren ze in en rond Amersfoort en daarbuiten door heel Nederland.",
    "tags": [
      "bloemist",
      "bloemen",
      "planten",
      "cadeau",
      "Kamp",
      "Boeketten op maat",
      "Rouwbloemen",
      "Bruidsboeketten"
    ],
    "websiteUrl": "https://www.bloem-binderijallseasons.nl",
    "phone": "033 4720372",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/371478436/bloembinderij-all-seasons",
      "https://www.bloem-binderijallseasons.nl",
      "https://bloembinderijallseasons.nl/contact/",
      "https://www.regiobloemist.nl/en/florist/18389/bloembinderij-all-seasons-amersfoort",
      "https://www.bloemenwinkels.nl/utrecht/amersfoort/bloembinderij-all-seasons/",
      "https://www.facebook.com/p/Bloembinderij-All-Seasons-100063566412745/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 11,
    "status": "open",
    "lat": 52.157334,
    "lng": 5.39385,
    "geoConfidence": "high",
    "specialties": [
      "Boeketten op maat",
      "Rouwbloemen",
      "Bruidsboeketten",
      "Snijbloemen & planten",
      "Bloemabonnementen",
      "Eigen bezorgdienst"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Kamp 11, 3811 AM Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "033-4720372"
      },
      {
        "label": "E-mail",
        "value": "info@bloembinderijallseasons.nl"
      },
      {
        "label": "Geopend",
        "value": "di t/m vr 10-17u, za 9-17u"
      },
      {
        "label": "Specialiteit",
        "value": "Rouw- & bruidsbloemen"
      },
      {
        "label": "Bezorging",
        "value": "Eigen dienst in Amersfoort, landelijk via WY-bloemisten"
      },
      {
        "label": "Google-beoordeling",
        "value": "4,8 (ca. 40 reviews)"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "09:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Bloembinderij+All+Seasons+Kamp+11+Amersfoort",
    "hasGoogleReviews": true,
    "facebookUrl": "https://www.facebook.com/p/Bloembinderij-All-Seasons-100063566412745/",
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09133_1402685231.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl listing JSON-LD)",
    "schemaType": "Florist",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09133_1402685231.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Interieur & wonen",
      "Inspiratie opdoen",
      "Cadeau zoeken"
    ]
  },
  {
    "id": "new-de-gouden-naald",
    "name": "De Gouden Naald",
    "category": "Services & praktisch",
    "subcategory": "Kledingreparatie & naaiatelier",
    "address": "Kamp 12",
    "postalCode": "3811 AR",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Vakkundige kledingreparatie en stomerij aan de Kamp: jassen, broeken en truien professioneel hersteld in hartje Amersfoort.",
    "longDescription": "De Gouden Naald is een vertrouwd adres voor kledingreparatie en stomerij aan de Kamp 12 in de historische binnenstad van Amersfoort. Je kunt er terecht voor professioneel herstel en vermaken van jassen, broeken, truien en ander textiel, plus een complete stomerijservice. Het bedrijf is al ruim dertig jaar actief in De Kamp en bereikbaar op 033 470 0881.",
    "tags": [
      "Kledingreparatie",
      "Stomerij",
      "Vermaakwerk",
      "Ritsen vervangen",
      "Innemen & inkorten",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://www.tijdvooramersfoort.nl/nl/locaties/2285951495/de-gouden-naald-amersfoort",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/2285951495/de-gouden-naald-amersfoort",
      "https://www.openingstijden.nl/De-Gouden-Naald/Amersfoort/Kamp-12/",
      "https://www.openingstijden.com/open/de-gouden-naald-amersfoort/",
      "https://firmania.nl/amersfoort/de-gouden-naald-221417",
      "https://www.cylex.nl/bedrijf/de-gouden-naald-10834633.html",
      "https://www.telefoonboek.nl/bedrijven/t2901048/amersfoort/de-gouden-naald-amersfoort/"
    ],
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 12,
    "status": "open",
    "lat": 52.157447,
    "lng": 5.393676,
    "geoConfidence": "high",
    "priceRange": "€€",
    "specialties": [
      "Kledingreparatie",
      "Stomerij",
      "Vermaakwerk",
      "Ritsen vervangen",
      "Innemen & inkorten"
    ],
    "keyFacts": [
      {
        "label": "Categorie",
        "value": "Kledingreparatie & stomerij"
      },
      {
        "label": "Adres",
        "value": "Kamp 12, 3811 AR Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "033 470 0881"
      },
      {
        "label": "Actief",
        "value": "Ruim 30 jaar"
      },
      {
        "label": "Wijk",
        "value": "De Kamp, binnenstad"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "13:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "09:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "09:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "09:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "09:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "09:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=De+Gouden+Naald+Kamp+12+3811+AR+Amersfoort",
    "hasGoogleReviews": false,
    "schemaType": "Store",
    "imageCandidateUrl": "https://assets.plaece.nl/thumb/yfPzMj624uidYHUGe6OTpxVlJrwUF6Gxgndlfs3_irw/resizing_type:fit/width:650/height:366/gravity:sm/aHR0cHM6Ly9hc3NldHMucGxhZWNlLm5sL29kcC11YmFzZS9pbWFnZS9kc2MwOTEzMl8zNjY1Mjc1Mzk2LmpwZw.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl og:image)",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/thumb/yfPzMj624uidYHUGe6OTpxVlJrwUF6Gxgndlfs3_irw/resizing_type:fit/width:650/height:366/gravity:sm/aHR0cHM6Ly9hc3NldHMucGxhZWNlLm5sL29kcC11YmFzZS9pbWFnZS9kc2MwOTEzMl8zNjY1Mjc1Mzk2LmpwZw.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Praktisch geregeld"
    ],
    "priceLevel": "mid"
  },
  {
    "id": "k-b-g-l-gold-silver",
    "name": "B.G.L. Gold & Silver",
    "category": "Mode & sieraden",
    "subcategory": "Jeweller / goldsmith",
    "address": "Kamp 13",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "B.G.L. Gold & Silver — jeweller / goldsmith op Kamp 13 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "B.G.L. Gold & Silver is gevestigd op Kamp 13 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Kamp 13, core De Kamp street. Active goldsmith/jeweller selling watches, jewellery and wedding rings plus custom work and repairs (033 4753472). Own website and tijdvooramersfoort confirm.",
    "tags": [
      "jeweller",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://www.bglgoldandsilver.nl/",
    "sourceUrls": [
      "https://www.bglgoldandsilver.nl/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 13,
    "status": "open",
    "schemaType": "JewelryStore",
    "inclusionStatus": "confirmed_core",
    "inclusionReason": "On Kamp 13, core De Kamp street. Active goldsmith/jeweller selling watches, jewellery and wedding rings plus custom work and repairs (033 4753472). Own website and tijdvooramersfoort confirm.",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Shoppen",
      "Cadeau zoeken"
    ]
  },
  {
    "id": "new-j-l-lijstenmakerij",
    "name": "J&L Lijstenmakerij",
    "category": "Interieur & kunst",
    "subcategory": "Lijstenmakerij & inlijsten",
    "address": "Kamp 14",
    "postalCode": "3811 AR",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Ambachtelijke lijstenmakerij sinds 1994, tussen de Stier en de Kamperbinnenpoort. Inlijstwerk, museumglas en giclée-kunstreproducties.",
    "longDescription": "Al sinds 1994 verzorgt J&L Lijstenmakerij aan de Kamp, tussen de Stier en de Kamperbinnenpoort, vakkundig inlijstwerk voor foto's, zeefdrukken, borduurwerk en kunst — met keuze uit diverse glassoorten en passe-partouts. Daarnaast vindt u er een grote collectie giclées en zeefdrukken van o.a. Corneille, Hans Innemée, Henk Helmantel en Marius van Dokkum, plus origineel werk van Anton Heyboer, Theo Onnes en Ineke ten Kaate. Elke giclée wordt in beperkte oplage geleverd met gesigneerd certificaat; ook wanddecoratie en inlijstingen voor bedrijven zijn mogelijk.",
    "tags": [
      "Inlijstwerk op maat",
      "Museumglas",
      "Giclée-kunstreproducties",
      "Zeefdrukken & originele kunst",
      "Passe-partouts",
      "Inlijsten voor bedrijven",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://jl-lijstenmakerij.nl",
    "instagramUrl": "https://www.instagram.com/jl_lijstenmakerij/",
    "facebookUrl": "https://www.facebook.com/p/JL-Art-Lijstenmakerij-100054385245810/",
    "sourceUrls": [
      "https://jl-lijstenmakerij.nl/ (eigen website — og:image, openingstijden, sinds 1994, beschrijving)",
      "https://jl-lijstenmakerij.nl/contact/ (telefoon, e-mail, adres, Instagram-link)",
      "https://www.vvvamersfoort.nl/nl/locaties/2901/j-l-lijstenmakerij (referentiebron VVV)",
      "https://www.openingstijden.nl/J-L-Art-Lijstenmakerij/Amersfoort/Kamp-14/ (recensiestatus: 0 geverifieerde beoordelingen)",
      "https://www.instagram.com/jl_lijstenmakerij/ (eigenaar Jan-Pieter Cop)",
      "https://nominatim.openstreetmap.org (geocode: benoemde shop-node 'J&L Lijstenmakerij', Kamp 14, lat 52.1574657 / lng 5.3937594)"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 14,
    "status": "open",
    "lat": 52.1574657,
    "lng": 5.3937594,
    "geoConfidence": "high",
    "priceRange": "€€",
    "specialties": [
      "Inlijstwerk op maat",
      "Museumglas",
      "Giclée-kunstreproducties",
      "Zeefdrukken & originele kunst",
      "Passe-partouts",
      "Inlijsten voor bedrijven"
    ],
    "keyFacts": [
      {
        "label": "Sinds",
        "value": "1994"
      },
      {
        "label": "Specialisme",
        "value": "Inlijstwerk & giclée-reproducties"
      },
      {
        "label": "Ligging",
        "value": "Tussen de Stier en de Kamperbinnenpoort"
      },
      {
        "label": "Telefoon",
        "value": "033 - 461 93 21"
      },
      {
        "label": "E-mail",
        "value": "mail@jl-lijstenmakerij.nl"
      },
      {
        "label": "Donderdagavond",
        "value": "Op afspraak"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "11:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=J%26L%20Lijstenmakerij%20Kamp%2014%203811%20AR%20Amersfoort",
    "hasGoogleReviews": false,
    "schemaType": "ArtGallery",
    "imageCandidateUrl": "https://jl-lijstenmakerij.nl/wp-content/uploads/2022/12/JL-Lijstenmakerij-Kerst-768x611.jpg",
    "imageCandidateSource": "jl-lijstenmakerij.nl",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/thumb/LHlgomXfUvbECYbFnfbfnD1uWMMqKyEzq7QMZK5JbA8/resizing_type:fit/width:960/height:0/gravity:sm/enlarge:0/aHR0cHM6Ly9hc3NldHMucGxhZWNlLm5sL29kcC11YmFzZS9pbWFnZS9kc2MwOTEzNC0yXzMyNjMyNDg5MC5qcGc.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Interieur & wonen",
      "Inspiratie opdoen",
      "Zoete trek"
    ],
    "priceLevel": "mid"
  },
  {
    "id": "spar-city-amersfoort",
    "name": "SPAR City Amersfoort",
    "category": "Keten / anker",
    "subcategory": "Supermarkt en lunchservice",
    "address": "Kamp 15-17",
    "postalCode": "3811 AM",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": "Bas",
    "publicPersonRole": "publiek contactpersoon lunchservice, niet als eigenaar tonen",
    "shortDescription": "Buurtsupermarkt in hartje Amersfoort met dagelijkse boodschappen, vers belegde broodjes, salades en koffie to go. Dagelijks open tot 22:00 uur.",
    "longDescription": "SPAR City Amersfoort ligt aan de Kamp, op een steenworp van de Kamperbinnenpoort in het oude centrum. Naast je dagelijkse boodschappen vind je hier ambachtelijk verse producten: zelf belegde broodjes, huisgemaakte salades en smoothies, vers gebakken croissants en koffie to go. De winkel is elke dag geopend tot 22:00 uur en biedt daarnaast een lunchbezorgservice en zakelijke catering voor kantoren in de buurt.",
    "tags": [
      "supermarkt",
      "lunch",
      "broodjes",
      "boodschappen",
      "Kamp",
      "Dagelijkse boodschappen",
      "Verse broodjes & salades",
      "Koffie to go"
    ],
    "websiteUrl": "https://www.spar.nl/winkels/spar-city-amersfoort-333/",
    "phone": "033 8200999",
    "email": "info@sparcityamersfoort.nl",
    "sourceUrls": [
      "https://www.spar.nl/winkels/spar-city-amersfoort-333/",
      "https://www.sparcityamersfoort.nl/",
      "https://www.openingstijden.nl/Spar/Amersfoort/Kamp-15-17/",
      "https://wanderlog.com/place/details/2931111/spar-city-store",
      "https://amersfoort.nieuws.nl/nieuws/jonge-ondernemer-opent-spar-city-amersfoort",
      "https://nl.linkedin.com/posts/bas-dekker-b3788646_hoera-spar-city-amersfoort-is-vandaag-activity-6945337597049102336-EC9a"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 15,
    "status": "open",
    "lat": 52.1573605,
    "lng": 5.394089,
    "geoConfidence": "high",
    "priceRange": "$$",
    "specialties": [
      "Dagelijkse boodschappen",
      "Verse broodjes & salades",
      "Koffie to go",
      "Lunchbezorging",
      "Borrel & gemak",
      "Zakelijke catering"
    ],
    "keyFacts": [
      {
        "label": "Sinds",
        "value": "2017"
      },
      {
        "label": "Type",
        "value": "SPAR City buurtsupermarkt"
      },
      {
        "label": "Dagelijks open",
        "value": "tot 22:00 uur"
      },
      {
        "label": "Adres",
        "value": "Kamp 15-17, 3811 AM Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "033-8200999"
      },
      {
        "label": "E-mail",
        "value": "info@sparcityamersfoort.nl"
      },
      {
        "label": "Bezorging",
        "value": "Lunch & Thuisbezorgd.nl"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "08:00",
            "close": "22:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "08:00",
            "close": "22:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "08:00",
            "close": "22:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "08:00",
            "close": "22:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "08:00",
            "close": "22:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "08:00",
            "close": "22:00"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "10:00",
            "close": "22:00"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=SPAR+city+Amersfoort+Kamp+15+Amersfoort",
    "hasGoogleReviews": true,
    "facebookUrl": "https://www.facebook.com/SPARamersfoort/",
    "imageCandidateUrl": "https://cdn.prod.website-files.com/65f95db71b19f54e688292d6/65f986df50a9949ffc82c4ae_winkel.jpg",
    "imageCandidateSource": "sparcityamersfoort.nl",
    "schemaType": "Store",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://cdn.prod.website-files.com/65f95db71b19f54e688292d6/65f986df50a9949ffc82c4ae_winkel.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Boodschappen",
      "Vertrouwde namen",
      "Snelle hap",
      "Afhalen"
    ]
  },
  {
    "id": "freddo",
    "name": "Freddo",
    "category": "Koffie, lunch & zoet",
    "subcategory": "Koffie, matcha, ijs en broodjes",
    "address": "Kamp 16",
    "postalCode": "3811 AR",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": "Andra Mirzoyan",
    "publicPersonRole": "eigenaar",
    "shortDescription": "Italiaanse koffiespot op de Kamp: freddo cappuccino, fruitige matcha, plantaardige latte's, huisgemaakte ijsthee en verse broodjes.",
    "longDescription": "Freddo is de nieuwe koffiespot van Andra Mirzoyan op Kamp 16, met Italiaanse roots en een eigentijdse twist. Naast een dubbele espresso of freddo cappuccino vind je hier verrassende fruitmatcha's en biologische latte-alternatieven met bijzondere ingrediënten zoals blauwe spirulina en rauwe cacao. Daarbij verse broodjes, ijs en huisgemaakte ijsthee — door de week vanaf 10:30 uur geopend, in het hart van de Kamp.",
    "tags": [
      "koffie",
      "matcha",
      "ijs",
      "broodjes",
      "lunch",
      "Kamp",
      "Specialty koffie",
      "Freddo cappuccino"
    ],
    "websiteUrl": "https://www.tijdvooramersfoort.nl/nl/locaties/612456906/freddo",
    "phone": "06 83848727",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/612456906/freddo",
      "https://drimble.nl/regio/utrecht/amersfoort/104787730/koffie-matcha-en-sandwiches-andra-opent-freddo-op-de-kamp.html",
      "https://www.instagram.com/freddo.amersfoort",
      "https://atfreddo.com/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 16,
    "status": "open",
    "lat": 52.157492,
    "lng": 5.393843,
    "geoConfidence": "high",
    "priceRange": "€",
    "specialties": [
      "Specialty koffie",
      "Freddo cappuccino",
      "Fruitmatcha",
      "Plantaardige latte's",
      "Verse broodjes",
      "Huisgemaakt ijs"
    ],
    "keyFacts": [
      {
        "label": "Keuken",
        "value": "Koffie & lunch, Italiaanse roots"
      },
      {
        "label": "Eigenaar",
        "value": "Andra Mirzoyan"
      },
      {
        "label": "Geopend",
        "value": "2025"
      },
      {
        "label": "Adres",
        "value": "Kamp 16, 3811 AR Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "06 83848727"
      },
      {
        "label": "Specials",
        "value": "Blauwe spirulina & rauwe cacao latte's"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "11:00",
            "close": "16:30"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:30",
            "close": "16:30"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:30",
            "close": "16:30"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:30",
            "close": "16:30"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:30",
            "close": "16:30"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:30",
            "close": "16:30"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "11:00",
            "close": "15:30"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Freddo%20Kamp%2016%20Amersfoort",
    "hasGoogleReviews": false,
    "instagramUrl": "https://www.instagram.com/freddo.amersfoort",
    "facebookUrl": "https://www.facebook.com/61574728471903",
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/dsc6548-kopie-groot_808204671.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl)",
    "schemaType": "CafeOrCoffeeShop",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dsc6548-kopie-groot_808204671.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Koffie & lunch",
      "Even bijkomen",
      "Zoete trek",
      "Werkplek / koffie"
    ],
    "priceLevel": "budget"
  },
  {
    "id": "k-big-bazar-amersfoort",
    "name": "Big Bazar Amersfoort",
    "category": "Keten / anker",
    "subcategory": "Discount / variety store",
    "address": "Kamp 17",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Big Bazar Amersfoort — discount / variety store op Kamp 17 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Big Bazar Amersfoort is gevestigd op Kamp 17 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Kamp (Kamp 15-17 complex; occupies no. 17), core De Kamp street. Distinct from SPAR City on the existing list. Confirmed open with current hours. Candidates 18 and 32 are the same business, deduplicated.",
    "tags": [
      "discount",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://www.bigbazar.nl/",
    "sourceUrls": [
      "https://www.bigbazar.nl/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 17,
    "status": "open",
    "schemaType": "Store",
    "inclusionStatus": "confirmed_core",
    "inclusionReason": "On Kamp (Kamp 15-17 complex; occupies no. 17), core De Kamp street. Distinct from SPAR City on the existing list. Confirmed open with current hours. Candidates 18 and 32 are the same business, deduplicated.",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Boodschappen",
      "Vertrouwde namen"
    ]
  },
  {
    "id": "k-the-fat-tiger",
    "name": "The Fat Tiger",
    "category": "Eten & drinken",
    "subcategory": "Takeaway / delivery",
    "address": "Kamp 18",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "The Fat Tiger — takeaway / delivery op Kamp 18 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "The Fat Tiger is gevestigd op Kamp 18 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Kamp 18, core De Kamp street. Active Vietnamese/Asian takeaway & delivery (banh mi, bowls, bubble tea); own site shows current 7-day hours. Shares Kamp 18 with other tenants.",
    "tags": [
      "takeaway",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://www.the-fat-tiger-amersfoort.nl/",
    "sourceUrls": [
      "https://www.the-fat-tiger-amersfoort.nl/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 18,
    "status": "open",
    "schemaType": "Restaurant",
    "inclusionStatus": "confirmed_core",
    "inclusionReason": "On Kamp 18, core De Kamp street. Active Vietnamese/Asian takeaway & delivery (banh mi, bowls, bubble tea); own site shows current 7-day hours. Shares Kamp 18 with other tenants.",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Uit eten",
      "Samen tafelen",
      "Snelle hap",
      "Afhalen"
    ]
  },
  {
    "id": "k-zitgeluk",
    "name": "Zitgeluk",
    "category": "Interieur & kunst",
    "subcategory": "Interior / furniture store",
    "address": "Kamp 18",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Zitgeluk — interior / furniture store op Kamp 18 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Zitgeluk is gevestigd op Kamp 18 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Kamp 18, core De Kamp street (some directories also tag a connected Coninckstraat unit behind the same block). Active furniture store specialising in seating, plus lighting, cabinets, tables (033 741 0150). Own website confirms. Distinct from The Fat Tiger at the same number",
    "tags": [
      "interior",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://zitgeluk.nl/",
    "sourceUrls": [
      "https://zitgeluk.nl/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 18,
    "status": "open",
    "schemaType": "FurnitureStore",
    "inclusionStatus": "confirmed_core",
    "inclusionReason": "On Kamp 18, core De Kamp street (some directories also tag a connected Coninckstraat unit behind the same block). Active furniture store specialising in seating, plus lighting, cabinets, tables (033 741 0150). Own website confirms. Distinct from The Fat Tiger at the same number.",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Interieur & wonen",
      "Inspiratie opdoen"
    ]
  },
  {
    "id": "k-arthur-willemijn-stores",
    "name": "Arthur & Willemijn Stores",
    "category": "Mode & sieraden",
    "subcategory": "Women's fashion / clothing store",
    "address": "Kamp 19",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Arthur & Willemijn Stores — women's fashion / clothing store op Kamp 19 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Arthur & Willemijn Stores is gevestigd op Kamp 19 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Kamp 19, core De Kamp street. Long-running (since 1978) womenswear store; the Kamp is the original/flagship store (033 4727291). Active. Shares the Kamp 19 complex with ReYoutiefull and Saya Boutique Hotel.",
    "tags": [
      "women's fashion",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://www.arthurenwillemijn.nl/",
    "sourceUrls": [
      "https://www.arthurenwillemijn.nl/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 19,
    "status": "open",
    "schemaType": "ClothingStore",
    "inclusionStatus": "confirmed_core",
    "inclusionReason": "On Kamp 19, core De Kamp street. Long-running (since 1978) womenswear store; the Kamp is the original/flagship store (033 4727291). Active. Shares the Kamp 19 complex with ReYoutiefull and Saya Boutique Hotel.",
    "imageUrl": "https://www.arthurenwillemijn.nl/files/logo/factif-logo.jpg",
    "imageFit": "cover",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Shoppen",
      "Cadeau zoeken"
    ]
  },
  {
    "id": "k-reyoutiefull-store",
    "name": "ReYoutiefull Store",
    "category": "Mode & sieraden",
    "subcategory": "Sustainable concept / second-hand & consignment fashion store",
    "address": "Kamp 19",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "ReYoutiefull Store — sustainable concept / second-hand & consignment fashion store op Kamp 19 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "ReYoutiefull Store is gevestigd op Kamp 19 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Kamp 19, core De Kamp street. Sustainable retail concept by Arthur & Willemijn in their original Kamp building; VVV lists it as a current location. Distinct from the Saya Boutique Hotel that also occupies the Kamp 19 complex. Candidates 15, 20 are the same store; t",
    "tags": [
      "sustainable concept",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://www.arthurenwillemijn.nl/over-ons/reyoutiefull/",
    "sourceUrls": [
      "https://www.arthurenwillemijn.nl/over-ons/reyoutiefull/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 19,
    "status": "open",
    "schemaType": "ClothingStore",
    "inclusionStatus": "confirmed_core",
    "inclusionReason": "On Kamp 19, core De Kamp street. Sustainable retail concept by Arthur & Willemijn in their original Kamp building; VVV lists it as a current location. Distinct from the Saya Boutique Hotel that also occupies the Kamp 19 complex. Candidates 15, 20 are the same store; the 'Be-youtie-full boutique HOTEL' part of candidate 15 is superseded by Saya (see reject).",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Shoppen",
      "Cadeau zoeken"
    ]
  },
  {
    "id": "saya-boutique-hotel",
    "name": "Saya Boutique Hotel",
    "category": "Slapen",
    "subcategory": "Boutique hotel",
    "address": "Kamp 19",
    "postalCode": "3811 AM",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Stijlvol selfservice boutiquehotel op de Kamp: zelf inchecken via lockbox, luxe kamers, eigen terras en gratis snelle wifi.",
    "longDescription": "Saya Boutique Hotel is een sfeervol selfservice boutiquehotel midden in het centrum van Amersfoort, op loopafstand van de winkelstraten en de Kamperbinnenpoort. Je checkt zelf in via een lockbox en verblijft in luxe ingerichte kamers met een eigen terrasje en gratis supersnelle wifi. Ontbijt is van dinsdag t/m zaterdag op de kamer bij te boeken, in samenwerking met Anna's Smaakatelier.",
    "tags": [
      "hotel",
      "boutique hotel",
      "overnachten",
      "selfservice",
      "Kamp",
      "Selfservice boutiquehotel",
      "Zelf inchecken via lockbox",
      "Luxe kamers"
    ],
    "websiteUrl": "https://sayahotel.nl",
    "phone": "033-4229111",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/3873092799/saya-boutique-hotel",
      "https://sayahotel.nl",
      "https://www.booking.com/hotel/nl/beyoutiefull-boutique.html",
      "https://www.booking.com/reviews/nl/hotel/beyoutiefull-boutique.en-gb.html",
      "https://www.tripadvisor.com/Hotel_Review-g188613-d23978322-Reviews-Saya_Boutique_Hotel-Amersfoort.html",
      "https://www.google.com/travel/hotels/entity/ChoInNb2n-fV273tARoNL2cvMTFxNDY1NF83eBAB"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 19,
    "status": "open",
    "lat": 52.157424,
    "lng": 5.394184,
    "geoConfidence": "high",
    "specialties": [
      "Selfservice boutiquehotel",
      "Zelf inchecken via lockbox",
      "Luxe kamers",
      "Eigen terras",
      "Gratis snelle wifi",
      "Ontbijt op de kamer (di-za)"
    ],
    "keyFacts": [
      {
        "label": "Type",
        "value": "Selfservice boutiquehotel"
      },
      {
        "label": "Inchecken",
        "value": "Zelf via lockbox, vanaf 15:00"
      },
      {
        "label": "Uitchecken",
        "value": "Tot 11:00"
      },
      {
        "label": "Ontbijt",
        "value": "Bij te boeken op de kamer (di t/m za), i.s.m. Anna's Smaakatelier"
      },
      {
        "label": "Wifi",
        "value": "Gratis, supersnel"
      },
      {
        "label": "Beoordeling",
        "value": "8,6/10 op Booking.com (482 reviews)"
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Saya%20Boutique%20Hotel%2C%20Kamp%2019%2C%20Amersfoort&query_place_id=",
    "hasGoogleReviews": true,
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/saya-boutique-hotel-1_1078014669.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl listing)",
    "schemaType": "Hotel",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/saya-boutique-hotel-1_1078014669.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Overnachten",
      "Weekendje weg"
    ]
  },
  {
    "id": "new-robert-harms-tweewielers",
    "name": "Robert Harms Tweewielers",
    "category": "Winkels & makers",
    "subcategory": "Fietsenwinkel & -reparatie",
    "address": "Kamp 20",
    "postalCode": "3811 AR",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Fietsenwinkel op de gezellige Kamp: van Batavus en Gazelle tot e-bikes, plus specialist in aangepaste fietsen en Tworby-driewielers.",
    "longDescription": "Robert Harms Tweewielers zit midden in het centrum van Amersfoort, op de gezellige winkelstraat de Kamp, met een ruim assortiment stads-, e- en transportfietsen van merken als Batavus, Gazelle en Pointer. De winkel onderscheidt zich met aangepaste fietsen: als dealer van de Tworby-ombouwmodule en van Huka-driewielers maak je hier op afspraak (vaak samen met een ergotherapeut) een proefrit om veilig te blijven fietsen. Daarnaast kun je terecht voor reparaties, onderhoud en deskundig advies voor elke tweewieler.",
    "tags": [
      "Stads- en e-bikes",
      "Aangepaste fietsen",
      "Tworby-driewielers",
      "Huka-driewielers",
      "Reparatie & onderhoud",
      "Batavus & Gazelle",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://www.robertharms.nl",
    "instagramUrl": "https://www.instagram.com/robertharms.nl/",
    "facebookUrl": "https://www.facebook.com/robertharms.nl",
    "sourceUrls": [
      "https://www.robertharms.nl/nl/",
      "https://www.robertharms.nl/nl/service/vestigingen/",
      "https://www.pointerfietsen.nl/3811-ar-20-robert-harms-tweewielers-amersfoort/",
      "https://www.huka.nl/verkooppunten/robert-harms-amersfoort/",
      "https://www.tijdvooramersfoort.nl/nl/locaties/106203899/robert-harms-tweewielers-amersfoort",
      "https://nl.polomap.com/amersfoort/153515"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 20,
    "status": "open",
    "lat": 52.15755,
    "lng": 5.394028,
    "geoConfidence": "high",
    "priceRange": "€€",
    "specialties": [
      "Stads- en e-bikes",
      "Aangepaste fietsen",
      "Tworby-driewielers",
      "Huka-driewielers",
      "Reparatie & onderhoud",
      "Batavus & Gazelle"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Kamp 20 (ook Kamp 18), 3811 AR Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "033 785 2578"
      },
      {
        "label": "E-mail",
        "value": "info@robertharms.nl"
      },
      {
        "label": "Specialiteit",
        "value": "Aangepaste fietsen & driewielers (Tworby, Huka)"
      },
      {
        "label": "Keten sinds",
        "value": "2002"
      },
      {
        "label": "Vestigingen",
        "value": "Amersfoort, Laren, Baarn, Diemen"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "13:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "09:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "09:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "09:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "09:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "09:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Robert+Harms+Tweewielers+Kamp+20+Amersfoort",
    "hasGoogleReviews": false,
    "schemaType": "Store",
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09144_2743354581.jpg",
    "imageCandidateSource": "assets.plaece.nl",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09144_2743354581.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Shoppen",
      "Lokaal & ambachtelijk"
    ],
    "priceLevel": "mid"
  },
  {
    "id": "k-wibra-amersfoort",
    "name": "Wibra Amersfoort",
    "category": "Keten / anker",
    "subcategory": "Discount variety / textiles & household store",
    "address": "Kamp 20-22",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Wibra Amersfoort — discount variety / textiles & household store op Kamp 20-22 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Wibra Amersfoort is gevestigd op Kamp 20-22 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Kamp 20-22, core De Kamp street. Confirmed open with current hours (033 4767778). Distinct from Robert Harms Tweewielers (Kamp 20) on the existing list. Candidates 22 and 35 are the same business, deduplicated.",
    "tags": [
      "discount variety",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://www.wibra.nl/",
    "sourceUrls": [
      "https://www.wibra.nl/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 20,
    "status": "open",
    "schemaType": "Store",
    "inclusionStatus": "confirmed_core",
    "inclusionReason": "On Kamp 20-22, core De Kamp street. Confirmed open with current hours (033 4767778). Distinct from Robert Harms Tweewielers (Kamp 20) on the existing list. Candidates 22 and 35 are the same business, deduplicated.",
    "imageUrl": "https://www.wibra.nl/wp-content/uploads/sites/3/2022/02/logo-wibra.png",
    "imageFit": "cover",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Boodschappen",
      "Vertrouwde namen"
    ]
  },
  {
    "id": "new-runnersworld-aart-stigter",
    "name": "Runnersworld Aart Stigter (nu Runners4Life)",
    "category": "Winkels & makers",
    "subcategory": "Hardloopspeciaalzaak",
    "address": "Kamp 25",
    "postalCode": "3811 AM",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Hardloopspecialist aan de Kamp: persoonlijk schoenadvies, loopanalyse en topmerken. Sinds 2021 verder als Runners4Life.",
    "longDescription": "De vertrouwde hardloopwinkel aan de Kamp 25, ooit bekend als Runnersworld Aart Stigter, gaat sinds januari 2021 verder onder de naam Runners4Life. Het ervaren team van fervente hardlopers helpt zowel beginners als gevorderden met persoonlijk advies, een professionele loopanalyse en een breed assortiment hardloopschoenen, kleding en accessoires van topmerken. Met een 4,7-sterrenwaardering op Google is dit al jaren hét adres voor hardlopend Amersfoort, op loopafstand van de Kamperbinnenpoort.",
    "tags": [
      "Hardloopschoenen",
      "Loopanalyse",
      "Persoonlijk schoenadvies",
      "Hardloopkleding",
      "Loopgroepen & clinics",
      "Topmerken",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://runnersworldamersfoort.nl",
    "instagramUrl": "https://www.instagram.com/runners4life.nl/",
    "facebookUrl": "https://www.facebook.com/Runners4Life.nl/",
    "sourceUrls": [
      "https://runners4life.nl/de-winkel/",
      "https://www.openingstijdengids.nl/runnersworld/amersfoort/1",
      "https://www.openingstijden.nl/Runnersworld/Amersfoort/Kamp-25/",
      "https://www.tiendeo.nl/Winkels/amersfoort/runnersworld-kamp/59360",
      "https://www.yoys.nl/phone,31-337600061,Hardloopwinkel,Amersfoort,NL71450.html",
      "https://www.northdata.com/Runners4Life%20B%C2%B7V%C2%B7,%20Amersfoort/KVK%2081088582"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 25,
    "status": "open",
    "lat": 52.1575091,
    "lng": 5.394478,
    "geoConfidence": "high",
    "priceRange": "€€",
    "specialties": [
      "Hardloopschoenen",
      "Loopanalyse",
      "Persoonlijk schoenadvies",
      "Hardloopkleding",
      "Loopgroepen & clinics",
      "Topmerken"
    ],
    "keyFacts": [
      {
        "label": "Nu bekend als",
        "value": "Runners4Life"
      },
      {
        "label": "Naamswijziging",
        "value": "januari 2021"
      },
      {
        "label": "Telefoon",
        "value": "033 760 0061"
      },
      {
        "label": "Google-beoordeling",
        "value": "4,7 / 5 (±135 reviews)"
      },
      {
        "label": "Specialisatie",
        "value": "Hardloopwinkel & loopanalyse"
      },
      {
        "label": "Adres",
        "value": "Kamp 25, 3811 AM Amersfoort"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "12:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "09:30",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "09:30",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "09:30",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "09:30",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "09:30",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "12:00",
            "close": "16:00"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/place/Kamp+25,+3811+AM+Amersfoort/data=!4m2!3m1!1s0x47c6469c1c4679ad:0xd6400d5e22cb9767",
    "hasGoogleReviews": true,
    "schemaType": "Store",
    "imageCandidateUrl": "https://runners4life.nl/wp-content/uploads/2021/02/runners4life-winkel.png",
    "imageCandidateSource": "runners4life.nl",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://runners4life.nl/wp-content/uploads/2021/02/runners4life-winkel.png",
    "imageFit": "cover",
    "perfectFor": [
      "Shoppen",
      "Lokaal & ambachtelijk"
    ],
    "priceLevel": "mid"
  },
  {
    "id": "k-kapsalon-sepideh",
    "name": "Kapsalon Sepideh",
    "category": "Beauty & verzorging",
    "subcategory": "Hair salon",
    "address": "Kamp 26",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Kapsalon Sepideh — hair salon op Kamp 26 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Kapsalon Sepideh is gevestigd op Kamp 26 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Kamp 26, core De Kamp street. Active salon (033 8886031). Shares house number with 'Werners Optiek - Kamp 26' on the existing list; the two occupy different units/floors at the same address, so this is a distinct business. No dedicated own-domain website found; place",
    "tags": [
      "hair salon",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://haar.expert/kapsalons/kapsalon-sepideh-kamp-26-3811ar-amersfoort",
    "sourceUrls": [
      "https://haar.expert/kapsalons/kapsalon-sepideh-kamp-26-3811ar-amersfoort"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 26,
    "status": "open",
    "schemaType": "HairSalon",
    "inclusionStatus": "confirmed_core",
    "inclusionReason": "On Kamp 26, core De Kamp street. Active salon (033 8886031). Shares house number with 'Werners Optiek - Kamp 26' on the existing list; the two occupy different units/floors at the same address, so this is a distinct business. No dedicated own-domain website found; placeholder is a directory page.",
    "imageUrl": "https://8723153915a94d8b033f-50c48ed79b54074d1364733415261e68.ssl.cf3.rackcdn.com/images/haar-expert-background.jpg",
    "imageFit": "cover",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Verwennen",
      "Me-time"
    ]
  },
  {
    "id": "new-werners-optiek",
    "name": "Werners Optiek",
    "category": "Services & praktisch",
    "subcategory": "Opticien & oogzorg",
    "address": "Kamp 26",
    "postalCode": "3811 AN",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Persoonlijke opticien aan de Kamp sinds 2019. Brillen met een verhaal van kleine ateliers, eigenhandig gebouwd interieur en grondige oogmeting.",
    "longDescription": "Werners Optiek is sinds 1 maart 2019 de eigenzinnige opticien van Werner Bakker aan de Kamp in Amersfoort, die zijn winkel met de hand bouwde rond een werktafel van massief iepenhout. Naast bekende modemerken werkt hij met kleine ateliers met een verhaal, zoals het Japanse Eyevan (handgerolde titanium veren) en de Belgische ontwerper Pierre. Verwacht een grondige oogmeting, persoonlijk advies, Hoya-glazen en alle tijd om de bril te vinden die jou bijzonder maakt.",
    "tags": [
      "Persoonlijk brilladvies",
      "Exclusieve ateliermerken",
      "Eyevan handgemaakt Japan",
      "Grondige oogmeting",
      "Contactlenzen",
      "Hoya glazen",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://www.wernersoptiek.nl",
    "instagramUrl": "https://www.instagram.com/wernersoptiek_amersfoort/",
    "facebookUrl": "https://www.facebook.com/WernersOptiek/",
    "sourceUrls": [
      "https://www.wernersoptiek.nl/",
      "https://www.tijdvooramersfoort.nl/en/locations/1707212240/werners-optics",
      "https://www.vvvamersfoort.nl/en/locations/1879/werners-optiek",
      "https://www.destadamersfoort.nl/zakelijk/nieuws/217837/brillen-met-een-verhaal-586612",
      "https://www.openingstijden.com/open/werners-optiek/amersfoort/",
      "https://www.facebook.com/WernersOptiek/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 26,
    "status": "open",
    "lat": 52.15761,
    "lng": 5.39424,
    "geoConfidence": "high",
    "specialties": [
      "Persoonlijk brilladvies",
      "Exclusieve ateliermerken",
      "Eyevan handgemaakt Japan",
      "Grondige oogmeting",
      "Contactlenzen",
      "Hoya glazen"
    ],
    "keyFacts": [
      {
        "label": "Sinds",
        "value": "2019"
      },
      {
        "label": "Opticien",
        "value": "Werner Bakker"
      },
      {
        "label": "Specialiteit",
        "value": "Brillen van kleine ateliers"
      },
      {
        "label": "Topmerken",
        "value": "Eyevan, Pierre"
      },
      {
        "label": "Glazen",
        "value": "Hoya"
      },
      {
        "label": "Donderdag",
        "value": "Koopavond tot 20:00"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "09:30",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "09:30",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "09:30",
            "close": "20:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "09:30",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "09:30",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Werners+Optiek+Kamp+26+Amersfoort",
    "hasGoogleReviews": false,
    "schemaType": "BeautySalon",
    "imageCandidateUrl": "https://www.wernersoptiek.nl/wp-content/uploads/2025/07/IMG_20250702_152341-scaled-600x600.jpg",
    "imageCandidateSource": "wernersoptiek.nl",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://www.wernersoptiek.nl/wp-content/uploads/2025/07/IMG_20250702_152341-scaled.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Praktisch geregeld"
    ]
  },
  {
    "id": "new-smart-repair-house",
    "name": "Smart Repair House",
    "category": "Services & praktisch",
    "subcategory": "Smartphone- & tabletreparatie en accessoires",
    "address": "Kamp 27",
    "postalCode": "3811 AM",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Smartphone- en tabletreparatie in hartje Amersfoort, schuin tegenover Scapino. Ook hoesjes, screenprotectors en accessoires.",
    "longDescription": "Smart Repair House aan de Kamp 27 repareert je smartphone of tablet en maakt 'm weer als nieuw. Naast reparaties vind je er accessoires zoals telefoonhoesjes en screenprotectors. De winkel ligt in de Amersfoortse binnenstad, schuin tegenover Scapino, en is zeven dagen per week geopend met koopavond op donderdag.",
    "tags": [
      "telefoonreparatie",
      "smartphonereparatie",
      "tabletreparatie",
      "schermreparatie",
      "telefoonhoesjes",
      "screenprotectors",
      "accessoires",
      "binnenstad"
    ],
    "websiteUrl": "https://smartrepairhouse.nl",
    "phone": "033 479 0016",
    "sourceUrls": [
      "https://smartrepairhouse.nl"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 27,
    "status": "open",
    "lat": 52.1556,
    "lng": 5.3865,
    "geoConfidence": "low",
    "specialties": [
      "Smartphonereparatie",
      "Tabletreparatie",
      "Schermreparatie",
      "Telefoonhoesjes",
      "Screenprotectors",
      "Telefoonaccessoires"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Kamp 27, 3811 AM Amersfoort (schuin tegenover Scapino)"
      },
      {
        "label": "Telefoon",
        "value": "033 479 0016"
      },
      {
        "label": "E-mail",
        "value": "info@smartrepairhouse.nl"
      },
      {
        "label": "Specialisme",
        "value": "Smartphone- & tabletreparatie en accessoires"
      },
      {
        "label": "Koopavond",
        "value": "Donderdag tot 21:00"
      },
      {
        "label": "Geopend",
        "value": "7 dagen per week"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "13:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "09:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "09:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "09:30",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "09:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "09:30",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "12:00",
            "close": "17:00"
          }
        ]
      }
    ],
    "hasGoogleReviews": false,
    "schemaType": "Store",
    "imageCandidateSource": "none",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://smartrepairhouse.nl/media/c244a84ee5b1ae503f70482eb26ad3ad.png",
    "imageFit": "cover",
    "perfectFor": [
      "Praktisch geregeld"
    ]
  },
  {
    "id": "star-juwelier",
    "name": "Star Juwelier",
    "category": "Mode & sieraden",
    "subcategory": "Juwelier",
    "address": "Kamp 28",
    "postalCode": "3811 AM",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Vertrouwde juwelier op de Kamp sinds 1999. Specialist in 14-, 18- en 22-karaats gouden sieraden, trouwringen en maatwerk. Ook online via de webshop.",
    "longDescription": "Star Juwelier is sinds 1999 een vertrouwd familieadres in het centrum van Amersfoort, op de Kamp 28 vlak bij de Kamperbinnenpoort. De winkel is gespecialiseerd in 14-, 18- en 22-karaats gouden sieraden, trouwringen, kettingen, armbanden en horloges, met daarnaast maatwerk, handgravure, reparaties en het inkopen van goud. Je kunt er terecht in de stijlvolle winkel of online via de webshop, telkens met deskundig persoonlijk advies en een warm welkom.",
    "tags": [
      "juwelier",
      "sieraden",
      "trouwringen",
      "goud",
      "zilver",
      "Gouden sieraden 14/18/22 karaat",
      "Sieraden op maat",
      "Handgravure"
    ],
    "websiteUrl": "https://starjuwelier.nl",
    "phone": "+31 33 4752533",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/292785061/star-juwelier",
      "https://starjuwelier.nl (JSON-LD: geo, adres, openingstijden, telefoon, foundingDate, legalName)",
      "https://starjuwelier.nl/contact/ (openingstijden + social links Facebook/Instagram)",
      "https://www.tijdvooramersfoort.nl/nl/locaties/292785061/star-juwelier (JSON-LD geo-bevestiging + og:image foto)",
      "https://www.openingstijden.nl/Star-juwelier/Amersfoort/Kamp-28/ (openingstijden, telefoon)",
      "https://www.juwelier-in.nl/amersfoort/star-juwelier (omschrijving, diensten, sinds 1999)"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 28,
    "status": "open",
    "lat": 52.15763,
    "lng": 5.3943,
    "geoConfidence": "high",
    "specialties": [
      "Gouden sieraden 14/18/22 karaat",
      "Trouwringen",
      "Sieraden op maat",
      "Handgravure",
      "Reparaties",
      "Goud inkopen"
    ],
    "keyFacts": [
      {
        "label": "Sinds",
        "value": "1999"
      },
      {
        "label": "Type",
        "value": "Juwelier / goudsmid"
      },
      {
        "label": "Specialisatie",
        "value": "14-18-22 karaats goud & trouwringen"
      },
      {
        "label": "Adres",
        "value": "Kamp 28, 3811 AR Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "033 475 25 33 / 06 23244585"
      },
      {
        "label": "E-mail",
        "value": "info@starjuwelier.nl"
      },
      {
        "label": "Webshop",
        "value": "starjuwelier.nl"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "13:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "13:00",
            "close": "16:00"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Star+Juwelier+Kamp+28+Amersfoort",
    "hasGoogleReviews": true,
    "instagramUrl": "https://www.instagram.com/starjuwelier",
    "facebookUrl": "https://www.facebook.com/Starjuwelier",
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09153_3159453264.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl listing)",
    "schemaType": "JewelryStore",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09153_3159453264.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Shoppen",
      "Cadeau zoeken",
      "Trouwen & gala"
    ]
  },
  {
    "id": "k-sjenkels-amersfoort",
    "name": "Sjenkels Amersfoort",
    "category": "Beauty & verzorging",
    "subcategory": "Hair salon",
    "address": "Kamp 29",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Sjenkels Amersfoort — hair salon op Kamp 29 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Sjenkels Amersfoort is gevestigd op Kamp 29 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Kamp 29, core De Kamp street. Salon opened Sept 2023; Nexxt Hairsalon team merged in Nov 2025 - confirms it is currently active. Own website confirms address.",
    "tags": [
      "hair salon",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://sjenkels.nl/salons/amersfoort/",
    "sourceUrls": [
      "https://sjenkels.nl/salons/amersfoort/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 29,
    "status": "open",
    "schemaType": "HairSalon",
    "inclusionStatus": "confirmed_core",
    "inclusionReason": "On Kamp 29, core De Kamp street. Salon opened Sept 2023; Nexxt Hairsalon team merged in Nov 2025 - confirms it is currently active. Own website confirms address.",
    "imageUrl": "https://sjenkels.nl/wp-content/uploads/2024/03/Amersfoort-etalage.jpg",
    "imageFit": "cover",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Verwennen",
      "Me-time"
    ]
  },
  {
    "id": "hairbeautiful",
    "name": "HairBeautiful",
    "category": "Beauty & verzorging",
    "subcategory": "Hair & beauty salon",
    "address": "Kamp 30",
    "postalCode": "3811 AS",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Vertrouwde hair & beauty salon aan de gezellige Kamp, ruim 10 jaar ervaring. Knippen, kleuren, keratine en microblading — di t/m za.",
    "longDescription": "HairBeautiful is een gevestigde hair & beauty salon aan de sfeervolle Kamp 30 in het centrum van Amersfoort, met ruim tien jaar ervaring en gediplomeerde vakmensen. Naast knippen, kleuren en föhnen kun je hier terecht voor keratinebehandelingen, permanent, harsen en microblading, gewerkt met kwaliteitsproducten van onder meer Fanola. In een huiselijke, gastvrije sfeer staat een kopje koffie, thee of cappuccino voor je klaar; geopend dinsdag tot en met zaterdag van 10:00 tot 17:00 uur.",
    "tags": [
      "kapper",
      "beauty",
      "haarsalon",
      "Kamp",
      "verzorging",
      "Knippen & kleuren",
      "Keratinebehandeling",
      "Microblading"
    ],
    "websiteUrl": "https://www.hairbeautiful.nl",
    "phone": "033 888 62 53",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/1875048216/hairbeautiful",
      "https://www.hairbeautiful.nl/",
      "https://www.facebook.com/HairBeautifulofficial/",
      "https://www.instagram.com/hairbeautifulofficial"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 30,
    "status": "open",
    "lat": 52.157644,
    "lng": 5.394356,
    "geoConfidence": "high",
    "specialties": [
      "Knippen & kleuren",
      "Keratinebehandeling",
      "Microblading",
      "Föhnen & styling",
      "Harsen & epileren",
      "Fanola-producten"
    ],
    "keyFacts": [
      {
        "label": "Ervaring",
        "value": "Ruim 10 jaar"
      },
      {
        "label": "Telefoon",
        "value": "033 888 62 53"
      },
      {
        "label": "E-mail",
        "value": "info@hairbeautiful.nl"
      },
      {
        "label": "Adres",
        "value": "Kamp 30, 3811 AS Amersfoort"
      },
      {
        "label": "Type",
        "value": "Hair & beauty salon"
      },
      {
        "label": "Extra",
        "value": "Gratis koffie, thee of cappuccino"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/dir/?api=1&destination=52.157644%2C5.394356",
    "hasGoogleReviews": false,
    "instagramUrl": "https://www.instagram.com/hairbeautifulofficial",
    "facebookUrl": "https://www.facebook.com/HairBeautifulofficial",
    "imageCandidateUrl": "https://primary.jwwb.nl/public/m/v/h/temp-ovguflimqujsuzympgjd/mez0ym/FanolaFiberFix.jpg",
    "imageCandidateSource": "primary.jwwb.nl",
    "schemaType": "BeautySalon",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/thumb/qE03y0FhtNzUNhLUUdT2eS660Q1Ys-3wF5v5whAoPpQ/resizing_type:fit/width:960/height:0/gravity:sm/enlarge:0/aHR0cHM6Ly9hc3NldHMucGxhZWNlLm5sL29kcC11YmFzZS9pbWFnZS9kc2MwOTE1Ml8zODk3Nzg5MzAyLmpwZw.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Verwennen",
      "Me-time"
    ]
  },
  {
    "id": "poke2go",
    "name": "Poke2Go Amersfoort",
    "category": "Eten & drinken",
    "subcategory": "Poké bowls en açaí bowls",
    "address": "Kamp 32",
    "postalCode": "3811 AS",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Verse poké bowls, açaí bowls en desserts om zelf samen te stellen op de Kamp — met zalm, tonijn of vegan toppings, snel afgehaald of bezorgd.",
    "longDescription": "Bij Poke2Go aan de Kamp 32 stel je je eigen Hawaiiaanse poké bowl samen met verse vis, edamame, wakame en tientallen toppings, plus açaí bowls en desserts. Populaire keuzes zijn de 'Sweet Tuna' met tonijn, radijs en unagi-dressing en de 'Crunchy Chicken' met krokante kip en chili-mayo. Je bestelt eenvoudig online voor afhalen of bezorging; de zaak scoort gemiddeld rond de 4 sterren over ruim 430 reviews.",
    "tags": [
      "poké",
      "açaí",
      "bowls",
      "vegan",
      "afhalen",
      "Poké bowls op maat",
      "Açaí bowls",
      "Verse vis (zalm & tonijn)"
    ],
    "websiteUrl": "https://poke2go.nl",
    "phone": "033-2023262",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/415614862/poke2go-amersfoort",
      "https://amersfoort.poke2go.nl (officiële website — JSON-LD Restaurant schema: telefoon, geo, openingstijden, aggregateRating)",
      "https://amersfoort.poke2go.nl/informatie (zichtbare openingstijden bevestigen JSON-LD)",
      "https://www.tijdvooramersfoort.nl/nl/locaties/415614862/poke2go-amersfoort (JSON-LD Place: adres, geo 52.157664/5.394425, og:image business-foto's)",
      "https://www.facebook.com/Pokeg2oAmersfoort/ (live, HTTP 200)",
      "https://www.instagram.com/poke2go.amersfoort/ (live, HTTP 200)"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 32,
    "status": "open",
    "lat": 52.15771,
    "lng": 5.39445,
    "geoConfidence": "high",
    "priceRange": "€€",
    "specialties": [
      "Poké bowls op maat",
      "Açaí bowls",
      "Verse vis (zalm & tonijn)",
      "Vegan opties",
      "Desserts",
      "Afhalen & bezorgen"
    ],
    "keyFacts": [
      {
        "label": "Keuken",
        "value": "Poké / Hawaiiaans"
      },
      {
        "label": "Adres",
        "value": "Kamp 32, 3811 AS Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "033-2023262"
      },
      {
        "label": "Reviews",
        "value": "± 4,0 sterren (435 beoordelingen)"
      },
      {
        "label": "Dieet",
        "value": "Vegan opties beschikbaar"
      },
      {
        "label": "Service",
        "value": "Online bestellen, afhalen & bezorgen"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "16:00",
            "close": "20:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "16:00",
            "close": "20:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "16:00",
            "close": "20:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "16:00",
            "close": "20:00"
          }
        ]
      },
      {
        "day": "friday",
        "closed": true,
        "periods": []
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "16:00",
            "close": "20:00"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "16:00",
            "close": "20:00"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Poke2Go+Amersfoort+Kamp+32+Amersfoort",
    "hasGoogleReviews": true,
    "instagramUrl": "https://www.instagram.com/poke2go.amersfoort/",
    "facebookUrl": "https://www.facebook.com/Pokeg2oAmersfoort/",
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/dsc01372_2007811633.jpg",
    "imageCandidateSource": "assets.plaece.nl",
    "schemaType": "Restaurant",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dsc01372_2007811633.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Uit eten",
      "Samen tafelen",
      "Vegan",
      "Snelle hap"
    ],
    "priceLevel": "mid"
  },
  {
    "id": "jacks-casino-sports",
    "name": "Jack's Casino & Sports Amersfoort",
    "category": "Keten / anker",
    "subcategory": "Casino en sports",
    "address": "Kamp 33",
    "postalCode": "3811 AM",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Sfeervol Jack's Casino & Sports in hartje Amersfoort aan de Kamp: gokkasten, roulette, live sportweddenschappen én verse keuken. Gratis entree.",
    "longDescription": "Midden in het centrum van Amersfoort, aan de gezellige winkelstraat de Kamp, vind je Jack's Casino & Sports. Naast een breed aanbod gokkasten, videoslots en roulettetafels kun je hier live wedden op voetbal, darts, tennis en meer, terwijl de eigen koks zorgen voor culinaire verrassingen. Met gratis entree, gratis snacks, drankjes en wifi en dagelijks ruime openingstijden (door de week tot 01.00 uur, in het weekend tot 02.00 uur) is het een toegankelijke uitgaansplek in de binnenstad.",
    "tags": [
      "casino",
      "sports",
      "18+",
      "uitgaan",
      "Kamp",
      "Gokkasten & videoslots",
      "Roulette",
      "Live sportweddenschappen"
    ],
    "websiteUrl": "https://www.jacks.nl",
    "phone": "+35620993015",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/4040331392/jack-s-casino-sports-amersfoort",
      "https://www.jacks.nl",
      "https://www.jackscasino.nl/vestigingen/amersfoort",
      "https://www.openingstijden.nl/Jacks-Casino/Amersfoort/Kamp-33/",
      "https://www.telefoonboek.nl/bedrijven/t3852508/amersfoort/jacks-casino-amersfoort/",
      "https://www.jvhgaming.com/nl/content/over-jvh/historie.html"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 33,
    "status": "open",
    "lat": 52.157625,
    "lng": 5.394884,
    "geoConfidence": "high",
    "priceRange": "€€",
    "specialties": [
      "Gokkasten & videoslots",
      "Roulette",
      "Live sportweddenschappen",
      "Eigen keuken",
      "Gratis entree",
      "Centrum Amersfoort"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Kamp 33, 3811 AM Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "033 479 5238"
      },
      {
        "label": "Entree",
        "value": "Gratis"
      },
      {
        "label": "Keten sinds",
        "value": "2003 (JVH Gaming)"
      },
      {
        "label": "Wedden op",
        "value": "Voetbal, darts, tennis, F1"
      },
      {
        "label": "Extra",
        "value": "Gratis snacks, drankjes & wifi"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "09:00",
            "close": "01:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "09:00",
            "close": "01:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "09:00",
            "close": "01:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "09:00",
            "close": "02:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "09:00",
            "close": "02:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "09:00",
            "close": "02:00"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "09:00",
            "close": "01:00"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Jack%27s%20Casino%20%26%20Sports%20Amersfoort%2C%20Kamp%2033%2C%20Amersfoort",
    "hasGoogleReviews": true,
    "instagramUrl": "https://www.instagram.com/jacks.casino/",
    "facebookUrl": "https://www.facebook.com/jackscasinoamersfoort",
    "imageCandidateUrl": "https://jacks.nl/media/2023-04/jacksnl-opengraph.jpg",
    "imageCandidateSource": "jacks.nl",
    "schemaType": "EntertainmentBusiness",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09157_1111233745.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Boodschappen",
      "Vertrouwde namen"
    ],
    "priceLevel": "mid"
  },
  {
    "id": "indian-flavour",
    "name": "Indian Flavour",
    "category": "Eten & drinken",
    "subcategory": "Indiaas en Surinaams afhaalrestaurant",
    "address": "Kamp 34",
    "postalCode": "3811 AS",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Indiaas afhaal- en bezorgrestaurant aan de gezellige Kamp: 100% halal currys, biryani's en Surinaamse roti's om mee te nemen.",
    "longDescription": "Indian Flavour serveert authentieke Indiase gerechten aan de Kamp 34, midden in de levendige winkelstraat van Amersfoort. Op het menu staan onder meer geurige curry's, biryani's en Surinaamse roti's, allemaal 100% halal en met volop vegetarische keuzes. Je kunt elke dag in de middag en avond afhalen of laten bezorgen.",
    "tags": [
      "Indiaas",
      "Surinaams",
      "curry",
      "roti",
      "afhalen",
      "100% Halal",
      "Curry's",
      "Biryani"
    ],
    "websiteUrl": "https://indianflavour.nl",
    "phone": "0334721035",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/112407254/indian-flavour",
      "https://assets.plaece.nl/odp-ubase/image/dsc09155_917558258.jpg",
      "https://www.indianflavour-amersfoort.nl/contact",
      "https://restaurantguru.com/Indiaas-Restaurant-Indian-Flavour-Amersfoort",
      "https://www.facebook.com/p/Indian-Flavour-100054489487818/",
      "https://www.waze.com/live-map/directions/netherlands/utrecht/amersfoort/indiaas-restaurant-indian-flavour"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 34,
    "status": "open",
    "lat": 52.157713,
    "lng": 5.394481,
    "geoConfidence": "high",
    "priceRange": "€",
    "specialties": [
      "Indiaas",
      "100% Halal",
      "Curry's",
      "Biryani",
      "Surinaamse roti",
      "Afhalen & bezorgen"
    ],
    "keyFacts": [
      {
        "label": "Keuken",
        "value": "Indiaas / Surinaams"
      },
      {
        "label": "Halal",
        "value": "100% halal"
      },
      {
        "label": "Adres",
        "value": "Kamp 34, 3811 AS Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "033 472 1035"
      },
      {
        "label": "Service",
        "value": "Afhalen & bezorgen"
      },
      {
        "label": "Google-score",
        "value": "ca. 3,8/5 (ruim 270 reviews)"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "15:00",
            "close": "22:45"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "15:00",
            "close": "22:45"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "15:00",
            "close": "22:45"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "15:00",
            "close": "22:45"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "15:00",
            "close": "22:45"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "15:00",
            "close": "22:45"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "15:00",
            "close": "22:45"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Indian%20Flavour%20Kamp%2034%20Amersfoort&query_place_id=ChIJobQb6ZpGxkcRiQEUg-GBAwk",
    "hasGoogleReviews": true,
    "facebookUrl": "https://www.facebook.com/p/Indian-Flavour-100054489487818/",
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09155_917558258.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl listing)",
    "schemaType": "Restaurant",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09155_917558258.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Uit eten",
      "Samen tafelen",
      "Snelle hap",
      "Afhalen"
    ],
    "priceLevel": "budget"
  },
  {
    "id": "new-scapino",
    "name": "Scapino Amersfoort",
    "category": "Keten / anker",
    "subcategory": "Schoenen, sport- & vrijetijdskleding",
    "address": "Kamp 36 / 36A",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Voordelige schoenen, sport- en vrijetijdskleding voor het hele gezin, midden in de Amersfoortse binnenstad aan de Kamp. Donderdag koopavond.",
    "longDescription": "Scapino aan de Kamp 36 is de vertrouwde voordeelwinkel in de Amersfoortse binnenstad voor schoenen, sportartikelen en vrijetijdskleding voor dames, heren en kinderen. De compacte maar overzichtelijk ingerichte winkel ligt op loopafstand van de Kamperbinnenpoort en is van maandag tot en met zaterdag open, met donderdag koopavond tot 21:00 en op zondag van 12:00 tot 17:00. Bekend om de lage prijzen en de laagsteprijsgarantie van de keten.",
    "tags": [
      "Schoenen",
      "Sportartikelen",
      "Vrijetijdskleding",
      "Kinderschoenen",
      "Lage prijzen",
      "Binnenstad Amersfoort",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://www.scapino.nl",
    "instagramUrl": "https://www.instagram.com/scapinonl/",
    "facebookUrl": "https://www.facebook.com/ScapinoNL.Amersfoort/",
    "sourceUrls": [
      "https://www.scapino.nl/winkels/scapino-amersfoort-510049/",
      "https://www.openingstijdengids.nl/scapino/amersfoort/1",
      "https://www.openingstijden.nl/Scapino/Amersfoort/Kamp-36/",
      "https://www.facebook.com/ScapinoNL.Amersfoort/",
      "https://www.instagram.com/scapinonl/",
      "https://www.google.com/maps/search/?api=1&query=Scapino+Kamp+36+Amersfoort"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 36,
    "status": "open",
    "lat": 52.15766,
    "lng": 5.39476,
    "geoConfidence": "high",
    "priceRange": "€",
    "specialties": [
      "Schoenen",
      "Sportartikelen",
      "Vrijetijdskleding",
      "Kinderschoenen",
      "Lage prijzen",
      "Binnenstad Amersfoort"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Kamp 36, 3811 AS Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "033 470 0106"
      },
      {
        "label": "Assortiment",
        "value": "Schoenen, sport- & vrijetijdskleding"
      },
      {
        "label": "Koopavond",
        "value": "Donderdag tot 21:00"
      },
      {
        "label": "Doelgroep",
        "value": "Dames, heren & kinderen"
      },
      {
        "label": "Keten",
        "value": "Scapino (laagsteprijsgarantie)"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "09:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "09:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "09:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "09:30",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "09:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "09:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "12:00",
            "close": "17:00"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Scapino+Kamp+36+Amersfoort",
    "hasGoogleReviews": true,
    "schemaType": "Restaurant",
    "imageCandidateUrl": "https://www.scapino.nl/logo-114.png",
    "imageCandidateSource": "scapino.nl",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/locaties-stad-28_2921529205.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Boodschappen",
      "Vertrouwde namen",
      "Met kinderen"
    ],
    "priceLevel": "budget"
  },
  {
    "id": "holland-parket",
    "name": "Holland Parket",
    "category": "Interieur & kunst",
    "subcategory": "Vloeren en parket",
    "address": "Kamp 37",
    "postalCode": "3811 AN",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Vloerenspecialist in een sfeervolle showroom op de Kamp: ruim 2.500 houten, PVC-, laminaat- en kurkvloeren, met eigen ervaren vloerleggers.",
    "longDescription": "Holland Parket is dé vloerenspecialist van midden-Nederland en heeft zijn Amersfoortse showroom op Kamp 37, midden in de historische binnenstad. Je vindt er meer dan 2.500 vloeren: echte houten en parketvloeren, PVC en vinyl, laminaat en kurk, met deskundig en vrijblijvend advies. Bijzonder is dat het bedrijf werkt met eigen ervaren vloerleggers, die je vloer ook kunnen renoveren of schuren.",
    "tags": [
      "parket",
      "vloeren",
      "interieur",
      "woonwinkel",
      "Kamp",
      "Houten vloeren & parket",
      "PVC- en vinylvloeren",
      "Laminaat & kurk"
    ],
    "websiteUrl": "https://hollandparket.nl",
    "phone": "033 47 555 01",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/2564269941/holland-parket",
      "https://hollandparket.nl",
      "https://hollandparket.nl/vestigingen/amersfoort/",
      "https://www.openingstijden.nl/Holland-Parket/Amersfoort/Kamp-37/",
      "https://floorlife.nl/holland-parket-amersfoort/over-ons/",
      "https://www.klantenvertellen.nl/reviews/1038794/holland_parket"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 37,
    "status": "open",
    "lat": 52.157742,
    "lng": 5.395184,
    "geoConfidence": "high",
    "specialties": [
      "Houten vloeren & parket",
      "PVC- en vinylvloeren",
      "Laminaat & kurk",
      "Eigen vloerleggers",
      "Renoveren & schuren",
      "Vrijblijvend vloeradvies"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Kamp 37, 3811 AN Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "033 - 47 555 01"
      },
      {
        "label": "E-mail",
        "value": "amersfoort@hollandparket.nl"
      },
      {
        "label": "Opgericht",
        "value": "1988 (in Ede, door Wijnand van Beek)"
      },
      {
        "label": "Assortiment",
        "value": "Meer dan 2.500 vloeren"
      },
      {
        "label": "Bijzonder",
        "value": "Eigen ervaren vloerleggers"
      },
      {
        "label": "Branche",
        "value": "Vloerenspecialist / parket"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "16:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Holland+Parket+Kamp+37+Amersfoort",
    "hasGoogleReviews": false,
    "facebookUrl": "https://www.facebook.com/pages/Holland-Parket/338082472872350",
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/dsc05833_387444287.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl)",
    "schemaType": "FurnitureStore",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dsc05833_387444287.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Interieur & wonen",
      "Inspiratie opdoen"
    ]
  },
  {
    "id": "avondwinkel-sn",
    "name": "Avondwinkel S&N",
    "category": "Services & praktisch",
    "subcategory": "Avondwinkel",
    "address": "Kamp 39",
    "postalCode": "3811 AN",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Avondwinkel op de Kamp voor de hoge nood: snacks, snoep, drankjes, sigaretten en boodschappen tot diep in de nacht, ook in het weekend.",
    "longDescription": "Het Avondwinkeltje S&N aan de Kamp 39 is de vertrouwde avondwinkel in het Amersfoortse stadshart voor wanneer je 's avonds nog iets nodig hebt. Je vindt er een praktisch assortiment: zuivel, snacks, snoep, frisdrank, sigaretten en alcoholische dranken. De winkel is iedere dag open vanaf 16:00 uur en doordeweeks tot 01:00 uur, in het weekend zelfs tot 02:00 uur.",
    "tags": [
      "avondwinkel",
      "boodschappen",
      "laat open",
      "praktisch",
      "Kamp",
      "Snacks & snoep",
      "Frisdrank & bier",
      "Sigaretten"
    ],
    "phone": "+31 6 34226696",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/2138016370/avondwinkel-s-n",
      "https://www.openingstijden.com/o3142134/het-avondwinkeltje-s&n-kamp-39-amersfoort/",
      "https://www.openingstijdengids.nl/het-avondwinkeltje-s-en-n/amersfoort/1",
      "https://nl.near-place.com/avondwinkel-s-n-kamp-39-amersfoort",
      "https://www.facebook.com/p/Het-avondwinkeltje-SN-100065088627277/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 39,
    "status": "open",
    "lat": 52.157771,
    "lng": 5.395273,
    "geoConfidence": "high",
    "priceRange": "€",
    "specialties": [
      "Avondwinkel",
      "Snacks & snoep",
      "Frisdrank & bier",
      "Sigaretten",
      "Late openingstijden",
      "Boodschappen"
    ],
    "keyFacts": [
      {
        "label": "Type",
        "value": "Avondwinkel / late-night shop"
      },
      {
        "label": "Ligging",
        "value": "Kamp 39, stadshart Amersfoort"
      },
      {
        "label": "Open tot",
        "value": "01:00 (wk) / 02:00 (weekend)"
      },
      {
        "label": "Opent",
        "value": "Dagelijks vanaf 16:00"
      },
      {
        "label": "Telefoon",
        "value": "+31 6 34226696 (verifiëren)"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "16:00",
            "close": "01:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "16:00",
            "close": "01:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "16:00",
            "close": "01:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "16:00",
            "close": "01:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "16:00",
            "close": "02:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "16:00",
            "close": "02:00"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "16:00",
            "close": "00:00"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Avondwinkel+S%26N+Kamp+39+Amersfoort&query_place_id=",
    "hasGoogleReviews": false,
    "facebookUrl": "https://www.facebook.com/p/Het-avondwinkeltje-SN-100065088627277/",
    "imageCandidateUrl": "https://assets.plaece.nl/thumb/b6r_4gp4Tuk6_Cru1GAv4BvrIM0GEZwRoU6UeEE30xQ/resizing_type:fit/width:650/height:366/gravity:sm/aHR0cHM6Ly9hc3NldHMucGxhZWNlLm5sL29kcC11YmFzZS9pbWFnZS9kc2MwOTE2NV8yNDIxMDQ5NTgwLmpwZw.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl og:image)",
    "schemaType": "Store",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/thumb/b6r_4gp4Tuk6_Cru1GAv4BvrIM0GEZwRoU6UeEE30xQ/resizing_type:fit/width:650/height:366/gravity:sm/aHR0cHM6Ly9hc3NldHMucGxhZWNlLm5sL29kcC11YmFzZS9pbWFnZS9kc2MwOTE2NV8yNDIxMDQ5NTgwLmpwZw.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Praktisch geregeld",
      "Snelle hap",
      "Afhalen"
    ],
    "priceLevel": "budget"
  },
  {
    "id": "skitzo",
    "name": "Skitzo",
    "category": "Mode & sieraden",
    "subcategory": "Sieraden en goudsmid",
    "address": "Kamp 40",
    "postalCode": "3811 AS",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": "Tobias",
    "publicPersonRole": "eigenaar, publiek genoemd in beeldlabel",
    "shortDescription": "Sfeervolle juwelier op de Kamp met unieke, handgemaakte sieraden, horloges en tassen — plus eigen goudsmidatelier voor reparatie en goudinkoop.",
    "longDescription": "Skitzo zit al meer dan 25 jaar op Kamp 40 in het hart van Amersfoort en staat bekend als een van de leukste juweliers van de stad. Je vindt er unieke, in Nederland handgemaakte sieraden van kleine ontwerpers en ateliers, naast horloges en tassen (waaronder Maria La Verda) in elke prijsklasse. Via het eigen goudsmidatelier (Atelier Pronk) kun je ook terecht voor maatwerk, reparaties en de inkoop van oud goud.",
    "tags": [
      "sieraden",
      "goudsmid",
      "juwelier",
      "goud",
      "zilver",
      "Handgemaakte sieraden",
      "Unieke ontwerpen",
      "Horloges"
    ],
    "websiteUrl": "https://www.skitzo.nl",
    "phone": "033 472 1417",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/1993983577/skitzo",
      "https://skitzo-sieraden.nl/",
      "https://skitzo-sieraden.nl/contact/",
      "https://www.cylex.nl/bedrijf/skitzo-10707725.html",
      "https://www.youropi.com/nl/amersfoort/winkelen/skitzo-4844/",
      "https://www.facebook.com/skitzowinkel"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 40,
    "status": "open",
    "lat": 52.157777,
    "lng": 5.394778,
    "geoConfidence": "high",
    "priceRange": "€-€€€",
    "specialties": [
      "Handgemaakte sieraden",
      "Unieke ontwerpen",
      "Horloges",
      "Tassen",
      "Goudsmidatelier & reparatie",
      "Inkoop oud goud"
    ],
    "keyFacts": [
      {
        "label": "Sinds",
        "value": "Meer dan 25 jaar op de Kamp"
      },
      {
        "label": "Type",
        "value": "Juwelier / sieraden"
      },
      {
        "label": "Specialiteit",
        "value": "Handgemaakte, unieke sieraden uit NL"
      },
      {
        "label": "Atelier",
        "value": "Eigen goudsmidatelier (Atelier Pronk)"
      },
      {
        "label": "Telefoon",
        "value": "033 472 1417"
      },
      {
        "label": "Adres",
        "value": "Kamp 40, 3811 AS Amersfoort"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/dir/?api=1&destination=52.157777%2C5.394778",
    "hasGoogleReviews": false,
    "facebookUrl": "https://www.facebook.com/skitzowinkel",
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/p1080575-600x450_4240214929.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl listing)",
    "schemaType": "JewelryStore",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/p1080575-600x450_4240214929.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Shoppen",
      "Cadeau zoeken"
    ],
    "priceLevel": "premium"
  },
  {
    "id": "new-repair-n-go",
    "name": "Repair n Go Amersfoort",
    "category": "Services & praktisch",
    "subcategory": "Telefoon- en tabletreparatie",
    "address": "Kamp 41",
    "postalCode": "3811 AN",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Snelle smartphone- en tabletreparatie aan de Kamp: scherm of batterij vaak klaar terwijl je wacht, met originele onderdelen en garantie.",
    "longDescription": "Repair n Go aan de Kamp 41 in het centrum van Amersfoort repareert smartphones, iPhones en tablets van onder meer Apple, Samsung, Huawei, Sony en OnePlus. De meeste schermen en batterijen worden vervangen terwijl je wacht, vaak binnen ongeveer 30 minuten, met originele onderdelen en garantie op de reparatie. In vrijwel alle gevallen blijft je data behouden, behalve bij waterschade of softwareproblemen.",
    "tags": [
      "telefoonreparatie",
      "iphone reparatie",
      "smartphone",
      "tablet",
      "scherm vervangen",
      "batterij",
      "amersfoort centrum",
      "de kamp"
    ],
    "websiteUrl": "https://repairngo.nl/locations/amersfoort/",
    "instagramUrl": "https://www.instagram.com/repairngonl/",
    "facebookUrl": "https://www.facebook.com/repairngoNL/",
    "phone": "033 476 8164",
    "sourceUrls": [
      "https://repairngo.nl/locations/amersfoort/",
      "https://repairngo.nl/servicepunten/amersfoort/",
      "https://www.tijdvooramersfoort.nl/nl/locaties/1453425491/repair-n-go-amersfoort",
      "https://www.tupalo.nl/amersfoort/repair-n-go-amersfoort-telefoon-expert-kamp-41",
      "https://www.hotfrog.nl/company/52848913014f07751fee1760f1d0d710",
      "https://kadastralekaart.com/adres/amersfoort-kamp-41/0307200000410618"
    ],
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 41,
    "status": "open",
    "geoConfidence": "low",
    "specialties": [
      "iPhone schermreparatie",
      "Smartphone batterij vervangen",
      "Samsung reparatie",
      "Tablet- en iPad-reparatie",
      "Reparatie met originele onderdelen",
      "Klaar terwijl je wacht (ca. 30 min)"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Kamp 41, 3811 AN Amersfoort"
      },
      {
        "label": "Specialisme",
        "value": "iPhone-, smartphone- en tabletreparatie"
      },
      {
        "label": "Doorlooptijd",
        "value": "Veel reparaties klaar terwijl je wacht (ca. 30 min)"
      },
      {
        "label": "Merken",
        "value": "Apple, Samsung, Huawei, Sony, OnePlus e.a."
      },
      {
        "label": "Garantie",
        "value": "Garantie op reparaties; data blijft meestal behouden"
      },
      {
        "label": "Contact",
        "value": "033 476 8164 / amersfoort@repairngo.nl"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "13:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Repair+n+Go+Amersfoort+Kamp+41",
    "hasGoogleReviews": true,
    "schemaType": "Store",
    "imageCandidateUrl": "https://repairngo.nl/wp-content/uploads/2018/09/national-nedarlanded.jpg",
    "imageCandidateSource": "Official website og:image (repairngo.nl)",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/thumb/lU0mOndn_SlyNPR7dzRXgLv-0Fbs_G4M08PKfAdqT8A/resizing_type:fit/width:1580/height:0/gravity:sm/enlarge:0/aHR0cHM6Ly9hc3NldHMucGxhZWNlLm5sL29kcC11YmFzZS9pbWFnZS9kc2MwOTE3MV8yNDQ5MzM5MjIxLmpwZw.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Praktisch geregeld"
    ]
  },
  {
    "id": "k-le-perron-amersfoort",
    "name": "Le Perron Amersfoort",
    "category": "Koffie, lunch & zoet",
    "subcategory": "Boulangerie / organic bakery / lunchroom",
    "address": "Kamp 42",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Le Perron Amersfoort — boulangerie / organic bakery / lunchroom op Kamp 42 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Le Perron Amersfoort is gevestigd op Kamp 42 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Kamp 42, core De Kamp street. Active organic bakery/lunchroom; appears on the Le Perron chain site and current directories. The Kamp 42 conflict with 'Louis Blancardi Wijnen' on the existing list resolves in favour of Le Perron as the current tenant.",
    "tags": [
      "boulangerie",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://leperron.nl/",
    "sourceUrls": [
      "https://leperron.nl/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 42,
    "status": "open",
    "schemaType": "CafeOrCoffeeShop",
    "inclusionStatus": "confirmed_core",
    "inclusionReason": "On Kamp 42, core De Kamp street. Active organic bakery/lunchroom; appears on the Le Perron chain site and current directories. The Kamp 42 conflict with 'Louis Blancardi Wijnen' on the existing list resolves in favour of Le Perron as the current tenant.",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Koffie & lunch",
      "Even bijkomen",
      "Werkplek / koffie"
    ]
  },
  {
    "id": "louis-blancardi-wijnen",
    "name": "Louis Blancardi Wijnen",
    "category": "Winkels & makers",
    "subcategory": "Wijnwinkel",
    "address": "Kamp 42",
    "postalCode": "3811 AS",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": "Louis Blancardi",
    "publicPersonRole": "zelfstandig wijninkoper / vinoloog",
    "shortDescription": "Onafhankelijke wijnhandel op de Kamp: gekwalificeerd vinoloog met avontuurlijke kwaliteitswijnen, champagnes, oudere amarones en dessertwijnen.",
    "longDescription": "Louis Blancardi Wijnen aan de Kamp 42 is een zelfstandige wijnhandel waar een gekwalificeerd vinoloog volledig onafhankelijk van keten of filiaal inkoopt. Het assortiment is veelzijdig en niet alledaags: van avontuurlijke kwaliteitswijnen uit klassieke en nieuwe wijnlanden tot 1er en grand cru champagnes, oudere jaargangen amarone en een ruime collectie dessertwijnen uit de hele wereld. Ook voor wijnaccessoires zoals decanteerkaraffen, kurkentrekkers en glazen ben je hier aan het juiste adres, met persoonlijk en deskundig advies.",
    "tags": [
      "wijn",
      "vinoloog",
      "champagne",
      "wijnwinkel",
      "Kamp",
      "Kwaliteitswijnen",
      "1er & grand cru champagnes",
      "Oudere amarones"
    ],
    "websiteUrl": "https://www.louisblancardi.nl",
    "phone": "033 476 80 15",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/1865448340/louis-blancardi-wijnen",
      "https://www.openingstijden.com/o8019977/louis-blancardi-wijnen-kamp-42-amersfoort/",
      "https://perswijn.nl/grootspraak_locatie/wijnhandel-louis-blancardi/",
      "https://en.nicelocal.co.nl/amersfoort/shops/wijnhandel_louis_blancardi/",
      "https://www.facebook.com/louisblancardiwijnen/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 42,
    "status": "open",
    "lat": 52.157808,
    "lng": 5.394865,
    "geoConfidence": "high",
    "priceRange": "€€-€€€",
    "specialties": [
      "Kwaliteitswijnen",
      "1er & grand cru champagnes",
      "Oudere amarones",
      "Dessertwijnen",
      "Onafhankelijk vinoloog",
      "Wijnaccessoires"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Kamp 42, 3811 AS Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "033 - 476 80 15"
      },
      {
        "label": "E-mail",
        "value": "wijnhandelblancardi@gmail.com"
      },
      {
        "label": "Eigenaar",
        "value": "François de Wekker"
      },
      {
        "label": "Sinds",
        "value": "ca. 2005"
      },
      {
        "label": "Type",
        "value": "Zelfstandige wijnhandel / vinoloog"
      },
      {
        "label": "Pinnen",
        "value": "Ja"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Louis+Blancardi+Wijnen+Kamp+42+Amersfoort&query_place_id=",
    "hasGoogleReviews": false,
    "facebookUrl": "https://www.facebook.com/louisblancardiwijnen/",
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09162_2434463912.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl directory listing)",
    "schemaType": "WineStore",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09162_2434463912.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Shoppen",
      "Lokaal & ambachtelijk"
    ],
    "priceLevel": "premium"
  },
  {
    "id": "new-corner-corner",
    "name": "The Corner House",
    "category": "Koffie, lunch & zoet",
    "subcategory": "Koffie- en lunchroom",
    "address": "Kamp 44",
    "postalCode": "3811 AS",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Gezellige koffie- en lunchroom in een monumentaal pand aan de Kamp, met huiselijke sfeer, verse koffie en eerlijke lunch.",
    "longDescription": "The Corner House is een sfeervolle koffie- en lunchroom in een monumentaal pand op winkelstraat de Kamp in hartje Amersfoort. De kaart is met liefde samengesteld, geïnspireerd op het traditionele koken van moeder en op gerechten die de eigenaren tijdens hun reizen ontdekten: van tosti's en panini's tot frisse salades en een dagelijkse linzensoep volgens geheim recept. 's Ochtends ben je welkom voor verse koffie en lekkers, in een huiselijke en intieme setting.",
    "tags": [
      "koffie",
      "lunch",
      "lunchroom",
      "ontbijt",
      "koffiebar",
      "huiskamer",
      "monumentaal pand",
      "de Kamp"
    ],
    "websiteUrl": "https://www.thecornerhouse.nl/",
    "facebookUrl": "https://www.facebook.com/TheCornerHouseAmersfoort/",
    "phone": "+31 33 880 1763",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/3181420028/the-corner-house",
      "https://firmania.nl/amersfoort/the-corner-house-454949",
      "https://www.cylex.nl/bedrijf/the-corner-house-12976761.html",
      "https://en.eet.nu/amersfoort/the-corner",
      "https://restaurantguru.com/The-Corner-Amersfoort",
      "https://www.facebook.com/TheCornerHouseAmersfoort/"
    ],
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 44,
    "status": "open",
    "lat": 52.157889,
    "lng": 5.395155,
    "geoConfidence": "high",
    "priceRange": "€10 - €25",
    "specialties": [
      "Verse koffie en koffiemelanges",
      "Lunch: tosti's, panini's en salades",
      "Dagelijkse linzensoep (geheim familierecept)",
      "Huisgemaakt gebak",
      "Shared lunch experience (proeverij van voorgerechten)",
      "Biologische thee"
    ],
    "keyFacts": [
      {
        "label": "Type",
        "value": "Koffie- en lunchroom"
      },
      {
        "label": "Locatie",
        "value": "Monumentaal pand aan winkelstraat de Kamp"
      },
      {
        "label": "Prijsindicatie",
        "value": "€10 - €25 per persoon"
      },
      {
        "label": "Sfeer",
        "value": "Huiselijk en intiem"
      },
      {
        "label": "Adres",
        "value": "Kamp 44, 3811 AS Amersfoort"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "08:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "08:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "08:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "08:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "08:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:30"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=The+Corner+House+Kamp+44+Amersfoort&query_place_id=",
    "hasGoogleReviews": true,
    "schemaType": "CafeOrCoffeeShop",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/thumb/IfzotZSgjXL_UDKBuNEsFDWh2R7z77EsrvGJIyINUuM/resizing_type:fit/width:640/height:0/gravity:sm/enlarge:0/aHR0cHM6Ly9hc3NldHMucGxhZWNlLm5sL29kcC11YmFzZS9pbWFnZS9kc2MwOTE2N18zNDA3MjMzNTEyLmpwZw.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Koffie & lunch",
      "Even bijkomen",
      "Zoete trek",
      "Met kinderen"
    ],
    "priceLevel": "mid"
  },
  {
    "id": "new-studio-release",
    "name": "Studio Release",
    "category": "Beauty & verzorging",
    "subcategory": "Luxe massagesalon",
    "address": "Kamp 45",
    "postalCode": "3811 AN",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": "Merle Minjon",
    "publicPersonRole": "Eigenaar",
    "shortDescription": "Luxe massagesalon net buiten de Kamperbinnenpoort, met massages volledig op maat in een serene, eigentijdse studio.",
    "longDescription": "Studio Release is een luxe massagesalon aan de Kamp, op een steenworp van de historische Kamperbinnenpoort. Ervaren masseurs stemmen elke behandeling volledig af op jouw wensen en klachten, van de Signature Massage op maat tot zwangerschaps-, duo- en ontspanningsmassages. In een sereen, eigentijds interieur kom je hier helemaal tot rust midden in het centrum van Amersfoort.",
    "tags": [
      "massage",
      "wellness",
      "ontspanning",
      "luxe",
      "massagesalon",
      "self-care",
      "De Kamp",
      "Amersfoort centrum"
    ],
    "websiteUrl": "https://studiorelease.nl/amersfoort/",
    "instagramUrl": "https://www.instagram.com/we.release/",
    "phone": "+31 85 401 3596",
    "sourceUrls": [
      "https://studiorelease.nl/amersfoort/",
      "https://www.vvvamersfoort.nl/nl/locaties/6028/studio-release",
      "https://www.destadamersfoort.nl/lokaal/overig/965951/eindelijk-een-luxe-massagestudio-in-amersfoort-release-opent-haar-deuren-aan-de-kamp",
      "https://www.fresha.com/lvp/studio-release-massage-amersfoort-kamp-amersfoort-2MBbMJ"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 45,
    "status": "open",
    "lat": 52.157866,
    "lng": 5.395556,
    "geoConfidence": "high",
    "priceRange": "€€",
    "specialties": [
      "Signature Massage op maat",
      "Ontspanningsmassage",
      "Zwangerschapsmassage",
      "Postnatale massage",
      "Duomassage",
      "Cupping massage"
    ],
    "keyFacts": [
      {
        "label": "Geopend",
        "value": "Oktober 2023"
      },
      {
        "label": "Openingstijden",
        "value": "Dagelijks 10:00-22:00"
      },
      {
        "label": "Ligging",
        "value": "Net buiten de Kamperbinnenpoort"
      },
      {
        "label": "Online boeken",
        "value": "Via studiorelease.nl / Salonized"
      },
      {
        "label": "Onderdeel van",
        "value": "Studio Release (ook in Hilversum en Utrecht)"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "10:00",
            "close": "22:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "22:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "22:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "22:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "22:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "22:00"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "10:00",
            "close": "22:00"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Studio%20Release%20Kamp%2045%203811%20AN%20Amersfoort",
    "hasGoogleReviews": true,
    "schemaType": "BeautySalon",
    "imageCandidateUrl": "https://studiorelease.nl/wp-content/uploads/2026/06/amersfoort-massagesalon-1.jpg",
    "imageCandidateSource": "Eigen og:image van studiorelease.nl (officiele website, Amersfoort-pagina)",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://studiorelease.nl/wp-content/uploads/2026/06/amersfoort-massagesalon-1.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Verwennen",
      "Me-time"
    ],
    "priceLevel": "mid"
  },
  {
    "id": "awaze",
    "name": "Awazé",
    "category": "Eten & drinken",
    "subcategory": "Ethiopisch en vegan restaurant",
    "address": "Kamp 48",
    "postalCode": "3811 AS",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": "Wosene Asmamaw",
    "publicPersonRole": "eigenaresse",
    "shortDescription": "Het eerste Ethiopische (en vegan) restaurant van Amersfoort, op de Kamp. Deel injera-schalen met de hand — bestek hoeft niet.",
    "longDescription": "Awazé is sinds 2019 het eerste Ethiopische restaurant van Amersfoort, gevestigd in een historisch pand op de Kamp. Eigenaresse Wosene Asmamaw kookt zelf authentieke, kruidige gerechten — van pittige kip en gekruid rundvlees tot ruime veganistische schalen — die je deelt met de hand op een injera, de licht-zure pannenkoek waarop alles wordt geserveerd. De gezellige, warme sfeer en de gastvrijheid leveren consequent lovende reviews op.",
    "tags": [
      "Ethiopisch",
      "vegan",
      "restaurant",
      "injera",
      "wereldkeuken",
      "Ethiopische keuken",
      "Veganistisch",
      "Deelschalen"
    ],
    "websiteUrl": "https://www.awazerestaurant.nl",
    "phone": "033 737 0029",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/930122048/awaze",
      "https://www.awazerestaurant.nl",
      "https://www.awazerestaurant.nl/ethiopische-en-vegan-restaurant/",
      "https://restaurantguru.com/Awaze-Restaurant-Amersfoort",
      "https://en.eet.nu/amersfoort/awaze",
      "https://www.tripadvisor.com/Restaurant_Review-g188613-d18962526-Reviews-Awaze_Ethiopisch_Restaurant-Amersfoort.html"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "imageUrl": "https://www.awazerestaurant.nl/wp-content/uploads/2020/01/DSC_0876-v2-1030x685.jpg",
    "featured": true,
    "sortOrder": 48,
    "status": "open",
    "lat": 52.157975,
    "lng": 5.395315,
    "geoConfidence": "high",
    "priceRange": "€€",
    "specialties": [
      "Ethiopische keuken",
      "Veganistisch",
      "Injera",
      "Deelschalen",
      "Eten met de hand",
      "Glutenvrije opties"
    ],
    "keyFacts": [
      {
        "label": "Sinds",
        "value": "2019"
      },
      {
        "label": "Keuken",
        "value": "Ethiopisch & vegan"
      },
      {
        "label": "Eigenaresse",
        "value": "Wosene Asmamaw"
      },
      {
        "label": "Bijzonder",
        "value": "Eerste Ethiopische restaurant van Amersfoort"
      },
      {
        "label": "Serveerwijze",
        "value": "Op injera, geen bestek nodig"
      },
      {
        "label": "Telefoon",
        "value": "033 737 0029"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "17:00",
            "close": "22:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "17:00",
            "close": "22:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "17:00",
            "close": "22:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "17:00",
            "close": "22:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "17:00",
            "close": "22:00"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "17:00",
            "close": "22:00"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Awaz%C3%A9%20Kamp%2048%20Amersfoort&query_place_id=",
    "hasGoogleReviews": true,
    "instagramUrl": "https://www.instagram.com/awaze_restaurant",
    "facebookUrl": "https://www.facebook.com/awazerestaurant/",
    "imageCandidateUrl": "https://www.awazerestaurant.nl/wp-content/uploads/2020/01/DSC_0876-v2-1030x685.jpg",
    "imageCandidateSource": "awazerestaurant.nl",
    "schemaType": "Restaurant",
    "updatedAt": "2026-06-14",
    "imageFit": "cover",
    "perfectFor": [
      "Uit eten",
      "Samen tafelen",
      "Vegan",
      "Date night"
    ],
    "priceLevel": "mid"
  },
  {
    "id": "babai",
    "name": "Babai",
    "category": "Interieur & kunst",
    "subcategory": "Perzische en Oosterse tapijten",
    "address": "Kamp 49",
    "postalCode": "3811 AN",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Vertrouwd familiebedrijf sinds 1975 aan de Kamp: handgeknoopte Perzische en oosterse tapijten kopen, reinigen en restaureren.",
    "longDescription": "Babai is een Amersfoorts familiebedrijf met Iraanse wortels dat sinds 1975 gespecialiseerd is in handgeknoopte Perzische en oosterse tapijten. In de ruime showroom aan de Kamp 49 koopt en verkoopt men nieuwe en antieke tapijten, en verzorgt het vakkundige reiniging en restauratie. Service, kwaliteit en eerlijke prijzen staan voorop; bezoek is op dinsdag t/m zaterdag mogelijk, en op maandag, donderdagavond en zondag op afspraak.",
    "tags": [
      "tapijten",
      "Perzisch",
      "Oosters",
      "restauratie",
      "interieur",
      "Perzische tapijten",
      "Oosterse tapijten",
      "Handgeknoopt"
    ],
    "websiteUrl": "https://www.babai.nl",
    "phone": "+31 33 470 22 11",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/3823650099/babai",
      "https://www.babai.nl",
      "https://www.babai.nl/contact/",
      "https://www.cylex.nl/bedrijf/babai-perzische-tapijten-11000888.html"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 49,
    "status": "open",
    "lat": 52.157944,
    "lng": 5.395709,
    "geoConfidence": "high",
    "specialties": [
      "Perzische tapijten",
      "Oosterse tapijten",
      "Handgeknoopt",
      "Tapijtreiniging",
      "Restauratie",
      "Antieke tapijten"
    ],
    "keyFacts": [
      {
        "label": "Sinds",
        "value": "1975"
      },
      {
        "label": "Type",
        "value": "Familiebedrijf"
      },
      {
        "label": "Specialisme",
        "value": "Perzische en oosterse tapijten"
      },
      {
        "label": "Diensten",
        "value": "Verkoop, reiniging en restauratie"
      },
      {
        "label": "Showroom",
        "value": "Ca. 300 m²"
      },
      {
        "label": "Parkeren",
        "value": "Gratis bij Achter de Kamp 108"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "09:30",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "09:30",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "09:30",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "09:30",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "09:30",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Babai+Kamp+49+Amersfoort",
    "hasGoogleReviews": false,
    "instagramUrl": "https://www.instagram.com/babaitapijten",
    "facebookUrl": "https://www.facebook.com/p/Babai-100069180708806/",
    "imageCandidateUrl": "https://www.babai.nl/wp-content/uploads/2021/07/629-1-199x300.jpg",
    "imageCandidateSource": "babai.nl",
    "schemaType": "FurnitureStore",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://www.babai.nl/wp-content/uploads/2021/07/629-1.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Interieur & wonen",
      "Inspiratie opdoen"
    ]
  },
  {
    "id": "new-leith-jewels",
    "name": "Leith Jewels",
    "category": "Mode & sieraden",
    "subcategory": "Juwelier — gouden & zilveren sieraden, horloges en trouwringen",
    "address": "Kamp 50",
    "postalCode": "3811 AS",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Sfeervolle juwelier aan de Kamp voor trendy zilveren en betaalbare gouden sieraden, horloges en op maat gemaakte trouwringen.",
    "longDescription": "Leith Jewels is een juwelier in de Amersfoortse binnenstad aan de Kamp, met een ruime collectie sieraden, horloges, verlovings- en trouwringen. Naast trendy zilver en betaalbaar goud vind je er edelstenen en luxe diamanten stukken. De winkel verzorgt ook reparaties, graveren, het inkopen van oud goud en het vervangen van horlogebatterijen.",
    "tags": [
      "juwelier",
      "sieraden",
      "horloges",
      "trouwringen",
      "verlovingsringen",
      "goud",
      "zilver",
      "diamant"
    ],
    "websiteUrl": "https://www.leithjuwelier.nl/",
    "instagramUrl": "https://www.instagram.com/leith.jewels/",
    "facebookUrl": "https://www.facebook.com/p/LEITH-Jewels-Amersfoort-61551398413911/",
    "phone": "033 785 0147",
    "sourceUrls": [
      "https://www.leithjuwelier.nl/",
      "https://www.leithjuwelier.nl/contact",
      "https://www.vvvamersfoort.nl/nl/locaties/2951/leith-jewels-amersfoort",
      "https://www.tijdvooramersfoort.nl/nl/locaties/650868700/leith-jewels",
      "https://www.infobel.com/nl/netherlands/leith_jewellery/amersfoort/NL102915851-0337850147/businessdetails.aspx",
      "https://www.instagram.com/leith.jewels/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 50,
    "status": "open",
    "lat": 52.1580125,
    "lng": 5.3954087,
    "geoConfidence": "high",
    "specialties": [
      "Gouden en zilveren sieraden",
      "Verlovings- en trouwringen op maat",
      "Horloges (diverse merken)",
      "Sieraadreparatie en graveren",
      "Inkoop oud goud",
      "Horlogebatterij vervangen"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Kamp 50, 3811 AS Amersfoort"
      },
      {
        "label": "Type",
        "value": "Juwelier / sieraden & horloges"
      },
      {
        "label": "Telefoon",
        "value": "033 785 0147"
      },
      {
        "label": "Openingstijden",
        "value": "Ma gesloten, di–za 11:00–17:00, zo 12:00–17:00"
      },
      {
        "label": "Specialiteit",
        "value": "Trouwringen, sieraden, horloges & reparatie"
      },
      {
        "label": "Webshop",
        "value": "Online bestellen via leithjuwelier.nl"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "11:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "11:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "11:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "11:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "11:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "12:00",
            "close": "17:00"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Leith+Jewels+Kamp+50+Amersfoort",
    "hasGoogleReviews": false,
    "schemaType": "JewelryStore",
    "imageCandidateUrl": "https://lirp.cdn-website.com/6cc83556/dms3rep/multi/opt/Afbeelding+van+WhatsApp+op+2024-11-01+om+11.54.24_c0e8d227-1920w.jpg",
    "imageCandidateSource": "Official website leithjuwelier.nl og:image / twitter:image (business's own product photo, WhatsApp 2024-11-01)",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://static-vvvamersfoort.mypoiworld.com/img/f4ab2591-d0de-4ca6-836a-b268ee9a6fa0.jpg/xl.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Shoppen",
      "Cadeau zoeken",
      "Trouwen & gala"
    ]
  },
  {
    "id": "de-heren-van-amersfoort",
    "name": "De Heren van Amersfoort",
    "category": "Interieur & kunst",
    "subcategory": "Woonmaterialen",
    "address": "Kamp 51",
    "postalCode": "3811 AN",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Familiezaak op de Kamp voor vloeren, gordijnen, zonwering en parket — deskundig advies in de winkel en vakkundig leggen bij u thuis.",
    "longDescription": "De Heren van Amersfoort is een familiebedrijf dat al ruim 25 jaar met passie woninginrichting verzorgt vanuit hun showroom aan Kamp 51, midden in de historische binnenstad. U vindt er de nieuwste collecties topmerken op het gebied van gordijnen, vloerbedekking, zonwering en parket. Deskundige begeleiding in de winkel en vakkundig leggen bij u thuis staan centraal, zonder dat het duur hoeft te zijn.",
    "tags": [
      "interieur",
      "woonmaterialen",
      "vloeren",
      "familiebedrijf",
      "Kamp",
      "Gordijnen",
      "Zonwering",
      "Parket"
    ],
    "websiteUrl": "https://www.deherenvanamersfoort.nl",
    "phone": "033 4720 600",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/1901312621/de-heren-van-amersfoort",
      "https://www.telefoonboek.nl/bedrijven/t2846562/amersfoort/de-heren-van-amersfoort/",
      "https://www.cylex.nl/bedrijf/de-heren-van-amersfoort-10620375.html",
      "https://www.deherenvanamersfoort.nl/?page_id=725",
      "https://drimble.nl/bedrijf/amersfoort/2884097/de-heren-van-amersfoort.html"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 51,
    "status": "open",
    "lat": 52.157978,
    "lng": 5.39582,
    "geoConfidence": "high",
    "specialties": [
      "Vloeren",
      "Gordijnen",
      "Zonwering",
      "Parket",
      "Raambekleding",
      "Woninginrichting"
    ],
    "keyFacts": [
      {
        "label": "Type",
        "value": "Woninginrichting / interieurwinkel"
      },
      {
        "label": "Ervaring",
        "value": "25+ jaar familiebedrijf"
      },
      {
        "label": "Telefoon",
        "value": "033 4720 600"
      },
      {
        "label": "Adres",
        "value": "Kamp 51, 3811 AN Amersfoort"
      },
      {
        "label": "Gesloten",
        "value": "Maandag en zondag"
      },
      {
        "label": "Service",
        "value": "Advies in de winkel + leggen aan huis"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=De+Heren+van+Amersfoort+Kamp+51+Amersfoort",
    "hasGoogleReviews": false,
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09187_364871223.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl)",
    "schemaType": "FurnitureStore",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09187_364871223.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Interieur & wonen",
      "Inspiratie opdoen",
      "Met kinderen",
      "Trouwen & gala"
    ]
  },
  {
    "id": "new-acell-telecommunicatie",
    "name": "A'cell Telecommunicatie",
    "category": "Services & praktisch",
    "subcategory": "Telefoonwinkel & reparatie",
    "address": "Kamp 52",
    "postalCode": "3811 AS",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Vertrouwde telefoonwinkel aan de Kamp voor reparatie van smartphones, spelcomputers en gadgets, plus accessoires en telecomdiensten.",
    "longDescription": "A'cell Telecommunicatie is al sinds 2013 een vaste waarde aan de Kamp, midden in het historische winkelhart van Amersfoort. Je kunt er terecht voor het repareren van smartphones, spelcomputers en andere gadgets, en voor een ruim aanbod telefoonaccessoires. Klanten roemen de persoonlijke service en vakkennis die de winkel onderscheiden van grote ketens.",
    "tags": [
      "telefoonwinkel",
      "telecom",
      "smartphone reparatie",
      "accessoires",
      "de kamp",
      "amersfoort",
      "Reparatie spelcomputers en gadgets",
      "Telefoonaccessoires"
    ],
    "facebookUrl": "https://www.facebook.com/ACELLTelecommunicatie/",
    "phone": "+31 33 476 8004",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/3061082701/acell-telecommunicatie",
      "https://www.facebook.com/ACELLTelecommunicatie/",
      "https://www.openingstijden.com/o3650720/acell-kamp-52-amersfoort/",
      "https://www.openingstijdengids.nl/acell/amersfoort/1",
      "https://www.cylex.nl/bedrijf/a-cell-10787975.html",
      "https://www.oozo.nl/bedrijven/amersfoort/stadskern/coninckstraat/188921/acell"
    ],
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 52,
    "status": "open",
    "lat": 52.158037,
    "lng": 5.395482,
    "geoConfidence": "medium",
    "specialties": [
      "Smartphone reparatie",
      "Reparatie spelcomputers en gadgets",
      "Telefoonaccessoires",
      "Telecomdiensten",
      "Persoonlijk advies"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Kamp 52, 3811 AS Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "+31 33 476 8004"
      },
      {
        "label": "Type",
        "value": "Telefoonwinkel & reparatie"
      },
      {
        "label": "Gevestigd sinds",
        "value": "2013"
      },
      {
        "label": "KvK",
        "value": "56723717"
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=A%27cell%20Telecommunicatie%20Kamp%2052%20Amersfoort",
    "hasGoogleReviews": false,
    "schemaType": "Store",
    "imageCandidateUrl": "https://scontent-ams2-1.xx.fbcdn.net/v/t1.6435-1/56120056_2175577685840869_1561451844545282048_n.jpg",
    "imageCandidateSource": "Facebook page (ACELL Telecommunicatie) og:image",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/thumb/aX43VolIl4gsGpo9M3W_fkaEzV6-leVtsUPu8HOKtdM/resizing_type:fit/width:960/height:0/gravity:sm/enlarge:0/aHR0cHM6Ly9hc3NldHMucGxhZWNlLm5sL29kcC11YmFzZS9pbWFnZS9kc2MwOTE3OF8xNjU3NTg2Nzc0LmpwZw.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Praktisch geregeld"
    ]
  },
  {
    "id": "bever-amersfoort",
    "name": "Bever Amersfoort",
    "category": "Keten / anker",
    "subcategory": "Outdoorwinkel",
    "address": "Kamp 53",
    "postalCode": "3811 AN",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Ruime, moderne outdoorwinkel vlak bij het historisch centrum: kleding, schoenen en kampeer- en wandeluitrusting voor je volgende avontuur.",
    "longDescription": "Bever Amersfoort is dé outdoorspeciaalzaak aan de Kamp, op een steenworp van het historische centrum. In deze ruime, moderne winkel vind je een brede collectie outdoor- en wandelkleding, schoenen en complete kampeer- en reisuitrusting van merken als Haglöfs en Sea to Summit, met persoonlijk en deskundig advies. Op donderdag is de winkel koopavond tot 20.00 uur; op zondag ben je tussen 12.00 en 17.00 uur welkom.",
    "tags": [
      "outdoor",
      "sport",
      "wandelen",
      "kleding",
      "Kamp",
      "Outdoorkleding",
      "Wandelschoenen",
      "Kampeeruitrusting"
    ],
    "websiteUrl": "https://www.bever.nl",
    "phone": "085 88 850 88",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/3898272727/bever-amersfoort",
      "https://www.bever.nl/winkels/amersfoort.html",
      "https://reviews.birdeye.com/bever-amsterfoort-177216284285642",
      "https://www.openingstijden.nl/Bever/Amersfoort/Kamp-53-57/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 53,
    "status": "open",
    "lat": 52.15808,
    "lng": 5.39588,
    "geoConfidence": "high",
    "priceRange": "€€",
    "specialties": [
      "Outdoorkleding",
      "Wandelschoenen",
      "Kampeeruitrusting",
      "Backpacks",
      "Reisartikelen",
      "Deskundig advies"
    ],
    "keyFacts": [
      {
        "label": "Type",
        "value": "Outdoor- & sportzaak"
      },
      {
        "label": "Assortiment",
        "value": "Kleding, schoenen & kampeeruitrusting"
      },
      {
        "label": "Adres",
        "value": "Kamp 53-57, 3811 AN Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "085-88 850 88"
      },
      {
        "label": "Koopavond",
        "value": "Donderdag tot 20.00 uur"
      },
      {
        "label": "Locatie",
        "value": "Bij het historisch centrum"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "12:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "20:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "09:30",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "12:00",
            "close": "17:00"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Bever+Amersfoort+Kamp+53+Amersfoort",
    "hasGoogleReviews": true,
    "imageCandidateUrl": "https://www.bever.nl/content/dam/bever/stores/517.jpg",
    "imageCandidateSource": "bever.nl",
    "schemaType": "Store",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://www.bever.nl/content/dam/bever/stores/517.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Boodschappen",
      "Vertrouwde namen"
    ],
    "priceLevel": "mid"
  },
  {
    "id": "new-fietsdiscounter",
    "name": "Fietsdiscounter.nl",
    "category": "Winkels & makers",
    "subcategory": "Fietsenwinkel",
    "address": "Kamp 56",
    "postalCode": "3811 AS",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Voordelige fietsenwinkel op de Kamp met e-bikes, transport- en kinderfietsen van bekende merken — proefrijden kan in de winkel.",
    "longDescription": "Fietsdiscounter.nl is een fietsenwinkel midden in de Amersfoortse binnenstad aan de Kamp, gespecialiseerd in scherp geprijsde e-bikes, transportfietsen en kinderfietsen van betrouwbare merken. Je kunt de fietsen in de winkel testen en rekenen op garantie en service. Klanten waarderen de winkel met gemiddeld 4,7 sterren op Google.",
    "tags": [
      "fietsenwinkel",
      "e-bike",
      "elektrische fiets",
      "transportfiets",
      "kinderfiets",
      "stadsfiets",
      "binnenstad",
      "de kamp"
    ],
    "websiteUrl": "https://fietsdiscounter.nl/",
    "phone": "033 285 1531",
    "sourceUrls": [
      "https://fietsdiscounter.nl/",
      "https://fietsdiscounter.nl/onze-winkel/",
      "https://nominatim.openstreetmap.org/lookup?osm_ids=N2672776213",
      "https://openstreetmap.app/poi/Nederland/Utrecht/Amersfoort/Kamp/N/2672776213",
      "https://www.indebuurt.com/fietsenmaker-in-amersfoort/fietsdiscounter-nl-hdvo8/",
      "https://nl.near-place.com/fietsdiscounter-kamp-56-amersfoort-amersfoort"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 56,
    "status": "open",
    "lat": 52.1580978,
    "lng": 5.3956554,
    "geoConfidence": "high",
    "priceRange": "€€",
    "specialties": [
      "E-bikes / elektrische fietsen",
      "Transportfietsen",
      "Kinderfietsen",
      "Stadsfietsen",
      "Scherpe aanbiedingen / voordeelfietsen",
      "Proefrit in de winkel"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Kamp 56, 3811 AS Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "033 285 1531"
      },
      {
        "label": "Openingstijden",
        "value": "Ma-za 09:30-18:00, zondag gesloten"
      },
      {
        "label": "Google-beoordeling",
        "value": "4,7/5 (ca. 261 reviews)"
      },
      {
        "label": "Specialisatie",
        "value": "E-bikes, transport- en kinderfietsen"
      },
      {
        "label": "KvK",
        "value": "53477987"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "09:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "09:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "09:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "09:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "09:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "09:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Fietsdiscounter.nl+Kamp+56+Amersfoort",
    "hasGoogleReviews": true,
    "schemaType": "Store",
    "imageCandidateUrl": "https://fietsdiscounter.nl/wp-content/uploads/2025/11/Schermafbeelding-2025-11-12-165505.png",
    "imageCandidateSource": "Business's own website (og:image / Yoast schema primaryImageOfPage on fietsdiscounter.nl)",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://fietsdiscounter.nl/wp-content/uploads/2021/06/IMG-20210616-WA0001-1.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Shoppen",
      "Lokaal & ambachtelijk",
      "Met kinderen"
    ],
    "priceLevel": "mid"
  },
  {
    "id": "new-flink",
    "name": "Flink Amersfoort Centrum",
    "category": "Services & praktisch",
    "subcategory": "Boodschappenbezorging",
    "address": "Kamp 58",
    "postalCode": "3811 AS",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Flitsbezorger Flink bezorgt vanuit een dark store aan de Kamp je boodschappen razendsnel thuis via de app, binnen het centrum van Amersfoort.",
    "longDescription": "Flink runt aan de Kamp 58 een dark store: een bezorgmagazijn dat niet open is voor publiek, maar volledig is ingericht om online bestellingen razendsnel te verwerken. Via de Flink-app of webshop bestel je dagelijkse boodschappen die binnen het bezorggebied in het centrum van Amersfoort snel worden thuisbezorgd. Naast de gewone bezorging biedt de vestiging ook Too Good To Go-pakketten met producten tegen een gereduceerde prijs.",
    "tags": [
      "boodschappenbezorging",
      "flitsbezorger",
      "dark store",
      "bezorgservice",
      "supermarkt",
      "thuisbezorgd",
      "too good to go",
      "centrum"
    ],
    "websiteUrl": "https://www.goflink.com/nl-NL/",
    "sourceUrls": [
      "https://drimble.nl/bedrijf/amersfoort/000050754408/flink-amersfoort-centrum.html",
      "https://wanderlog.com/place/details/11145583/flink-amersfoort-centrum",
      "https://openkvk.nl/company/nevenvestiging-flink-amersfoort-centrum-81901496-50754408",
      "https://www.transfirm.nl/nl/organisatie/819014960034-flink-amersfoort-centrum",
      "https://www.frituurwereld.nl/flitsbezorger-flink-van-dark-store-naar-buurtfunctie/",
      "https://nl.wikipedia.org/wiki/Flink_(supermarkt)"
    ],
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 58,
    "status": "open",
    "lat": 52.158121,
    "lng": 5.395702,
    "geoConfidence": "medium",
    "specialties": [
      "Boodschappen razendsnel thuisbezorgd via de app",
      "Flitsbezorging vanuit een lokale dark store",
      "Ruim assortiment dagelijkse boodschappen",
      "Bezorging binnen het centrum van Amersfoort",
      "Too Good To Go-pakketten tegen gereduceerde prijs",
      "Bestellen via app en webshop"
    ],
    "keyFacts": [
      {
        "label": "Type",
        "value": "Dark store / flitsbezorging (niet publiek toegankelijk)"
      },
      {
        "label": "Bestellen",
        "value": "Via de Flink-app, webshop of Thuisbezorgd.nl"
      },
      {
        "label": "KvK",
        "value": "81901496 (vestiging 000050754408), status Actief"
      },
      {
        "label": "Geregistreerd sinds",
        "value": "1 december 2021"
      },
      {
        "label": "Google-beoordeling",
        "value": "2,3 / 5 op basis van 73 reviews"
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/place/@52.158121,5.395702,17z/",
    "hasGoogleReviews": true,
    "schemaType": "Store",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/3/3d/Flink%2C_Hillegersberg%2C_Rotterdam_%282021%29_01.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Praktisch geregeld",
      "Snelle hap",
      "Afhalen",
      "Zoete trek"
    ]
  },
  {
    "id": "dhome-de-winkel",
    "name": "DHome de winkel",
    "category": "Interieur & kunst",
    "subcategory": "Conceptstore en interieuradvies",
    "address": "Kamp 60",
    "postalCode": "3811 AT",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": "Debbie",
    "publicPersonRole": "eigenaresse en interieurstylist",
    "shortDescription": "Conceptstore van interieurstylist Debbie Fontein aan de Kamp: meubels, raambekleding, vloeren, verlichting, mode én persoonlijk interieuradvies.",
    "longDescription": "DHome de winkel is de conceptstore van interieurstylist Debbie Fontein, sinds mei 2023 gevestigd aan Kamp 60 in winkelgebied De Kamp. In deze sfeervolle boetiek met een neutrale stijl en pittige accenten vind je meubels, raambekleding, vloeren, karpetten, verlichting en bijzondere woonaccessoires, naast mode, sieraden en verantwoorde producten die je niet overal tegenkomt. Je kunt er bovendien terecht voor persoonlijk en betaalbaar interieuradvies; de winkel is open op donderdag en vrijdag van 10.00–17.00 uur en zaterdag van 10.00–16.00 uur.",
    "tags": [
      "interieur",
      "conceptstore",
      "woonwinkel",
      "design",
      "Kamp",
      "Interieuradvies",
      "Meubels & woonaccessoires",
      "Raambekleding & vloeren"
    ],
    "websiteUrl": "https://www.dhome.nl",
    "phone": "06 13196770",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/3552999928/dhome-de-winkel",
      "https://www.dhome.nl",
      "https://www.wonen360.nl/article/9607872/interieuradviseur-verkoopt-niet-alleen-haar-favoriete-meubels-en-woonaccessoires/",
      "https://www.instagram.com/dhome_debbie_fontein/",
      "https://www.linkedin.com/in/debbie-fontein-de-jong-88384614/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dhome-de-winkel-klein_3498163889.jpg",
    "featured": true,
    "sortOrder": 60,
    "status": "open",
    "lat": 52.158175,
    "lng": 5.395858,
    "geoConfidence": "high",
    "specialties": [
      "Interieuradvies",
      "Meubels & woonaccessoires",
      "Raambekleding & vloeren",
      "Verlichting & karpetten",
      "Conceptstore",
      "Mode & sieraden"
    ],
    "keyFacts": [
      {
        "label": "Sinds",
        "value": "mei 2023"
      },
      {
        "label": "Eigenaar",
        "value": "Debbie Fontein"
      },
      {
        "label": "Type",
        "value": "Conceptstore / interieur"
      },
      {
        "label": "Telefoon",
        "value": "06 13196770"
      },
      {
        "label": "Adres",
        "value": "Kamp 60, 3811 AT Amersfoort"
      },
      {
        "label": "Wijk",
        "value": "Winkelgebied De Kamp"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "closed": true,
        "periods": []
      },
      {
        "day": "wednesday",
        "closed": true,
        "periods": []
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "16:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/dir/?api=1&destination=52.158175%2C5.395858",
    "hasGoogleReviews": false,
    "instagramUrl": "https://www.instagram.com/dhome_debbie_fontein/",
    "facebookUrl": "https://www.facebook.com/DHome-412353955512862/",
    "imageCandidateUrl": "https://www.dhome.nl/img/DHome-logo.jpg",
    "imageCandidateSource": "dhome.nl",
    "schemaType": "FurnitureStore",
    "updatedAt": "2026-06-14",
    "imageFit": "cover",
    "perfectFor": [
      "Interieur & wonen",
      "Inspiratie opdoen"
    ]
  },
  {
    "id": "toko-dong-a",
    "name": "Toko Dong-A",
    "category": "Winkels & makers",
    "subcategory": "Aziatische levensmiddelen",
    "address": "Kamp 61",
    "postalCode": "3811 AP",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Aziatische toko op de Kamp vol kruiden, specerijen en producten uit o.a. Thailand, Indonesië, Vietnam, Japan en Suriname.",
    "longDescription": "Toko Dong-A aan de Kamp 61 is een sfeervolle Aziatische toko in het hart van Amersfoort. Je vindt er een ruime selectie levensmiddelen, kruiden, specerijen, servies en cadeauartikelen uit onder meer Thailand, China, Vietnam, Indonesië, India, Japan, de Filipijnen en Suriname/Antillen. Ideaal voor wie thuis authentieke gerechten wil koken; geopend van dinsdag tot en met zondag (donderdag tot 20.00 uur), maandag gesloten.",
    "tags": [
      "toko",
      "Aziatisch",
      "kruiden",
      "specerijen",
      "servies",
      "Aziatische levensmiddelen",
      "Kruiden & specerijen",
      "Indonesisch"
    ],
    "phone": "0334767216",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/3483947753/toko-dong-a",
      "https://www.openingstijden.com/open/toko-dong-a/amersfoort/",
      "https://restaurantguru.com/Toko-Dong-A-Amersfoort",
      "https://www.yelp.com/biz/toko-dong-a-amersfoort",
      "https://evendo.com/locations/netherlands/amersfoort/shop/toko-dong-a"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 61,
    "status": "open",
    "lat": 52.158158,
    "lng": 5.396265,
    "geoConfidence": "high",
    "specialties": [
      "Aziatische levensmiddelen",
      "Kruiden & specerijen",
      "Indonesisch",
      "Thais",
      "Surinaams/Antilliaans",
      "Servies & cadeauartikelen"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Kamp 61, 3811 AP Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "033 476 7216"
      },
      {
        "label": "Type",
        "value": "Aziatische toko / supermarkt"
      },
      {
        "label": "Herkomst producten",
        "value": "Thailand, China, Vietnam, Indonesië, India, Japan, Filipijnen, Suriname/Antillen"
      },
      {
        "label": "Gesloten",
        "value": "Maandag"
      },
      {
        "label": "Koopavond",
        "value": "Donderdag tot 20.00 uur"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "20:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "12:00",
            "close": "18:00"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Toko%20Dong-A%20Kamp%2061%20Amersfoort",
    "hasGoogleReviews": true,
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09197_1093641845.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl official listing)",
    "schemaType": "Store",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09197_1093641845.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Shoppen",
      "Lokaal & ambachtelijk",
      "Cadeau zoeken"
    ]
  },
  {
    "id": "studio-mr-bunny",
    "name": "Studio Mr Bunny",
    "category": "Winkels & makers",
    "subcategory": "Kunst, curiosa en tufting workshops",
    "address": "Kamp 62",
    "postalCode": "3811 AT",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": "Mr Bunny",
    "publicPersonRole": "maker / creatieveling",
    "shortDescription": "Handgemaakt atelier en winkel op de Kamp: unieke stolpen, trooststolpen, tassen en gezellige tuft-workshops met Mr Bunny.",
    "longDescription": "Studio Mr Bunny is een sfeervol handgemaakt atelier annex winkel aan de Kamp 62 in Amersfoort, waar kunst, natuur en ambacht samenkomen in unieke stolpen, betekenisvolle trooststolpen, curiosa en handgemaakte tassen. In de lichte, ruime werkplaats geeft Mr Bunny zelf met veel passie en geduld workshops spiegel tuften (5,5 uur, €97,50) en slippers tuften (2,5 uur, €57,50), voor maximaal vier deelnemers per sessie. De winkel is open op woensdag, donderdag en vrijdag van 12.00 tot 16.00 uur en daarbuiten op afspraak.",
    "tags": [
      "tufting",
      "workshop",
      "kunst",
      "curiosa",
      "maker",
      "Stolpen",
      "Trooststolpen",
      "Tuft-workshops"
    ],
    "websiteUrl": "https://www.studiomrbunny.com",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/1988445895/studio-mr-bunny",
      "https://www.studiomrbunny.nl (official website JSON-LD: address, geo, priceRange, social links, reviews, workshop catalog, og:image)",
      "https://www.tijdvooramersfoort.nl/nl/locaties/1988445895/studio-mr-bunny (reference: opening hours wo/do/vr 12.00-16.00, geo, photos)",
      "https://www.vvvamersfoort.nl/nl/locaties/3018/studio-mr-bunny (confirms listing)",
      "https://www.oozo.nl/bedrijven/amersfoort/stadskern/coninckstraat/3066707/studio-mr-bunny (business directory)",
      "WebSearch: 'Studio Mr Bunny Amersfoort Kamp 62 openingstijden' (confirmed wo/do/vr 12-16 + op afspraak)"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 62,
    "status": "open",
    "lat": 52.158245,
    "lng": 5.3958866,
    "geoConfidence": "high",
    "priceRange": "$$",
    "specialties": [
      "Stolpen",
      "Trooststolpen",
      "Tuft-workshops",
      "Handgemaakte tassen",
      "Curiosa & woondecoratie",
      "Creatief uitje"
    ],
    "keyFacts": [
      {
        "label": "Type",
        "value": "Handgemaakt atelier & winkel"
      },
      {
        "label": "Specialiteit",
        "value": "Stolpen & trooststolpen"
      },
      {
        "label": "Workshops",
        "value": "Spiegel tuften (€97,50) & slippers tuften (€57,50)"
      },
      {
        "label": "Groepsgrootte",
        "value": "Max. 4 deelnemers per sessie"
      },
      {
        "label": "Buurt",
        "value": "De Kamp, Amersfoort"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "closed": true,
        "periods": []
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "12:00",
            "close": "16:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "12:00",
            "close": "16:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "12:00",
            "close": "16:00"
          }
        ]
      },
      {
        "day": "saturday",
        "closed": true,
        "periods": []
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/place/studio+mr+bunny/@52.158245,5.3958866,17z/data=!4m8!3m7!1s0x47c64725f9b9479d:0xed228ee55194631b!8m2!3d52.158245!4d5.3958866!9m1!1b1!16s%2Fg%2F11l1r8yyr6",
    "hasGoogleReviews": true,
    "instagramUrl": "https://www.instagram.com/studiomrbunny",
    "facebookUrl": "https://www.facebook.com/studiomrbunny",
    "imageCandidateUrl": "https://www.studiomrbunny.nl/opengraph-image?a31a048f0545efcb",
    "imageCandidateSource": "studiomrbunny.nl",
    "schemaType": "ArtGallery",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://fyhxnuuloxsxkdpppqie.supabase.co/storage/v1/object/public/site-images/home/hero-slideshow/etalage-voorgevel.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Shoppen",
      "Lokaal & ambachtelijk"
    ]
  },
  {
    "id": "new-belhadi-modestoffen",
    "name": "Belhadi Modestoffen",
    "category": "Winkels & makers",
    "subcategory": "Stoffenwinkel voor modestoffen, fournituren en naaibenodigdheden",
    "address": "Kamp 63",
    "postalCode": "3811 AP",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": "Belhadi",
    "publicPersonRole": "Eigenaar",
    "shortDescription": "Sfeervolle stoffenwinkel in hartje Amersfoort voor trendy modestoffen, bijzondere buitenlandse stoffen en fournituren, met persoonlijk vakadvies.",
    "longDescription": "Bij Belhadi Modestoffen aan de Kamp koop je trendy modestoffen volgens de laatste mode én bijzondere buitenlandse stoffen, voornamelijk uit Turkije en Italië. Naast stoffen vind je hier fournituren zoals garens (Gütermann en Mettler), ritsen, knopen en band — alles om zelf kleding of woonaccessoires te maken. Eigenaar Belhadi, bekend van de stoffenmarkten, opende de winkel in 2020 en helpt klanten graag met advies vanuit zijn brede vakkennis.",
    "tags": [
      "stoffenwinkel",
      "modestoffen",
      "fournituren",
      "naaien",
      "textiel",
      "handwerk",
      "Amersfoort centrum",
      "De Kamp"
    ],
    "facebookUrl": "https://www.facebook.com/p/Belhadimodestoffen-100063607835681/",
    "phone": "+31 33 211 0059",
    "sourceUrls": [
      "https://www.cylex.nl/bedrijf/belhadi-modestoffen-13274941.html",
      "https://vind-open.nl/amersfoort/belhadi-modestoffen-564561",
      "https://www.tijdvooramersfoort.nl/nl/locaties/3098534527/belhadi-modestoffen",
      "https://www.destadamersfoort.nl/lokaal/zakelijk/373855/-advertorial-belhadi-van-markt-naar-winkel-veel-klanten-maken-z",
      "https://www.facebook.com/p/Belhadimodestoffen-100063607835681/",
      "https://www.waze.com/live-map/directions/nl/ut/amersfoort/belhadi-modestoffen?to=place.ChIJ_74e4xhHxkcRgII8uFgL7Qo"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 63,
    "status": "open",
    "lat": 52.158191,
    "lng": 5.396357,
    "geoConfidence": "medium",
    "specialties": [
      "Modestoffen volgens de laatste mode",
      "Bijzondere buitenlandse stoffen (Turkije en Italië)",
      "Fournituren: garens, ritsen, knopen en band",
      "Stoffen voor kinder- en dameskleding",
      "Persoonlijk vakadvies over stof en verwerking",
      "Materialen voor zelf naaien en handwerk"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Kamp 63, 3811 AP Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "033 211 0059"
      },
      {
        "label": "Type",
        "value": "Stoffenwinkel / modestoffen"
      },
      {
        "label": "Geopend sinds",
        "value": "Oktober 2020"
      },
      {
        "label": "Specialiteit",
        "value": "Trendy modestoffen en buitenlandse stoffen"
      },
      {
        "label": "Website",
        "value": "Niet meer actief (domein vervallen)"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "12:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "09:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "09:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "09:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "09:30",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "09:30",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Belhadi+Modestoffen+Kamp+63+Amersfoort&query_place_id=ChIJ_74e4xhHxkcRgII8uFgL7Qo",
    "hasGoogleReviews": true,
    "schemaType": "Store",
    "imageCandidateSource": "none",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://storage.pubble.nl/96897487/content/2020/11/edbd4c45-4d26-48bf-a5fa-db7cd7eade09_thumb1920.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Shoppen",
      "Lokaal & ambachtelijk",
      "Met kinderen"
    ]
  },
  {
    "id": "new-thai-massage-hoanghuong",
    "name": "Thai Massage HoangHuong",
    "category": "Beauty & verzorging",
    "subcategory": "Thaise massagesalon & nagelstudio",
    "address": "Kamp 64",
    "postalCode": "3811 AT",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Authentieke Thaise massagesalon en nagelstudio aan de Kamp, met traditionele, olie-, kruiden- en hot stone massages.",
    "longDescription": "Bij Thai Massage HoangHuong aan de Kamp 64 geniet je van authentieke Thaise massages in een verzorgde, hygienische salon in het hart van Amersfoort. Naast traditionele Thaise, olie-, kruiden-, voet- en hot stone massages kun je hier ook terecht voor een manicure of pedicure. De salon is zes dagen per week tot in de avond geopend, zodat ontspannen ook na werktijd kan.",
    "tags": [
      "thaise massage",
      "massagesalon",
      "wellness",
      "ontspanning",
      "hot stone",
      "nagelstudio",
      "manicure",
      "pedicure"
    ],
    "websiteUrl": "https://thaimassagehoanghuong.nl",
    "facebookUrl": "https://www.facebook.com/thaimassagehoanghuong/",
    "phone": "033 752 09 63",
    "sourceUrls": [
      "https://thaimassagehoanghuong.nl/",
      "https://thaimassagehoanghuong.nl/contact/",
      "https://www.fresha.com/lvp/thai-hoanghuong-kamp-amersfoort-A7DzYv",
      "https://www.cylex.nl/bedrijf/thai-massage-hoanghuong-13226391.html",
      "https://www.tijdvooramersfoort.nl/nl/locaties/176939014/hoang-huong-thai-massages",
      "https://www.waze.com/live-map/directions/netherlands/utrecht/amersfoort/thai-massage-hoanghuong"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 64,
    "status": "open",
    "lat": 52.1582254,
    "lng": 5.3959645,
    "geoConfidence": "high",
    "specialties": [
      "Traditionele Thaise massage",
      "Hot stone massage",
      "Kruidenmassage",
      "Olie- en ontspanningsmassage",
      "Voetmassage",
      "Manicure & pedicure"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Kamp 64, 3811 AT Amersfoort"
      },
      {
        "label": "Openingstijden",
        "value": "Ma-za 10:00-21:00, zo 10:00-18:00"
      },
      {
        "label": "Telefoon",
        "value": "033 752 09 63 / 06 552 19 110"
      },
      {
        "label": "Specialisme",
        "value": "Thaise massages & nagelverzorging"
      },
      {
        "label": "Parkeren",
        "value": "Goede parkeergelegenheid in de buurt"
      },
      {
        "label": "KvK",
        "value": "64659461"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "10:00",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/place/Thai+Massage+HoangHuong/@52.1582254,5.3959645,16z/data=!3m1!4b1!4m6!3m5!1s0x47c6469c0acee843:0x14d72d9a113e1634!8m2!3d52.1582254!4d5.3959645!16s%2Fg%2F11btx6yf7z",
    "hasGoogleReviews": false,
    "schemaType": "BeautySalon",
    "imageCandidateUrl": "https://thaimassagehoanghuong.nl/wp-content/uploads/2024/04/Thai-Massage-HoangHuong-Amersfoort10-2000x1500.jpg",
    "imageCandidateSource": "Eigen websitefoto van de salon (thaimassagehoanghuong.nl, wp-content upload 2024/04). De og:image meta is alleen het 250x250 logo/favicon; deze 2000x1500 salonfoto is de eigen brand-afbeelding die op de site wordt gebruikt.",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://thaimassagehoanghuong.nl/wp-content/uploads/2024/04/Thai-Massage-HoangHuong-Amersfoort10-2000x1500.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Verwennen",
      "Me-time"
    ]
  },
  {
    "id": "new-tulip-clinic",
    "name": "Tulip Clinic",
    "category": "Beauty & verzorging",
    "subcategory": "Beauty- & laserkliniek",
    "address": "Kamp 68",
    "postalCode": "3811 AT",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": "Jalal Lotfi",
    "publicPersonRole": "Dermatoloog en kliniekdirecteur (sinds 2017); publiekelijk vermeld op de Over ons-pagina",
    "shortDescription": "Beauty- en laserkliniek in hartje De Kamp voor injectables, laserontharing en medische huidbehandelingen, met medische expertise.",
    "longDescription": "Tulip Clinic aan de Kamp 68 is een veelzijdige beauty- en laserkliniek in het centrum van Amersfoort die schoonheid combineert met medische expertise. Het team biedt onder meer botox en fillers, laserontharing, microneedling en medische huidbehandelingen voor onder andere acne en huidverbetering. De kliniek wordt geleid door dermatoloog Jalal Lotfi en werkt als AGB-geregistreerde praktijk met ervaren specialisten.",
    "tags": [
      "beautykliniek",
      "laserkliniek",
      "laserontharing",
      "injectables",
      "botox",
      "fillers",
      "huidtherapie",
      "microneedling"
    ],
    "websiteUrl": "https://tulipclinic.nl",
    "instagramUrl": "https://www.instagram.com/tulipclinicnl/",
    "facebookUrl": "https://www.facebook.com/tulipclinicnl/",
    "phone": "+31 33 737 0216",
    "sourceUrls": [
      "https://tulipclinic.nl/",
      "https://tulipclinic.nl/contact/",
      "https://tulipclinic.nl/over-ons/",
      "https://www.fresha.com/lvp/tulip-clinic-beauty-laser-clinic-amersfoort-kamp-amersfoort-A87okq",
      "https://www.treatwell.nl/en/place/tulip-laser-beauty-center/",
      "https://injectablesbooking.nl/kliniek/tulip-clinic"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 68,
    "status": "open",
    "lat": 52.158411,
    "lng": 5.396333,
    "geoConfidence": "high",
    "specialties": [
      "Laserontharing",
      "Injectables (botox & fillers)",
      "Microneedling",
      "Medische huidbehandelingen",
      "Acnebehandeling",
      "Anti-aging & huidverbetering"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Kamp 68, 3811 AT Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "+31 33 737 0216"
      },
      {
        "label": "Openingstijden",
        "value": "Di t/m za 10:00-18:00; ma en zo gesloten"
      },
      {
        "label": "Google-beoordeling",
        "value": "ca. 4,7 sterren (200+ reviews)"
      },
      {
        "label": "Type",
        "value": "Beauty- & laserkliniek met medische expertise (AGB 90093792)"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Tulip+Clinic+Kamp+68+Amersfoort",
    "hasGoogleReviews": true,
    "schemaType": "BeautySalon",
    "imageCandidateUrl": "https://tulipclinic.nl/wp-content/uploads/elementor/thumbs/medische-huidtherapie-amersfoort-en-de-omgeving-r87n1jhylbs9vrcj56h8zq4hxu5va9gk4z1jlyu7i0.png",
    "imageCandidateSource": "Official website (tulipclinic.nl) og:image / primaryImageOfPage",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://tulipclinic.nl/wp-content/uploads/2025/07/tulip-clinic-amersfoort.webp",
    "imageFit": "cover",
    "perfectFor": [
      "Verwennen",
      "Me-time",
      "Trouwen & gala"
    ]
  },
  {
    "id": "new-perfect-dress",
    "name": "Perfect Dress",
    "category": "Mode & sieraden",
    "subcategory": "Galajurken & avondkleding",
    "address": "Kamp 70",
    "postalCode": "3811 AT",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Specialist in galajurken, cocktail- en avondjurken in maat 32 t/m 54, met persoonlijk pasadvies in hartje De Kamp.",
    "longDescription": "Perfect Dress aan de Kamp 70 is dé galazaak van Amersfoort voor galajurken, cocktailjurken, feestjurken en moeder-van-de-bruid-outfits. Je vindt er een ruime collectie in maat 32 t/m 54 met persoonlijk styling-advies en vermaak op maat via het eigen atelier. Plan een pasafspraak en laat je van top tot teen kleden voor je gala, bruiloft of feest.",
    "tags": [
      "galajurken",
      "avondkleding",
      "cocktailjurken",
      "feestkleding",
      "moeder van de bruid",
      "mode",
      "de kamp",
      "amersfoort"
    ],
    "websiteUrl": "https://perfect-dress.nl",
    "instagramUrl": "https://www.instagram.com/perfect_dress.nl/",
    "facebookUrl": "https://www.facebook.com/theperfectdressamersfoort/",
    "phone": "+31 6 87706764",
    "sourceUrls": [
      "https://perfect-dress.nl",
      "https://perfect-dress.nl/contact/",
      "https://perfect-dress.nl/over-ons/",
      "https://www.instagram.com/perfect_dress.nl/",
      "https://www.facebook.com/theperfectdressamersfoort/",
      "https://www.degalazaak.nl/winkels/amersfoort/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 70,
    "status": "open",
    "lat": 52.1583981,
    "lng": 5.3961764,
    "geoConfidence": "medium",
    "specialties": [
      "Galajurken",
      "Cocktailjurken",
      "Avond- en feestjurken",
      "Moeder van de bruid",
      "Maat 32 t/m 54",
      "Vermaak op maat (atelier)"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Kamp 70, 3811 AT Amersfoort"
      },
      {
        "label": "Openingstijden",
        "value": "di-za 10:00-17:00, zo 12:00-16:00, ma gesloten"
      },
      {
        "label": "Maatvoering",
        "value": "Maat 32 t/m 54"
      },
      {
        "label": "Afspraak",
        "value": "Pasafspraak aanbevolen; ook eigen atelier voor vermaak"
      },
      {
        "label": "Contact",
        "value": "06-87706764 (bel/WhatsApp), info@perfect-dress.nl"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "12:00",
            "close": "16:00"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Perfect+Dress+Kamp+70+Amersfoort",
    "hasGoogleReviews": false,
    "schemaType": "ClothingStore",
    "imageCandidateUrl": "https://perfect-dress.nl/wp-content/uploads/2026/06/2026_R206i_FLEUR_2_BD.webp",
    "imageCandidateSource": "perfect-dress.nl og:image (eigen campagnebeeld 2026)",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://perfect-dress.nl/wp-content/uploads/2026/06/2026_R206i_FLEUR_2_BD.webp",
    "imageFit": "cover",
    "perfectFor": [
      "Shoppen",
      "Cadeau zoeken",
      "Trouwen & gala"
    ]
  },
  {
    "id": "the-far-east",
    "name": "The Far East",
    "category": "Eten & drinken",
    "subcategory": "Chinees restaurant",
    "address": "Kamp 74",
    "postalCode": "3811 AT",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Vertrouwd Chinees-Indisch restaurant op de Kamp: Kantonese en Szechuanese specialiteiten, afhalen of bezorgen, elke dag open vanaf 16.00 uur.",
    "longDescription": "The Far East is een sfeervol Chinees-Indisch restaurant midden in het centrum van Amersfoort, aan de gezellige Kamp 74. Op de kaart staan authentieke Oosterse gerechten, van originele Kantonese en Szechuanese specialiteiten tot vertrouwde Indische rijst- en bamischotels, met populaire combinatiemenu's voor een schappelijke prijs. Je kunt er lekker ter plekke eten of je bestelling afhalen of laten bezorgen; de keuken is elke dag van de week geopend van 16.00 tot 21.00 uur.",
    "tags": [
      "Chinees",
      "restaurant",
      "afhaal",
      "Oosters",
      "Kamp",
      "Kantonese keuken",
      "Szechuanese specialiteiten",
      "Chinees-Indisch"
    ],
    "websiteUrl": "https://fareast-amersfoort.nl",
    "phone": "033 472 50 21",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/141081316/the-far-east",
      "https://www.thefareast-amersfoort.nl/",
      "https://assets.plaece.nl/odp-ubase/image/dsc09205_3127035507.jpg",
      "https://restaurantguru.com/The-Far-East-Amersfoort",
      "https://www.yelp.com/biz/specialiteiten-restaurant-the-far-east-amersfoort",
      "https://en.eet.nu/amersfoort/the-far-east"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 74,
    "status": "open",
    "lat": 52.158408,
    "lng": 5.396378,
    "geoConfidence": "high",
    "priceRange": "€€",
    "specialties": [
      "Kantonese keuken",
      "Szechuanese specialiteiten",
      "Chinees-Indisch",
      "Afhalen & bezorgen",
      "Combinatiemenu's",
      "Wokgerechten"
    ],
    "keyFacts": [
      {
        "label": "Keuken",
        "value": "Chinees-Indisch"
      },
      {
        "label": "Adres",
        "value": "Kamp 74, 3811 AT Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "(033) 472 50 21"
      },
      {
        "label": "Geopend",
        "value": "Dagelijks 16.00 - 21.00 uur"
      },
      {
        "label": "Service",
        "value": "Eten, afhalen & bezorgen"
      },
      {
        "label": "Google-beoordeling",
        "value": "ca. 4,2"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "16:00",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "16:00",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "16:00",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "16:00",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "16:00",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "16:00",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "16:00",
            "close": "21:00"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=The+Far+East+Kamp+74+Amersfoort",
    "hasGoogleReviews": true,
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09205_3127035507.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl / Visit Amersfoort)",
    "schemaType": "Restaurant",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09205_3127035507.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Uit eten",
      "Samen tafelen",
      "Snelle hap",
      "Afhalen"
    ],
    "priceLevel": "mid"
  },
  {
    "id": "new-happyfood",
    "name": "HappyFood Amersfoort (Kamp)",
    "category": "Eten & drinken",
    "subcategory": "Cafetaria / snackbar met afhaal en bezorging",
    "address": "Kamp 76",
    "postalCode": "3811 AT",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Cafetaria op de Kamp in de binnenstad: knapperige verse friet, snacks, broodjes en HappyBurgers om af te halen of te laten bezorgen.",
    "longDescription": "HappyFood is een kwaliteitscafetaria aan de Kamp 76, midden in de historische binnenstad van Amersfoort vlak bij de Kamperbinnenpoort. Je vindt er versgesneden friet, een breed assortiment snacks, verse broodjes en de eigen HappyBurgers, klaar om af te halen of thuis te laten bezorgen. Een vertrouwd adres voor een snelle, hartige hap in het centrum.",
    "tags": [
      "cafetaria",
      "snackbar",
      "fastfood",
      "afhaal",
      "bezorging",
      "friet",
      "burgers",
      "binnenstad"
    ],
    "facebookUrl": "https://www.facebook.com/happyfoodamersfoort/",
    "phone": "033-7851364",
    "sourceUrls": [
      "https://www.openingstijdengids.nl/happyfood/amersfoort/2",
      "https://www.openingstijden.com/open/happyfood-amersfoort-kamp/amersfoort/",
      "https://www.telefoonboek.nl/bedrijven/t4160665/amersfoort/happyfood-amersfoort-kamp/",
      "https://nominatim.openstreetmap.org/",
      "https://www.facebook.com/happyfoodamersfoort/",
      "https://happyfood.nl/locatie/amersfoort/"
    ],
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 76,
    "status": "open",
    "lat": 52.1584438,
    "lng": 5.396454,
    "geoConfidence": "high",
    "priceRange": "€",
    "specialties": [
      "Versgesneden friet",
      "HappyBurgers",
      "Klassieke snacks (frikandel, kroket)",
      "Verse broodjes",
      "Afhalen",
      "Bezorging"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Kamp 76, 3811 AT Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "033-7851364"
      },
      {
        "label": "Type",
        "value": "Cafetaria / snackbar"
      },
      {
        "label": "Afhalen",
        "value": "Ja"
      },
      {
        "label": "Ligging",
        "value": "Historische binnenstad, nabij Kamperbinnenpoort"
      },
      {
        "label": "Openingstijden",
        "value": "Breed vermeld als ca. 12:00-22:00 (niet per dag geverifieerd)"
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=HappyFood+Kamp+76+Amersfoort",
    "hasGoogleReviews": false,
    "schemaType": "Restaurant",
    "imageCandidateSource": "none",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://happyfood.nl/wp-content/uploads/2024/05/HappyFood-bestellen.png",
    "imageFit": "cover",
    "perfectFor": [
      "Uit eten",
      "Samen tafelen",
      "Snelle hap",
      "Afhalen"
    ],
    "priceLevel": "budget"
  },
  {
    "id": "new-optiek-verkerk",
    "name": "Optiek Verkerk",
    "category": "Services & praktisch",
    "subcategory": "Opticien & oogzorg",
    "address": "Kamp 78",
    "postalCode": "3811 AT",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Zelfstandige kwaliteitsopticien aan de Kamp: nauwkeurige oogmetingen, persoonlijk advies en monturen op maat.",
    "longDescription": "Optiek Verkerk is de onafhankelijke kwaliteitsopticien aan de Kamp 78, aan de rand van het centrum vlak bij De Stier. Onder één dak werken opticiens, optometristen en contactlensspecialisten aan nauwkeurige oogmetingen, deskundig advies over brillenglazen en contactlenzen, en monturen op maat. Klanten roemen de rustige, persoonlijke aanpak; gratis parkeren is mogelijk in de eigen parkeergarage achter de zaak.",
    "tags": [
      "opticien",
      "brillen",
      "zonnebrillen",
      "contactlenzen",
      "oogmeting",
      "optometrie",
      "De Kamp",
      "Amersfoort"
    ],
    "websiteUrl": "https://www.optiekverkerk.nl/amersfoort",
    "instagramUrl": "https://www.instagram.com/optiekverkerk/",
    "facebookUrl": "https://www.facebook.com/optiekverkerk",
    "phone": "033 472 17 19",
    "sourceUrls": [
      "https://www.optiekverkerk.nl/amersfoort",
      "https://www.vvvamersfoort.nl/nl/locaties/2927/optiek-verkerk-amersfoort",
      "https://optiek.nl/opticiens/optiek-verkerk-amersfoort-kamp-78-3811-at-amersfoort",
      "https://opiness.nl/review/optiek-verkerk-amersfoort",
      "https://www.facebook.com/optiekverkerk"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 78,
    "status": "open",
    "lat": 52.15843,
    "lng": 5.39666,
    "geoConfidence": "high",
    "specialties": [
      "Nauwkeurige oogmetingen / refractie",
      "Persoonlijk brilladvies",
      "Monturen op maat",
      "Multifocale brillenglazen",
      "Contactlenzen aanmeten",
      "Optometrie & oogzorg"
    ],
    "keyFacts": [
      {
        "label": "Type",
        "value": "Zelfstandige opticien"
      },
      {
        "label": "Telefoon",
        "value": "033 472 17 19"
      },
      {
        "label": "E-mail",
        "value": "amersfoort@optiekverkerk.nl"
      },
      {
        "label": "Parkeren",
        "value": "Gratis eigen parkeergarage achter de zaak (voor klanten)"
      },
      {
        "label": "Koopavond",
        "value": "Donderdagavond geopend (19:00-21:00)"
      },
      {
        "label": "Locatie",
        "value": "Aan de Kamp, nabij De Stier"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "09:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "09:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "09:00",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "09:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "09:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Optiek+Verkerk+Kamp+78+3811+AT+Amersfoort",
    "hasGoogleReviews": true,
    "schemaType": "Store",
    "imageCandidateUrl": "https://optiekverkerk.nl/_images-v3/bba31636-b3ab-4500-a935-4c30e07ed3a4",
    "imageCandidateSource": "Official website og:image (optiekverkerk.nl/amersfoort)",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://optiekverkerk.nl/_images-v3/bba31636-b3ab-4500-a935-4c30e07ed3a4",
    "imageFit": "cover",
    "perfectFor": [
      "Praktisch geregeld"
    ]
  },
  {
    "id": "terre-des-hommes-amersfoort",
    "name": "Terre des Hommes Amersfoort",
    "category": "Winkels & makers",
    "subcategory": "Tweedehands winkel / goed doel",
    "address": "Kamp 79",
    "postalCode": "3811 AP",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Sfeervolle tweedehandswinkel in hartje De Kamp: kwaliteitskleding, boeken en curiosa, gerund door vrijwilligers tegen kinderuitbuiting.",
    "longDescription": "Bij Terre des Hommes aan de Kamp 79 shop je eersteklas tweedehands en maak je tegelijk impact. In deze gezellige winkel vind je goede kwaliteit dames-, heren- en kinderkleding, schoenen, tassen, accessoires, speelgoed, boeken, platen, serviesgoed en curiosa. De winkel draait volledig op vrijwilligers en de hele opbrengst gaat naar de projecten van Terre des Hommes Nederland tegen kinderuitbuiting wereldwijd.",
    "tags": [
      "tweedehands",
      "goed doel",
      "kleding",
      "boeken",
      "duurzaam",
      "Tweedehands winkel",
      "Kringloop",
      "Vintage kleding"
    ],
    "websiteUrl": "https://www.terredeshommes.nl",
    "phone": "033 737 0449",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/4066033477/terre-des-hommes-amersfoort",
      "https://www.terredeshommes.nl/onze-winkels/amersfoort",
      "https://www.openingstijdengids.nl/terre-des-hommes/amersfoort/1",
      "https://www.meukisleuk.nl/winkels/219/terre-des-hommes-amersfoort.html",
      "https://www.facebook.com/people/Terre-des-Hommes-Amersfoort/100064835614795/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 79,
    "status": "open",
    "lat": 52.15847,
    "lng": 5.397068,
    "geoConfidence": "high",
    "specialties": [
      "Tweedehands winkel",
      "Kringloop",
      "Vintage kleding",
      "Boeken & platen",
      "Goed doel",
      "Duurzaam shoppen"
    ],
    "keyFacts": [
      {
        "label": "Type",
        "value": "Tweedehandswinkel / kringloop"
      },
      {
        "label": "Goed doel",
        "value": "Terre des Hommes Nederland"
      },
      {
        "label": "Bemensing",
        "value": "Volledig door vrijwilligers"
      },
      {
        "label": "Winkel geopend",
        "value": "ca. 2011 (12,5 jaar in mei 2024)"
      },
      {
        "label": "Telefoon",
        "value": "033 737 0449 / 06-83590436"
      },
      {
        "label": "E-mail",
        "value": "winkel.amersfoort@tdh.nl"
      },
      {
        "label": "Opbrengst 2025",
        "value": "EUR 140.000 voor de strijd tegen kinderuitbuiting"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Terre%20des%20Hommes%20Amersfoort%20Kamp%2079",
    "hasGoogleReviews": true,
    "instagramUrl": "https://www.instagram.com/terredeshommesamersfoort",
    "facebookUrl": "https://www.facebook.com/people/Terre-des-Hommes-Amersfoort/100064835614795/",
    "imageCandidateUrl": "https://assets.plaece.nl/thumb/OnzEUavaxFX8srmjJpXJO02wX-Dns2T01jPBMT_hgng/resizing_type:fit/width:650/height:366/gravity:sm/aHR0cHM6Ly9hc3NldHMucGxhZWNlLm5sL29kcC11YmFzZS9pbWFnZS9kc2MwMTYxMy0zXzM1NDg2MzIyNDEuanBn.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl directory listing)",
    "schemaType": "Store",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dsc01613-3_3548632241.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Shoppen",
      "Lokaal & ambachtelijk",
      "Trouwen & gala"
    ]
  },
  {
    "id": "binnenspecialist-van-den-berg",
    "name": "Binnenspecialist van den Berg Amersfoort",
    "category": "Interieur & kunst",
    "subcategory": "Vloeren, behang, gordijnen en zonwering",
    "address": "Kamp 82",
    "postalCode": "3811 AT",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Voormalige Binnenspecialist van den Berg aan de Kamp 82 — vloeren, gordijnen, behang en zonwering. Deze binnenstadwinkel is inmiddels gesloten.",
    "longDescription": "Binnenspecialist van den Berg was de Amersfoortse vestiging van de Binnenspecialist-formule, gevestigd aan de Kamp 82 in de historische binnenstad. De winkel adviseerde over en leverde vloeren, behang, gordijnen en binnen- en buitenzonwering en stond bekend om persoonlijk maatwerk (4,8 sterren uit 16 Google-reviews). Deze locatie is inmiddels gesloten; de activiteiten zijn verplaatst naar de vestigingen in Voorthuizen en Zeist, beide met parkeergelegenheid voor de deur en behoud van dezelfde service en garantie.",
    "tags": [
      "interieur",
      "vloeren",
      "gordijnen",
      "behang",
      "zonwering",
      "Binnenzonwering",
      "Buitenzonwering",
      "Interieuradvies"
    ],
    "websiteUrl": "https://www.binnenspecialist.nl",
    "phone": "033-4801379",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/4023424995/binnenspecialist-van-den-berg-amersfoort",
      "https://www.binnenspecialist.nl/van-den-berg-amersfoort",
      "https://www.binnenspecialist.nl",
      "https://zaubee.com/biz/binnenspecialist-van-den-berg-amersfoort-qo9lpw4n",
      "https://firmania.nl/amersfoort/binnenspecialist-van-den-berg-amersfoort-547522",
      "https://www.cbw-erkend.nl/bedrijven/Van-den-Berg-Binnenspecialist-AMERSFOORT"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 82,
    "status": "closed",
    "lat": 52.158549,
    "lng": 5.396709,
    "geoConfidence": "high",
    "specialties": [
      "Vloeren",
      "Gordijnen",
      "Behang",
      "Binnenzonwering",
      "Buitenzonwering",
      "Interieuradvies"
    ],
    "keyFacts": [
      {
        "label": "Status",
        "value": "Gesloten (verplaatst naar Voorthuizen en Zeist)"
      },
      {
        "label": "Adres",
        "value": "Kamp 82, 3811 AT Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "033-4801379"
      },
      {
        "label": "Assortiment",
        "value": "Vloeren, behang, gordijnen, zonwering"
      },
      {
        "label": "Google-beoordeling",
        "value": "4,8 ster (16 reviews)"
      },
      {
        "label": "Onderdeel van",
        "value": "Binnenspecialist (CBW-erkend)"
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Binnenspecialist+van+den+Berg+Kamp+82+Amersfoort&query_place_id=",
    "hasGoogleReviews": true,
    "instagramUrl": "https://www.instagram.com/binnenspecialist/",
    "facebookUrl": "https://www.facebook.com/binnenspecialist",
    "imageCandidateUrl": "https://www.binnenspecialist.nl/modules/Socialmedia/Views/Frontend/Img/og_default.png",
    "imageCandidateSource": "binnenspecialist.nl",
    "schemaType": "JewelryStore",
    "updatedAt": "2026-06-14"
  },
  {
    "id": "new-struijk-acousticon",
    "name": "Struijk Acousticon",
    "category": "Services & praktisch",
    "subcategory": "Audicien & hoorzorg",
    "address": "Kamp 86",
    "postalCode": "3811 AT",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": "Ron & Joke",
    "publicPersonRole": "Audiciens",
    "shortDescription": "Zelfstandige vakaudicien op de Kamp, al 45+ jaar. Hoortoestellen, hoortesten, gehoorbescherming en oordoppen op maat in hartje Amersfoort.",
    "longDescription": "Struijk Acousticon is een zelfstandige vakaudicien aan Kamp 86 in het historische centrum van Amersfoort, al meer dan 45 jaar een vertrouwd adres voor hoorzorg. Het team helpt je persoonlijk bij de keuze en aanpassing van een hoortoestel, een gratis hoortest, gehoorbescherming en oordoppen op maat. Klanten waarderen de deskundige, rustige begeleiding, zichtbaar in de uitstekende Google-beoordelingen.",
    "tags": [
      "audicien",
      "hoortoestellen",
      "hoortest",
      "gehoorbescherming",
      "oordoppen op maat",
      "hoorzorg",
      "De Kamp",
      "Amersfoort"
    ],
    "websiteUrl": "https://www.struijk-acousticon.nl",
    "instagramUrl": "https://www.instagram.com/struijkaudiciens",
    "facebookUrl": "https://www.facebook.com/struijkaudiciens",
    "phone": "033-4728183",
    "sourceUrls": [
      "https://www.struijk-acousticon.nl",
      "https://www.struijk-acousticon.nl/contact/",
      "https://www.struijk-audiciens.nl/vestiging/struijk-acousticon-amersfoort/",
      "https://www.zorgscore.nl/audicien/amersfoort/struijk-acousticon/99494b11-a263-4a0c-a7de-b17e05ea953c",
      "https://www.hoorprofs.nl/audiciens/acousticon-amersfoort/",
      "https://www.gehoorinfo.nl/Amersfoort/Kamp+86+/Acousticon+Amersfoort.html"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 86,
    "status": "open",
    "lat": 52.15861283,
    "lng": 5.39683834,
    "geoConfidence": "high",
    "specialties": [
      "Hoortoestellen aanmeten en aanpassen",
      "Gratis hoortest",
      "Gehoorbescherming op maat",
      "Oordoppen op maat",
      "Hoorhulpmiddelen",
      "Persoonlijk hooradvies"
    ],
    "keyFacts": [
      {
        "label": "Type",
        "value": "Zelfstandige vakaudicien"
      },
      {
        "label": "Ervaring",
        "value": "45+ jaar in Amersfoort"
      },
      {
        "label": "Openingstijden",
        "value": "Di t/m vr 09:00-17:00; ma, za, zo gesloten"
      },
      {
        "label": "Telefoon",
        "value": "033-4728183"
      },
      {
        "label": "Google-beoordeling",
        "value": "ca. 9,4 (26 reviews)"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "09:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "09:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "09:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "09:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "saturday",
        "closed": true,
        "periods": []
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Struijk+Acousticon+Kamp+86+Amersfoort",
    "hasGoogleReviews": true,
    "schemaType": "Store",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://www.struijk-acousticon.nl/wp-content/uploads/IMG_3479-e1616589525713.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Praktisch geregeld"
    ]
  },
  {
    "id": "de-aubergerie",
    "name": "De Aubergerie",
    "category": "Eten & drinken",
    "subcategory": "Frans restaurant",
    "address": "Kamp 88",
    "postalCode": "3811 AT",
    "city": "Amersfoort",
    "streetSegment": "Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Sfeervol Bib Gourmand-restaurant van Han & Ingrid Everts in een monumentaal pand uit 1700 aan de rand van de Amersfoortse binnenstad.",
    "longDescription": "In hun met een Bib Gourmand onderscheiden restaurant aan Kamp 88 verwelkomen Han en Ingrid Everts maximaal 28 gasten in een monumentaal pand uit circa 1700, modern-klassiek ingericht met eiken tafels en comfortabele fauteuils. De keuken is op de Franse leest geschoeid met kleine internationale invloeden en golft mee met de seizoenen; kies uit het Bib Gourmand keuzemenu of het uitdagender Surprise-menu, met passende wijnarrangementen. Geopend van dinsdag tot en met zaterdag, waarbij gasten tussen 18:00 en 20:00 arriveren.",
    "tags": [
      "Frans",
      "restaurant",
      "diner",
      "Kamp",
      "Amersfoort",
      "Bib Gourmand",
      "Frans-seizoensgebonden keuken",
      "Surprise-menu"
    ],
    "websiteUrl": "https://www.deaubergerie.nl",
    "phone": "033 4756096",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/1028998442/de-aubergerie-2",
      "https://www.deaubergerie.nl",
      "https://guide.michelin.com/nl/nl/utrecht/amersfoort/restaurant/de-aubergerie",
      "https://www.gault-millau.nl/en/restaurants/de-aubergerie-amersfoort",
      "https://www.tripadvisor.com/Restaurant_Review-g188613-d748063-Reviews-Restaurant_De_Aubergerie-Amersfoort.html",
      "https://www.thefork.com/restaurant/de-aubergerie-r242425"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 88,
    "status": "open",
    "lat": 52.15865,
    "lng": 5.396922,
    "geoConfidence": "high",
    "priceRange": "€34 - €62",
    "specialties": [
      "Bib Gourmand",
      "Frans-seizoensgebonden keuken",
      "Surprise-menu",
      "Wijn-spijs arrangementen",
      "Monumentaal pand (1700)",
      "Intieme setting (max. 28 gasten)"
    ],
    "keyFacts": [
      {
        "label": "Keuken",
        "value": "Frans, seizoensgebonden met internationale invloeden"
      },
      {
        "label": "Onderscheiding",
        "value": "Michelin Bib Gourmand"
      },
      {
        "label": "Gastheer/-vrouw",
        "value": "Han & Ingrid Everts"
      },
      {
        "label": "Pand",
        "value": "Monumentaal pand uit circa 1700"
      },
      {
        "label": "Capaciteit",
        "value": "Maximaal 28 gasten"
      },
      {
        "label": "Reserveren",
        "value": "Online via Guestplan of 033-4756096"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "18:00",
            "close": "00:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "18:00",
            "close": "00:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "18:00",
            "close": "00:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "18:00",
            "close": "00:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "18:00",
            "close": "00:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/dir/?api=1&destination=52.15865%2C5.396922",
    "hasGoogleReviews": true,
    "facebookUrl": "https://nl-nl.facebook.com/pages/de-Aubergerie/187925561270843",
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/knofappel-aubergerie-01k-002_1329120067.jpeg",
    "imageCandidateSource": "assets.plaece.nl",
    "schemaType": "Restaurant",
    "updatedAt": "2026-06-14",
    "perfectFor": [
      "Uit eten",
      "Samen tafelen",
      "Date night",
      "Zoete trek"
    ],
    "priceLevel": "mid"
  },
  {
    "id": "k-step-events",
    "name": "Step Events",
    "category": "Winkels & makers",
    "subcategory": "Scooter shop - sales, rental & outings",
    "address": "Oliesteeg 10",
    "city": "Amersfoort",
    "streetSegment": "Achter de Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Step Events — scooter shop - sales, rental & outings op Oliesteeg 10 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Step Events is gevestigd op Oliesteeg 10 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Oliesteeg 10, an in-scope side street off the Kamp (part of official De Kamp e.o.). Active (by appointment), Yelp updated 2026. Candidates 11, 25 and 49 are the same business, deduplicated. Edge because Oliesteeg is a quiet NE side street.",
    "tags": [
      "scooter shop - sales, rental & outings",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://sportstep.nl/",
    "sourceUrls": [
      "https://sportstep.nl/"
    ],
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 110,
    "status": "open",
    "schemaType": "Store",
    "inclusionStatus": "confirmed_edge",
    "inclusionReason": "On Oliesteeg 10, an in-scope side street off the Kamp (part of official De Kamp e.o.). Active (by appointment), Yelp updated 2026. Candidates 11, 25 and 49 are the same business, deduplicated. Edge because Oliesteeg is a quiet NE side street.",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Shoppen",
      "Lokaal & ambachtelijk"
    ]
  },
  {
    "id": "k-hotel-de-tabaksplant",
    "name": "Hotel de Tabaksplant",
    "category": "Slapen",
    "subcategory": "Hotel / B&B",
    "address": "Coninckstraat 15",
    "city": "Amersfoort",
    "streetSegment": "Achter de Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Hotel de Tabaksplant — hotel / b&b op Coninckstraat 15 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Hotel de Tabaksplant is gevestigd op Coninckstraat 15 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Coninckstraat 15, explicitly in-scope side street within the Kampkwartier. 25-room hotel in an early-1600s monument; active with current bookings.",
    "tags": [
      "hotel",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://www.hoteldetabaksplant.nl/",
    "sourceUrls": [
      "https://www.hoteldetabaksplant.nl/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 115,
    "status": "open",
    "schemaType": "Hotel",
    "inclusionStatus": "confirmed_core",
    "inclusionReason": "On Coninckstraat 15, explicitly in-scope side street within the Kampkwartier. 25-room hotel in an early-1600s monument; active with current bookings.",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Overnachten",
      "Weekendje weg"
    ]
  },
  {
    "id": "kapsalon-sura",
    "name": "Kapsalon Sura Amersfoort",
    "category": "Beauty & verzorging",
    "subcategory": "Kapsalon",
    "address": "Achter de Kamp 30",
    "postalCode": "3811 JG",
    "city": "Amersfoort",
    "streetSegment": "Achter de Kamp",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Vertrouwde kapsalon in hartje Amersfoort voor dames, heren en kinderen. Binnenlopen of een afspraak maken kan allebei.",
    "longDescription": "Kapsalon Sura aan Achter de Kamp 30 is een gevestigde naam in het centrum van Amersfoort voor dames, heren en kinderen. Je kunt er spontaan binnenlopen of een afspraak maken voor knippen, kleuren, highlights en babylights, bruidskapsels, baard scheren en epileren. Op donderdag is de salon doorlopend geopend tot 21:00 uur, en op zaterdag tot 17:00 uur.",
    "tags": [
      "kapper",
      "kapsalon",
      "baard",
      "epileren",
      "Achter de Kamp",
      "Dames, heren & kinderen",
      "Knippen & kleuren",
      "Highlights & babylights"
    ],
    "websiteUrl": "https://www.kapsalonsura.nl",
    "phone": "033 495 3200",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/328257863/kapsalon-sura-amersfoort",
      "https://www.openingstijden.com/o2860923/kapsalon-sura-v-o-f--achter-de-kamp-30-amersfoort/",
      "https://opiness.nl/review/kapsalon-sura",
      "https://haar.expert/kapsalons/kapsalon-sura-achter-de-kamp-30-3811-jg-amersfoort",
      "https://www.kappers.nl/amersfoort/kapsalon-sura"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 130,
    "status": "open",
    "lat": 52.157102,
    "lng": 5.394551,
    "geoConfidence": "high",
    "specialties": [
      "Dames, heren & kinderen",
      "Knippen & kleuren",
      "Highlights & babylights",
      "Bruidskapsels",
      "Baard scheren",
      "Epileren"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Achter de Kamp 30, 3811 JG Amersfoort"
      },
      {
        "label": "Telefoon",
        "value": "033 - 495 3200"
      },
      {
        "label": "Voor",
        "value": "Dames, heren & kinderen"
      },
      {
        "label": "Afspraak",
        "value": "Inlopen of afspraak maken"
      },
      {
        "label": "Koopavond",
        "value": "Donderdag tot 21:00"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "13:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "09:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "09:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "09:00",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "09:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "09:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Kapsalon%20Sura%20Achter%20de%20Kamp%2030%20Amersfoort",
    "hasGoogleReviews": false,
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09231_3004433160.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl)",
    "schemaType": "HairSalon",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09231_3004433160.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Verwennen",
      "Me-time",
      "Met kinderen"
    ]
  },
  {
    "id": "glitter-en-glas",
    "name": "Glitter en Glas",
    "category": "Interieur & kunst",
    "subcategory": "Glas-in-lood atelier en kunstwinkel",
    "address": "Achter de Kamp 32",
    "postalCode": "3811 GJ",
    "city": "Amersfoort",
    "streetSegment": "Achter de Kamp",
    "publicPersonName": "Frank Winnubst en Ilse Spetter",
    "publicPersonRole": "makers / eigenaren",
    "shortDescription": "Atelier en kunstwinkel voor glas-in-lood in hartje Amersfoort. Frank Winnubst restaureert, repareert en ontwerpt ramen, deuren en lampen.",
    "longDescription": "Glitter en Glas aan Achter de Kamp 32 is het atelier en de kunstwinkel van glas-in-loodkunstenaar Frank Winnubst (samen met Ilse Spetter), midden in winkelgebied De Kamp. Frank restaureert en repareert glas-in-lood en ontwerpt nieuwe ramen, deuren en lampen op maat. Voorin de winkel vind je raamhangers, lampen, deur- en raampanelen, porselein, sieraden en sjaals, aangevuld met wisselend werk van andere kunstenaars.",
    "tags": [
      "glas-in-lood",
      "kunst",
      "atelier",
      "ambacht",
      "Achter de Kamp",
      "Restauratie & reparatie",
      "Maatwerk ramen & deuren",
      "Glaskunst lampen"
    ],
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/2093568107/glitter-en-glas",
      "https://www.vvvamersfoort.nl/nl/locaties/1506/glitter-en-glas",
      "https://glasinloodkunstenaar.nl/",
      "https://www.facebook.com/GlitterenGlas/",
      "https://www.instagram.com/glitterenglas/",
      "https://www.leuketip.com/cities/amersfoort/shops/glitter-en-glas/5598037ce4b08ef7c3e85716"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 132,
    "status": "open",
    "lat": 52.157139,
    "lng": 5.394647,
    "geoConfidence": "high",
    "specialties": [
      "Glas-in-lood",
      "Restauratie & reparatie",
      "Maatwerk ramen & deuren",
      "Glaskunst lampen",
      "Kunstwinkel",
      "Wisselende exposities"
    ],
    "keyFacts": [
      {
        "label": "Eigenaar",
        "value": "Frank Winnubst & Ilse Spetter"
      },
      {
        "label": "Specialiteit",
        "value": "Glas-in-lood"
      },
      {
        "label": "Type",
        "value": "Atelier & kunstwinkel"
      },
      {
        "label": "Telefoon",
        "value": "06 53 36 49 87"
      },
      {
        "label": "E-mail",
        "value": "frank@glitterenglas.nl"
      },
      {
        "label": "Gebied",
        "value": "De Kamp, Amersfoort"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "closed": true,
        "periods": []
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "16:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "16:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "16:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "11:00",
            "close": "15:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Glitter%20en%20Glas%20Achter%20de%20Kamp%2032%20Amersfoort",
    "hasGoogleReviews": false,
    "instagramUrl": "https://www.instagram.com/glitterenglas/",
    "facebookUrl": "https://www.facebook.com/GlitterenGlas/",
    "imageCandidateUrl": "https://assets.plaece.nl/thumb/YR-LkT0oSCmqt2LCcK_A1P9Ad5vvDAa7abTKefs-0nQ/resizing_type:fit/width:650/height:366/gravity:sm/aHR0cHM6Ly9hc3NldHMucGxhZWNlLm5sL29kcC11YmFzZS9pbWFnZS9kc2MwOTIyOV8zNjU2Mzc2NjEuanBn.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl listing)",
    "schemaType": "ArtGallery",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/thumb/atpTZEj-XA1F1Yan0A3bAHiljFTEsGqN4Sy9fC-eEqY/resizing_type:fit/width:960/height:0/gravity:sm/enlarge:0/aHR0cHM6Ly9hc3NldHMucGxhZWNlLm5sL29kcC11YmFzZS9pbWFnZS9kc2MwOTIyOV8zNjU2Mzc2NjEuanBn.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Interieur & wonen",
      "Inspiratie opdoen"
    ]
  },
  {
    "id": "new-kapsalon-rene-benoit",
    "name": "Kapsalon René Benoît",
    "category": "Beauty & verzorging",
    "subcategory": "Kapsalon",
    "address": "Grote Sint Jansstraat 1-E",
    "postalCode": "3811 HX",
    "city": "Amersfoort",
    "streetSegment": "Grote Sint Jansstraat",
    "publicPersonName": "René Benoît",
    "publicPersonRole": "Eigenaar & kapper",
    "shortDescription": "Sfeervolle ouderwetse kapsalon in hartje De Kamp, waar René en Maschinka je met vakmanschap en persoonlijke aandacht ontvangen.",
    "longDescription": "Kapsalon René Benoît is al ruim 25 jaar gevestigd in een karakteristiek pand aan de Grote Sint Jansstraat, op een steenworp van de Kamperbinnenpoort. In deze gezellige salon hangt de sfeer van een ouderwetse opkamer, waar René Benoît en zijn zelf opgeleide assistente Maschinka klanten met vakmanschap en oprechte persoonlijke aandacht knippen. Gezelligheid en moderne technieken gaan hier vanzelfsprekend hand in hand.",
    "tags": [
      "kapsalon",
      "kapper",
      "haar",
      "De Kamp",
      "Amersfoort",
      "binnenstad",
      "vakmanschap",
      "persoonlijke aandacht"
    ],
    "phone": "033 472 13 65",
    "sourceUrls": [
      "http://www.uniekwinkelen.nl/rene_benoit.htm",
      "https://www.tijdvooramersfoort.nl/nl/locaties/434115988/kapsalon-rene-benoit-kapsalon",
      "https://drimble.nl/bedrijf/amersfoort/15733742/kapsalon-rene-benoit.html",
      "https://haar.expert/kapsalons/rene-benoit-grote-sint-jansstraat-1/e-3811-hx-amersfoort",
      "https://www.wiewathaar.nl/salons/rene-benoit/",
      "https://www.openingstijden.com/open/kapsalon-rene-benoit/amersfoort/"
    ],
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 201,
    "status": "open",
    "lat": 52.157224,
    "lng": 5.393612,
    "geoConfidence": "medium",
    "specialties": [
      "Knippen heren",
      "Knippen dames",
      "Persoonlijk advies",
      "Klassiek vakmanschap",
      "Knippen op afspraak"
    ],
    "keyFacts": [
      {
        "label": "Sinds",
        "value": "1996 (ruim 25 jaar op locatie)"
      },
      {
        "label": "Team",
        "value": "René Benoît & Maschinka"
      },
      {
        "label": "Sfeer",
        "value": "Ouderwetse, gezellige opkamer"
      },
      {
        "label": "Locatie",
        "value": "Historisch pand bij de Kamperbinnenpoort"
      },
      {
        "label": "Telefoon",
        "value": "033 472 13 65"
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Kapsalon+Ren%C3%A9+Beno%C3%AEt+Grote+Sint+Jansstraat+1+Amersfoort",
    "hasGoogleReviews": false,
    "schemaType": "HairSalon",
    "imageCandidateSource": "Geen geschikte afbeelding gepubliceerd. De enige gevonden foto (assets.plaece.nl, via tijdvooramersfoort.nl) is afkomstig van een dataplatform, niet van de onderneming zelf, en is zonder toestemming/licentie niet bruikbaar. De salon heeft geen eigen website/og:image.",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/thumb/JEa6LdAm2QwqLnbLwbAHc8CwmtbnoGLtw2b7qhv_yWk/resizing_type:fit/width:1900/height:0/gravity:sm/enlarge:0/aHR0cHM6Ly9hc3NldHMucGxhZWNlLm5sL29kcC11YmFzZS9pbWFnZS9kc2MwOTI2MF8zMzU0NjkxMTM5LmpwZw.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Verwennen",
      "Me-time"
    ]
  },
  {
    "city": "Amersfoort",
    "publicPersonName": null,
    "publicPersonRole": null,
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "status": "open",
    "schemaType": "HairSalon",
    "updatedAt": "2026-06-14",
    "sortOrder": 202,
    "id": "new-de-haarschneider",
    "name": "De Haarschneider",
    "category": "Beauty & verzorging",
    "subcategory": "Dames- en herenkapsalon",
    "address": "Grote Sint Jansstraat 2",
    "postalCode": "3811 HX",
    "streetSegment": "Grote Sint Jansstraat",
    "shortDescription": "Vertrouwde dames- en herenkapsalon in de Grote Sint Jansstraat, vlak bij De Kamp.",
    "longDescription": "De Haarschneider is een kapsalon voor dames en heren in de Grote Sint Jansstraat in de binnenstad van Amersfoort, op een steenworp van De Kamp.",
    "tags": [
      "kapper",
      "kapsalon",
      "heren",
      "dames",
      "Grote Sint Jansstraat"
    ],
    "phone": "033 470 2483",
    "sourceUrls": [
      "https://www.telefoonboek.nl/",
      "https://www.kappersalons.nl/"
    ],
    "specialties": [
      "Dameskapsel",
      "Herenkapsel",
      "Knippen",
      "Kleuren"
    ],
    "perfectFor": [
      "Verwennen",
      "Me-time"
    ]
  },
  {
    "id": "new-il-divino-wijnwinkel",
    "name": "Il diVino Wijnwinkel",
    "category": "Winkels & makers",
    "subcategory": "Wijnwinkel met spannende wijnen en wijnworkshops",
    "address": "Grote Sint Jansstraat 2A",
    "postalCode": "3811 HX",
    "city": "Amersfoort",
    "streetSegment": "Grote Sint Jansstraat",
    "publicPersonName": "Ewout Jansen",
    "publicPersonRole": "Eigenaar",
    "shortDescription": "Wijnwinkel voor spannende, eerlijke wijnen uit minder bekende streken, plus wijnworkshops en proeverijen midden in De Kamp.",
    "longDescription": "Il diVino is dé plek in het centrum van Amersfoort voor karaktervolle wijnen uit minder bekende regio's, met veel aandacht voor biologische en natuurwijnen uit onder meer Griekenland, Marokko, Tsjechie en Georgie. Eigenaar Ewout Jansen opende de vestiging aan de Grote Sint Jansstraat in 2022 als derde winkel naast Hilversum en Bussum. Naast persoonlijk advies kun je er terecht voor wijnworkshops, proeverijen op maat en relatiegeschenken.",
    "tags": [
      "wijnwinkel",
      "wijn",
      "natuurwijn",
      "biologische wijn",
      "wijnworkshop",
      "proeverij",
      "relatiegeschenken",
      "De Kamp"
    ],
    "websiteUrl": "https://www.ildivino-wijnwinkel.nl",
    "instagramUrl": "https://www.instagram.com/il.divino.wijnwinkel/",
    "facebookUrl": "https://www.facebook.com/www.ildivino.nl/",
    "phone": "033 303 82 65",
    "sourceUrls": [
      "https://www.vvvamersfoort.nl/nl/ildivinoamersfoort",
      "https://www.ildivino-wijnwinkel.nl",
      "https://www.ildivino-wijnwinkel.nl/c-1954363/onze-winkels/",
      "https://www.destadamersfoort.nl/lokaal/lokaal/799096/wijnwinkel-il-divino-officieel-geopend",
      "https://nl.linkedin.com/posts/ewoutpfjansen_il-divino-wijnwinkel-amersfoort-grote-activity-6976158582211780608--Hex",
      "https://vind-open.nl/amersfoort/il-divino-wijnwinkel-amersfoort-808266"
    ],
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 202,
    "status": "open",
    "geoConfidence": "low",
    "priceRange": "€€",
    "specialties": [
      "Wijnen uit minder bekende wijnstreken (o.a. Griekenland, Georgie, Marokko, Tsjechie)",
      "Biologische en natuurwijnen",
      "Wijnworkshops en cursussen",
      "Proeverijen op maat (groepen vanaf 10 personen)",
      "Relatiegeschenken en wijnpakketten",
      "Persoonlijk wijnadvies"
    ],
    "keyFacts": [
      {
        "label": "Opgericht (Amersfoort)",
        "value": "1 maart 2022"
      },
      {
        "label": "Eigenaar",
        "value": "Ewout Jansen"
      },
      {
        "label": "Vestigingen",
        "value": "Amersfoort, Bussum en Hilversum"
      },
      {
        "label": "Specialiteit",
        "value": "Spannende bio- en natuurwijnen uit minder bekende streken"
      },
      {
        "label": "Extra",
        "value": "Wijnworkshops, proeverijen en wijnclub"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "11:00",
            "close": "16:00"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Il+diVino+Wijnwinkel+Grote+Sint+Jansstraat+2A+Amersfoort",
    "hasGoogleReviews": false,
    "schemaType": "WineStore",
    "imageCandidateUrl": "https://cdn.myonlinestore.eu/93c5246b-6be1-11e9-a722-44a8421b9960/images/il%20divino%20cat_winkels.jpg",
    "imageCandidateSource": "Eigen og:image / website van Il diVino Wijnwinkel (ildivino-wijnwinkel.nl, myonlinestore CDN)",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://static-vvvamersfoort.mypoiworld.com/img/505a0a49-bc7c-4668-a6de-ff13122cecba.jpg/xl.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Shoppen",
      "Lokaal & ambachtelijk"
    ],
    "priceLevel": "mid"
  },
  {
    "id": "annas-smaakatelier",
    "name": "Anna’s Smaakatelier",
    "category": "Koffie, lunch & zoet",
    "subcategory": "Taart, koffie, lunch en high tea",
    "address": "Grote Sint Jansstraat 4",
    "postalCode": "3811 HX",
    "city": "Amersfoort",
    "streetSegment": "Grote Sint Jansstraat",
    "publicPersonName": "Anna Yilmaz",
    "publicPersonRole": "Heel Holland Bakt winnares",
    "shortDescription": "Taartzaak van Heel Holland Bakt-winnares Anna Yilmaz: ambachtelijke taart, goede koffie, lunch en high tea in de Amersfoortse binnenstad.",
    "longDescription": "Anna's Smaakatelier is de gezellige taart- en lunchzaak van Heel Holland Bakt-winnares Anna Yilmaz, sinds april 2021 gevestigd aan de Grote Sint Jansstraat in hartje Amersfoort. Je komt er voor ambachtelijke taartjes en financiers bij goede koffie of thee, een uitgebreide lunch en op vrijdag en zaterdag voor Anna's ontbijt met verse croissants en brioches. In de aangrenzende Anna's Living Room geeft Anna masterclasses en zijn besloten high tea's voor kleine gezelschappen mogelijk; haar Turkse achtergrond klinkt subtiel door in de Nederlandse recepten.",
    "tags": [
      "taart",
      "high tea",
      "lunch",
      "koffie",
      "Heel Holland Bakt",
      "Ambachtelijke taart",
      "Koffie & thee",
      "Bakworkshops"
    ],
    "websiteUrl": "https://www.annasmaakatelier.nl",
    "phone": "033-2082374",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/2655648317/anna-s-smaakatelier",
      "https://www.annasmaakatelier.nl/openingstijden-locatie/",
      "https://www.annasmaakatelier.nl/",
      "https://www.facebook.com/Annasmaakatelier/",
      "https://www.rtvutrecht.nl/nieuws/2172882/heel-holland-bakt-winnares-anna-yilmaz-opent-eigen-zaak-in-amersfoort",
      "https://www.citymarketingamersfoort.nl/nieuws/nieuws-overzicht/van-heel-holland-bakt-naar-amersfoorts-icoon-anna-yilmaz-bakt-de-stad"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/foto-anna-en-team_3821906750.jpg",
    "featured": true,
    "sortOrder": 204,
    "status": "open",
    "lat": 52.157115,
    "lng": 5.393956,
    "geoConfidence": "high",
    "specialties": [
      "Ambachtelijke taart",
      "Koffie & thee",
      "High tea",
      "Lunch",
      "Bakworkshops",
      "Verse croissants & brioches"
    ],
    "keyFacts": [
      {
        "label": "Sinds",
        "value": "2021"
      },
      {
        "label": "Keuken",
        "value": "Patisserie / lunch"
      },
      {
        "label": "Eigenaresse",
        "value": "Anna Yilmaz (Heel Holland Bakt 2019)"
      },
      {
        "label": "Specialiteit",
        "value": "Taart & gebak"
      },
      {
        "label": "Google",
        "value": "4,6 sterren (~249 reviews)"
      },
      {
        "label": "Telefoon",
        "value": "033-2082374"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "closed": true,
        "periods": []
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "09:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "09:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "09:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "09:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Anna%27s%20Smaakatelier%20Grote%20Sint%20Jansstraat%204%20Amersfoort",
    "hasGoogleReviews": true,
    "facebookUrl": "https://www.facebook.com/Annasmaakatelier/",
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/foto-anna-en-team_3821906750.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl JSON-LD)",
    "schemaType": "CafeOrCoffeeShop",
    "updatedAt": "2026-06-14",
    "imageFit": "cover",
    "perfectFor": [
      "Koffie & lunch",
      "Even bijkomen",
      "Zoete trek",
      "Werkplek / koffie"
    ]
  },
  {
    "id": "jans-pakhuys",
    "name": "Jans Pakhuys",
    "category": "Winkels & makers",
    "subcategory": "Atelier, galerie en cadeauwinkel",
    "address": "Grote Sint Jansstraat 4",
    "postalCode": "3811 HX",
    "city": "Amersfoort",
    "streetSegment": "Grote Sint Jansstraat",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Atelier, galerie én cadeauwinkel in één: zo'n 14 kunstenaars met een verstandelijke beperking maken hier dagelijks unieke kunst en cadeaus.",
    "longDescription": "Jans Pakhuys aan de Grote Sint Jansstraat 4 is een bijzondere combinatie van atelier, galerie en cadeauwinkel in het hart van Amersfoort. Elke dag maken zo'n 14 kunstenaars met een licht tot matig verstandelijke beperking er schilderijen, kunstwerken en originele cadeaus die je live aan het werk ziet ontstaan. Alles wordt met liefde en aandacht gemaakt en is uniek, kleurrijk en van hoge kwaliteit; Jans Pakhuys is onderdeel van zorgorganisatie Amerpoort (Eemhart).",
    "tags": [
      "atelier",
      "galerie",
      "cadeaus",
      "kunst",
      "Amerpoort",
      "Kunstatelier",
      "Cadeauwinkel",
      "Sociale onderneming"
    ],
    "websiteUrl": "https://www.janspakhuys.nl",
    "phone": "033 461 17 79",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/2205738819/jans-pakhuys",
      "https://www.janspakhuys.nl (301 -> amerpoort.nl -> eemhart.nl)",
      "https://www.amerpoort.nl/locaties/overdag/jans-pakhuys.html",
      "https://www.vvvamersfoort.nl/en/locations/2205738819/jan-s-warehouse",
      "https://amersfoort.socialekaartnederland.nl/organisaties/amerpoort-jans-pakhuys-amersfoort",
      "https://www.degoedegids.nl/adres/6393/jans-pakhuys-cadeaus/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 204,
    "status": "open",
    "lat": 52.157087,
    "lng": 5.39397,
    "geoConfidence": "high",
    "priceRange": "€€",
    "specialties": [
      "Kunstatelier",
      "Galerie",
      "Cadeauwinkel",
      "Sociale onderneming",
      "Handgemaakte kunst",
      "Originele cadeaus"
    ],
    "keyFacts": [
      {
        "label": "Type",
        "value": "Atelier, galerie & cadeauwinkel"
      },
      {
        "label": "Keuken",
        "value": "n.v.t. (winkel/galerie)"
      },
      {
        "label": "Kunstenaars",
        "value": "circa 14"
      },
      {
        "label": "Doelgroep",
        "value": "Mensen met een verstandelijke beperking"
      },
      {
        "label": "Onderdeel van",
        "value": "Amerpoort / Eemhart"
      },
      {
        "label": "Telefoon",
        "value": "033 461 17 79"
      },
      {
        "label": "Adres",
        "value": "Grote Sint Jansstraat 4, 3811 HX Amersfoort"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:30",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:30",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:30",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:30",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Jans+Pakhuys+Grote+Sint+Jansstraat+4+Amersfoort",
    "hasGoogleReviews": false,
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/b6b187fe46798c7c6bfc0b147828fa56b35d7c84.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl listing)",
    "schemaType": "ArtGallery",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/b6b187fe46798c7c6bfc0b147828fa56b35d7c84.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Shoppen",
      "Lokaal & ambachtelijk",
      "Cadeau zoeken"
    ],
    "priceLevel": "mid"
  },
  {
    "id": "new-orium-goudsmeden",
    "name": "ORIUM Goudsmeden",
    "category": "Mode & sieraden",
    "subcategory": "Goudsmidatelier & juwelier",
    "address": "Grote Sint Jansstraat 5",
    "postalCode": "3811 HX",
    "city": "Amersfoort",
    "streetSegment": "Grote Sint Jansstraat",
    "publicPersonName": "Marcel Baartmans",
    "publicPersonRole": "Meester Goudsmid (eigenaar)",
    "shortDescription": "Goudsmidatelier in De Kamp waar Marcel Baartmans op maat sieraden en trouwringen smeedt, naast Nomos-horloges en designmerken.",
    "longDescription": "ORIUM Goudsmeden is een ambachtelijk goudsmidatelier aan de Grote Sint Jansstraat, waar meestergoudsmid Marcel Baartmans en Inge Zegers in een open atelier sieraden, trouwringen en manchetknopen op maat ontwerpen en vervaardigen in goud en platina. Naast eigen creaties verkoopt de zaak collecties van gerenommeerde merken zoals Niessing, Gellner en Angela Hübel, plus Nomos Glashütte-horloges. Bestaande sieraden worden met zorg vermaakt of gerepareerd, met behoud van hun emotionele waarde.",
    "tags": [
      "goudsmid",
      "sieraden op maat",
      "trouwringen",
      "atelier",
      "Nomos horloges",
      "juwelier",
      "De Kamp",
      "Amersfoort"
    ],
    "websiteUrl": "https://www.orium-goudsmeden.nl",
    "facebookUrl": "https://www.facebook.com/p/ORIUM-goudsmeden-100057134572784/",
    "phone": "+31 33 257 2971",
    "sourceUrls": [
      "https://www.orium-goudsmeden.nl",
      "https://nederlandsgildevangoudsmeden.nl/ledenoverzicht/marcel-baartmans/",
      "https://www.tijdvooramersfoort.nl/nl/locaties/352130398/orium-goudsmeden",
      "https://www.cylex.nl/bedrijf/orium-goudsmeden-10728680.html",
      "https://wanderlog.com/place/details/587047/orium-goudsmeden",
      "https://niessing.com/nl-HU/merchant/ORIUM-goudsmeden"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 205,
    "status": "open",
    "lat": 52.156963,
    "lng": 5.393823,
    "geoConfidence": "medium",
    "priceRange": "€€€",
    "specialties": [
      "Sieraden op maat ontwerpen en smeden",
      "Trouw- en verlovingsringen",
      "Vermaken en repareren van bestaande sieraden",
      "Goud en platina edelsmeedwerk",
      "Nomos Glashütte-horloges",
      "Designermerken (Niessing, Gellner, Angela Hübel)"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Grote Sint Jansstraat 5, 3811 HX Amersfoort"
      },
      {
        "label": "Openingstijden",
        "value": "Di t/m za 10:00-17:00; zo & ma gesloten"
      },
      {
        "label": "Telefoon",
        "value": "+31 33 257 2971"
      },
      {
        "label": "Goudsmid",
        "value": "Marcel Baartmans, Meester Goudsmid"
      },
      {
        "label": "Specialiteit",
        "value": "Open atelier; sieraden op maat & Nomos-horloges"
      },
      {
        "label": "Google-beoordeling",
        "value": "4,5 sterren (14 reviews)"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=ORIUM+Goudsmeden+Grote+Sint+Jansstraat+5+Amersfoort",
    "hasGoogleReviews": true,
    "schemaType": "JewelryStore",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/thumb/reeF96YeZb_W8hycTFsS7Cui7q7ZCn-IriBAJtvJJ6Y/resizing_type:fit/width:1280/height:0/gravity:sm/enlarge:0/aHR0cHM6Ly9hc3NldHMucGxhZWNlLm5sL29kcC11YmFzZS9pbWFnZS9kc2MwOTI1MF8zNDY1MTI0ODIxLmpwZw.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Shoppen",
      "Cadeau zoeken",
      "Trouwen & gala"
    ],
    "priceLevel": "premium"
  },
  {
    "id": "koko-de-verzamelwinkel",
    "name": "KoKo de verzamelwinkel",
    "category": "Mode & sieraden",
    "subcategory": "Sieraden en dierfiguren",
    "address": "Grote Sint Jansstraat 6",
    "postalCode": "3811 HX",
    "city": "Amersfoort",
    "streetSegment": "Grote Sint Jansstraat",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Sinds 1985 het adres op de Kamp voor bijzondere sieraden en handgeschilderde verzameldierfiguren. Nu opheffingsuitverkoop met 50% korting.",
    "longDescription": "KoKo de verzamelwinkel runt sinds 1985 aan de Grote Sint Jansstraat een sfeervolle cadeauwinkel met als motto 'net even iets anders': een verrassend aanbod kettingen, armbanden en oorbellen in alle prijsklassen, naast handgemaakte en met de hand beschilderde verzameldierfiguren van merken als Country Artists, Border Fine Arts, Clarecraft en Mats Jonasson. Klanten roemen de persoonlijke service, inclusief het repareren van kapotte sieraden. De winkel neemt nu afscheid met een opheffingsuitverkoop (50% korting); ze is open op vrijdag en zaterdag van 11:00 tot 17:00 uur.",
    "tags": [
      "sieraden",
      "cadeau",
      "dierfiguren",
      "verzamelwinkel",
      "Grote Sint Jansstraat",
      "Verzameldierfiguren",
      "Handgeschilderde beeldjes",
      "Originele cadeaus"
    ],
    "websiteUrl": "https://www.koko.eu",
    "phone": "0334751561",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/1687675345/koko-de-verzamelwinkel",
      "https://www.tijdvooramersfoort.nl/en/locations/1687675345/koko-the-collection-store",
      "https://amersfoortnieuwsvandaag.nl/koko-de-verzamelwinkel/",
      "https://www.koko.eu/",
      "https://assets.plaece.nl/odp-ubase/image/schermafbeelding-20230221-114002_3192778530.png"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 206,
    "status": "open",
    "lat": 52.157016,
    "lng": 5.39404,
    "geoConfidence": "high",
    "priceRange": "€-€€",
    "specialties": [
      "Sieraden",
      "Verzameldierfiguren",
      "Handgeschilderde beeldjes",
      "Originele cadeaus",
      "Sieraden repareren"
    ],
    "keyFacts": [
      {
        "label": "Sinds",
        "value": "1985"
      },
      {
        "label": "Assortiment",
        "value": "Sieraden & dierfiguren"
      },
      {
        "label": "Merken beeldjes",
        "value": "Country Artists, Border Fine Arts, Clarecraft, Mats Jonasson"
      },
      {
        "label": "Telefoon",
        "value": "033-475 1561"
      },
      {
        "label": "Status",
        "value": "Opheffingsuitverkoop (-50%)"
      },
      {
        "label": "Open",
        "value": "Vrij & za 11:00-17:00"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "closed": true,
        "periods": []
      },
      {
        "day": "wednesday",
        "closed": true,
        "periods": []
      },
      {
        "day": "thursday",
        "closed": true,
        "periods": []
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "11:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "11:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=KoKo+de+verzamelwinkel+Grote+Sint+Jansstraat+6+Amersfoort",
    "hasGoogleReviews": true,
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/schermafbeelding-20230221-114002_3192778530.png",
    "imageCandidateSource": "assets.plaece.nl",
    "schemaType": "ClothingStore",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/schermafbeelding-20230221-114002_3192778530.png",
    "imageFit": "cover",
    "perfectFor": [
      "Shoppen",
      "Cadeau zoeken"
    ],
    "priceLevel": "premium"
  },
  {
    "id": "k-wolwinkel-elitt",
    "name": "Wolwinkel Elitt",
    "category": "Winkels & makers",
    "subcategory": "Yarn / wool / knitting & crochet shop with workshops",
    "address": "Grote Sint Jansstraat 8",
    "city": "Amersfoort",
    "streetSegment": "Grote Sint Jansstraat",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Wolwinkel Elitt — yarn / wool / knitting & crochet shop with workshops op Grote Sint Jansstraat 8 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Wolwinkel Elitt is gevestigd op Grote Sint Jansstraat 8 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Grote Sint Jansstraat 8, a core De Kamp side street, in the 'Oude Stadsherberg'. Active yarn shop (Els & Laura), VVV and tijdvooramersfoort confirm under De Kamp. NOTE: website field is a placeholder; correct site is wolwinkelelitt.nl (info@wolwinkelel",
    "tags": [
      "yarn",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://dewimperfabriek.nl/",
    "sourceUrls": [
      "https://dewimperfabriek.nl/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 208,
    "status": "open",
    "schemaType": "Store",
    "inclusionStatus": "confirmed_core",
    "inclusionReason": "On Grote Sint Jansstraat 8, a core De Kamp side street, in the 'Oude Stadsherberg'. Active yarn shop (Els & Laura), VVV and tijdvooramersfoort confirm under De Kamp. NOTE: website field is a placeholder; correct site is wolwinkelelitt.nl (info@wolwinkelelitt.nl) - update before publishing.",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Shoppen",
      "Lokaal & ambachtelijk"
    ]
  },
  {
    "id": "theehuis-something-else",
    "name": "Theehuis Something Else",
    "category": "Koffie, lunch & zoet",
    "subcategory": "Theehuis en high tea",
    "address": "Grote Sint Jansstraat 11",
    "postalCode": "3811 HX",
    "city": "Amersfoort",
    "streetSegment": "Grote Sint Jansstraat",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Engels theehuis in een Anton Pieck-pandje bij de Kamp: high tea, afternoon tea, verse scones en lunch. Wo t/m za geopend, reserveren aanbevolen.",
    "longDescription": "Theehuis Something Else is sinds 2006 een sfeervolle Engelse theeschenkerij aan de Grote Sint Jansstraat 11, in een knus Anton Pieck-achtig pandje vlak bij de Kamperbinnenpoort. Hier geniet je van huisgemaakte high teas zoals de Cream Tea Royal For Two en de Something Else High Tea, afternoon tea, verse scones, lekkere sandwiches en tea-specialiteiten als St. Johns Tea en Knickerbockerscoffee, met seizoensgebonden en zoveel mogelijk biologische ingrediënten. Met circa 30 zitplaatsen binnen en een terras in de zomer is het geschikt voor verjaardagen, reünies of borrels; op reservering kan ook een evening tea-diner, en bezoekers van Museum Flehite krijgen elke tweede lunch of high tea voor de helft van de prijs.",
    "tags": [
      "thee",
      "high tea",
      "lunch",
      "theehuis",
      "Grote Sint Jansstraat",
      "Afternoon tea",
      "Engelse tearoom",
      "Verse scones"
    ],
    "websiteUrl": "https://www.theeschenkerijsomethingelse.nl",
    "phone": "033 475 66 44",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/2520684170/theeschenkerij-something-else",
      "https://www.vvvamersfoort.nl/nl/locaties/1475/lunch-tearoom-somethingelse",
      "https://restaurantguru.com/Theeschenkerij-Something-Else-Amersfoort",
      "https://www.tripadvisor.com/Restaurant_Review-g188613-d3568346-Reviews-Theeschenkerij_Something_Else-Amersfoort.html",
      "https://en.eet.nu/amersfoort/theeschenkerij-somethingelse",
      "https://www.facebook.com/TheeschenkerijSomethingElse"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 211,
    "status": "open",
    "lat": 52.156908,
    "lng": 5.393862,
    "geoConfidence": "high",
    "priceRange": "€€",
    "specialties": [
      "High tea",
      "Afternoon tea",
      "Engelse tearoom",
      "Verse scones",
      "Lunch & sandwiches",
      "Tea-specialiteiten"
    ],
    "keyFacts": [
      {
        "label": "Sinds",
        "value": "2006"
      },
      {
        "label": "Keuken",
        "value": "Engels / tearoom"
      },
      {
        "label": "Specialiteit",
        "value": "High tea & afternoon tea"
      },
      {
        "label": "Zitplaatsen",
        "value": "±30 binnen, +20 terras (zomer)"
      },
      {
        "label": "Telefoon",
        "value": "+31 33 475 66 44"
      },
      {
        "label": "Postcode",
        "value": "3811 HX Amersfoort"
      },
      {
        "label": "Geopend",
        "value": "Wo t/m za 10.00-17.30"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "closed": true,
        "periods": []
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:30"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Theehuis%20Something%20Else%20Grote%20Sint%20Jansstraat%2011%20Amersfoort",
    "hasGoogleReviews": true,
    "facebookUrl": "https://www.facebook.com/TheeschenkerijSomethingElse",
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09244_3722269228.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl)",
    "schemaType": "CafeOrCoffeeShop",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09244_3722269228.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Koffie & lunch",
      "Even bijkomen",
      "Zoete trek"
    ],
    "priceLevel": "mid"
  },
  {
    "id": "k-the-wax-bar-amersfoort",
    "name": "The Wax Bar Amersfoort",
    "category": "Beauty & verzorging",
    "subcategory": "Waxing / beauty salon",
    "address": "Grote Sint Jansstraat 13",
    "city": "Amersfoort",
    "streetSegment": "Grote Sint Jansstraat",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "The Wax Bar Amersfoort — waxing / beauty salon op Grote Sint Jansstraat 13 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "The Wax Bar Amersfoort is gevestigd op Grote Sint Jansstraat 13 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Grote Sint Jansstraat 13, core De Kamp side street. Current location of The Wax Bar chain; own site, VVV and tijdvooramersfoort confirm the address and active hours.",
    "tags": [
      "waxing",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://www.thewaxbar.nl/en/locatie/amersfoort",
    "sourceUrls": [
      "https://www.thewaxbar.nl/en/locatie/amersfoort"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 213,
    "status": "open",
    "schemaType": "HairSalon",
    "inclusionStatus": "confirmed_core",
    "inclusionReason": "On Grote Sint Jansstraat 13, core De Kamp side street. Current location of The Wax Bar chain; own site, VVV and tijdvooramersfoort confirm the address and active hours.",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Verwennen",
      "Me-time"
    ]
  },
  {
    "id": "picture-at-home",
    "name": "Picture @ Home",
    "category": "Interieur & kunst",
    "subcategory": "Lijstenmakerij",
    "address": "Grote Sint Jansstraat 15",
    "postalCode": "3811 HX",
    "city": "Amersfoort",
    "streetSegment": "Grote Sint Jansstraat",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Ambachtelijke lijstenmakerij — de Amersfoortse winkel aan de Grote Sint Jansstraat sloot eind 2024; nu op afspraak vanuit Almere Haven.",
    "longDescription": "Picture @ Home was een ambachtelijke lijstenmakerij en kunsthandel aan de Grote Sint Jansstraat 15, vlak bij de Kamp in het centrum van Amersfoort, gespecialiseerd in inlijstwerk op maat, sfeervolle passe-partouts en het optimaal presenteren van kunst, prenten en foto's. Per 31 oktober 2024 is de winkel in Amersfoort definitief gesloten. Sinds 1 november 2024 zet eigenaar de werkzaamheden voort vanuit een thuis-atelier op Buitenhof 66 in Almere Haven, uitsluitend op afspraak en met dezelfde persoonlijke service en vakmanschap.",
    "tags": [
      "lijstenmakerij",
      "kunst",
      "inlijsten",
      "interieur",
      "Grote Sint Jansstraat",
      "Lijstenmakerij op maat",
      "Ambachtelijk inlijstwerk",
      "Passe-partouts"
    ],
    "websiteUrl": "https://www.pictureathome.nl",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/2381595876/picture-home",
      "https://www.pictureathome.nl",
      "https://www.pictureathome.nl/contact"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 215,
    "status": "closed",
    "lat": 52.156769,
    "lng": 5.393972,
    "geoConfidence": "high",
    "specialties": [
      "Lijstenmakerij op maat",
      "Ambachtelijk inlijstwerk",
      "Passe-partouts",
      "Kunsthandel",
      "Inlijsten op afspraak"
    ],
    "keyFacts": [
      {
        "label": "Type",
        "value": "Lijstenmakerij & kunsthandel"
      },
      {
        "label": "Status Amersfoort",
        "value": "Gesloten per 31 okt 2024"
      },
      {
        "label": "Verhuisd naar",
        "value": "Buitenhof 66, Almere Haven"
      },
      {
        "label": "Sinds nieuw adres",
        "value": "1 november 2024"
      },
      {
        "label": "Bereikbaarheid",
        "value": "Alleen op afspraak"
      },
      {
        "label": "E-mail",
        "value": "info@pictureathome.nl"
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/dir/?api=1&destination=52.156769%2C5.393972",
    "hasGoogleReviews": false,
    "imageCandidateUrl": "https://assets.plaece.nl/odp-ubase/image/dsc09233_1828809843.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl / Citymarketing Amersfoort)",
    "schemaType": "HomeGoodsStore",
    "updatedAt": "2026-06-14"
  },
  {
    "id": "k-o-sole-mio",
    "name": "O Sole Mio",
    "category": "Eten & drinken",
    "subcategory": "Italian restaurant / pizzeria",
    "address": "Zuidsingel 57",
    "city": "Amersfoort",
    "streetSegment": "Zuidsingel",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "O Sole Mio — italian restaurant / pizzeria op Zuidsingel 57 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "O Sole Mio is gevestigd op Zuidsingel 57 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Zuidsingel 57, the Kamp-end singel that is part of De Kamp e.o.; contiguous with the listed Zuidsingel cluster (63-68) and La Base (66). Amersfoort's first Italian restaurant (since 1974), active. Edge because it is at the southern edge of the Kamp-end of the singel.",
    "tags": [
      "italian restaurant",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://osolemio-amersfoort.nl/",
    "sourceUrls": [
      "https://osolemio-amersfoort.nl/"
    ],
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 357,
    "status": "open",
    "schemaType": "Restaurant",
    "inclusionStatus": "confirmed_edge",
    "inclusionReason": "On Zuidsingel 57, the Kamp-end singel that is part of De Kamp e.o.; contiguous with the listed Zuidsingel cluster (63-68) and La Base (66). Amersfoort's first Italian restaurant (since 1974), active. Edge because it is at the southern edge of the Kamp-end of the singel.",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Uit eten",
      "Samen tafelen",
      "Date night"
    ]
  },
  {
    "id": "k-broers-fietsreparateurs",
    "name": "Broers Fietsreparateurs",
    "category": "Winkels & makers",
    "subcategory": "Bicycle shop, rental & repair",
    "address": "Zuidsingel 59",
    "city": "Amersfoort",
    "streetSegment": "Zuidsingel",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Broers Fietsreparateurs — bicycle shop, rental & repair op Zuidsingel 59 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Broers Fietsreparateurs is gevestigd op Zuidsingel 59 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On Zuidsingel 59, adjacent to O Sole Mio and the listed Zuidsingel cluster; on the De Kamp e.o. singel stretch and listed by VVV/tijdvooramersfoort. Active Shimano-certified bike shop/workshop/rental. Edge because it is on the lower-numbered (southern) end ",
    "tags": [
      "bicycle shop, rental & repair",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://www.broersfietsreparateurs.nl/",
    "sourceUrls": [
      "https://www.broersfietsreparateurs.nl/"
    ],
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 359,
    "status": "open",
    "schemaType": "Store",
    "inclusionStatus": "confirmed_edge",
    "inclusionReason": "On Zuidsingel 59, adjacent to O Sole Mio and the listed Zuidsingel cluster; on the De Kamp e.o. singel stretch and listed by VVV/tijdvooramersfoort. Active Shimano-certified bike shop/workshop/rental. Edge because it is on the lower-numbered (southern) end of the singel.",
    "imageUrl": "https://cdn.prod.website-files.com/67efae014387ed2945f5845c/67efb50bd74832b03882c1b7_64380f4b4a905443ca0030a4_pietervdkoppel_250521_13.jpg.jpeg",
    "imageFit": "cover",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Shoppen",
      "Lokaal & ambachtelijk"
    ]
  },
  {
    "id": "eigenaar8-mini-store",
    "name": "Eigenaar8 MINI store",
    "category": "Interieur & kunst",
    "subcategory": "Vintage design, HKliving en vinyl",
    "address": "Zuidsingel 63",
    "postalCode": "3811 AJ",
    "city": "Amersfoort",
    "streetSegment": "Zuidsingel",
    "publicPersonName": "Maartje en Maurice",
    "publicPersonRole": "eigenaren",
    "shortDescription": "Sfeervolle MINI store van Maartje & Maurice aan de Zuidsingel: HKliving gemixt met vintage interieurparels en een lekker aanbod vinyl.",
    "longDescription": "Eigenaar8 MINI store zit aan de Zuidsingel 63, in het pand waar eigenaren Maartje & Maurice zelf boven wonen. Je vindt er een ruim aanbod van het interieurmerk HKliving, mooi gecombineerd met zorgvuldig uitgezochte vintage parels en een fijne selectie vinyl. De winkel is open op woensdag, vrijdag en zaterdag van 11.00 tot 17.00 uur, of op afspraak.",
    "tags": [
      "vintage",
      "design",
      "HKliving",
      "vinyl",
      "Zuidsingel",
      "Vintage interieur",
      "Woonaccessoires",
      "Conceptstore"
    ],
    "websiteUrl": "https://www.eigenaar8.nl",
    "instagramUrl": "https://www.instagram.com/eigenaar8/",
    "phone": "0647919905",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/4133843811/eigenaar8-hkliving-mini-store",
      "https://www.eigenaar8.nl/",
      "https://transfirm.nl/nl/organisatie/86463292-000055889980-eigenaar8",
      "https://www.instagram.com/ministore.eigenaar8/",
      "https://allevintagewinkels.nl/utrecht/amersfoort/eigenaar8"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 363,
    "status": "open",
    "lat": 52.156408,
    "lng": 5.393664,
    "geoConfidence": "high",
    "specialties": [
      "HKliving",
      "Vintage interieur",
      "Vinyl",
      "Woonaccessoires",
      "Conceptstore"
    ],
    "keyFacts": [
      {
        "label": "Adres",
        "value": "Zuidsingel 63, 3811 AJ Amersfoort"
      },
      {
        "label": "Eigenaren",
        "value": "Maartje & Maurice"
      },
      {
        "label": "Telefoon",
        "value": "06 47919905"
      },
      {
        "label": "Specialiteit",
        "value": "HKliving + vintage + vinyl"
      },
      {
        "label": "KvK",
        "value": "86463292"
      },
      {
        "label": "Open",
        "value": "Wo, vr, za 11.00-17.00 of op afspraak"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "closed": true,
        "periods": []
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "11:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "thursday",
        "closed": true,
        "periods": []
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "11:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "11:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=52.156408,5.393664",
    "hasGoogleReviews": false,
    "facebookUrl": "https://www.facebook.com/eigenaar8/",
    "imageCandidateUrl": "https://assets.plaece.nl/thumb/M7bAJT1av7hsuEin66LP8V1b-qyTOwRZDYNFjnKUh48/resizing_type:fit/width:650/height:366/gravity:sm/aHR0cHM6Ly9hc3NldHMucGxhZWNlLm5sL29kcC11YmFzZS9pbWFnZS9laWdlbmFhcjgtbWluaXN0b3JlXzE0NDI1MjE3LmpwZw.jpg",
    "imageCandidateSource": "assets.plaece.nl (via tijdvooramersfoort.nl listing)",
    "schemaType": "HomeGoodsStore",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://assets.plaece.nl/thumb/M7bAJT1av7hsuEin66LP8V1b-qyTOwRZDYNFjnKUh48/resizing_type:fit/width:650/height:366/gravity:sm/aHR0cHM6Ly9hc3NldHMucGxhZWNlLm5sL29kcC11YmFzZS9pbWFnZS9laWdlbmFhcjgtbWluaXN0b3JlXzE0NDI1MjE3LmpwZw.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Interieur & wonen",
      "Inspiratie opdoen"
    ]
  },
  {
    "city": "Amersfoort",
    "publicPersonName": null,
    "publicPersonRole": null,
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "status": "open",
    "schemaType": "CafeOrCoffeeShop",
    "updatedAt": "2026-06-14",
    "sortOrder": 365,
    "id": "new-downeys-coffee-en-tea",
    "name": "Downey's Coffee & Tea",
    "category": "Koffie, lunch & zoet",
    "subcategory": "Lunchroom & sociale onderneming",
    "address": "Zuidsingel 65",
    "postalCode": "3811 HD",
    "streetSegment": "Zuidsingel",
    "websiteUrl": "https://www.downeys.nl",
    "shortDescription": "Sfeervolle lunchroom en sociale onderneming met koffie, thee, lunch en high tea aan de Zuidsingel.",
    "longDescription": "Downey's Coffee & Tea is een lunchroom én sociale onderneming aan de Zuidsingel, waar mensen met een verstandelijke beperking werken. Je vindt er koffie, thee, verse lunch en high tea — vlak bij De Kamp.",
    "tags": [
      "koffie",
      "thee",
      "lunch",
      "high tea",
      "sociale onderneming",
      "Zuidsingel"
    ],
    "specialties": [
      "Koffie & thee",
      "Lunch",
      "High tea",
      "Sociale onderneming"
    ],
    "sourceUrls": [
      "https://www.downeys.nl",
      "https://www.tijdvooramersfoort.nl/",
      "https://www.vvvamersfoort.nl/"
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "17:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "perfectFor": [
      "Koffie & lunch",
      "Even bijkomen",
      "Zoete trek",
      "Werkplek / koffie"
    ]
  },
  {
    "id": "la-base-pizza",
    "name": "La Base Pizza Amersfoort",
    "category": "Eten & drinken",
    "subcategory": "Napolitaanse pizza",
    "address": "Zuidsingel 66",
    "postalCode": "3811 HD",
    "city": "Amersfoort",
    "streetSegment": "Zuidsingel",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Authentieke Napolitaanse pizza uit de 480°C steenoven, gebakken in 60-90 seconden door Italiaanse pizzaioli. AVPN-gecertificeerd, 7 dagen open.",
    "longDescription": "Bij La Base Pizza aan de Zuidsingel proef je een stukje Napels in het hart van Amersfoort: échte Napolitaanse pizza's, gebakken in een ambachtelijke steenoven uit Napels op 480°C en in slechts 60 tot 90 seconden klaar. Het restaurant werkt met verse Italiaanse producten met DOP-keurmerk, waaronder 100% buffelmozzarella, grana padano en prosciutto crudo, en is officieel lid van de Associazione Verace Pizza Napoletana (AVPN, sinds 2021). De Italiaanse pizzaioli staan zeven dagen per week voor je klaar; je kunt blijven eten of afhalen.",
    "tags": [
      "pizza",
      "Napolitaans",
      "Italiaans",
      "restaurant",
      "Zuidsingel",
      "Napolitaanse pizza",
      "Houtgestookte/steenoven 480°C",
      "AVPN-gecertificeerd"
    ],
    "websiteUrl": "https://labasepizza.nl",
    "phone": "033-2003188",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/1557219200/la-base-pizza-amersfoort",
      "https://labasepizza.nl",
      "https://labasepizza.nl/en/locaties/amersfoort/",
      "https://www.pizzanapoletana.org/en/associati/834-la_base_pizza_amersfoort",
      "https://restaurantguru.com/La-Base-Amersfoort",
      "https://www.facebook.com/labasepizzaamersfoort/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 366,
    "status": "open",
    "lat": 52.156618,
    "lng": 5.393608,
    "geoConfidence": "high",
    "priceRange": "€€",
    "specialties": [
      "Napolitaanse pizza",
      "Houtgestookte/steenoven 480°C",
      "AVPN-gecertificeerd",
      "Verse Italiaanse DOP-producten",
      "Afhalen & eten",
      "Groepsmenu's (10+ personen)"
    ],
    "keyFacts": [
      {
        "label": "Keuken",
        "value": "Authentiek Napolitaans (pizza)"
      },
      {
        "label": "Oven",
        "value": "Ambachtelijke steenoven uit Napels, 480°C"
      },
      {
        "label": "Baktijd",
        "value": "60-90 seconden per pizza"
      },
      {
        "label": "Certificering",
        "value": "AVPN - Vera Pizza Napoletana (lid nr. 867, sinds 2021)"
      },
      {
        "label": "Telefoon",
        "value": "033-2003188"
      },
      {
        "label": "E-mail",
        "value": "amersfoort@labasepizza.nl"
      },
      {
        "label": "Open",
        "value": "Ma t/m zo, 17:00-21:30"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "periods": [
          {
            "open": "17:00",
            "close": "21:30"
          }
        ]
      },
      {
        "day": "tuesday",
        "periods": [
          {
            "open": "17:00",
            "close": "21:30"
          }
        ]
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "17:00",
            "close": "21:30"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "17:00",
            "close": "21:30"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "17:00",
            "close": "21:30"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "17:00",
            "close": "21:30"
          }
        ]
      },
      {
        "day": "sunday",
        "periods": [
          {
            "open": "17:00",
            "close": "21:30"
          }
        ]
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=La+Base+Pizza+Amersfoort+Zuidsingel+66",
    "hasGoogleReviews": true,
    "instagramUrl": "https://www.instagram.com/labasepizza/",
    "facebookUrl": "https://www.facebook.com/labasepizzaamersfoort/",
    "imageCandidateUrl": "https://labasepizza.nl/wp-content/uploads/2025/06/restaurantamersfoort1.jpg",
    "imageCandidateSource": "labasepizza.nl",
    "schemaType": "Restaurant",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://labasepizza.nl/wp-content/uploads/2025/06/restaurantamersfoort1.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Uit eten",
      "Samen tafelen",
      "Date night"
    ],
    "priceLevel": "mid"
  },
  {
    "id": "new-singelhuis",
    "name": "Singelhuis",
    "category": "Eten & drinken",
    "subcategory": "Sfeervolle event-, kook- en dinerlocatie voor groepen",
    "address": "Zuidsingel 67",
    "postalCode": "3811 HD",
    "city": "Amersfoort",
    "streetSegment": "Zuidsingel",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Sfeervolle kook- en eventlocatie midden in Amersfoort: kookworkshops, diners met groepen, vergaderingen en feestjes — geheel op maat.",
    "longDescription": "Het Singelhuis aan de Zuidsingel is een warme, huiselijke locatie in het hart van Amersfoort die je als 'tweede woonkamer' kunt afhuren. Met een goed geoutilleerde keuken verzorgen ze samen met diverse chefs kookworkshops, diners en (wijn)proeverijen voor groepen, en de ruimte leent zich net zo goed voor vergaderingen, lezingen en verjaardags- of bedrijfsfeesten tot zo'n 30 personen. Reserveren gaat eenvoudig op afspraak via e-mail of WhatsApp.",
    "tags": [
      "kookworkshop",
      "kookstudio",
      "eventlocatie",
      "diner",
      "groepen",
      "vergaderlocatie",
      "feestlocatie",
      "wijnproeverij"
    ],
    "websiteUrl": "https://singelhuis.nl",
    "instagramUrl": "https://www.instagram.com/singelhuis/",
    "facebookUrl": "https://www.facebook.com/profile.php?id=100071598317220",
    "phone": "+31 6 22504459",
    "sourceUrls": [
      "https://singelhuis.nl",
      "https://feestjegeven.nl/l/singelhuis/n2nu26h1rt",
      "https://www.telefoonboek.nl/bedrijven/t8636219/amersfoort/singelhuis-amersfoort-b.v./",
      "https://www.facebook.com/profile.php?id=100071598317220",
      "https://www.instagram.com/singelhuis/",
      "https://www.transfirm.nl/nl/organisatie/834420060001-singelhuis-amersfoort-b.v."
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 367,
    "status": "open",
    "lat": 52.1566765,
    "lng": 5.3935917,
    "geoConfidence": "high",
    "specialties": [
      "Kookworkshops met chefs",
      "Diners voor groepen",
      "Wijn- en spijsproeverijen",
      "Vergaderingen en bijeenkomsten",
      "Verjaardags- en bedrijfsfeesten",
      "Locatieverhuur op maat"
    ],
    "keyFacts": [
      {
        "label": "Type",
        "value": "Kook-, diner- en eventlocatie (op afspraak)"
      },
      {
        "label": "Locatie",
        "value": "Zuidsingel 67, historisch centrum Amersfoort"
      },
      {
        "label": "Groepsgrootte",
        "value": "Tot circa 30 personen"
      },
      {
        "label": "Reserveren",
        "value": "Per e-mail of WhatsApp"
      },
      {
        "label": "Faciliteiten",
        "value": "Goed geoutilleerde keuken en spoelkeuken; beamer en flip-over beschikbaar"
      },
      {
        "label": "Parkeren",
        "value": "Parkeergelegenheid op loopafstand"
      }
    ],
    "googleMapsUrl": "https://www.google.nl/maps/place/Zuidsingel+67,+3811+HD+Amersfoort/@52.1566798,5.391403,17z",
    "hasGoogleReviews": true,
    "schemaType": "Restaurant",
    "imageCandidateUrl": "https://singelhuis.nl/wp-content/uploads/2022/10/279887701_165937259136217_626844878020761856_n.jpg",
    "imageCandidateSource": "singelhuis.nl (eigen website-afbeelding; sfeerfoto interieur)",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://singelhuis.nl/wp-content/uploads/2022/10/279887701_165937259136217_626844878020761856_n.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Uit eten",
      "Samen tafelen",
      "Date night",
      "Zoete trek"
    ]
  },
  {
    "id": "new-hairstyling-geke",
    "name": "Hairstyling Geke",
    "category": "Beauty & verzorging",
    "subcategory": "Kapsalon gespecialiseerd in krullend haar",
    "address": "Zuidsingel 68",
    "postalCode": "3811 HD",
    "city": "Amersfoort",
    "streetSegment": "Zuidsingel",
    "publicPersonName": "Geke",
    "publicPersonRole": "Eigenaresse / kapster",
    "shortDescription": "Sfeervolle kapsalon in de oude binnenstad van Amersfoort, gespecialiseerd in het knippen van krullend haar.",
    "longDescription": "Hairstyling Geke is een stijlvolle kapsalon aan de Zuidsingel in het historische hart van Amersfoort, met comfortabele wasstoelen en een ervaren team. Eigenaresse Geke ontwikkelde een eigen techniek om elk type krullend haar optimaal te knippen, naast knippen, kleuren en verzorgende behandelingen voor dames en heren. Online reserveren kan eenvoudig via Treatwell; de salon is woensdag tot en met zaterdag geopend.",
    "tags": [
      "kapper",
      "kapsalon",
      "krullend haar",
      "curly hair",
      "dameskapper",
      "herenkapper",
      "kleuren",
      "Amersfoort"
    ],
    "websiteUrl": "https://gekekappers.mytreatwell.nl",
    "instagramUrl": "https://www.instagram.com/gekekappersamersfoort/",
    "facebookUrl": "https://www.facebook.com/GekeKappers/",
    "phone": "033-4722361",
    "sourceUrls": [
      "https://gekekappers.mytreatwell.nl",
      "https://www.treatwell.nl/salon/geke-kappers/",
      "https://www.openingstijden.com/open/hairstyling-geke/amersfoort/",
      "https://www.cylex.nl/bedrijf/hairstyling-geke-11792588.html",
      "https://www.instagram.com/gekekappersamersfoort/",
      "https://www.facebook.com/GekeKappers/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 368,
    "status": "open",
    "lat": 52.155,
    "lng": 5.3876,
    "geoConfidence": "low",
    "priceRange": "€17,95 - €246,85",
    "specialties": [
      "Krullend haar knippen",
      "Knippen dames & heren",
      "Kleuren, highlights & lowlights",
      "Wassen en knippen",
      "Truffel-hotstone behandeling",
      "Online reserveren via Treatwell"
    ],
    "keyFacts": [
      {
        "label": "Specialisatie",
        "value": "Knippen van krullend haar (eigen techniek)"
      },
      {
        "label": "Ligging",
        "value": "Oude binnenstad, Zuidsingel"
      },
      {
        "label": "Reserveren",
        "value": "Online via Treatwell of telefonisch"
      },
      {
        "label": "Reviews",
        "value": "1.731+ geverifieerde Treatwell-reviews, gem. 4,8 sterren"
      },
      {
        "label": "Jubileum",
        "value": "Bestaat ruim 25 jaar"
      }
    ],
    "hours": [
      {
        "day": "monday",
        "closed": true,
        "periods": []
      },
      {
        "day": "tuesday",
        "closed": true,
        "periods": []
      },
      {
        "day": "wednesday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "thursday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "friday",
        "periods": [
          {
            "open": "10:00",
            "close": "21:00"
          }
        ]
      },
      {
        "day": "saturday",
        "periods": [
          {
            "open": "10:00",
            "close": "18:00"
          }
        ]
      },
      {
        "day": "sunday",
        "closed": true,
        "periods": []
      }
    ],
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Hairstyling+Geke+Zuidsingel+68+3811+HD+Amersfoort",
    "hasGoogleReviews": false,
    "schemaType": "HairSalon",
    "imageCandidateUrl": "https://cdn1.treatwell.net/images/view/v2.i9393605.w1080.h720.xC0656B00/",
    "imageCandidateSource": "Treatwell-profielfoto van Geke kappers (og:image van gekekappers.mytreatwell.nl)",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://cdn1.treatwell.net/images/view/v2.i9393605.w1080.h720.xC0656B00/",
    "imageFit": "cover",
    "perfectFor": [
      "Verwennen",
      "Me-time"
    ],
    "priceLevel": "mid"
  },
  {
    "id": "k-boetiek033",
    "name": "Boetiek033",
    "category": "Mode & sieraden",
    "subcategory": "Fashion / gift / baby concept store",
    "address": "Zuidsingel 70",
    "city": "Amersfoort",
    "streetSegment": "Zuidsingel",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Boetiek033 — fashion / gift / baby concept store op Zuidsingel 70 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Boetiek033 is gevestigd op Zuidsingel 70 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On the Kamp-end stretch of Zuidsingel (no. 70/70a), immediately past the already-listed Hairstyling Geke (68); sister shop of the listed Keizerin (same owners) and filed under De Kamp on tijdvooramersfoort. Active sustainable fashion/gift/baby concept store. Edge becaus",
    "tags": [
      "fashion",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://www.boetiek033.nl/",
    "sourceUrls": [
      "https://www.boetiek033.nl/"
    ],
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 370,
    "status": "open",
    "schemaType": "ClothingStore",
    "inclusionStatus": "confirmed_edge",
    "inclusionReason": "On the Kamp-end stretch of Zuidsingel (no. 70/70a), immediately past the already-listed Hairstyling Geke (68); sister shop of the listed Keizerin (same owners) and filed under De Kamp on tijdvooramersfoort. Active sustainable fashion/gift/baby concept store. Edge because it is a singel address, but the storefront is reached from the Kamp-end cluster.",
    "imageUrl": "http://www.keizerin.nl/cdn/shop/files/Keizerin_beeldmerk_dicht_goud_1200x1200.jpg?v=1764861697",
    "imageFit": "cover",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Shoppen",
      "Cadeau zoeken"
    ]
  },
  {
    "id": "bij-sophie",
    "name": "Bij Sophie",
    "category": "Koffie, lunch & zoet",
    "subcategory": "Lunch, delicatessen en borrel",
    "address": "Weverssingel 2",
    "postalCode": "3811 GJ",
    "city": "Amersfoort",
    "streetSegment": "Weverssingel",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Lunch, delicatessen, borrel, wijn, bier en werkplek vlak bij De Kamp.",
    "longDescription": "Bij Sophie is a warm place for breakfast, coffee, lunch, delicacies, drinks and small gifts, close to De Kamp.",
    "tags": [
      "lunch",
      "delicatessen",
      "borrel",
      "koffie",
      "Weverssingel"
    ],
    "websiteUrl": "https://bijsophieamersfoort.nl",
    "phone": "033-202 6548",
    "email": "info@bijsophieamersfoort.nl",
    "sourceUrls": [
      "https://www.tijdvooramersfoort.nl/nl/locaties/2026543073/bij-sophie",
      "https://bijsophieamersfoort.nl/"
    ],
    "verificationStatus": "verified_public_source",
    "permissionStatus": "placeholder_only",
    "imageStatus": "shopfront_needed",
    "featured": false,
    "sortOrder": 402,
    "status": "open",
    "schemaType": "CafeOrCoffeeShop",
    "updatedAt": "2026-06-14",
    "imageUrl": "https://bijsophieamersfoort.nl/wp-content/uploads/2022/06/285887430_149459334321696_6988469667600221132_n.jpg",
    "imageFit": "cover",
    "perfectFor": [
      "Koffie & lunch",
      "Even bijkomen",
      "Werkplek / koffie"
    ]
  },
  {
    "id": "k-atelier-mimosa",
    "name": "Atelier MiMosa",
    "category": "Beauty & verzorging",
    "subcategory": "Hair salon",
    "address": "Weverssingel 4",
    "city": "Amersfoort",
    "streetSegment": "Weverssingel",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Atelier MiMosa — hair salon op Weverssingel 4 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Atelier MiMosa is gevestigd op Weverssingel 4 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On the Kamp-end stretch of Weverssingel (no. 4), adjacent to the already-listed Bij Sophie (Weverssingel 2). Active. CORRECTION: it is a hair salon (run by Jill Oostveen & Enis Turgut), not a generic creative atelier/shop as the candidate described. Edge because it",
    "tags": [
      "hair salon",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://www.ateliermimosa.nl/",
    "sourceUrls": [
      "https://www.ateliermimosa.nl/"
    ],
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 404,
    "status": "open",
    "schemaType": "HairSalon",
    "inclusionStatus": "confirmed_edge",
    "inclusionReason": "On the Kamp-end stretch of Weverssingel (no. 4), adjacent to the already-listed Bij Sophie (Weverssingel 2). Active. CORRECTION: it is a hair salon (run by Jill Oostveen & Enis Turgut), not a generic creative atelier/shop as the candidate described. Edge because it is a singel address at the Kamp-end cluster.",
    "imageUrl": "https://www.ateliermimosa.nl/assets/images/ateliermimosa-v2.png",
    "imageFit": "cover",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Verwennen",
      "Me-time"
    ]
  },
  {
    "id": "k-van-dijk-clinic",
    "name": "Van Dijk Clinic",
    "category": "Beauty & verzorging",
    "subcategory": "Cosmetic-medical clinic",
    "address": "Weverssingel 7",
    "city": "Amersfoort",
    "streetSegment": "Weverssingel",
    "publicPersonName": null,
    "publicPersonRole": null,
    "shortDescription": "Van Dijk Clinic — cosmetic-medical clinic op Weverssingel 7 in winkelgebied De Kamp, Amersfoort.",
    "longDescription": "Van Dijk Clinic is gevestigd op Weverssingel 7 in De Kamp, het onafhankelijke winkelgebied in de historische binnenstad van Amersfoort. On the Kamp-end stretch of Weverssingel (no. 7), near Bij Sophie (no. 2). Active clinic for medical-cosmetic treatments (BIG-registered physicians). Edge because it is a singel address; sits within the Kamp-end cluster.",
    "tags": [
      "cosmetic-medical clinic",
      "Kamp Amersfoort"
    ],
    "websiteUrl": "https://www.vandijkclinic.nl/",
    "sourceUrls": [
      "https://www.vandijkclinic.nl/"
    ],
    "verificationStatus": "needs_owner_verification",
    "permissionStatus": "placeholder_only",
    "imageStatus": "owner_photo_needed",
    "featured": false,
    "sortOrder": 407,
    "status": "open",
    "schemaType": "BeautySalon",
    "inclusionStatus": "confirmed_edge",
    "inclusionReason": "On the Kamp-end stretch of Weverssingel (no. 7), near Bij Sophie (no. 2). Active clinic for medical-cosmetic treatments (BIG-registered physicians). Edge because it is a singel address; sits within the Kamp-end cluster.",
    "imageUrl": "https://www.vandijkclinic.nl/wp-content/uploads/elementor/thumbs/ClinicAwards-2023-q8valpv5eepmnu31bazia09822d2hqn7wgp61e12zg.png",
    "imageFit": "cover",
    "updatedAt": "2026-06-14",
    "lastChecked": "2026-06-14",
    "perfectFor": [
      "Verwennen",
      "Me-time"
    ]
  }
];

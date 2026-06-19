import { describe, expect, it } from "vitest";
import { parsePlaceDetails } from "@/lib/places";

describe("parsePlaceDetails (Places API New)", () => {
  const sample = {
    rating: 4.6,
    userRatingCount: 240,
    googleMapsUri: "https://maps.google.com/?cid=123",
    reviews: [
      {
        rating: 5,
        text: { text: "Heerlijk gegeten!" },
        authorAttribution: { displayName: "Jan", uri: "https://maps.google.com/jan", photoUri: "https://x/jan.jpg" },
        relativePublishTimeDescription: "2 weken geleden",
      },
      { rating: 4, originalText: { text: "Prima" }, authorAttribution: {} },
    ],
  };

  it("maps rating, total, maps url, and reviews", () => {
    const r = parsePlaceDetails(sample);
    expect(r.rating).toBe(4.6);
    expect(r.total).toBe(240);
    expect(r.mapsUrl).toBe("https://maps.google.com/?cid=123");
    expect(r.reviews).toHaveLength(2);
    expect(r.reviews[0]).toMatchObject({ author: "Jan", rating: 5, text: "Heerlijk gegeten!" });
    expect(r.reviews[1].text).toBe("Prima"); // falls back to originalText
    expect(r.reviews[1].author).toBe("Google-gebruiker"); // missing displayName default
  });

  it("caps at 5 reviews and tolerates missing fields", () => {
    const many = { reviews: Array.from({ length: 9 }, () => ({ rating: 5, text: { text: "ok" } })) };
    const r = parsePlaceDetails(many);
    expect(r.reviews).toHaveLength(5);
    expect(r.rating).toBeNull();
    expect(r.total).toBeNull();
    expect(r.mapsUrl).toBeNull();
  });

  it("returns an empty list when there are no reviews", () => {
    expect(parsePlaceDetails({}).reviews).toEqual([]);
  });
});

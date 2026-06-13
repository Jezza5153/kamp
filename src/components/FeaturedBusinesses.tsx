import { businesses } from "@/data/businesses";
import BusinessCard from "./BusinessCard";

const FeaturedBusinesses = () => {
  // Filter for featured businesses: De Tafelaar, Toko Tjin, Awazé, Anna’s Smaakatelier, FLUPS, DHome de winkel
  const featuredIds = [
    "de-tafelaar",
    "toko-tjin",
    "awaze",
    "annas-smaakatelier",
    "flups",
    "dhome-de-winkel"
  ];

  const featured = businesses.filter((b) => featuredIds.includes(b.id));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {featured.map((business) => (
        <BusinessCard key={business.id} business={business} />
      ))}
    </div>
  );
};

export default FeaturedBusinesses;

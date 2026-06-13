"use client";

import { useState, useMemo } from "react";
import { Business, businesses } from "@/data/businesses";
import BusinessCard from "./BusinessCard";
import CategoryFilter from "./CategoryFilter";
import BusinessSearch from "./BusinessSearch";

const BusinessGrid = ({ limit }: { limit?: number }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Alles");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredBusinesses = useMemo(() => {
    return businesses
      .filter((b) => b.verificationStatus !== "verify_active" || b.featured) // Hide unverifed unless featured/explicit
      .filter((b) => {
        const categoryMatch = selectedCategory === "Alles" || b.category === selectedCategory;
        const searchMatch = 
          b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          b.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (b.publicPersonName?.toLowerCase().includes(searchQuery.toLowerCase()));
        
        return categoryMatch && searchMatch;
      })
      .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.sortOrder - b.sortOrder);
  }, [selectedCategory, searchQuery]);

  const displayedBusinesses = limit ? filteredBusinesses.slice(0, limit) : filteredBusinesses;

  return (
    <section id="ondernemers" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {!limit && (
          <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <CategoryFilter 
              selected={selectedCategory} 
              onSelect={setSelectedCategory} 
            />
            <BusinessSearch 
              query={searchQuery} 
              onSearch={setSearchQuery} 
            />
          </div>
        )}
        
        {displayedBusinesses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedBusinesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-stone/10 rounded-3xl border border-stone/20">
            <h3 className="text-2xl font-serif font-bold text-deep-green mb-2">Geen resultaten gevonden</h3>
            <p className="text-warm-brown/60">Probeer een andere categorie of zoekterm.</p>
            <button 
              onClick={() => {setSelectedCategory("Alles"); setSearchQuery("");}}
              className="mt-4 text-amber font-bold hover:underline"
            >
              Filters wissen
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default BusinessGrid;

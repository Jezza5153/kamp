"use client";

import { useState, useMemo } from "react";
import { businesses } from "@/data/businesses";
import BusinessCard from "./BusinessCard";
import CategoryFilter from "./CategoryFilter";
import BusinessSearch from "./BusinessSearch";
import { motion, AnimatePresence } from "framer-motion";
import { FilterX } from "lucide-react";

const BusinessGrid = ({ limit }: { limit?: number }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Alles");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredBusinesses = useMemo(() => {
    return businesses
      .filter((b) => b.verificationStatus !== "verify_active" || b.featured)
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
    <section id="ondernemers" className="py-24 px-4 sm:px-6 lg:px-8 bg-stone/5">
      <div className="max-w-7xl mx-auto">
        {!limit && (
          <div className="mb-16 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
              <div className="max-w-xl">
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-deep-green mb-4">De Gids</h2>
                <p className="text-warm-brown/60 text-lg font-medium">Zoek op categorie, naam of product om de juiste ondernemer te vinden.</p>
              </div>
              <BusinessSearch 
                query={searchQuery} 
                onSearch={setSearchQuery} 
              />
            </div>
            <CategoryFilter 
              selected={selectedCategory} 
              onSelect={setSelectedCategory} 
            />
          </div>
        )}
        
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12"
        >
          <AnimatePresence mode="popLayout">
            {displayedBusinesses.length > 0 ? (
              displayedBusinesses.map((business) => (
                <motion.div
                  key={business.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <BusinessCard business={business} />
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-stone/30 shadow-inner"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone/20 text-stone mb-6">
                  <FilterX className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-deep-green mb-2">Geen match gevonden</h3>
                <p className="text-warm-brown/60 text-lg max-w-sm mx-auto mb-8">Probeer een andere categorie of zoekterm.</p>
                <button 
                  onClick={() => {setSelectedCategory("Alles"); setSearchQuery("");}}
                  className="px-8 py-3 bg-deep-green text-white font-bold rounded-full hover:bg-amber transition-all shadow-lg active:scale-95"
                >
                  Alle filters wissen
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default BusinessGrid;

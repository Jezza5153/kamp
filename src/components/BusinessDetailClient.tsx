"use client";

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { businesses } from "@/data/businesses";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { motion } from "framer-motion";
import { Globe, Phone, Mail, ArrowLeft, MapPin, Quote, Camera } from "lucide-react";

interface Props {
  params: { id: string };
}

// Note: generateMetadata and generateStaticParams must be in a separate server file or 
// this component must be a server component that calls a client component.
// Since I want animations, I'll convert the main logic to a client component 
// but for now I'll keep it simple as a client component for the refinement step.

export default function BusinessDetail({ business }: { business: typeof businesses[0] }) {
  if (!business) notFound();

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Editorial Header */}
      <div className="relative pt-12 pb-24 sm:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Breadcrumbs 
            items={[
              { label: business.category, href: `/categorie/${business.category.toLowerCase().replace(/ & /g, '-').replace(/, /g, '-').replace(/ /g, '-')}` },
              { label: business.name, current: true }
            ]} 
          />
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-end"
          >
            <div className="lg:col-span-8">
              <span className="inline-block px-4 py-1.5 bg-amber text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-6">
                {business.category}
              </span>
              <h1 className="text-6xl md:text-9xl font-serif font-black text-deep-green tracking-tighter leading-[0.85] mb-8">
                {business.name}
              </h1>
              <p className="text-2xl md:text-3xl text-warm-brown/80 font-medium leading-tight max-w-3xl">
                {business.shortDescription}
              </p>
            </div>
            
            <div className="lg:col-span-4 flex flex-col gap-6">
              {business.websiteUrl && (
                <a 
                  href={business.websiteUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center px-10 py-5 bg-deep-green text-white font-black uppercase tracking-widest text-xs rounded-full hover:bg-amber transition-all shadow-2xl hover:scale-105 active:scale-95"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Bezoek website
                </a>
              )}
            </div>
          </motion.div>
        </div>
        
        {/* Decorative background text */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 text-[20vw] font-serif font-black text-stone/10 select-none pointer-events-none whitespace-nowrap z-0 ornament transition-transform duration-[20s] animate-pulse">
          {business.name.split(' ')[0]}
        </div>
      </div>

      {/* Main Visual */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-20 relative z-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="rounded-[3rem] overflow-hidden shadow-[0_40px_80px_-20px_rgba(24,61,43,0.3)] aspect-[21/9] bg-stone/20 border-4 border-white/20"
        >
          {business.imageUrl ? (
            <img 
              src={business.imageUrl} 
              alt={business.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone/40 text-4xl font-serif italic">
              Beeld in aanvraag
            </div>
          )}
        </motion.div>
      </div>

      {/* Editorial Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          <div className="lg:col-span-7 space-y-16">
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px bg-amber w-12" />
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-amber">Het Verhaal</h2>
              </div>
              <div className="prose prose-2xl font-medium text-warm-brown/90 leading-[1.4] italic font-serif">
                <Quote className="w-12 h-12 text-amber/20 mb-6 -ml-2" />
                {business.longDescription}
              </div>
            </section>
            
            {business.publicPersonName && (
              <section className="bg-white p-12 rounded-[2.5rem] border border-stone/10 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-amber mb-8">Het Gezicht</h3>
                  <div className="flex items-center gap-8">
                    <div className="w-24 h-24 rounded-full bg-deep-green text-white flex items-center justify-center text-3xl font-serif font-black shadow-xl ring-8 ring-stone/10">
                      {business.publicPersonName[0]}
                    </div>
                    <div>
                      <p className="text-3xl font-serif font-black text-deep-green">{business.publicPersonName}</p>
                      <p className="text-warm-brown/50 text-sm font-bold uppercase tracking-widest">{business.publicPersonRole}</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 text-9xl font-serif font-black text-stone/5 group-hover:scale-110 transition-transform duration-700">
                  {business.publicPersonName[0]}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-32 space-y-8">
              <div className="bg-deep-green text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-amber mb-10">Locatie & Contact</h3>
                <dl className="space-y-8">
                  <div className="flex items-start gap-4">
                    <MapPin className="w-6 h-6 text-stone/40 flex-shrink-0" />
                    <div>
                      <dt className="text-[10px] font-black uppercase tracking-widest text-stone/40 mb-1">Adres</dt>
                      <dd className="text-xl font-medium">{business.address}, {business.postalCode || '3811'} Amersfoort</dd>
                    </div>
                  </div>
                  {business.phone && (
                    <div className="flex items-start gap-4">
                      <Phone className="w-6 h-6 text-stone/40 flex-shrink-0" />
                      <div>
                        <dt className="text-[10px] font-black uppercase tracking-widest text-stone/40 mb-1">Telefoon</dt>
                        <dd className="text-xl font-medium">{business.phone}</dd>
                      </div>
                    </div>
                  )}
                  {business.email && (
                    <div className="flex items-start gap-4">
                      <Mail className="w-6 h-6 text-stone/40 flex-shrink-0" />
                      <div>
                        <dt className="text-[10px] font-black uppercase tracking-widest text-stone/40 mb-1">E-mail</dt>
                        <dd className="text-xl font-medium break-all">{business.email}</dd>
                      </div>
                    </div>
                  )}
                  {business.instagramUrl && (
                    <div className="flex items-start gap-4">
                      <Camera className="w-6 h-6 text-stone/40 flex-shrink-0" />
                      <div>
                        <dt className="text-[10px] font-black uppercase tracking-widest text-stone/40 mb-1">Socials</dt>
                        <dd>
                          <a href={business.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-xl font-medium hover:text-amber transition-colors">
                            Instagram
                          </a>
                        </dd>
                      </div>
                    </div>
                  )}
                </dl>
                
                {/* Decorative dots */}
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <div className="grid grid-cols-4 gap-2">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
                    ))}
                  </div>
                </div>
              </div>

              <Link 
                href="/loop-de-kamp"
                className="group flex items-center justify-between p-8 bg-amber rounded-[2.5rem] shadow-xl hover:bg-stone transition-all transform hover:-translate-y-1"
              >
                <div>
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/60 mb-1 group-hover:text-deep-green/40">Route Guide</h4>
                  <p className="text-xl font-serif font-black text-white group-hover:text-deep-green">Loop de Kamp</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-amber shadow-lg group-hover:bg-deep-green group-hover:text-white transition-all">
                  <ArrowLeft className="w-6 h-6 rotate-180" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <JsonLd type="LocalBusiness" data={business} />
    </div>
  );
}

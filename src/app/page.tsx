import Hero from "@/components/Hero";
import SeoIntro from "@/components/SeoIntro";
import BusinessGrid from "@/components/BusinessGrid";
import OwnerSubmitCta from "@/components/OwnerSubmitCta";
import FeaturedHorizontal from "@/components/FeaturedHorizontal";

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <SeoIntro />
      
      <FeaturedHorizontal />

      <BusinessGrid />

      <OwnerSubmitCta />
    </div>
  );
}

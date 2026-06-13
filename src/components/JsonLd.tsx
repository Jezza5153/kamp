import { Business } from "@/data/businesses";

interface JsonLdProps {
  type: "LocalBusiness" | "ItemList" | "WebSite";
  data: any;
}

const JsonLd = ({ type, data }: JsonLdProps) => {
  let jsonLd: any = {};

  if (type === "LocalBusiness") {
    const business = data as Business;
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": business.name,
      "description": business.shortDescription,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": business.address,
        "addressLocality": "Amersfoort",
        "postalCode": business.postalCode,
        "addressCountry": "NL"
      },
      "telephone": business.phone,
      "url": `https://ondernemersvandekamp.nl/ondernemers/${business.id}`,
      "sameAs": [
        business.websiteUrl,
        business.instagramUrl
      ].filter(Boolean)
    };
  } else if (type === "ItemList") {
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": data.name,
      "itemListElement": data.items
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

export default JsonLd;

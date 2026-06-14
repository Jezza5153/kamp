import Image from "next/image";
import type { Business } from "@/data/businesses";
import { placeholderSvg } from "@/lib/placeholder";

interface BusinessImageProps {
  business: Business;
  /** next/image sizes hint */
  sizes?: string;
  /** prioritise loading (above-the-fold) */
  priority?: boolean;
  className?: string;
  /** override the small corner tag on the generated placeholder */
  tag?: string;
}

/**
 * Image precedence: a local owner photo (next/image, optimised) → a validated
 * external photo/logo (the business's own public image) → a deterministic,
 * on-brand generative placeholder. Logos are shown `contain` on a branded
 * backdrop so they look intentional; photos fill `cover`.
 */
export default function BusinessImage({ business, sizes, priority, className = "", tag }: BusinessImageProps) {
  const url = business.imageUrl;
  const alt = `${business.name} — ${business.subcategory}, ${business.address} Amersfoort`;
  const placeholder = () =>
    placeholderSvg({ id: business.id, name: business.name, category: business.category, tag: tag ?? business.streetSegment });

  // 1a. Owner-uploaded photo served from the dynamic /media route. It must NOT
  // go through next/image: on Workers the optimiser resolves "/..." via the
  // ASSETS binding (static files only), so a dynamic route 404s. Plain <img>.
  if (url && url.startsWith("/media/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
      />
    );
  }

  // 1b. Other local static image → optimised next/image
  if (url && url.startsWith("/")) {
    return (
      <Image src={url} alt={alt} fill sizes={sizes ?? "(max-width: 768px) 100vw, 33vw"} priority={priority} className={`object-cover ${className}`} />
    );
  }

  // 2. External public photo/logo
  if (url && /^https?:\/\//.test(url)) {
    if (business.imageFit === "contain") {
      // logo on a branded generative backdrop
      return (
        <div className={`absolute inset-0 h-full w-full ${className}`}>
          <div className="absolute inset-0" aria-hidden="true" dangerouslySetInnerHTML={{ __html: placeholder() }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-contain p-[12%]"
          />
        </div>
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy="no-referrer"
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
      />
    );
  }

  // 3. Generative placeholder
  return <div aria-hidden="true" className={`absolute inset-0 h-full w-full ${className}`} dangerouslySetInnerHTML={{ __html: placeholder() }} />;
}

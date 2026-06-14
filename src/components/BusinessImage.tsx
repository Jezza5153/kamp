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
 * Renders a real local photo when available, otherwise a deterministic,
 * on-brand generative cover. The parent controls aspect ratio/rounding;
 * this fills it. External (hot-linked) image URLs are intentionally ignored
 * in favour of the placeholder — only owner/local assets are shown.
 */
export default function BusinessImage({ business, sizes, priority, className = "", tag }: BusinessImageProps) {
  const local = business.imageUrl && business.imageUrl.startsWith("/") ? business.imageUrl : null;

  if (local) {
    return (
      <Image
        src={local}
        alt={`${business.name} — ${business.subcategory}, ${business.address} Amersfoort`}
        fill
        sizes={sizes ?? "(max-width: 768px) 100vw, 33vw"}
        priority={priority}
        className={`object-cover ${className}`}
      />
    );
  }

  const svg = placeholderSvg({
    id: business.id,
    name: business.name,
    category: business.category,
    tag: tag ?? business.streetSegment,
  });
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

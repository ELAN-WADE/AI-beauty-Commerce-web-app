'use client';

import React from 'react';
import Image from 'next/image';

const FALLBACK_PACKSHOT = '/product_barrier_cream.jpg';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Width the image renders at — drives responsive srcset (bandwidth). */
  sizes?: string;
  /** Set for the LCP image only (hero / gallery main). */
  priority?: boolean;
  fallbackSrc?: string;
}

/**
 * Batch-2 drop-in for product packshots: identical layout (fill + caller
 * classes), but responsive srcsets + AVIF/WebP instead of full-size JPGs.
 * Parent must be positioned (all call sites use relative/absolute wrappers).
 * Decorative art, avatars (remote URLs) and tiny icons stay plain <img>.
 */
export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className,
  sizes = '(max-width: 768px) 50vw, 25vw',
  priority = false,
  fallbackSrc = FALLBACK_PACKSHOT,
}) => {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);

  React.useEffect(() => {
    setFailedSrc(null);
  }, [src]);

  return (
    <Image
      src={failedSrc === src || !src ? fallbackSrc : src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
};

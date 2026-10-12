import React, { useState, useEffect } from 'react';

const FALLBACK_PACKSHOT = '/product_barrier_cream.jpg';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fallbackSrc?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = '',
  priority = false,
  fallbackSrc = FALLBACK_PACKSHOT,
}) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    setFailedSrc(null);
  }, [src]);

  return (
    <img
      src={failedSrc === src || !src ? fallbackSrc : src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      className={`w-full h-full object-cover ${className}`}
      onError={() => setFailedSrc(src)}
    />
  );
};

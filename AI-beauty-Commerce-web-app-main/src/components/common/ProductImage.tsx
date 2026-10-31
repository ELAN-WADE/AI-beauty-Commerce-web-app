import Image from 'next/image';
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
  sizes = '(max-width: 768px) 50vw, 25vw',
  fallbackSrc = FALLBACK_PACKSHOT,
}) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    setFailedSrc(null);
  }, [src]);

  const source = failedSrc === src || !src ? fallbackSrc : src;
  const style = `w-full h-full object-cover ${className}`;
  // Optimize same-origin public images. External CMS media keeps its approved URL.
  if (source.startsWith('/') && !source.startsWith('//') && !/\.svg(?:[?#]|$)/i.test(source)) return (
    <Image src={source} alt={alt} width={1200} height={1200} sizes={sizes}
      priority={priority} decoding="async" className={style} onError={() => setFailedSrc(src)} />
  );
  return <img src={source} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async"
    fetchPriority={priority ? 'high' : 'auto'} className={style} onError={() => setFailedSrc(src)} />;
};

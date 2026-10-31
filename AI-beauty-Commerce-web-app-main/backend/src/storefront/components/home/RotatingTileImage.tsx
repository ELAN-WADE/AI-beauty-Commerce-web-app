import React, { useState, useEffect } from 'react';
import { ProductImage } from '../common/ProductImage';

interface RotatingTileImageProps {
  images: string[];
  alt: string;
  intervalMs?: number;
  priority?: boolean;
  className?: string;
}

export const RotatingTileImage: React.FC<RotatingTileImageProps> = ({
  images,
  alt,
  intervalMs = 8000,
  priority = false,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [images.length, intervalMs, prefersReducedMotion]);

  if (images.length === 0) return null;

  if (prefersReducedMotion || images.length === 1) {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        <ProductImage
          src={images[0]}
          alt={alt}
          priority={priority}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="w-full h-full object-cover object-center"
        />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {images.map((img, idx) => (
        <div
          key={`${img}-${idx}`}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-out ${
            idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
          aria-hidden={idx !== currentIndex}
        >
          <ProductImage
            src={img}
            alt={alt}
            priority={priority && idx === 0}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="w-full h-full object-cover object-center"
          />
        </div>
      ))}
    </div>
  );
};

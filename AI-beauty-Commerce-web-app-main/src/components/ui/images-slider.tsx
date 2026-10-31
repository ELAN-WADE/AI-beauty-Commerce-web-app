'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface ImagesSliderProps {
  images: string[];
  children?: React.ReactNode;
  overlay?: boolean;
  overlayClassName?: string;
  className?: string;
  autoplay?: boolean;
  direction?: 'up' | 'down';
}

export const ImagesSlider: React.FC<ImagesSliderProps> = ({
  images,
  children,
  overlay = true,
  overlayClassName,
  className,
  autoplay = true,
  direction = 'up',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<string[]>([]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex + 1 === images.length ? 0 : prevIndex + 1
    );
  }, [images.length]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex - 1 < 0 ? images.length - 1 : prevIndex - 1
    );
  }, [images.length]);

  useEffect(() => {
    let active = true;
    const loadPromises = images.map((image) => {
      return new Promise<string>((resolve) => {
        const img = new Image();
        img.src = image;
        img.onload = () => resolve(image);
        img.onerror = () => resolve(image);
      });
    });

    Promise.all(loadPromises).then((loaded) => {
      if (active) setLoadedImages(loaded);
    });

    return () => {
      active = false;
    };
  }, [images]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        handleNext();
      } else if (event.key === 'ArrowLeft') {
        handlePrevious();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    let interval: ReturnType<typeof setInterval> | undefined;
    if (autoplay && images.length > 1) {
      interval = setInterval(() => {
        handleNext();
      }, 7000);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (interval) clearInterval(interval);
    };
  }, [autoplay, images.length, handleNext, handlePrevious]);

  const slideVariants = {
    initial: {
      scale: 1.05,
      opacity: 0,
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.9,
        ease: [0.645, 0.045, 0.355, 1.0] as const,
      },
    },
    upExit: {
      opacity: 0,
      scale: 0.98,
      transition: {
        duration: 0.9,
        ease: [0.645, 0.045, 0.355, 1.0] as const,
      },
    },
    downExit: {
      opacity: 0,
      scale: 0.98,
      transition: {
        duration: 0.9,
        ease: [0.645, 0.045, 0.355, 1.0] as const,
      },
    },
  };

  const areImagesLoaded = loadedImages.length > 0;

  return (
    <div
      className={cn(
        'overflow-hidden h-full w-full relative flex items-center justify-center',
        className
      )}
      style={{
        perspective: '1000px',
      }}
    >
      {areImagesLoaded && (
        <AnimatePresence mode="popLayout">
          <motion.img
            key={currentIndex}
            src={loadedImages[currentIndex]}
            alt={`Slide ${currentIndex + 1}`}
            initial="initial"
            animate="visible"
            exit={direction === 'up' ? 'upExit' : 'downExit'}
            variants={slideVariants}
            className="h-full w-full absolute inset-0 object-cover object-center pointer-events-none"
          />
        </AnimatePresence>
      )}

      {areImagesLoaded && overlay && (
        <div
          className={cn('absolute inset-0 bg-black/40 z-10 pointer-events-none', overlayClassName)}
        />
      )}

      {areImagesLoaded && (
        <div className="relative z-20 w-full h-full flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};

export default ImagesSlider;

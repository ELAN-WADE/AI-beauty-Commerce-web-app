'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export interface DepthCardProps {
  image: string;
  title: string;
  description?: string;
  eyebrow?: string;
  width?: number | string;
  height?: number | string;
  maxRotation?: number;
  maxTranslation?: number;
  borderRadius?: string;
  spotlight?: boolean;
  disableOnMobile?: boolean;
  respectReducedMotion?: boolean;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
  footer?: React.ReactNode;
}

export const DepthCard: React.FC<DepthCardProps> = ({
  image,
  title,
  description,
  eyebrow,
  width,
  height,
  maxRotation = 8,
  maxTranslation = 12,
  borderRadius = '12px',
  spotlight = false,
  disableOnMobile = true,
  respectReducedMotion = true,
  className = '',
  onClick,
  ariaLabel,
  footer,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isMobilePointer, setIsMobilePointer] = useState(false);

  const targetRef = useRef({ rx: 0, ry: 0, tx: 0, ty: 0 });
  const currentRef = useRef({ rx: 0, ry: 0, tx: 0, ty: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(pointer: coarse)');
    const sync = () => setIsMobilePointer(mql.matches || window.innerWidth < 768);
    sync();
    window.addEventListener('resize', sync);
    mql.addEventListener?.('change', sync);
    return () => {
      window.removeEventListener('resize', sync);
      mql.removeEventListener?.('change', sync);
    };
  }, []);

  const tiltDisabled =
    (respectReducedMotion && prefersReducedMotion) ||
    (disableOnMobile && isMobilePointer);

  const animateLoop = () => {
    const cur = currentRef.current;
    const tgt = targetRef.current;
    const ease = 0.14;

    cur.rx += (tgt.rx - cur.rx) * ease;
    cur.ry += (tgt.ry - cur.ry) * ease;
    cur.tx += (tgt.tx - cur.tx) * ease;
    cur.ty += (tgt.ty - cur.ty) * ease;

    if (innerRef.current) {
      innerRef.current.style.transform = `rotateX(${cur.rx.toFixed(2)}deg) rotateY(${cur.ry.toFixed(2)}deg)`;
    }
    if (mediaRef.current) {
      mediaRef.current.style.transform = `translate3d(${cur.tx.toFixed(2)}px, ${cur.ty.toFixed(2)}px, 0) scale(1.04)`;
    }
    if (contentRef.current) {
      contentRef.current.style.transform = `translate3d(${(cur.tx * 0.45).toFixed(2)}px, ${(cur.ty * 0.45).toFixed(2)}px, 16px)`;
    }

    const moving =
      Math.abs(tgt.rx - cur.rx) > 0.02 ||
      Math.abs(tgt.ry - cur.ry) > 0.02 ||
      Math.abs(tgt.tx - cur.tx) > 0.02 ||
      Math.abs(tgt.ty - cur.ty) > 0.02;

    if (moving) {
      rafRef.current = requestAnimationFrame(animateLoop);
    } else {
      rafRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const kickLoop = () => {
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(animateLoop);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (tiltDisabled || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    targetRef.current = {
      rx: -ny * maxRotation,
      ry: nx * maxRotation,
      tx: -nx * maxTranslation,
      ty: -ny * maxTranslation,
    };
    kickLoop();

    if (spotlight) {
      setSpotlightPos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
        opacity: 1,
      });
    }
  };

  const handlePointerLeave = () => {
    targetRef.current = { rx: 0, ry: 0, tx: 0, ty: 0 };
    if (!tiltDisabled) kickLoop();
    if (spotlight) {
      setSpotlightPos((prev) => ({ ...prev, opacity: 0 }));
    }
  };

  const interactiveProps = onClick
    ? {
        role: 'button' as const,
        tabIndex: 0,
        'aria-label': ariaLabel || title,
        onClick,
        onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        },
      }
    : {};

  const sizeStyle: React.CSSProperties = {
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    borderRadius,
    perspective: '1000px',
  };

  return (
    <div
      ref={cardRef}
      style={sizeStyle}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...interactiveProps}
      className={`group relative ${onClick ? 'cursor-pointer active:scale-[0.985]' : ''} transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] ${className}`}
    >
      <div
        ref={innerRef}
        style={{
          borderRadius,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full h-full overflow-hidden bg-[#141316] shadow-[0_14px_34px_rgba(15,15,16,0.12)]"
      >
        <div
          ref={mediaRef}
          className="absolute inset-0 will-change-transform"
          style={{ transform: 'scale(1.03)' }}
        >
          <img
            src={image}
            alt={title}
            loading="lazy"
            draggable={false}
            className="w-full h-full object-cover object-center pointer-events-none select-none"
          />
        </div>

        {/* Restrained legibility scrim */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/5"
        />

        {spotlight && spotlightPos.opacity > 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-opacity duration-200"
            style={{
              opacity: spotlightPos.opacity * 0.25,
              background: `radial-gradient(circle 180px at ${spotlightPos.x}% ${spotlightPos.y}%, rgba(255,255,255,0.45), transparent 70%)`,
            }}
          />
        )}

        <div
          ref={contentRef}
          className="relative z-10 flex h-full flex-col justify-end p-5 text-white will-change-transform"
        >
          {eyebrow && (
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#D4AF37] font-semibold">
              {eyebrow}
            </span>
          )}
          <h3 className="font-heading font-semibold text-base sm:text-lg leading-snug tracking-tight mt-1">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-white/80 leading-relaxed mt-1 line-clamp-2">
              {description}
            </p>
          )}
          {footer && <div className="mt-3">{footer}</div>}
        </div>
      </div>
    </div>
  );
};

export default DepthCard;


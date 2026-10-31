'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ShieldCheck, X, Quote, ArrowLeft, ArrowRight } from 'lucide-react';

export interface CardSpreadItem {
  id: string;
  authorName: string;
  city: string;
  skinType?: string;
  rating: number;
  date?: string;
  title: string;
  comment: string;
  verifiedPurchase?: boolean;
  authorAvatar?: string;
}

export interface CardSpreadProps {
  items: CardSpreadItem[];
  cardWidth?: number;
  cardHeight?: number;
  cardRadius?: number;
  radius?: number;
  arc?: number;
  cardColor?: string;
  cardPadding?: number;
  borderColor?: string;
  shadow?: number;
  lift?: number;
  push?: number;
  pushReach?: number;
  restOpacity?: number;
  stiffness?: number;
  damping?: number;
  mass?: number;
  fit?: boolean;
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
}

export const CardSpread: React.FC<CardSpreadProps> = ({
  items,
  cardWidth = 320,
  cardHeight = 390,
  cardRadius = 16,
  radius = 520,
  arc = 28, // Modest resting fan angle for text readability
  cardColor = '#FFFFFF',
  cardPadding = 24,
  borderColor = 'rgba(229, 231, 235, 0.9)',
  shadow = 0.12,
  lift = 28,
  push = 6,
  pushReach = 2,
  restOpacity = 0.92,
  stiffness = 160,
  damping = 18,
  mass = 0.9,
  fit = true,
  interactive = true,
  className = '',
  style
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [modalItem, setModalItem] = useState<CardSpreadItem | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeIndex = hoveredIndex !== null ? hoveredIndex : focusedIndex;
  const count = items.length;

  // Calculate fan angles
  const halfArc = arc / 2;
  const step = count > 1 ? arc / (count - 1) : 0;

  return (
    <div
      ref={containerRef}
      className={`relative w-full select-none ${className}`}
      style={style}
      role="region"
      aria-label="Customer testimonial card spread"
    >
      {/* Desktop Fanned Deck View (hidden on small screens) */}
      <div className="hidden md:flex flex-col items-center justify-center min-h-[460px] relative py-8 overflow-visible">
        <div
          className="relative flex items-center justify-center"
          style={{
            width: `${cardWidth + 240}px`,
            height: `${cardHeight + 40}px`
          }}
          onPointerLeave={() => {
            if (interactive) setHoveredIndex(null);
          }}
        >
          {items.map((item, index) => {
            const isHovered = activeIndex === index;
            const isOtherHovered = activeIndex !== null && !isHovered;

            // Base geometric resting angle
            const baseAngle = -halfArc + index * step;

            // Push neighbours aside when a card is hovered
            let angleOffset = 0;
            if (activeIndex !== null && !isHovered) {
              const dist = index - activeIndex;
              if (Math.abs(dist) <= pushReach) {
                const direction = dist > 0 ? 1 : -1;
                const factor = 1 - (Math.abs(dist) - 1) / pushReach;
                angleOffset = direction * push * Math.max(0, factor);
              }
            }

            const currentAngle = isHovered ? 0 : baseAngle + angleOffset;
            const rad = (currentAngle * Math.PI) / 180;

            // Position along circle arc
            const x = radius * Math.sin(rad);
            const y = radius * (1 - Math.cos(rad)) + (isHovered ? -lift : 0);

            return (
              <motion.article
                key={item.id}
                tabIndex={0}
                role="article"
                aria-label={`Review by ${item.authorName}`}
                onMouseEnter={() => {
                  if (interactive) setHoveredIndex(index);
                }}
                onFocus={() => {
                  if (interactive) setFocusedIndex(index);
                }}
                onBlur={() => {
                  if (interactive) setFocusedIndex(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' && index < count - 1) {
                    e.preventDefault();
                    setFocusedIndex(index + 1);
                  } else if (e.key === 'ArrowLeft' && index > 0) {
                    e.preventDefault();
                    setFocusedIndex(index - 1);
                  } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setModalItem(item);
                  }
                }}
                animate={{
                  x,
                  y,
                  rotate: currentAngle,
                  scale: isHovered ? 1.03 : 1,
                  opacity: isOtherHovered ? restOpacity : 1,
                  zIndex: isHovered ? 30 : 10 + index
                }}
                transition={{
                  type: 'spring',
                  stiffness,
                  damping,
                  mass
                }}
                className="absolute cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 flex flex-col justify-between"
                style={{
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                  borderRadius: `${cardRadius}px`,
                  backgroundColor: cardColor,
                  padding: `${cardPadding}px`,
                  border: `1px solid ${isHovered ? 'rgba(212, 175, 55, 0.45)' : borderColor}`,
                  boxShadow: isHovered
                    ? `0 20px 38px -12px rgba(0, 0, 0, ${shadow * 1.5}), 0 8px 18px -6px rgba(212, 175, 55, 0.12)`
                    : `0 10px 24px -10px rgba(0, 0, 0, ${shadow})`
                }}
              >
                {/* Card Top: Rating Stars & Discreet Verified Badge */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-1 text-[#D4AF37]"
                      aria-label={`${item.rating} out of 5 stars`}
                    >
                      {[...Array(item.rating)].map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className="fill-[#D4AF37] text-[#D4AF37]"
                          strokeWidth={0}
                        />
                      ))}
                    </div>

                    {item.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        <ShieldCheck size={11} className="text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>

                  {/* Headline Title */}
                  <h3 className="font-heading font-bold text-[13.5px] text-[#0F0F10] leading-snug line-clamp-2">
                    {item.title}
                  </h3>

                  {/* Review Text Body */}
                  <p className="text-xs text-[#4B5563] leading-relaxed line-clamp-5 font-normal">
                    "{item.comment}"
                  </p>
                </div>

                {/* Card Bottom: Author Info & Read Full Link */}
                <div className="pt-3 border-t border-[#E5E7EB]/80 flex items-center justify-between">
                  <div>
                    <h4 className="font-heading font-bold text-xs text-[#0F0F10]">
                      {item.authorName}
                    </h4>
                    <p className="text-[10.5px] font-mono text-[#8E8E93]">
                      {item.city} • {item.skinType || 'Fitzpatrick V'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalItem(item);
                    }}
                    className="text-[11px] font-mono text-[#8B6E27] hover:text-[#0F0F10] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Read
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* Ambient instruction note for desktop */}
        <p className="text-[11px] font-mono text-[#8E8E93] text-center mt-6">
          Hover or tap any card to spread and inspect in detail
        </p>
      </div>

      {/* Mobile Accessible Scrollable Deck (screens < 768px) */}
      <div className="md:hidden space-y-4">
        <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1 snap-x snap-mandatory no-scrollbar">
          {items.map((item) => (
            <article
              key={item.id}
              className="snap-center shrink-0 w-[84vw] max-w-[320px] rounded-2xl bg-white p-5 border border-[#E5E7EB] shadow-xs flex flex-col justify-between"
              style={{ minHeight: '340px' }}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[#D4AF37]">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} size={12} className="fill-[#D4AF37] text-[#D4AF37]" strokeWidth={0} />
                    ))}
                  </div>

                  {item.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck size={11} className="text-emerald-600" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>

                <h3 className="font-heading font-bold text-sm text-[#0F0F10] leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-[#4B5563] leading-relaxed font-normal">
                  "{item.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB]/80 mt-4">
                <h4 className="font-heading font-bold text-xs text-[#0F0F10]">
                  {item.authorName}
                </h4>
                <p className="text-[10.5px] font-mono text-[#8E8E93]">
                  {item.city} • {item.skinType}
                </p>
              </div>
            </article>
          ))}
        </div>
        <p className="text-[10.5px] font-mono text-[#8E8E93] text-center">
          ← Swipe to explore all customer stories →
        </p>
      </div>

      {/* Accessible Full Review Modal */}
      <AnimatePresence>
        {modalItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
            onClick={() => setModalItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-[#E5E7EB] relative space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setModalItem(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#0F0F10] transition-colors cursor-pointer"
                aria-label="Close review modal"
              >
                <X size={15} />
              </button>

              <div className="flex items-center gap-1.5 text-[#D4AF37]">
                {[...Array(modalItem.rating)].map((_, i) => (
                  <Star key={i} size={14} className="fill-[#D4AF37] text-[#D4AF37]" strokeWidth={0} />
                ))}
                {modalItem.verifiedPurchase && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck size={11} className="text-emerald-600" />
                    <span>Verified Customer</span>
                  </span>
                )}
              </div>

              <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#0F0F10]">
                {modalItem.title}
              </h3>

              <div className="relative pl-3 border-l-2 border-[#D4AF37]">
                <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed font-normal">
                  "{modalItem.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                <div>
                  <p className="font-heading font-bold text-[#0F0F10]">{modalItem.authorName}</p>
                  <p className="text-[#8E8E93] text-[11px] font-mono">
                    {modalItem.city} • {modalItem.skinType || 'Fitzpatrick V'}
                  </p>
                </div>
                {modalItem.date && (
                  <span className="text-[10.5px] font-mono text-[#9CA3AF]">
                    {modalItem.date}
                  </span>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CardSpread;

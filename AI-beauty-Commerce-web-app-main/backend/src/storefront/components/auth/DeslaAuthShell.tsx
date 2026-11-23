'use client';

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ScanFace } from 'lucide-react';
import { DESLA_EASE_OUT } from '../motion/DeslaMotion';

/**
 * Reusable diagonal repeating "Desla" typography watermark (SVG pattern, zero raster overhead).
 * Stays strictly behind interactive surfaces at ~4.5% opacity.
 */
export const DeslaWatermark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`pointer-events-none select-none absolute inset-0 overflow-hidden z-0 ${className}`}
  >
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern
          id="desla-diagonal-watermark"
          width="240"
          height="130"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-24)"
        >
          <text
            x="16"
            y="54"
            fill="#111111"
            fillOpacity="0.045"
            fontFamily="var(--font-manrope), Manrope, 'Segoe UI', sans-serif"
            fontSize="26"
            fontWeight="600"
            fontStyle="italic"
            letterSpacing="0.06em"
          >
            Desla
          </text>
          <text
            x="136"
            y="114"
            fill="#111111"
            fillOpacity="0.04"
            fontFamily="var(--font-manrope), Manrope, 'Segoe UI', sans-serif"
            fontSize="26"
            fontWeight="600"
            fontStyle="italic"
            letterSpacing="0.06em"
          >
            Desla
          </text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#desla-diagonal-watermark)" />
    </svg>
  </div>
);

/**
 * Per-character stepped typewriter reveal (animate-text typewriter contract: ~46ms/char).
 * Renders immediately with zero animation under prefers-reduced-motion.
 */
const TypewriterText: React.FC<{
  text: string;
  speedMs?: number;
  startDelayMs?: number;
  className?: string;
  caretClassName?: string;
}> = ({ text, speedMs = 46, startDelayMs = 140, className = '', caretClassName = 'bg-[#B89248]' }) => {
  const prefersReduced = useReducedMotion();
  const [count, setCount] = useState(prefersReduced ? text.length : 0);

  useEffect(() => {
    if (prefersReduced) {
      setCount(text.length);
      return;
    }
    setCount(0);
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const startId = setTimeout(() => {
      intervalId = setInterval(() => {
        setCount((prev) => {
          if (prev >= text.length) {
            if (intervalId) clearInterval(intervalId);
            return text.length;
          }
          return prev + 1;
        });
      }, speedMs);
    }, startDelayMs);

    return () => {
      clearTimeout(startId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speedMs, startDelayMs, prefersReduced]);

  const isTyping = !prefersReduced && count < text.length;

  return (
    <span className={`relative block ${className}`} aria-label={text}>
      {/* Invisible full-text spacer locks exact final height from frame 0 (0px CLS) */}
      <span aria-hidden="true" className="block invisible select-none">
        {text}
      </span>
      <span aria-hidden="true" className="absolute inset-0">
        {prefersReduced ? text : text.slice(0, count)}
        {isTyping && (
          <span
            aria-hidden="true"
            className={`inline-block w-[1.5px] h-[0.92em] ml-0.5 align-middle animate-pulse ${caretClassName}`}
          />
        )}
      </span>
    </span>
  );
};

type ScanPillPhase = 'spin-in' | 'expand' | 'hold';
const SCAN_LABEL = 'AI Skin Scan';

/**
 * Mobile-safe static frosted AI Skin Scan CTA pill (zero layout-width animation,
 * zero disappearing timer loop, always calmly tappable on touch devices).
 */
const StaticSkinScanPill: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <a
    href="/skin-analysis"
    aria-label="AI Skin Scan — Discover personalized beauty recommendations"
    onClick={(e) => {
      if (onClick) {
        e.preventDefault();
        onClick();
      }
    }}
    className="group inline-flex items-center h-9 pl-2.5 pr-3 gap-1.5 rounded-full bg-[#1C1712]/70 hover:bg-[#1C1712]/85 text-white border border-white/25 shadow-[0_8px_22px_-8px_rgba(17,17,17,0.38)] whitespace-nowrap active:scale-[0.97] transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E6C77A] focus-visible:ring-offset-2 touch-manipulation"
  >
    <ScanFace className="w-4 h-4 shrink-0 text-[#F3DFAC]" aria-hidden="true" />
    <span className="text-[11px] font-medium tracking-tight text-white">
      {SCAN_LABEL}
    </span>
    <ArrowRight className="w-3 h-3 shrink-0 text-white/90" aria-hidden="true" />
  </a>
);

/**
 * Choreographed desktop AI Skin Scan button:
 * Runs once on mount (spin-in -> smooth expand -> calm resting state) so it
 * never vanishes or triggers perpetual layout recalculations.
 */
const AnimatedSkinScanPill: React.FC<{
  onClick?: () => void;
}> = ({ onClick }) => {
  const prefersReduced = useReducedMotion();
  const [phase, setPhase] = useState<ScanPillPhase>(prefersReduced ? 'hold' : 'spin-in');
  const [typedCount, setTypedCount] = useState(prefersReduced ? SCAN_LABEL.length : 0);

  useEffect(() => {
    if (prefersReduced) {
      setPhase('hold');
      setTypedCount(SCAN_LABEL.length);
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    if (phase === 'spin-in') {
      setTypedCount(0);
      timer = setTimeout(() => setPhase('expand'), 420);
    } else if (phase === 'expand') {
      timer = setTimeout(() => setPhase('hold'), 860);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [phase, prefersReduced]);

  useEffect(() => {
    if (prefersReduced) return;
    if (phase === 'expand') {
      setTypedCount(0);
      const id = setInterval(() => {
        setTypedCount((prev) => {
          if (prev >= SCAN_LABEL.length) {
            clearInterval(id);
            return SCAN_LABEL.length;
          }
          return prev + 1;
        });
      }, 46);
      return () => clearInterval(id);
    }
    if (phase === 'hold') {
      setTypedCount(SCAN_LABEL.length);
    }
  }, [phase, prefersReduced]);

  const isExpanded = prefersReduced || phase === 'expand' || phase === 'hold';
  const showArrow = prefersReduced || (phase === 'hold' && typedCount >= SCAN_LABEL.length);

  return (
    <motion.a
      href="/skin-analysis"
      aria-label="AI Skin Scan — Discover personalized beauty recommendations"
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      initial={prefersReduced ? false : { opacity: 0, scale: 0.85, width: 40 }}
      animate={
        prefersReduced || isExpanded
          ? { opacity: 1, scale: 1, width: 152 }
          : { opacity: 1, scale: 1, width: 40 }
      }
      transition={{ duration: 0.38, ease: DESLA_EASE_OUT }}
      className="group inline-flex items-center h-10 rounded-full bg-[#1C1712]/[0.44] hover:bg-[#1C1712]/[0.64] backdrop-blur-md text-white border border-white/[0.24] shadow-[0_8px_22px_-8px_rgba(17,17,17,0.32)] overflow-hidden whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E6C77A] focus-visible:ring-offset-2"
    >
      <motion.span
        initial={prefersReduced ? false : { rotate: -180, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.42, ease: DESLA_EASE_OUT }}
        className="w-10 h-10 shrink-0 flex items-center justify-center text-white"
        aria-hidden="true"
      >
        <ScanFace className="w-[18px] h-[18px]" />
      </motion.span>

      <span className="inline-flex items-center gap-1.5 pr-3.5 text-xs font-medium tracking-tight text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.22)]">
        <span aria-hidden="true">{SCAN_LABEL.slice(0, typedCount)}</span>
        {!prefersReduced && phase === 'expand' && typedCount < SCAN_LABEL.length && (
          <span className="inline-block w-[1.5px] h-3 bg-[#F3DFAC]" aria-hidden="true" />
        )}
        <motion.span
          animate={{ opacity: showArrow ? 1 : 0, x: showArrow ? 0 : -4 }}
          transition={{ duration: 0.2 }}
          aria-hidden="true"
        >
          <ArrowRight className="w-3.5 h-3.5 text-white/95 transition-transform duration-200 group-hover:translate-x-0.5" />
        </motion.span>
      </span>
    </motion.a>
  );
};

export interface DeslaAuthTabsProps {
  active: 'login' | 'signup';
  onChange: (next: 'login' | 'signup') => void;
  className?: string;
}

/**
 * Refined minimalist underline tab switcher ("Sign In | Create Account")
 * with thin animated gold underline and full keyboard navigation.
 */
export const DeslaAuthTabs: React.FC<DeslaAuthTabsProps> = ({
  active,
  onChange,
  className = '',
}) => {
  const tabs: { id: 'login' | 'signup'; label: string }[] = [
    { id: 'login', label: 'Sign In' },
    { id: 'signup', label: 'Create Account' },
  ];

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = tabs[(idx + 1) % tabs.length];
      onChange(next.id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(tabs[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(tabs[tabs.length - 1].id);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Authentication mode"
      className={`flex items-center gap-7 border-b border-[#EAE5DC] ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`relative min-h-[44px] pb-2.5 pt-2 text-sm font-medium transition-colors duration-150 cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89248] focus-visible:ring-offset-2 rounded-sm ${
              isActive
                ? 'text-[#111111]'
                : 'text-[#767168] hover:text-[#111111]'
            }`}
          >
            <span>{tab.label}</span>
            <span
              aria-hidden="true"
              className={`absolute bottom-[-1px] left-0 right-0 h-[2px] rounded-full transition-colors duration-150 ${
                isActive ? 'bg-[#B89248]' : 'bg-transparent'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

export interface DeslaAuthShellProps {
  artworkSrc: string;
  artworkAlt: string;
  artworkPosition?: string;
  eyebrow?: string;
  headline?: string;
  subheadline?: string;
  supportingCopy?: string;
  showSkinScanFeature?: boolean;
  onSkinScanClick?: () => void;
  footerNote?: React.ReactNode;
  topAlert?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shared compact luxury two-column desktop (max-w-[950px]) / vertical mobile authentication shell.
 * Keeps role photography bright and clearly visible on both desktop and mobile,
 * displays the exact original Desla black+gold logo, typewriter welcome copy,
 * and the choreographed rolling/expanding AI Skin Scan pill button.
 */
export const DeslaAuthShell: React.FC<DeslaAuthShellProps> = ({
  artworkSrc,
  artworkAlt,
  artworkPosition = 'object-[50%_20%]',
  eyebrow,
  headline = 'Welcome to Desla',
  subheadline = 'Beauty, reimagined around you.',
  supportingCopy = 'Discover your personal beauty essentials, curated collections, and a shopping experience tailored to you.',
  showSkinScanFeature = true,
  onSkinScanClick,
  footerNote,
  topAlert,
  children,
}) => {
  return (
    <div className="relative min-h-[100svh] bg-[#FBF9F5] text-[#111111] font-body flex flex-col justify-start lg:justify-center selection:bg-[#B89248]/20 selection:text-[#111111] px-3.5 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <DeslaWatermark />

      <div className="relative z-10 w-full max-w-[950px] mx-auto">
        {topAlert}

        <div className="w-full bg-[#FBF9F5] border border-[#E7E1D6] rounded-[20px] sm:rounded-[22px] overflow-hidden shadow-[0_24px_64px_-24px_rgba(17,17,17,0.11),0_4px_16px_-4px_rgba(17,17,17,0.04)] flex flex-col lg:flex-row lg:min-h-[550px]">
          {/* LEFT COLUMN (Desktop) / BRIGHT UNOBSTRUCTED TOP SHOWCASE (Mobile: deterministic fixed height so keyboard/URL bar never jumps layout) */}
          <div className="relative w-full lg:flex-1 h-[210px] sm:h-[250px] lg:h-auto lg:min-h-[550px] lg:max-h-none bg-[#F3EEE3] overflow-hidden shrink-0">
            <img
              src={artworkSrc}
              alt={artworkAlt}
              width={960}
              height={1200}
              decoding="async"
              fetchPriority="high"
              className={`absolute inset-0 w-full h-full object-cover ${artworkPosition}`}
            />

            <div className="relative z-10 h-full flex flex-col justify-between p-4 sm:p-5 lg:p-6">
              {/* Top Row: Transparent Floating Desla Logo + Optional Role Tag */}
              <div className="flex items-center justify-between gap-2.5">
                <img
                  src="/desla_logo_dark.svg"
                  alt="Desla!"
                  className="h-6 sm:h-[26px] w-auto block object-contain select-none drop-shadow-[0_1px_8px_rgba(255,255,255,0.85)]"
                />
                {eyebrow && (
                  <span className="px-2.5 py-1 rounded-full bg-[#1C1712]/70 lg:bg-[#1C1712]/[0.38] lg:backdrop-blur-md border border-white/[0.22] text-[10px] font-medium uppercase tracking-[0.16em] text-white/95">
                    {eyebrow}
                  </span>
                )}
              </div>

              {/* Desktop Bottom: Refined Glassmorphism Welcome Area + One-Shot AI Skin Scan Pill */}
              <div className="hidden lg:flex flex-col gap-3">
                {showSkinScanFeature && (
                  <div className="flex justify-start min-h-[40px]">
                    <AnimatedSkinScanPill onClick={onSkinScanClick} />
                  </div>
                )}

                <div className="rounded-2xl bg-[#1C1712]/[0.36] backdrop-blur-md border border-white/[0.20] px-5 py-4 shadow-[0_14px_34px_-16px_rgba(17,17,17,0.28)]">
                  <div className="w-7 h-[1.5px] bg-[#E6C77A] mb-2" aria-hidden="true" />
                  <h2 className="font-heading font-semibold text-[22px] leading-[1.2] tracking-tight text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.22)]">
                    <TypewriterText text={headline} speedMs={46} startDelayMs={160} caretClassName="bg-[#F3DFAC]" />
                  </h2>
                  <p className="text-xs italic font-medium text-[#F7EBD2] mt-1 [text-shadow:0_1px_6px_rgba(0,0,0,0.20)]">
                    {subheadline}
                  </p>
                  <p className="text-xs text-white/90 leading-relaxed mt-1.5 font-normal [text-shadow:0_1px_6px_rgba(0,0,0,0.18)]">
                    {supportingCopy}
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Bottom-Right: Calm, Always-Tappable AI Skin Scan Pill (decoupled from flex flow) */}
            {showSkinScanFeature && (
              <div className="absolute bottom-3.5 right-3.5 z-10 lg:hidden">
                <StaticSkinScanPill onClick={onSkinScanClick} />
              </div>
            )}
          </div>

          {/* MOBILE WELCOME STRIP (Solid Warm Parchment Band — zero backdrop-blur repaint flicker) */}
          <div className="lg:hidden bg-[#F4EFE6] border-b border-[#E7E1D6] px-5 py-3.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-[1.5px] bg-[#B89248]" aria-hidden="true" />
              <span className="text-[11px] italic font-medium text-[#8C6D28]">
                {subheadline}
              </span>
            </div>
            <h2 className="font-heading font-semibold text-lg leading-snug tracking-tight text-[#111111]">
              <TypewriterText text={headline} speedMs={42} startDelayMs={120} />
            </h2>
            <p className="text-xs text-[#4A4742] leading-relaxed mt-1 font-normal">
              {supportingCopy}
            </p>
          </div>

          {/* RIGHT COLUMN (Desktop 430px inside 950px shell — harmonized #FBF9F5 canvas) */}
          <div className="w-full lg:w-[430px] lg:shrink-0 bg-[#FBF9F5] px-5 py-5 sm:px-7 sm:py-7 lg:px-8 lg:py-7 flex flex-col justify-start lg:justify-center">
            {children}
          </div>
        </div>

        {footerNote && (
          <div className="mt-4 text-center text-[11px] text-[#767168]">
            {footerNote}
          </div>
        )}
      </div>
    </div>
  );
};

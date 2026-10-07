import React from 'react';

/**
 * Hand-Drawn & Organic Skincare Luxury Accents
 * Crafted with organic vector paths for a bespoke, high-end editorial cosmetic apothecary aesthetic.
 */

// 1. Hand-Drawn Botanical Sprig (Shea / Chamomile sprig)
export const BotanicalSprig: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-6 h-6',
  color = '#D4AF37'
}) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Stem */}
    <path
      d="M10 40C14 34 22 24 38 12"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Bottom Leaf Left */}
    <path
      d="M15 32C11 30 10 24 16 23C20 22 19 28 15 32Z"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.85"
    />
    {/* Middle Leaf Right */}
    <path
      d="M24 25C27 21 33 21 34 26C34 30 28 29 24 25Z"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.85"
    />
    {/* Upper Leaf Left */}
    <path
      d="M28 18C25 15 26 9 31 10C35 11 33 16 28 18Z"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.85"
    />
    {/* Tip Leaf */}
    <path
      d="M38 12C39 7 43 7 42 12C41 15 37 15 38 12Z"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.9"
    />
  </svg>
);

// 2. Hand-Drawn Organic Highlighting Circle / Loop
export const HandDrawnLoop: React.FC<{ className?: string; color?: string; children?: React.ReactNode }> = ({
  className = '',
  color = '#D4AF37',
  children
}) => (
  <span className={`relative inline-flex items-center justify-center ${className}`}>
    {children}
    <svg
      viewBox="0 0 100 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute -inset-x-2 -inset-y-1.5 w-[calc(100%+16px)] h-[calc(100%+12px)] pointer-events-none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M8 20C7 10 25 4 52 4C82 4 96 11 95 21C94 30 76 36 46 36C18 36 3 28 6 18C7 14 14 8 26 7"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
    </svg>
  </span>
);

// 3. Hand-Drawn Facial Contour Arcs (Dermatological facial topology mapping)
export const FacialContourArcs: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-full h-full',
  color = '#D4AF37'
}) => (
  <svg
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Organic cheek contour curve */}
    <path
      d="M40 70C65 110 135 110 160 70"
      stroke={color}
      strokeWidth="1.2"
      strokeDasharray="4 4"
      strokeLinecap="round"
      opacity="0.5"
    />
    {/* Jawline contour curve */}
    <path
      d="M55 100C75 145 125 145 145 100"
      stroke={color}
      strokeWidth="1.2"
      strokeLinecap="round"
      opacity="0.6"
    />
    {/* Forehead brow arc */}
    <path
      d="M60 50C85 40 115 40 140 50"
      stroke={color}
      strokeWidth="1.2"
      strokeLinecap="round"
      opacity="0.5"
    />
    {/* Center vertical facial symmetry meridian */}
    <path
      d="M100 30L100 170"
      stroke={color}
      strokeWidth="1"
      strokeDasharray="3 6"
      strokeLinecap="round"
      opacity="0.4"
    />
  </svg>
);

// 4. Apothecary Clinical Purity Seal
export const ApothecaryPuritySeal: React.FC<{ className?: string; size?: number }> = ({ className = 'w-16 h-16', size }) => (
  <div
    style={size ? { width: size, height: size } : undefined}
    className={`relative flex items-center justify-center ${size ? '' : className}`}
  >
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full animate-[spin_40s_linear_infinite]"
    >
      <circle cx="50" cy="50" r="46" stroke="#D4AF37" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
      <circle cx="50" cy="50" r="41" stroke="#D4AF37" strokeWidth="0.8" opacity="0.4" />
      <path
        id="textPathSeal"
        d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"
        fill="none"
      />
      <text fill="#997A2E" fontSize="7.5" fontWeight="600" letterSpacing="2.2" textAnchor="middle">
        <textPath href="#textPathSeal" startOffset="50%">
          DESLA! APOTHECARY • 100% CLINICALLY VERIFIED •
        </textPath>
      </text>
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
      <span className="text-[8px] font-mono font-bold text-[#997A2E] leading-none">PURE</span>
      <span className="text-[6.5px] font-mono text-[#6B7280] leading-none mt-0.5">LAB</span>
    </div>
  </div>
);

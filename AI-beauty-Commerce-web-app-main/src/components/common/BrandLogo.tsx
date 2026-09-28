import React from 'react';

interface BrandLogoProps {
  variant?: 'gold' | 'white' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'gold',
  size = 'md',
  showTagline = false,
  className = '',
  onClick,
}) => {
  const sizeClasses = {
    sm: 'h-6 text-lg',
    md: 'h-8 text-2xl',
    lg: 'h-10 text-3xl',
    xl: 'h-14 text-5xl',
  };

  const textColor = {
    gold: 'text-[#D4AF37]',
    white: 'text-[#FBF9F5]',
    dark: 'text-[#0F0F10]',
  };

  const badgeColor = {
    gold: 'text-[#F6E7C1] border-[#D4AF37]/50',
    white: 'text-[#D4AF37] border-white/30',
    dark: 'text-[#0F0F10] border-black/40 font-bold',
  };

  const taglineColor = {
    gold: 'text-[#A19B96]',
    white: 'text-white/70',
    dark: 'text-[#0F0F10] font-bold tracking-[0.22em]',
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex flex-col select-none cursor-pointer group ${className}`}
    >
      <div className="flex items-baseline gap-1">
        {/* Desla! Brandmark with Unified Sans Typography matching the Product System */}
        <span
          className={`font-heading font-extrabold tracking-tight ${sizeClasses[size]} ${textColor[variant]} transition-transform duration-200 group-hover:scale-[1.02]`}
          style={{ letterSpacing: '-0.04em' }}
        >
          Desla<span className={variant === 'dark' ? 'text-[#0F0F10]' : 'text-[#D4AF37]'}>!</span>
        </span>

        {/* TM Badge */}
        <span
          className={`text-[8px] font-mono uppercase px-1 py-0.2 rounded-xs border ${badgeColor[variant]} tracking-widest`}
        >
          TM
        </span>
      </div>

      {showTagline && (
        <span className={`text-[8.5px] uppercase font-heading ${taglineColor[variant]} -mt-1`}>
          HEALTH BEFORE BEAUTY
        </span>
      )}
    </div>
  );
};

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
  const heightClasses = {
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-9',
    lg: 'h-11 sm:h-12',
    xl: 'h-14 sm:h-16',
  };

  const logoSrc = {
    dark: '/desla_logo_dark.svg',
    white: '/desla_logo_white.svg',
    gold: '/desla_logo_gold.svg',
  }[variant];

  const taglineColor = {
    gold: 'text-[#D4AF37]',
    white: 'text-white/70',
    dark: 'text-[#0F0F10] font-bold tracking-[0.22em]',
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex flex-col select-none cursor-pointer group ${className}`}
    >
      <div className="flex items-center">
        <img
          src={logoSrc}
          alt="Desla!â„¢"
          className={`${heightClasses[size]} w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]`}
          loading="eager"
        />
      </div>

      {showTagline && (
        <span className={`text-[8px] sm:text-[8.5px] uppercase font-heading ${taglineColor[variant]} mt-0.5 tracking-[0.22em]`}>
          HEALTH BEFORE BEAUTY
        </span>
      )}
    </div>
  );
};

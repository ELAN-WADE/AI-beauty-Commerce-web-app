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
    sm: 'h-6',
    md: 'h-7 sm:h-8',
    lg: 'h-10 sm:h-11',
    xl: 'h-12 sm:h-14',
  };

  const logoSrc = {
    dark: '/desla_logo_dark.svg',
    white: '/desla_logo_white.svg',
    gold: '/desla_logo_gold.svg',
  }[variant];

  const taglineColor = {
    gold: 'text-[#B89248]',
    white: 'text-white/75',
    dark: 'text-[#111111] font-medium tracking-[0.2em]',
  };

  const content = (
    <>
      <img
        src={logoSrc}
        alt="Desla!"
        className={`${heightClasses[size]} w-auto block object-contain transition-opacity duration-200 group-hover:opacity-85`}
        loading="eager"
        decoding="async"
      />
      {showTagline && (
        <span className={`text-[8px] sm:text-[8.5px] uppercase font-heading ${taglineColor[variant]} mt-0.5`}>
          HEALTH BEFORE BEAUTY
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Desla! Homepage"
        className={`inline-flex flex-col items-start select-none cursor-pointer group bg-transparent border-0 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89248] focus-visible:ring-offset-2 rounded-sm ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`inline-flex flex-col items-start select-none group ${className}`}>
      {content}
    </div>
  );
};

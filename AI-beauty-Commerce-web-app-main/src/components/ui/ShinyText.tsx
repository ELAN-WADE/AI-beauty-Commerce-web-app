import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  shineColor?: string;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 3.5,
  className = '',
  shineColor = 'rgba(255, 255, 255, 0.85)'
}) => {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`inline-block bg-clip-text text-transparent select-none ${
        disabled ? '' : 'animate-shiny-text'
      } ${className}`}
      style={{
        backgroundImage: `linear-gradient(120deg, rgba(212, 175, 55, 0.15) 30%, ${shineColor} 50%, rgba(212, 175, 55, 0.15) 70%)`,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        animationDuration,
      }}
    >
      {text}
    </span>
  );
};

export default ShinyText;

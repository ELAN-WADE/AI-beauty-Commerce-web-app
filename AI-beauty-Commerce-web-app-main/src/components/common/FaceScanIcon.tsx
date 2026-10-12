import React from 'react';

interface FaceScanIconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export const FaceScanIcon: React.FC<FaceScanIconProps> = ({
  size = 16,
  className = '',
  strokeWidth = 1.75
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 4 Precise Biometric Corner Brackets */}
      <path
        d="M3.75 7.5V5.25C3.75 4.42157 4.42157 3.75 5.25 3.75H7.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 3.75H18.75C19.5784 3.75 20.25 4.42157 20.25 5.25V7.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.25 16.5V18.75C20.25 19.5784 19.5784 20.25 18.75 20.25H16.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 20.25H5.25C4.42157 20.25 3.75 19.5784 3.75 18.75V16.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Refined Facial Oval Silhouette */}
      <path
        d="M8.75 10C8.75 8.20507 10.2051 6.75 12 6.75C13.7949 6.75 15.25 8.20507 15.25 10V13.25C15.25 15.0449 13.7949 16.5 12 16.5C10.2051 16.5 8.75 15.0449 8.75 13.25V10Z"
        stroke="currentColor"
        strokeWidth={strokeWidth * 0.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* High-Precision Horizontal Skin Analysis Grid Line */}
      <line
        x1="7"
        y1="11.5"
        x2="17"
        y2="11.5"
        stroke="currentColor"
        strokeWidth={strokeWidth * 0.75}
        strokeLinecap="round"
        strokeDasharray="1.75 1.75"
      />
    </svg>
  );
};

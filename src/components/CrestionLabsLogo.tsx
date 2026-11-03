import React from "react";
import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Crestion Labs emblem logo.
 */
export const CrestionLabsLogo: React.FC<LogoProps> = ({ className = "", size = 28 }) => {
  return (
    <Image
      src="/crestion-logo.png"
      alt="Crestion Labs"
      width={size}
      height={size}
      priority
      className={`shrink-0 rounded-full object-contain transition-transform duration-300 group-hover:scale-105 ${className}`}
    />
  );
};

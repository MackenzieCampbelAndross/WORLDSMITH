import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Original Crestion Labs geometric symbol.
 * Inspired by architectural drafting coordinate benchmarks, isometric plane intersections,
 * and the act of constructing digital worlds from foundational axes.
 */
export const CrestionLabsLogo: React.FC<LogoProps> = ({ className = "", size = 28 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-300 group-hover:scale-105 ${className}`}
      aria-label="Crestion Labs symbol"
    >
      {/* Outer subtle alignment boundary */}
      <rect
        x="3"
        y="3"
        width="30"
        height="30"
        stroke="#a8cebc"
        strokeWidth="1"
        strokeOpacity="0.4"
        strokeDasharray="2 2"
      />
      {/* Precision corner marks */}
      <line x1="3" y1="9" x2="3" y2="3" stroke="#d0e5d3" strokeWidth="1.25" />
      <line x1="3" y1="3" x2="9" y2="3" stroke="#d0e5d3" strokeWidth="1.25" />
      <line x1="33" y1="9" x2="33" y2="3" stroke="#d0e5d3" strokeWidth="1.25" />
      <line x1="33" y1="3" x2="27" y2="3" stroke="#d0e5d3" strokeWidth="1.25" />
      <line x1="3" y1="27" x2="3" y2="33" stroke="#d0e5d3" strokeWidth="1.25" />
      <line x1="3" y1="33" x2="9" y2="33" stroke="#d0e5d3" strokeWidth="1.25" />
      <line x1="33" y1="27" x2="33" y2="33" stroke="#d0e5d3" strokeWidth="1.25" />
      <line x1="33" y1="33" x2="27" y2="33" stroke="#d0e5d3" strokeWidth="1.25" />

      {/* Primary geometric architectural form - interlocking structural planes */}
      <polygon
        points="18,6 29,12 29,24 18,30 7,24 7,12"
        stroke="#f0f1e6"
        strokeWidth="1.4"
        fill="rgba(240, 241, 230, 0.05)"
      />
      
      {/* Isometric axis cross lines */}
      <line x1="18" y1="18" x2="18" y2="6" stroke="#d0e5d3" strokeWidth="1.2" />
      <line x1="18" y1="18" x2="29" y2="24" stroke="#d0e5d3" strokeWidth="1.2" />
      <line x1="18" y1="18" x2="7" y2="24" stroke="#d0e5d3" strokeWidth="1.2" />

      {/* Central world benchmark core */}
      <circle cx="18" cy="18" r="2.5" fill="#f0f1e6" />
      <circle cx="18" cy="18" r="4.5" stroke="#a8cebc" strokeWidth="0.8" opacity="0.6" />
    </svg>
  );
};

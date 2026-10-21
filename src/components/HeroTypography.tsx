"use client";

import React from "react";

interface HeroTypographyProps {
  onExploreClick?: () => void;
  onContactClick?: () => void;
}

export const HeroTypography: React.FC<HeroTypographyProps> = ({
  onExploreClick,
  onContactClick,
}) => {
  return (
    <div className="relative z-20 w-full px-6 sm:px-10 lg:px-14 pb-12 sm:pb-10 lg:pb-12 pt-4 flex flex-col justify-end pointer-events-none font-body">
      {/* Main Grid: Space Grotesk Bold Architectural Headline on Left, Manrope Copy & Action Links on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-10 items-end">
        {/* Left Column: Monumental Headline (Space Grotesk 700 with Instrument Serif editorial italic contrast on "built") */}
        <div className="lg:col-span-8 pointer-events-auto">
          <h1 className="font-display font-bold text-[#f0f1e6] text-[clamp(2.4rem,6.6vw,5.85rem)] leading-[0.98] tracking-[-0.035em] max-w-4xl select-text">
            A world before <br />
            it’s <span className="font-accent italic font-normal tracking-tight text-[#d0e5d3]">built.</span>
          </h1>
        </div>

        {/* Right Column: Supporting editorial copy (Manrope) & minimal action text links */}
        <div className="lg:col-span-4 flex flex-col justify-end space-y-4 sm:space-y-6 lg:pb-1 pointer-events-auto pl-1 sm:pl-0">
          <p className="font-body text-xs sm:text-sm lg:text-[15px] leading-[1.68] text-[#f0f1e6]/85 font-normal max-w-md tracking-[-0.01em]">
            We transform architectural plans, renders and project assets into interactive
            places buyers can explore before they visit.
          </p>

          {/* Minimal Text Action Links (No borders, boxes, pills, or button containers) */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-7 pt-1 font-body text-xs font-semibold tracking-[0.14em] text-[#a8cebc]">
            <button
              type="button"
              onClick={onExploreClick}
              className="relative py-1 text-[#a8cebc] hover:text-[#f0f1e6] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f0f1e6] group"
              aria-label="Explore systems"
            >
              <span>EXPLORE SYSTEMS</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#d0e5d3] transition-all duration-300 group-hover:w-full" />
            </button>

            <button
              type="button"
              onClick={onContactClick}
              className="relative py-1 text-[#a8cebc] hover:text-[#f0f1e6] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f0f1e6] group"
              aria-label="For developers"
            >
              <span>FOR DEVELOPERS</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#d0e5d3] transition-all duration-300 group-hover:w-full" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

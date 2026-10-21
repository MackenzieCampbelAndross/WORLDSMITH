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
    <div className="relative z-20 w-full px-6 sm:px-10 lg:px-14 pb-8 sm:pb-10 lg:pb-12 pt-4 flex flex-col justify-end pointer-events-none">
      {/* Eyebrow Tag */}
      <div className="mb-2 sm:mb-3 pointer-events-auto">
        <span className="inline-block text-[10px] sm:text-xs font-mono tracking-[0.22em] uppercase text-[#a8cebc] opacity-90 border-b border-[#a8cebc]/30 pb-0.5">
          Digital Worlds for Real Estate
        </span>
      </div>

      {/* Main Grid: Monumental Editorial Headline on Left, Supporting Copy on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-end">
        {/* Left Column: Monumental Headline */}
        <div className="lg:col-span-8 pointer-events-auto">
          <h1 className="font-serif font-light text-[#f0f1e6] text-[clamp(2.35rem,6.2vw,5.75rem)] leading-[0.95] tracking-[-0.025em] max-w-4xl select-text">
            A world before <br />
            it’s built.
          </h1>
        </div>

        {/* Right Column: Supporting editorial copy & interactive anchor */}
        <div className="lg:col-span-4 flex flex-col justify-end space-y-4 lg:pb-1.5 pointer-events-auto">
          <p className="font-sans text-xs sm:text-sm lg:text-base leading-[1.6] text-[#f0f1e6]/80 font-normal max-w-md">
            We transform architectural plans, renders and project assets into interactive
            places buyers can explore before they visit.
          </p>

          <div className="flex flex-wrap items-center gap-4 sm:gap-5 pt-1 text-xs font-mono tracking-[0.15em] text-[#a8cebc]">
            <button
              type="button"
              onClick={onExploreClick}
              className="group inline-flex items-center gap-2 hover:text-[#f0f1e6] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f0f1e6] py-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#d0e5d3] group-hover:scale-125 transition-transform duration-200" />
              <span>EXPLORE SYSTEMS</span>
            </button>
            <span className="text-[#a8cebc]/40 hidden sm:inline">/</span>
            <button
              type="button"
              onClick={onContactClick}
              className="hover:text-[#f0f1e6] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f0f1e6] py-1"
            >
              FOR DEVELOPERS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

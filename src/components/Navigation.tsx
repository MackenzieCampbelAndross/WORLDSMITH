"use client";

import React, { useState } from "react";
import { WorldsmithLogo } from "./WorldsmithLogo";

interface NavigationProps {
  onContactClick?: () => void;
  onExploreClick?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  onContactClick,
  onExploreClick,
}) => {
  const [activeItem, setActiveItem] = useState<string | null>(null);

  return (
    <header className="relative z-30 w-full pt-6 md:pt-8 px-6 sm:px-10 lg:px-14 flex items-center justify-between pointer-events-auto">
      {/* Brand Identity: Symbol + Editorial Wordmark */}
      <a
        href="#"
        className="group flex items-center gap-3.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f0f1e6] rounded-sm py-1"
        aria-label="Worldsmith Homepage"
      >
        <WorldsmithLogo size={26} className="text-[#f0f1e6]" />
        <div className="flex flex-col">
          <span className="font-serif tracking-[0.14em] text-lg sm:text-xl font-light text-[#f0f1e6] uppercase leading-none">
            Worldsmith
          </span>
          <span className="text-[8px] tracking-[0.25em] text-[#a8cebc] uppercase font-mono mt-0.5 opacity-80">
            Spatial Intelligence
          </span>
        </div>
      </a>

      {/* Navigation Links & Action Pill */}
      <nav aria-label="Main Navigation" className="flex items-center gap-4 sm:gap-7 md:gap-10">
        <ul className="hidden sm:flex items-center gap-6 md:gap-9 text-xs tracking-[0.12em] font-mono text-[#a8cebc]">
          <li>
            <a
              href="#work"
              onClick={(e) => {
                e.preventDefault();
                if (onExploreClick) onExploreClick();
              }}
              onMouseEnter={() => setActiveItem("work")}
              onMouseLeave={() => setActiveItem(null)}
              className="relative py-1 transition-colors duration-200 hover:text-[#f0f1e6] focus-visible:outline-none focus-visible:text-[#f0f1e6]"
            >
              Work
              {activeItem === "work" && (
                <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-[#d0e5d3]" />
              )}
            </a>
          </li>
          <li>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                if (onExploreClick) onExploreClick();
              }}
              onMouseEnter={() => setActiveItem("how")}
              onMouseLeave={() => setActiveItem(null)}
              className="relative py-1 transition-colors duration-200 hover:text-[#f0f1e6] focus-visible:outline-none focus-visible:text-[#f0f1e6]"
            >
              How it works
              {activeItem === "how" && (
                <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-[#d0e5d3]" />
              )}
            </a>
          </li>
          <li>
            <a
              href="#developers"
              onClick={(e) => {
                e.preventDefault();
                if (onContactClick) onContactClick();
              }}
              onMouseEnter={() => setActiveItem("developers")}
              onMouseLeave={() => setActiveItem(null)}
              className="relative py-1 transition-colors duration-200 hover:text-[#f0f1e6] focus-visible:outline-none focus-visible:text-[#f0f1e6]"
            >
              For developers
              {activeItem === "developers" && (
                <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-[#d0e5d3]" />
              )}
            </a>
          </li>
        </ul>

        {/* Compact Charcoal Pill Contact Button - Matching Reference Frame Exactly */}
        <button
          type="button"
          onClick={onContactClick}
          aria-label="Contact Worldsmith"
          className="group relative inline-flex items-center justify-center px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#25231b] text-[#f0f1e6] text-xs font-mono tracking-wider border border-[#444238]/60 hover:border-[#a8cebc]/50 hover:bg-[#1a1813] transition-all duration-300 shadow-sm hover:shadow active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d0e5d3]"
        >
          <span className="relative flex items-center gap-2">
            <span>Contact</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#a8cebc] group-hover:bg-[#d0e5d3] transition-colors duration-200" />
          </span>
        </button>
      </nav>
    </header>
  );
};

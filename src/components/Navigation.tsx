"use client";

import React, { useState } from "react";

interface NavigationProps {
  onContactClick?: () => void;
  onExploreClick?: () => void;
  theme?: "dark" | "light";
  glass?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  onContactClick,
  onExploreClick,
  theme = "dark",
  glass = false,
}) => {
  const [activeItem, setActiveItem] = useState<string | null>(null);

  const isLight = theme === "light";
  const glassSurface = isLight
    ? `border-[#1f6651]/10 ${glass ? "bg-[#f4f2e8]/45" : "bg-[#f4f2e8]/35"}`
    : `border-[#f0f1e6]/10 ${glass ? "bg-[#081c14]/30" : "bg-[#081c14]/22"}`;

  return (
    <header
      className={`pointer-events-auto relative z-40 flex h-[68px] w-full items-center border-b px-6 font-body backdrop-blur-[16px] backdrop-saturate-[1.2] transition-colors duration-500 sm:px-10 md:h-[76px] lg:px-14 ${glassSurface}`}
    >
      <div className="flex w-full items-center justify-between">
      {/* Brand Identity: Clean Wordmark Only (Space Grotesk 700) */}
      <a
        href="#"
        className={`group flex items-center focus-visible:outline-none focus-visible:ring-1 rounded-sm py-1 transition-colors duration-500 ${
          isLight ? "focus-visible:ring-[#1f6651]" : "focus-visible:ring-[#f0f1e6]"
        }`}
        aria-label="Worldsmith Homepage"
      >
        <span
          className={`font-display tracking-[0.16em] text-lg sm:text-xl font-bold uppercase leading-none select-none transition-colors duration-500 ${
            isLight ? "text-[#1f6651]" : "text-[#f0f1e6]"
          }`}
        >
          WORLDSMITH
        </span>
      </a>

      {/* Navigation Links & Action Pill (Manrope) */}
      <nav aria-label="Main Navigation" className="flex items-center gap-4 sm:gap-7 md:gap-10">
        <ul
          className={`hidden sm:flex items-center gap-6 sm:gap-8 text-xs tracking-[0.12em] font-medium transition-colors duration-500 ${
            isLight ? "text-[#1f6651]/75" : "text-[#a8cebc]"
          }`}
        >
          <li>
            <a
              href="#hero"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onMouseEnter={() => setActiveItem("hero")}
              onMouseLeave={() => setActiveItem(null)}
              className={`relative py-1 transition-colors duration-200 focus-visible:outline-none ${
                isLight
                  ? "hover:text-[#1f6651] focus-visible:text-[#1f6651]"
                  : "hover:text-[#f0f1e6] focus-visible:text-[#f0f1e6]"
              }`}
            >
              Architectural World
              {activeItem === "hero" && (
                <span
                  className={`absolute -bottom-1 left-0 w-full h-[1px] transition-colors duration-300 ${
                    isLight ? "bg-[#1f6651]" : "bg-[#d0e5d3]"
                  }`}
                />
              )}
            </a>
          </li>
          <li>
            <a
              href="#manifesto-panel"
              onClick={(e) => {
                e.preventDefault();
                if (onExploreClick) onExploreClick();
              }}
              onMouseEnter={() => setActiveItem("manifesto")}
              onMouseLeave={() => setActiveItem(null)}
              className={`relative py-1 transition-colors duration-200 focus-visible:outline-none ${
                isLight
                  ? "hover:text-[#1f6651] focus-visible:text-[#1f6651]"
                  : "hover:text-[#f0f1e6] focus-visible:text-[#f0f1e6]"
              }`}
            >
              Philosophy
              {activeItem === "manifesto" && (
                <span
                  className={`absolute -bottom-1 left-0 w-full h-[1px] transition-colors duration-300 ${
                    isLight ? "bg-[#1f6651]" : "bg-[#d0e5d3]"
                  }`}
                />
              )}
            </a>
          </li>
        </ul>

        {/* Compact Charcoal Pill Contact Button */}
        <button
          type="button"
          onClick={onContactClick}
          aria-label="Contact Worldsmith"
          className="group relative inline-flex items-center justify-center px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#25231b] text-[#f0f1e6] text-xs font-semibold tracking-wider border border-[#444238]/60 hover:border-[#a8cebc]/50 hover:bg-[#1a1813] transition-all duration-300 shadow-sm hover:shadow active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d0e5d3]"
        >
          <span className="relative flex items-center gap-2">
            <span>Contact</span>
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                isLight ? "bg-[#1f6651] group-hover:bg-[#d0e5d3]" : "bg-[#a8cebc] group-hover:bg-[#d0e5d3]"
              }`}
            />
          </span>
        </button>
      </nav>
      </div>
    </header>
  );
};

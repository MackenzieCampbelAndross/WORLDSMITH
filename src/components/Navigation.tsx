"use client";

import React from "react";

interface NavigationProps {
  onContactClick?: () => void;
  theme?: "dark" | "light";
  visible?: boolean;
  wordmarkSplit?: number | null;
}

export const Navigation: React.FC<NavigationProps> = ({
  onContactClick,
  theme = "dark",
  visible = true,
  wordmarkSplit = null,
}) => {
  const isLight = theme === "light";
  const revealClasses = `fixed z-40 transition-[opacity,transform] duration-1000 ease-out ${
    visible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
  }`;

  return (
    <>
      <div
        aria-hidden={!visible}
        inert={!visible}
        className={`${revealClasses} left-6 top-6 sm:left-10 md:top-7 lg:left-14`}
      >
        <a
          href="#"
          onClick={(event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`pointer-events-auto inline-flex rounded-sm py-1 font-body transition-colors duration-300 focus-visible:outline-none focus-visible:ring-1 ${
            isLight ? "focus-visible:ring-[#1f6651]" : "focus-visible:ring-[#f0f1e6]"
          }`}
          aria-label="WorldSmith Homepage"
        >
          <span className="relative inline-block select-none font-display text-lg font-bold uppercase leading-none tracking-[0.16em] sm:text-xl">
            <span
              id="wordmark"
              className={`block ${
                isLight && wordmarkSplit === null ? "text-[#1f6651]" : "text-[#f0f1e6]"
              }`}
            >
              WORLDSMITH
            </span>
            {wordmarkSplit !== null && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 block text-[#1f6651]"
                style={{ clipPath: `inset(${wordmarkSplit}px 0 0 0)` }}
              >
                WORLDSMITH
              </span>
            )}
          </span>
        </a>
      </div>

      <div
        aria-hidden={!visible}
        inert={!visible}
        className={`${revealClasses} right-6 top-4 sm:right-10 lg:right-14`}
      >
        <button
          type="button"
          onClick={onContactClick}
          aria-label="Contact WorldSmith"
          className="pointer-events-auto group relative inline-flex items-center justify-center rounded-full border border-[#444238]/60 bg-[#25231b] px-5 py-2 text-xs font-semibold tracking-wider text-[#f0f1e6] shadow-sm transition-all duration-300 hover:border-[#a8cebc]/50 hover:bg-[#1a1813] hover:shadow active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d0e5d3] sm:px-6 sm:py-2.5"
        >
          <span className="relative flex items-center gap-2">
            <span>Contact</span>
            <span
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${
                isLight ? "bg-[#1f6651] group-hover:bg-[#d0e5d3]" : "bg-[#a8cebc] group-hover:bg-[#d0e5d3]"
              }`}
            />
          </span>
        </button>
      </div>
    </>
  );
};

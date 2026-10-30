"use client";

import React from "react";

interface NavigationProps {
  onContactClick?: () => void;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  signedIn?: boolean;
  theme?: "dark" | "light";
  visible?: boolean;
  wordmarkSplit?: number | null;
}

export const Navigation: React.FC<NavigationProps> = ({
  onContactClick,
  onLoginClick,
  onLogoutClick,
  signedIn = false,
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
          aria-label="Crestion Labs Homepage"
        >
          <span className="relative inline-block select-none font-cormorant text-[20px] font-medium uppercase leading-none tracking-[0.16em] sm:text-[22px]">
            <span
              id="wordmark"
              className={`block ${
                isLight && wordmarkSplit === null ? "text-[#1f6651]" : "text-[#f0f1e6]"
              }`}
            >
              CRESTION LABS
            </span>
            {wordmarkSplit !== null && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 block text-[#1f6651]"
                style={{ clipPath: `inset(${wordmarkSplit}px 0 0 0)` }}
              >
                CRESTION LABS
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
        <div className="pointer-events-auto flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={signedIn ? onLogoutClick : onLoginClick}
            aria-label={signedIn ? "Log out of Crestion Labs" : "Log in to Crestion Labs"}
            className={`inline-flex cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white px-3 py-1.5 font-display text-[9px] font-semibold uppercase tracking-[0.16em] text-[#0b0b0a] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-2px_0_rgba(0,0,0,0.10),0_1px_1px_rgba(0,0,0,0.12)] transition-all duration-300 hover:border-black/25 hover:bg-[#f3f1ea] active:translate-y-px active:duration-75 active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.55),0_1px_0_rgba(255,255,255,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6651] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ecece2] sm:px-4 sm:py-2 sm:text-[10px]`}
          >
            {signedIn ? "Log out" : "Login"}
          </button>
          <button
            type="button"
            onClick={onContactClick}
            aria-label="Contact Crestion Labs"
            className="group relative inline-flex cursor-pointer items-center justify-center rounded-full border border-black bg-black px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-2px_0_rgba(0,0,0,0.5),0_1px_1px_rgba(0,0,0,0.25)] transition-all duration-300 hover:border-[#1f5e44] hover:bg-[#1f5e44] active:translate-y-px active:duration-75 active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08),0_1px_0_rgba(255,255,255,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:px-5 sm:py-2.5 sm:text-[11px]"
          >
            <span className="relative flex items-center gap-2">
              <span>Contact Now</span>
              <span className="h-1.5 w-1.5 rounded-full bg-white transition-colors duration-200 group-hover:bg-white" />
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

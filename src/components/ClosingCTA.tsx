"use client";

import React from "react";

interface ClosingCTAProps {
  onStartProject: () => void;
  onExploreExperience: () => void;
}

export const ClosingCTA: React.FC<ClosingCTAProps> = ({
  onStartProject,
  onExploreExperience,
}) => {
  const currentYear = 2026;

  return (
    <section
      id="closing-section"
      className="relative z-20 w-full bg-[#184834] text-[#f0f1e6] pt-28 sm:pt-36 lg:pt-44 pb-12 px-6 sm:px-10 lg:px-14 border-t border-[#a8cebc]/20 flex flex-col justify-between overflow-hidden font-body"
    >
      {/* Subtle architectural datum grid background */}
      <div className="pointer-events-none absolute inset-0 z-0 grid-lines opacity-60" aria-hidden="true" />

      {/* Decorative architectural datum corner benchmarks */}
      <div className="pointer-events-none absolute top-12 left-10 text-[9px] font-mono tracking-widest text-[#a8cebc]/40">
        [WORLDSMITH // STUDIO FINALE // REF-2026]
      </div>
      <div className="pointer-events-none absolute top-12 right-10 text-[9px] font-mono tracking-widest text-[#a8cebc]/40">
        LAT 51.5074° N // LON 0.1278° W
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col justify-between flex-1 gap-20">
        
        {/* Main Editorial Conclusion Invitation */}
        <div className="max-w-4xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d0e5d3]" aria-hidden="true" />
            <span className="font-display text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] text-[#a8cebc] uppercase">
              Spatial Commissioning Studio
            </span>
          </div>

          <h2 className="text-4xl sm:text-6xl md:text-7xl font-display font-bold text-[#f0f1e6] tracking-tight leading-[1.02] mb-6">
            Let’s build <br />
            your <span className="font-accent italic font-normal text-[#d0e5d3]">world.</span>
          </h2>

          <p className="font-body text-base sm:text-xl text-[#f0f1e6]/85 max-w-2xl leading-relaxed mb-10 font-normal">
            Bring us your next development. Let’s turn it into a place buyers can explore before they arrive.
          </p>

          {/* Dual Action CTAs */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-2">
            <button
              type="button"
              onClick={onStartProject}
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#f0f1e6] text-[#184834] text-xs sm:text-sm font-semibold tracking-wider hover:bg-[#d0e5d3] transition-all duration-300 shadow-lg active:scale-95"
            >
              <span>Start a project</span>
              <span className="group-hover:translate-x-1 transition-transform font-bold">→</span>
            </button>

            <button
              type="button"
              onClick={onExploreExperience}
              className="relative py-2 text-xs sm:text-sm font-semibold tracking-wider text-[#a8cebc] hover:text-[#f0f1e6] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f0f1e6] group"
            >
              <span>Explore the experience</span>
              <span className="absolute bottom-1 left-0 w-0 h-[1px] bg-[#d0e5d3] transition-all duration-300 group-hover:w-full" />
            </button>
          </div>
        </div>

        {/* Integrated Architectural Studio Footer */}
        <footer className="pt-16 border-t border-[#a8cebc]/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 text-xs text-[#a8cebc]">
          {/* Brand Wordmark & Concise Statement */}
          <div className="space-y-2">
            <span className="font-display tracking-[0.16em] text-lg font-bold text-[#f0f1e6] uppercase block">
              WORLDSMITH
            </span>
            <p className="text-[11px] text-[#a8cebc]/80 max-w-sm leading-relaxed">
              Transforming architectural blueprints, masterplans and renders into interactive spatial property experiences.
            </p>
          </div>

          {/* Working Links & Year */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10">
            <ul className="flex items-center gap-6 text-[11px] font-medium tracking-wider uppercase">
              <li>
                <button
                  type="button"
                  onClick={onExploreExperience}
                  className="hover:text-[#f0f1e6] transition-colors"
                >
                  Experience
                </button>
              </li>
              <li>
                <a href="#plan-to-place" className="hover:text-[#f0f1e6] transition-colors">
                  Methodology
                </a>
              </li>
              <li>
                <a href="#use-cases" className="hover:text-[#f0f1e6] transition-colors">
                  Applications
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onStartProject}
                  className="text-[#d0e5d3] hover:text-[#f0f1e6] font-semibold transition-colors"
                >
                  Inquire
                </button>
              </li>
            </ul>

            <div className="text-[11px] font-mono text-[#a8cebc]/60">
              © {currentYear} WORLDSMITH STUDIO. ALL RIGHTS RESERVED.
            </div>
          </div>
        </footer>

      </div>
    </section>
  );
};

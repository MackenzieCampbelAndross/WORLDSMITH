"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { CurtainReveal } from "@/components/CurtainReveal";
import { ArchitecturalSchematic } from "@/components/ArchitecturalSchematic";
import { HeroTypography } from "@/components/HeroTypography";
import { ContactModal } from "@/components/ContactModal";

export default function Home() {
  const [stage, setStage] = useState<number>(0);
  const [pointerOffset, setPointerOffset] = useState({ x: 0, y: 0 });
  const [contactOpen, setContactOpen] = useState(false);

  // Opening animation orchestration timeline matching the reference video:
  // 0ms: Curtain columns drop
  // 1600ms: Curtain complete, schematic lines drawing & active
  // 3200ms: Headline appears
  // 4400ms: Supporting text & navigation settle into place
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1600); // schematic unfolds
    const t2 = setTimeout(() => setStage(2), 3200); // headline enters
    const t3 = setTimeout(() => setStage(3), 4400); // nav & supporting copy fully settled

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Smooth pointer parallax movement for interactive spatial depth
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { clientWidth, clientHeight } = currentTarget;
    const normX = (clientX / clientWidth) * 2 - 1;
    const normY = (clientY / clientHeight) * 2 - 1;
    setPointerOffset({ x: normX, y: normY });
  }, []);

  const handleExploreClick = () => {
    const target = document.getElementById("work-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="relative w-full bg-[#1f5e44] text-[#f0f1e6] selection:bg-[#a8cebc] selection:text-[#171713]">
      {/* 1. Opening Curtain Wave Reveal (Exact recreation of Crosswalk intro) */}
      <CurtainReveal onComplete={() => setStage((prev) => Math.max(prev, 1))} />

      {/* 2. Paper grain texture overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-10 paper-grain opacity-90 mix-blend-soft-light"
        aria-hidden="true"
      />

      {/* 3. Subtle vertical architectural grid lines */}
      <div
        className="pointer-events-none fixed inset-0 z-0 grid-lines"
        aria-hidden="true"
      />

      {/* =========================================================================
          HERO SECTION: Strictly fills 100vh / 100svh
          Ensures navigation, schematic, headline, and supporting paragraph
          occupy the full opening viewport without premature section intrusion.
         ========================================================================= */}
      <section
        onPointerMove={handlePointerMove}
        className="relative w-full h-screen h-[100svh] min-h-[640px] flex flex-col justify-between overflow-hidden z-10"
      >
        {/* Navigation Bar (Top) */}
        <div
          className={`transition-all duration-1000 ease-out z-30 shrink-0 ${
            stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
          }`}
        >
          <Navigation
            onContactClick={() => setContactOpen(true)}
            onExploreClick={handleExploreClick}
          />
        </div>

        {/* Central Architectural Schematic Illustration */}
        <div
          className={`absolute inset-0 z-10 transition-opacity duration-1000 ease-out pointer-events-none ${
            stage >= 1 ? "opacity-100" : "opacity-0"
          }`}
        >
          <ArchitecturalSchematic pointerOffset={pointerOffset} />
        </div>

        {/* Hero Editorial Typography (Bottom: Eyebrow, Monumental Headline, Copy) */}
        <div
          className={`transition-all duration-1000 ease-out z-20 shrink-0 ${
            stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <HeroTypography
            onExploreClick={handleExploreClick}
            onContactClick={() => setContactOpen(true)}
          />
        </div>
      </section>

      {/* =========================================================================
          SECONDARY SECTION: "Selected Commissions"
          Begins strictly below the 100svh Hero viewport boundary.
         ========================================================================= */}
      <section
        id="work-section"
        className="relative z-20 w-full min-h-[50vh] bg-[#1a4f39] border-t border-[#a8cebc]/20 py-20 px-6 sm:px-10 lg:px-14 flex flex-col justify-center"
      >
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-[#a8cebc]/20 pb-6">
            <div>
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#a8cebc] uppercase block mb-2">
                Selected Commissions
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-light text-[#f0f1e6]">
                Interactive Spatial Prototypes
              </h2>
            </div>
            <p className="text-xs font-mono text-[#a8cebc]/80 mt-4 md:mt-0 max-w-sm">
              Explore live developmental web spaces engineered for prospective residential and commercial tenants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Aethelgard Precinct",
                type: "Civic & Cultural Quarter",
                specs: "140,000 SQ.M // 8 TOWERS",
                status: "Pre-construction Visualisation",
              },
              {
                title: "Solaris Atrium",
                type: "Biophilic Commercial Core",
                specs: "65,000 SQ.M // NET ZERO",
                status: "Active Interactive Model",
              },
              {
                title: "Caspian Ridge",
                type: "High-Altitude Masterplan",
                specs: "210 HECTARES // 120 VILLAS",
                status: "Spatial Immersion Engine",
              },
            ].map((proj, idx) => (
              <div
                key={idx}
                className="group p-6 rounded-md border border-[#a8cebc]/20 bg-[#164230]/60 hover:bg-[#143d2c] hover:border-[#d0e5d3]/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#a8cebc] mb-4">
                    <span>{`0${idx + 1}`}</span>
                    <span className="px-2 py-0.5 rounded bg-[#25231b] text-[#d0e5d3]">
                      {proj.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-normal text-[#f0f1e6] mb-1 group-hover:text-[#d0e5d3] transition-colors">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-[#a8cebc]/80 mb-6">{proj.type}</p>
                </div>
                <div className="border-t border-[#a8cebc]/15 pt-4 flex items-center justify-between text-[11px] font-mono text-[#a8cebc]">
                  <span>{proj.specs}</span>
                  <button
                    onClick={() => setContactOpen(true)}
                    className="text-[#f0f1e6] group-hover:translate-x-1 transition-transform"
                    aria-label={`Inquire about ${proj.title}`}
                  >
                    Brief →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Functional Developer Contact Modal */}
      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </main>
  );
}

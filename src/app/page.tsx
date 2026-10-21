"use client";

import React, { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { CurtainReveal } from "@/components/CurtainReveal";
import { ArchitecturalSchematic } from "@/components/ArchitecturalSchematic";
import { HeroTypography } from "@/components/HeroTypography";
import { ContactModal } from "@/components/ContactModal";

export default function Home() {
  const [stage, setStage] = useState<number>(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [navTheme, setNavTheme] = useState<"dark" | "light">("dark");
  const [slideProgress, setSlideProgress] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);

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

  // Scroll listener to calculate precise slide overlay progress (0 = fully below, 1 = fully covering hero)
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // The track height is container.offsetHeight - windowHeight
      const totalScrollableDistance = containerRef.current.offsetHeight - windowHeight;
      if (totalScrollableDistance <= 0) return;

      // Scrolled distance within this pinned container track:
      // When rect.top is 0, we just started scrolling. When rect.top = -totalScrollableDistance, overlay has fully settled.
      const scrolled = -rect.top;
      const progress = Math.min(Math.max(scrolled / totalScrollableDistance, 0), 1);
      setSlideProgress(progress);

      // When the ivory panel covers the top navigation area (e.g. progress >= 0.85), switch nav theme to light
      if (progress >= 0.82) {
        setNavTheme("light");
      } else {
        setNavTheme("dark");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleExploreClick = () => {
    if (!containerRef.current) return;
    const totalScrollableDistance = containerRef.current.offsetHeight - window.innerHeight;
    const targetScrollY = containerRef.current.offsetTop + totalScrollableDistance;
    window.scrollTo({
      top: targetScrollY,
      behavior: "smooth",
    });
  };

  // Convert progress (0 to 1) into vertical translateY percentage (100% down to 0%)
  const translateYPercent = (1 - slideProgress) * 100;

  return (
    <main className="relative w-full bg-[#1f5e44] text-[#f0f1e6] selection:bg-[#a8cebc] selection:text-[#171713] font-body">
      {/* 1. Opening Curtain Wave Reveal (Exact recreation of Crosswalk intro) */}
      <CurtainReveal onComplete={() => setStage((prev) => Math.max(prev, 1))} />

      {/* 2. Paper grain texture overlay (Global) */}
      <div
        className="pointer-events-none fixed inset-0 z-50 paper-grain opacity-80 mix-blend-soft-light"
        aria-hidden="true"
      />

      {/* 3. Fixed Persistent Navigation (Seamless across forest green hero & ivory editorial panel) */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-1000 ease-out pointer-events-none ${
          stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
        }`}
      >
        <Navigation
          theme={navTheme}
          onContactClick={() => setContactOpen(true)}
          onExploreClick={handleExploreClick}
        />
      </div>

      {/* =========================================================================
          HERO & SLIDING OVERLAY CONTAINER:
          Total height of 200vh provides a dedicated scroll track:
          - Hero stays pinned / fixed in the viewport (at top: 0, height: 100vh).
          - As user scrolls down, the ivory panel translates upward from 100% to 0%,
            behaving like an opaque whiteboard sliding upward and covering the stationary hero.
         ========================================================================= */}
      <div ref={containerRef} className="relative w-full h-[200vh]">
        {/* Pinned Viewport Stage (Sticky 100vh container) */}
        <div className="sticky top-0 w-full h-[100svh] min-h-[640px] overflow-hidden">
          
          {/* LAYER 1: Stationarily Pinned Forest Green Hero */}
          <section className="absolute inset-0 w-full h-full flex flex-col justify-between overflow-hidden z-10 bg-[#1f5e44]">
            {/* Subtle vertical architectural grid lines for hero */}
            <div
              className="pointer-events-none absolute inset-0 z-0 grid-lines"
              aria-hidden="true"
            />

            {/* Spacer for fixed navigation */}
            <div className="w-full h-20 md:h-24 shrink-0" aria-hidden="true" />

            {/* Central Architectural Schematic Illustration (Stationary, interactive architecture) */}
            <div
              className={`absolute inset-0 z-10 transition-opacity duration-1000 ease-out pointer-events-auto ${
                stage >= 1 ? "opacity-100" : "opacity-0"
              }`}
            >
              <ArchitecturalSchematic />
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

          {/* LAYER 2: Warm Ivory Overlay Panel
              Sliding upward like an opaque whiteboard over the stationary hero.
              Translates from translateY(100%) to translateY(0%) based on scroll progress. */}
          <div
            id="manifesto-panel"
            className="absolute inset-0 w-full h-full z-30 bg-[#ecece2] text-[#1f6651] shadow-[0_-25px_60px_rgba(0,0,0,0.25)] flex flex-col justify-between overflow-hidden will-change-transform"
            style={{
              transform: `translate3d(0, ${translateYPercent}%, 0)`,
            }}
          >
            {/* Ivory architectural grid datum lines */}
            <div
              className="pointer-events-none absolute inset-0 z-0 grid-lines-ivory"
              aria-hidden="true"
            />

            {/* Structured Content Container: Proper vertical spacing below fixed navigation */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pt-28 sm:pt-32 md:pt-36 pb-10 sm:pb-14 flex-1 flex flex-col justify-between">
              
              {/* Main Statement Container (Prominent, restrained, and elegant) */}
              <div className="max-w-5xl my-auto py-6 sm:py-8">
                <p className="font-body text-xl sm:text-2xl md:text-[2rem] lg:text-[2.35rem] font-normal leading-[1.32] md:leading-[1.28] tracking-[-0.022em] text-[#1f6651] text-left">
                  Worldsmith transforms architectural visions into navigable reality. We unite architects, 3D artists, and spatial software engineers to translate plans, blueprints, and master renderings into interactive environments buyers can explore long before groundbreaking. We believe digital worlds should elevate human imagination—allowing prospective occupants to walk the halls, observe natural light, and experience unbuilt spaces with profound clarity.
                </p>
              </div>

              {/* Bottom Information Row: Clear hierarchy, balanced column spacing, and vertical breathing room */}
              <div className="pt-8 sm:pt-10 border-t border-[#1f6651]/20 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-end">
                <div className="md:col-span-4 lg:col-span-4">
                  <span className="block font-display text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1f6651]/65 mb-2.5">
                    Core Capability
                  </span>
                  <p className="font-body text-xs sm:text-sm font-medium text-[#1f6651] leading-relaxed max-w-sm">
                    Precision axonometric modeling, real-time spatial simulation, and multi-platform digital sales engines.
                  </p>
                </div>

                <div className="md:col-span-4 lg:col-span-4">
                  <span className="block font-display text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1f6651]/65 mb-2.5">
                    Architectural Medium
                  </span>
                  <p className="font-body text-xs sm:text-sm font-medium text-[#1f6651] leading-relaxed max-w-sm">
                    Zero-install web technology engineered directly for high-resolution touch displays, mobile devices, and browser viewports.
                  </p>
                </div>

                <div className="md:col-span-4 lg:col-span-4 flex items-center md:justify-end pt-2 md:pt-0">
                  <button
                    type="button"
                    onClick={() => setContactOpen(true)}
                    className="group inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#1f6651] text-[#f0f1e6] text-xs font-semibold tracking-wider hover:bg-[#184834] transition-all duration-300 shadow-sm hover:shadow active:scale-95"
                  >
                    <span>Engage the Studio</span>
                    <span className="group-hover:translate-x-0.5 transition-transform font-bold">→</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SELECTED COMMISSIONS SECTION (Flows naturally once the overlay has covered the hero)
         ========================================================================= */}
      <section
        id="work-section"
        className="relative z-30 w-full min-h-[50vh] bg-[#1a4f39] border-t border-[#a8cebc]/20 py-24 px-6 sm:px-10 lg:px-14 flex flex-col justify-center"
      >
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-[#a8cebc]/20 pb-6">
            <div>
              <span className="text-[11px] font-semibold tracking-[0.22em] text-[#a8cebc] uppercase block mb-2">
                Selected Commissions
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#f0f1e6] tracking-tight">
                Interactive Spatial Prototypes
              </h2>
            </div>
            <p className="text-xs font-normal text-[#a8cebc]/85 mt-4 md:mt-0 max-w-sm leading-relaxed">
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
                  <div className="flex items-center justify-between text-[11px] font-medium text-[#a8cebc] mb-4">
                    <span>{`0${idx + 1}`}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#25231b] text-[#d0e5d3] text-[10px] font-semibold tracking-wider">
                      {proj.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-display font-semibold text-[#f0f1e6] mb-1 group-hover:text-[#d0e5d3] transition-colors tracking-tight">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-[#a8cebc]/85 mb-6 font-normal">{proj.type}</p>
                </div>
                <div className="border-t border-[#a8cebc]/15 pt-4 flex items-center justify-between text-[11px] font-semibold tracking-wide text-[#a8cebc]">
                  <span>{proj.specs}</span>
                  <button
                    onClick={() => setContactOpen(true)}
                    className="text-[#f0f1e6] group-hover:translate-x-1 transition-transform font-medium"
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

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
  const [overlayProgress, setOverlayProgress] = useState<number>(0);

  const transitionTrackRef = useRef<HTMLDivElement>(null);

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

  // Scroll listener to calculate overlay sliding progress and dynamic navigation contrast
  useEffect(() => {
    const handleScroll = () => {
      // 1. Calculate overlay progress across the 200vh transition track
      if (transitionTrackRef.current) {
        const rect = transitionTrackRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const totalDistance = transitionTrackRef.current.offsetHeight - windowHeight;
        if (totalDistance > 0) {
          const scrolled = -rect.top;
          const progress = Math.min(Math.max(scrolled / totalDistance, 0), 1);
          setOverlayProgress(progress);
        }
      }

      // 2. Check which section intersects the top navbar zone (approx y=80px)
      const manifestoEl = document.getElementById("manifesto-panel");

      if (manifestoEl) {
        const r = manifestoEl.getBoundingClientRect();
        const isOverLight = r.top <= 80 && r.bottom >= 60;
        setNavTheme(isOverLight ? "light" : "dark");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleExploreClick = () => {
    if (transitionTrackRef.current) {
      const windowHeight = window.innerHeight;
      const totalDistance = transitionTrackRef.current.offsetHeight - windowHeight;
      const targetY = transitionTrackRef.current.offsetTop + totalDistance;
      window.scrollTo({
        top: targetY,
        behavior: "smooth",
      });
    }
  };

  return (
    <main className="relative w-full bg-[#ecece2] text-[#f0f1e6] selection:bg-[#a8cebc] selection:text-[#171713] font-body overflow-x-hidden">
      {/* 1. Opening Curtain Wave Reveal (Exact recreation of Crosswalk intro) */}
      <CurtainReveal onComplete={() => setStage((prev) => Math.max(prev, 1))} />

      {/* 2. Fixed Persistent Navigation (Seamless across Hero & Section 02 with dynamic theme) */}
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
          TRANSITION STAGE: HERO & UPWARD SLIDING IVORY OVERLAY
          A dedicated 200vh track:
          - Pinned Viewport Stage (`sticky top-0 h-[100svh]`):
            Contains the stationary green Hero (bottom layer, z-10).
          - Section 02 Ivory Panel (top layer, z-30):
            Begins at translateY(100%) (completely below viewport) and translates
            upward to translateY(0%) (completely covering hero) as user scrolls.
          - Hero remains completely stationary throughout the transition.
          - Once progress reaches 100%, the ivory panel completely fills the viewport.
         ========================================================================= */}
      <div ref={transitionTrackRef} className="relative w-full h-[200vh]">
        {/* Pinned Viewport Container */}
        <div className="sticky top-0 w-full h-[100svh] min-h-[640px] overflow-hidden">
          
          {/* SECTION 01: Pinned Stationary Green Hero (z-10) */}
          <section className="absolute inset-0 w-full h-full flex flex-col justify-between overflow-hidden z-10 bg-[#1f5e44]">
            {/* Subtle paper grain texture scoped exclusively to Hero */}
            <div
              className="pointer-events-none absolute inset-0 z-0 paper-grain opacity-80 mix-blend-soft-light"
              aria-hidden="true"
            />

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

            {/* Hero Editorial Typography (Bottom: Monumental Headline, Copy) */}
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

          {/* SECTION 02: Warm Ivory Philosophy Overlay Panel (z-30)
              Opaque whiteboard sliding smoothly upward from bottom of screen over the hero. */}
          <section
            id="manifesto-panel"
            className="absolute inset-0 w-full h-full z-30 bg-[#ecece2] text-[#1f6651] flex flex-col justify-between overflow-hidden will-change-transform"
            style={{
              transform: `translate3d(0, ${(1 - overlayProgress) * 100}%, 0)`,
            }}
          >

            {/* Structured Content Container: Proper vertical spacing below fixed navigation */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pt-28 sm:pt-32 md:pt-36 pb-12 sm:pb-16 flex-1 flex flex-col justify-between min-h-[calc(100svh-4rem)]">
              
              {/* Main Statement Container (Prominent, restrained, and elegant) */}
              <div className="max-w-5xl my-auto py-8 sm:py-12">
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
          </section>
        </div>
      </div>

      {/* Persistent Developer Project Inquiry Dialog */}
      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </main>
  );
}

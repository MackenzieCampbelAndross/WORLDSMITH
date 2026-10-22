"use client";

import React, { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { CurtainReveal } from "@/components/CurtainReveal";
import { ArchitecturalSchematic } from "@/components/ArchitecturalSchematic";
import { HeroTypography } from "@/components/HeroTypography";
import { ContactModal } from "@/components/ContactModal";
import { Section03Showcase } from "@/components/Section03Showcase";
import { Section04HomeTour } from "@/components/Section04HomeTour";
import { FinalCta } from "@/components/FinalCta";

const WORDMARK_PROBE_Y = 24;

export default function Home() {
  const [stage, setStage] = useState<number>(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [navTheme, setNavTheme] = useState<"dark" | "light">("dark");
  const [wordmarkSplit, setWordmarkSplit] = useState<number | null>(null);
  const [overlayProgress, setOverlayProgress] = useState<number>(0);

  const transitionTrackRef = useRef<HTMLDivElement>(null);
  const pinnedStageRef = useRef<HTMLDivElement>(null);

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

  // Scroll listener to calculate the ivory overlay progress and wordmark contrast.
  useEffect(() => {
    const handleScroll = () => {
      let scrollProgress = 0;
      if (transitionTrackRef.current && pinnedStageRef.current) {
        const rect = transitionTrackRef.current.getBoundingClientRect();
        const totalDistance =
          transitionTrackRef.current.offsetHeight - pinnedStageRef.current.offsetHeight;
        if (totalDistance > 0) {
          const scrolled = -rect.top;
          scrollProgress = Math.min(Math.max(scrolled / totalDistance, 0), 1);
          setOverlayProgress(scrollProgress);
        }

        const stageRect = pinnedStageRef.current.getBoundingClientRect();
        const panelTop = stageRect.top + (1 - scrollProgress) * stageRect.height;
        const stageCoversWordmark =
          stageRect.top <= WORDMARK_PROBE_Y && stageRect.bottom >= WORDMARK_PROBE_Y;

        let onLightBackground = false;
        let nextWordmarkSplit: number | null = null;

        if (stageCoversWordmark) {
          const wordmark = document.getElementById("wordmark");
          if (wordmark) {
            const wordmarkRect = wordmark.getBoundingClientRect();
            const split = Math.min(
              Math.max(panelTop - wordmarkRect.top, 0),
              wordmarkRect.height,
            );

            if (split >= wordmarkRect.height) {
              onLightBackground = false;
            } else if (split <= 0) {
              onLightBackground = true;
            } else {
              nextWordmarkSplit = split;
              onLightBackground = false;
            }
          }
        } else {
          const sectionAtProbe = (id: string) => {
            const section = document.getElementById(id);
            if (!section) return false;
            const bounds = section.getBoundingClientRect();
            return bounds.top <= WORDMARK_PROBE_Y && bounds.bottom >= WORDMARK_PROBE_Y;
          };

          if (sectionAtProbe("interactive-showcase")) onLightBackground = false;
          else if (sectionAtProbe("buyer-experience")) onLightBackground = true;
          else if (sectionAtProbe("contact")) onLightBackground = false;
        }

        setWordmarkSplit(nextWordmarkSplit);
        setNavTheme(onLightBackground ? "light" : "dark");
      } else {
        setWordmarkSplit(null);
        setNavTheme("dark");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleContactClick = () => {
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      const top = contactSection.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: "smooth" });
      return;
    }
    setContactOpen(true);
  };

  return (
    <main className="relative w-full bg-[#ecece2] text-[#f0f1e6] selection:bg-[#a8cebc] selection:text-[#171713] font-body overflow-x-clip">
      {/* 1. Opening Curtain Wave Reveal (Exact recreation of Crosswalk intro) */}
      <CurtainReveal onComplete={() => setStage((prev) => Math.max(prev, 1))} />

      {/* 2. Top page marks: the wordmark and Contact action sit directly on the artwork. */}
      <Navigation
        theme={navTheme}
        visible={stage >= 2}
        wordmarkSplit={wordmarkSplit}
        onContactClick={handleContactClick}
      />

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
        <div ref={pinnedStageRef} className="sticky top-0 w-full h-[100svh] min-h-[640px] overflow-hidden">
          
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
              <HeroTypography />
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
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pt-28 sm:pt-32 md:pt-36 pb-12 sm:pb-16 flex-1 flex flex-col min-h-[calc(100svh-4rem)]">

              {/* Main Statement Container (Prominent, restrained, and elegant) */}
              <div className="max-w-5xl py-8 sm:py-12">
                <p className="font-body text-xl sm:text-2xl md:text-[2rem] lg:text-[2.35rem] font-normal leading-[1.32] md:leading-[1.28] tracking-[-0.022em] text-[#1f6651] text-left">
                  Worldsmith transforms{" "}
                  <span className="box-decoration-clone bg-[#a8cebc] text-[#171713]">
                    architectural plans and renderings into immersive 3D worlds
                  </span>
                  , letting buyers explore developments before construction begins. We combine architectural expertise and spatial technology to turn unbuilt properties into interactive experiences that inspire confidence and accelerate decisions.
                </p>
              </div>

            </div>
          </section>
        </div>
      </div>

      {/* =========================================================================
          SECTION 03: INTERACTIVE 3BHK SHOWCASE
          Dark premium presentation stage — splash render → live 3D environment.
         ========================================================================= */}
      <Section03Showcase />

      {/* =========================================================================
          SECTION 04: THE HOMEBUYER EXPERIENCE
          Ivory editorial stage with a live room-by-room interior tour.
         ========================================================================= */}
      <Section04HomeTour />

      {/* FINAL CTA: A quiet, human close to the WorldSmith story. */}
      <FinalCta />

      {/* Persistent Developer Project Inquiry Dialog */}
      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </main>
  );
}

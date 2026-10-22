"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const PropertyViewer = dynamic(() => import("./showcase/PropertyViewer"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#121212]" />,
});

export const Section03Showcase: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [preloaded, setPreloaded] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Warm the viewer + three.js chunk while the section approaches the viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          import("./showcase/PropertyViewer").catch(() => undefined);
          setPreloaded(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(document.fullscreenElement === panelRef.current);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (document.fullscreenElement === panel) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      panel.requestFullscreen().catch(() => undefined);
    }
  }, []);

  const handleStart = useCallback(() => {
    setStarted(true);
    if (!preloaded) import("./showcase/PropertyViewer").catch(() => undefined);
  }, [preloaded]);

  const FullscreenIcon = (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  const ExitFullscreenIcon = (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <section
      ref={sectionRef}
      id="interactive-showcase"
      className="relative w-full bg-[#121212] overflow-hidden"
    >
      {/* Fine grain texture, low contrast */}
      <div
        className="pointer-events-none absolute inset-0 paper-grain opacity-[0.06] mix-blend-overlay"
        aria-hidden="true"
      />

      <div className="relative w-full flex items-center justify-center px-[4vw] sm:px-[6vw] py-[8vh]">
        {/* 16:9 experience panel — ~75% of content width on desktop, height-aware */}
        <div
          ref={panelRef}
          className={`relative bg-[#121212] overflow-hidden shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] ${
            isFullscreen ? "w-full h-full" : ""
          }`}
          style={
            isFullscreen
              ? undefined
              : {
                  width: "min(75vw, calc((100svh - 16vh) * 1.7778), 1600px)",
                  aspectRatio: "16 / 9",
                }
          }
        >
          {/* Viewer mounts on start; splash stays painted underneath until ready — no blank frame, no layout shift */}
          {started && (
            <div
              className={`absolute inset-0 transition-opacity duration-700 ${
                reducedMotion ? "duration-0" : ""
              } ${viewerReady ? "opacity-100" : "opacity-0"}`}
            >
              <PropertyViewer reducedMotion={reducedMotion} onReady={() => setViewerReady(true)} />
            </div>
          )}

          {/* Loading indicator while the scene initialises */}
          {started && !viewerReady && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#121212]/55 backdrop-blur-[2px]">
              <div className="w-8 h-8 rounded-full border-2 border-[#B5D5C5]/25 border-t-[#B5D5C5] animate-spin" />
              <p className="font-display text-[11px] tracking-[0.28em] uppercase text-[#F0EDE3]/80">
                Preparing the world
              </p>
            </div>
          )}

          {/* INITIAL EXPERIENCE SCREEN — art-directed splash */}
          {!started && (
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/showcase/community-splash.png"
                alt="Aerial evening view of a contemporary gated residential community with landscaped courtyards"
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
              {/* Restrained contrast treatment */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/85 via-[#121212]/15 to-[#121212]/45" />
              <div className="absolute inset-0 bg-[#0c0f0d]/10" />

              {/* Composition */}
              <div className="absolute inset-0 flex flex-col items-center justify-between py-[7%] px-[6%]">
                <div className="w-full flex items-start justify-between">
                  <span className="font-display text-[10px] sm:text-[11px] font-semibold tracking-[0.32em] uppercase text-[#F0EDE3]/70">
                    A digital twin experience
                  </span>
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    aria-label="Enter fullscreen"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#121212]/55 backdrop-blur-sm border border-[#F0EDE3]/20 text-[#F0EDE3]/85 hover:bg-[#121212]/75 hover:border-[#B5D5C5]/50 transition-colors duration-200"
                  >
                    {FullscreenIcon}
                    <span className="hidden sm:inline font-display text-[10px] font-semibold tracking-[0.18em] uppercase">
                      Fullscreen
                    </span>
                  </button>
                </div>

                <div className="flex flex-col items-center text-center max-w-3xl">
                  <h2 className="font-display font-bold text-[#F0EDE3] text-[clamp(1.9rem,5.2vw,4.2rem)] tracking-[0.22em] leading-none uppercase">
                    Worldsmith
                  </h2>
                  <p className="mt-3 sm:mt-4 font-body text-[11px] sm:text-[13px] tracking-[0.14em] uppercase text-[#F0EDE3]/75">
                    Step inside a residence before it is built
                  </p>
                  <button
                    type="button"
                    onClick={handleStart}
                    className="group mt-7 sm:mt-9 inline-flex items-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-[#206046] hover:bg-[#2a7456] text-[#F0EDE3] font-display text-[11px] sm:text-[12px] font-semibold tracking-[0.24em] uppercase transition-all duration-300 shadow-[0_18px_45px_-15px_rgba(32,96,70,0.9)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5D5C5]"
                  >
                    Start Experience
                    <span className="group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true">
                      →
                    </span>
                  </button>
                </div>

                <div className="w-full flex items-end justify-between">
                  <span className="font-body text-[10px] sm:text-[11px] tracking-[0.1em] text-[#F0EDE3]/55">
                    Overview · Dollhouse · First-person Explore
                  </span>
                  <span className="hidden sm:block font-accent italic text-[13px] text-[#B5D5C5]/85">
                    Casa Verdant — a Worldsmith demonstration community
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Exit-fullscreen control (visible only in fullscreen) */}
          {isFullscreen && (
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="Exit fullscreen"
              className="absolute bottom-4 right-4 z-30 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#121212]/70 backdrop-blur-sm border border-[#F0EDE3]/20 text-[#F0EDE3]/85 hover:border-[#B5D5C5]/50 transition-colors"
            >
              {ExitFullscreenIcon}
              <span className="font-display text-[10px] font-semibold tracking-[0.18em] uppercase">
                Exit
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

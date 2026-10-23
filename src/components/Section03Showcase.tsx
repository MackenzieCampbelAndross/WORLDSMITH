"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const PropertyViewer = dynamic(() => import("./showcase/PropertyViewer"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#121212]" />,
});

export const Section03Showcase: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);
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

  const handleStart = useCallback(() => {
    setStarted(true);
    if (!preloaded) import("./showcase/PropertyViewer").catch(() => undefined);
  }, [preloaded]);

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
      <div
        className="pointer-events-none absolute inset-0 grid-lines"
        style={{ "--grid-line-color": "rgba(181, 213, 197, 0.05)" } as React.CSSProperties}
        aria-hidden="true"
      />

      <div className="relative w-full flex items-center justify-center px-[4vw] sm:px-[6vw] py-[8vh]">
        {/* 16:9 experience panel — ~75% of content width on desktop, height-aware */}
        <div
          className="relative overflow-hidden border border-[#F0EDE3]/35 bg-[#121212] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
          style={{
            width: "min(75vw, calc((100svh - 16vh) * 1.7778), 1600px)",
            aspectRatio: "16 / 9",
          }}
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

          {/* INITIAL EXPERIENCE SCREEN — a quiet, centered invitation */}
          {!started && (
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/showcase/villa-splash.png"
                alt="Contemporary single-storey villa with projecting flat rooflines, timber entrance screen and landscaped front lawn at dusk"
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 bg-[#040a07]/55" />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(ellipse at center, rgba(4,10,7,0.04) 0%, rgba(4,10,7,0.42) 100%)",
                }}
                aria-hidden="true"
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                <h2 className="font-anton text-[clamp(1.8rem,6.9vw,6.25rem)] font-normal uppercase leading-none tracking-[0.06em] text-[#F0EDE3]">
                  Worldsmith
                </h2>
                <p className="mt-3 max-w-[30rem] text-balance font-body text-[10px] uppercase leading-[1.8] tracking-[0.18em] text-[#F0EDE3]/90 sm:mt-5 sm:text-[13px]">
                  Step inside a living simulation of our work
                </p>
                <button
                  type="button"
                  onClick={handleStart}
                  className="group mt-6 inline-flex items-center gap-3 whitespace-nowrap rounded-full bg-[#F0EDE3] px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0F1712] shadow-[0_20px_55px_-18px_rgba(0,0,0,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_24px_65px_-18px_rgba(0,0,0,0.95)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0EDE3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212] sm:mt-10 sm:px-11 sm:py-4 sm:text-[12px] sm:tracking-[0.24em]"
                >
                  Start Your Experience
                  <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                    →
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

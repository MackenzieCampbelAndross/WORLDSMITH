"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const PropertyViewer = dynamic(() => import("./showcase/PropertyViewer"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#121212]" />,
});

// Let the loading screen draw before the main thread blocks on the scene build.
const LOADER_HOLD_MS = 900;

const Keycap: React.FC<{ children: React.ReactNode; wide?: boolean }> = ({ children, wide }) => (
  <kbd
    className={`inline-flex h-6 items-center justify-center rounded-[3px] border border-[#F0EDE3]/25 bg-[#F0EDE3]/10 px-1.5 font-display text-[9px] font-semibold uppercase leading-none tracking-[0.1em] text-[#F0EDE3] shadow-[inset_0_-1.5px_0_rgba(0,0,0,0.45)] ${
      wide ? "min-w-[3.4rem]" : "min-w-6"
    }`}
  >
    {children}
  </kbd>
);

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center border border-[#B5D5C5]/30 px-2 py-1 font-display text-[8px] uppercase leading-none tracking-[0.18em] text-[#B5D5C5]">
    {children}
  </span>
);

export const Section03Showcase: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [deckOpen, setDeckOpen] = useState(false);
  const [deckSlide, setDeckSlide] = useState(0);
  const [deckReplay, setDeckReplay] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [isTouch] = useState(
    () => typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)
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
    // Requesting inside the click gesture is required; fall back to a fixed
    // overlay where the Fullscreen API is unavailable or refused (e.g. iOS).
    const panel = panelRef.current;
    if (panel && document.fullscreenEnabled) {
      panel.requestFullscreen?.().catch(() => setImmersive(true));
    } else if (panel) {
      setImmersive(true);
    }
  }, [preloaded]);

  const handleStop = useCallback(() => {
    setStarted(false);
    setMounted(false);
    setViewerReady(false);
    setLoaderGone(false);
    setDeckOpen(false);
    setDeckSlide(0);
    setDeckReplay(false);
    setImmersive(false);
    if (document.fullscreenElement === panelRef.current) {
      document.exitFullscreen?.().catch(() => undefined);
    }
  }, []);

  // Mirror the browser's fullscreen state (Esc exits natively).
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === panelRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // The fallback overlay has no native fullscreen, so handle Esc ourselves.
  useEffect(() => {
    if (!immersive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setImmersive(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [immersive]);

  // The fallback overlay leaves the flow, so lock page scroll behind it.
  useEffect(() => {
    if (!immersive) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [immersive]);

  // Open the onboarding deck once the scene is up; it has to be completed.
  useEffect(() => {
    if (!viewerReady) {
      setDeckOpen(false);
      return;
    }
    const show = setTimeout(() => {
      setDeckSlide(0);
      setDeckReplay(false);
      setDeckOpen(true);
    }, 700);
    return () => clearTimeout(show);
  }, [viewerReady]);

  // Mount the viewer only after the loading screen has painted: the scene build
  // and shader compile block the main thread.
  useEffect(() => {
    if (!started) {
      setMounted(false);
      return;
    }
    if (reducedMotion) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(true), LOADER_HOLD_MS);
    return () => clearTimeout(t);
  }, [started, reducedMotion]);

  // Keep the loader mounted until its cross-fade to the viewer has finished.
  useEffect(() => {
    if (!viewerReady) {
      setLoaderGone(false);
      return;
    }
    const t = setTimeout(() => setLoaderGone(true), 700);
    return () => clearTimeout(t);
  }, [viewerReady]);

  // Unmount the viewer once the section leaves the viewport so it releases its
  // global WASD/arrow-key capture, which otherwise blocks typing elsewhere.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !started || immersive) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) handleStop();
      },
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [started, handleStop, immersive]);

  const deckSlides = [
    {
      eyebrow: "01 — The space",
      title: "A living model",
      body: "Casa Verdant is presented as a fully rendered, real-time environment. Every room, finish and light source responds as you move through the space.",
      art: (
        <div className="flex flex-wrap gap-2">
          <Tag>Real-time 3D</Tag>
          <Tag>Casa Verdant</Tag>
        </div>
      ),
    },
    {
      eyebrow: "02 — Perspective",
      title: "Choose your vantage",
      body: "Move between first-person, third-person and an elevated overview of the plan — whichever best reads the design.",
      art: (
        <div className="flex flex-wrap gap-2">
          <Tag>FPP</Tag>
          <Tag>TPP</Tag>
          <Tag>Overview</Tag>
          <Tag>Dollhouse</Tag>
        </div>
      ),
    },
    {
      eyebrow: "03 — Movement",
      title: "Walk the residence",
      body: isTouch
        ? "Use the joystick on the left half of the screen to move through the space."
        : "Navigate with W A S D or the arrow keys. Movement is continuous, so you can pass from the entry hall to the rear garden without leaving the view.",
      art: isTouch ? (
        <Tag>Left half</Tag>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex gap-1">
            {["W", "A", "S", "D"].map((k) => (
              <Keycap key={k}>{k}</Keycap>
            ))}
          </span>
          <span className="font-body text-[10px] text-[#F0EDE3]/30">/</span>
          <span className="flex gap-1">
            {["↑", "↓", "←", "→"].map((k) => (
              <Keycap key={k}>{k}</Keycap>
            ))}
          </span>
        </div>
      ),
    },
    {
      eyebrow: "04 — Orientation",
      title: "Look as you move",
      body: isTouch
        ? "Drag on the right half of the screen to look around. The view updates as you move."
        : "Click once inside the scene to capture the cursor, then move to look around. Press Esc to release the cursor or exit fullscreen.",
      art: isTouch ? (
        <Tag>Right half</Tag>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Keycap wide>MOUSE</Keycap>
          <Keycap wide>ESC</Keycap>
        </div>
      ),
    },
  ];

  const isLastSlide = deckSlide === deckSlides.length - 1;

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
        {/* 16:9 experience panel — expands to fullscreen while the walkthrough runs */}
        <div
          ref={panelRef}
          className={`relative overflow-hidden bg-[#121212] ${
            isFullscreen || immersive
              ? ""
              : "border border-[#F0EDE3]/35 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
          }`}
          style={
            isFullscreen
              ? { width: "100%", height: "100%", aspectRatio: "auto" }
              : immersive
              ? { position: "fixed", inset: 0, width: "100%", height: "100%", aspectRatio: "auto", zIndex: 60 }
              : { width: "min(75vw, calc((100svh - 16vh) * 1.7778), 1600px)", aspectRatio: "16 / 9" }
          }
        >
          {/* Viewer mounts after the loading screen has painted; splash stays underneath so there is never a blank frame */}
          {started && mounted && (
            <div
              className={`absolute inset-0 transition-opacity duration-700 ${
                reducedMotion ? "duration-0" : ""
              } ${viewerReady ? "opacity-100" : "opacity-0"}`}
            >
              <PropertyViewer
                reducedMotion={reducedMotion}
                onReady={() => setViewerReady(true)}
                onGuide={() => {
                  setDeckSlide(0);
                  setDeckReplay(true);
                  setDeckOpen(true);
                }}
              />
            </div>
          )}

          {/* Loading screen — an architectural plan draws itself while the scene compiles */}
          {started && !loaderGone && (
            <div
              role="status"
              aria-live="polite"
              className={`absolute inset-0 z-20 overflow-hidden bg-[#121212] transition-opacity duration-700 ${
                reducedMotion ? "duration-0" : ""
              } ${viewerReady ? "pointer-events-none opacity-0" : "opacity-100"}`}
            >
              <div
                className="pointer-events-none absolute inset-0 grid-lines"
                style={{ "--grid-line-color": "rgba(181, 213, 197, 0.06)" } as React.CSSProperties}
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-0 paper-grain opacity-[0.05] mix-blend-overlay"
                aria-hidden="true"
              />

              <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 px-6 sm:gap-6">
                <p className="font-anton text-[9px] uppercase leading-none tracking-[0.42em] text-[#F0EDE3]/85 sm:text-[11px]">
                  Crestion Labs
                </p>

                <svg
                  viewBox="0 0 480 260"
                  fill="none"
                  className="w-[58%] max-w-[460px] overflow-visible"
                  aria-hidden="true"
                >
                  {/* site setback */}
                  <rect
                    x="30"
                    y="22"
                    width="420"
                    height="206"
                    stroke="#B5D5C5"
                    strokeOpacity="0.28"
                    strokeWidth="0.7"
                    strokeDasharray="4 7"
                    className="loader-fade"
                  />
                  {/* outer and inner walls */}
                  <rect x="68" y="42" width="320" height="160" pathLength={1} stroke="#F0EDE3" strokeWidth="1.1" className="loader-line" style={{ "--loader-delay": "0.05s" } as React.CSSProperties} />
                  <rect x="74" y="48" width="308" height="148" pathLength={1} stroke="#F0EDE3" strokeOpacity="0.45" strokeWidth="0.5" className="loader-line" style={{ "--loader-delay": "0.12s" } as React.CSSProperties} />
                  {/* partitions */}
                  <line x1="208" y1="48" x2="208" y2="142" pathLength={1} stroke="#F0EDE3" strokeOpacity="0.7" strokeWidth="0.8" className="loader-line" style={{ "--loader-delay": "0.24s" } as React.CSSProperties} />
                  <line x1="74" y1="142" x2="208" y2="142" pathLength={1} stroke="#F0EDE3" strokeOpacity="0.7" strokeWidth="0.8" className="loader-line" style={{ "--loader-delay": "0.3s" } as React.CSSProperties} />
                  <line x1="296" y1="48" x2="296" y2="202" pathLength={1} stroke="#F0EDE3" strokeOpacity="0.7" strokeWidth="0.8" className="loader-line" style={{ "--loader-delay": "0.28s" } as React.CSSProperties} />
                  <line x1="296" y1="112" x2="382" y2="112" pathLength={1} stroke="#F0EDE3" strokeOpacity="0.7" strokeWidth="0.8" className="loader-line" style={{ "--loader-delay": "0.36s" } as React.CSSProperties} />
                  <line x1="208" y1="104" x2="296" y2="104" pathLength={1} stroke="#F0EDE3" strokeOpacity="0.5" strokeWidth="0.8" className="loader-line" style={{ "--loader-delay": "0.4s" } as React.CSSProperties} />
                  {/* door swing */}
                  <path d="M 208 168 A 26 26 0 0 0 182 142" pathLength={1} stroke="#B5D5C5" strokeOpacity="0.6" strokeWidth="0.7" className="loader-line" style={{ "--loader-delay": "0.46s" } as React.CSSProperties} />
                  {/* loose furniture */}
                  <rect x="88" y="60" width="52" height="40" pathLength={1} stroke="#B5D5C5" strokeOpacity="0.32" strokeWidth="0.6" className="loader-line" style={{ "--loader-delay": "0.42s" } as React.CSSProperties} />
                  <rect x="314" y="132" width="58" height="30" pathLength={1} stroke="#B5D5C5" strokeOpacity="0.32" strokeWidth="0.6" className="loader-line" style={{ "--loader-delay": "0.48s" } as React.CSSProperties} />
                  <rect x="96" y="162" width="42" height="28" pathLength={1} stroke="#B5D5C5" strokeOpacity="0.32" strokeWidth="0.6" className="loader-line" style={{ "--loader-delay": "0.52s" } as React.CSSProperties} />
                  {/* dimension line */}
                  <line x1="68" y1="234" x2="388" y2="234" pathLength={1} stroke="#B5D5C5" strokeOpacity="0.55" strokeWidth="0.6" className="loader-line" style={{ "--loader-delay": "0.5s" } as React.CSSProperties} />
                  <line x1="68" y1="229" x2="68" y2="239" pathLength={1} stroke="#B5D5C5" strokeOpacity="0.55" strokeWidth="0.6" className="loader-line" style={{ "--loader-delay": "0.55s" } as React.CSSProperties} />
                  <line x1="388" y1="229" x2="388" y2="239" pathLength={1} stroke="#B5D5C5" strokeOpacity="0.55" strokeWidth="0.6" className="loader-line" style={{ "--loader-delay": "0.55s" } as React.CSSProperties} />
                  {/* north arrow */}
                  <circle cx="434" cy="52" r="10" pathLength={1} stroke="#B5D5C5" strokeOpacity="0.6" strokeWidth="0.6" className="loader-line" style={{ "--loader-delay": "0.5s" } as React.CSSProperties} />
                  <path d="M 434 46 L 434 58 M 434 46 L 430.5 51 M 434 46 L 437.5 51" pathLength={1} stroke="#B5D5C5" strokeOpacity="0.8" strokeWidth="0.6" className="loader-line" style={{ "--loader-delay": "0.56s" } as React.CSSProperties} />
                  {/* labels */}
                  <text x="68" y="34" className="loader-fade font-display" fill="#B5D5C5" fillOpacity="0.7" fontSize="6.5" letterSpacing="2" style={{ "--loader-delay": "0.35s" } as React.CSSProperties}>GROUND FLOOR</text>
                  <text x="430" y="76" className="loader-fade font-display" fill="#B5D5C5" fillOpacity="0.7" fontSize="6.5" letterSpacing="1" style={{ "--loader-delay": "0.6s" } as React.CSSProperties}>N</text>
                  <text x="68" y="250" className="loader-fade font-display" fill="#B5D5C5" fillOpacity="0.45" fontSize="6" letterSpacing="1.6" style={{ "--loader-delay": "0.62s" } as React.CSSProperties}>SCALE 1:100</text>
                </svg>

                <div className="flex w-[46%] max-w-[240px] flex-col items-center gap-3">
                  <div className="relative h-px w-full overflow-hidden bg-[#F0EDE3]/15">
                    <span className="loader-sweep absolute inset-y-0 left-0 w-1/3 bg-[#B5D5C5]" />
                  </div>
                  <p className="loader-breathe font-display text-[9px] uppercase tracking-[0.28em] text-[#B5D5C5]/80 sm:text-[10px]">
                    Preparing the world
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Onboarding deck — a 4:5 branded panel that must be completed */}
          {deckOpen && (
            <>
              {/* Swallow scene interaction until the walkthrough is done */}
              <div className="absolute inset-0 z-30" aria-hidden="true" />

              <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center p-4">
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label="How to explore the villa"
                  style={{ width: "min(84%, 21rem)", maxHeight: "92%" }}
                  className="guide-rise pointer-events-auto relative flex flex-col overflow-hidden rounded-[18px] border border-[#B5D5C5]/25 bg-[#0B100D] text-[#F0EDE3] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95)]"
                >
                  <div
                    className="pointer-events-none absolute inset-0 grid-lines"
                    style={{ "--grid-line-color": "rgba(181, 213, 197, 0.08)" } as React.CSSProperties}
                    aria-hidden="true"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 paper-grain opacity-[0.05] mix-blend-overlay"
                    aria-hidden="true"
                  />

                  <div className="relative flex items-center justify-between border-b border-[#B5D5C5]/25 bg-[#1f5e44] px-4 py-2.5">
                    <span className="font-display text-[8px] uppercase tracking-[0.3em] text-[#F0EDE3]/85">
                      How to explore
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-[9px] tracking-[0.22em] text-[#F0EDE3]">
                        {String(deckSlide + 1).padStart(2, "0")} / {String(deckSlides.length).padStart(2, "0")}
                      </span>
                      {deckReplay && (
                        <button
                          type="button"
                          onClick={() => setDeckOpen(false)}
                          aria-label="Close guide"
                          className="font-display text-[11px] leading-none text-[#F0EDE3]/60 transition-colors hover:text-[#F0EDE3]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div key={deckSlide} className="guide-rise relative px-5 py-5 sm:px-6">
                    <span className="font-display text-[8px] uppercase tracking-[0.26em] text-[#B5D5C5]/75">
                      {deckSlides[deckSlide].eyebrow}
                    </span>
                    <h3 className="mt-2.5 font-accent text-[clamp(1.45rem,4.8vh,2.15rem)] font-normal italic leading-[1.04] tracking-[-0.01em] text-[#F0EDE3]">
                      {deckSlides[deckSlide].title}
                    </h3>
                    <p className="mt-3 font-body text-[clamp(9.5px,1.6vh,12px)] leading-relaxed text-[#F0EDE3]/65">
                      {deckSlides[deckSlide].body}
                    </p>
                    <div className="mt-4 border-t border-[#B5D5C5]/15 pt-4">{deckSlides[deckSlide].art}</div>
                  </div>

                  <div className="relative border-t border-[#B5D5C5]/20 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5" aria-hidden="true">
                        {deckSlides.map((_, i) => (
                          <span
                            key={i}
                            className={`h-px w-5 transition-colors ${
                              i <= deckSlide ? "bg-[#B5D5C5]" : "bg-[#F0EDE3]/20"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        {deckSlide > 0 && (
                          <button
                            type="button"
                            onClick={() => setDeckSlide((s) => Math.max(0, s - 1))}
                            className="px-2 py-1 font-display text-[8.5px] uppercase tracking-[0.2em] text-[#F0EDE3]/50 transition-colors hover:text-[#F0EDE3]"
                          >
                            Back
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (!isLastSlide) {
                              setDeckSlide((s) => s + 1);
                            } else {
                              setDeckOpen(false);
                              setDeckReplay(false);
                            }
                          }}
                          className="inline-flex items-center gap-2 bg-[#B5D5C5] px-3.5 py-1.5 font-display text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[#0B100D] transition-colors hover:bg-[#F0EDE3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0EDE3]"
                        >
                          {isLastSlide ? "Begin walkthrough" : "Next"}
                          <span aria-hidden="true">→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Escape hatch for the fallback overlay, where there is no native Esc */}
          {immersive && (
            <button
              type="button"
              onClick={() => setImmersive(false)}
              className="absolute bottom-3 right-3 z-40 rounded-full border border-[#F0EDE3]/25 bg-[#121212]/80 px-3 py-1.5 font-display text-[9px] uppercase tracking-[0.16em] text-[#F0EDE3]/80 backdrop-blur transition-colors hover:text-[#F0EDE3] sm:text-[10px]"
            >
              Exit fullscreen
            </button>
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
                  Crestion Labs
                </h2>
                <p className="mt-3 max-w-[30rem] text-balance font-body text-[10px] uppercase leading-[1.8] tracking-[0.18em] text-[#F0EDE3]/90 sm:mt-5 sm:text-[13px]">
                  Step inside a living simulation of our work
                </p>
                <button
                  type="button"
                  onClick={handleStart}
                  className="group mt-6 inline-flex items-center gap-3 whitespace-nowrap rounded-full bg-[#F0EDE3] px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0F1712] shadow-[0_20px_55px_-18px_rgba(0,0,0,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_24px_65px_-18px_rgba(0,0,0,0.95)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0EDE3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212] sm:mt-10 sm:px-11 sm:py-4 sm:text-[12px] sm:tracking-[0.24em]"
                >
                  Try Out Our Experience
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

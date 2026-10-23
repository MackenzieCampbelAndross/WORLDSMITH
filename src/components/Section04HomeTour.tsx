"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  TOUR_ORDER,
  TOUR_TABS,
  TOUR_VIEWS,
  type TourGroup,
  type TourViewId,
} from "./showcase/tourViews";

const BuyerTourViewer = dynamic(() => import("./showcase/BuyerTourViewer"), {
  ssr: false,
});

const IconArrow = ({ dir }: { dir: "prev" | "next" }) => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d={dir === "prev" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconDrag = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M8 12H3m0 0 2.5-2.5M3 12l2.5 2.5M16 12h5m0 0-2.5-2.5M21 12l-2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BEDROOM_VIEWS: TourViewId[] = ["master", "bed2", "bed3"];

export const Section04HomeTour: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [view, setView] = useState<TourViewId>("living");
  const [lastBedroom, setLastBedroom] = useState<TourViewId>("master");
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasLooked, setHasLooked] = useState(false);

  const active = TOUR_VIEWS[view];
  const activeGroup = active.group;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          import("./showcase/BuyerTourViewer").catch(() => undefined);
          setMounted(true);
          io.disconnect();
        }
      },
      { rootMargin: "700px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const selectView = useCallback((next: TourViewId) => {
    setView(next);
    if (TOUR_VIEWS[next].group === "bedrooms") setLastBedroom(next);
  }, []);

  const selectGroup = useCallback(
    (group: TourGroup) => {
      const tab = TOUR_TABS.find((item) => item.group === group);
      if (!tab) return;
      selectView(group === "bedrooms" ? lastBedroom : tab.views[0]);
    },
    [lastBedroom, selectView]
  );

  const cycle = useCallback(
    (delta: number) => {
      const index = TOUR_ORDER.indexOf(view);
      const next = TOUR_ORDER[(index + delta + TOUR_ORDER.length) % TOUR_ORDER.length];
      selectView(next);
    },
    [selectView, view]
  );

  const bedroomViews = BEDROOM_VIEWS;
  const tabIndexLabel = activeGroup === "bedrooms" ? "04" : TOUR_TABS.find((tab) => tab.group === activeGroup)?.index ?? "01";

  return (
    <section
      ref={sectionRef}
      id="buyer-experience"
      className="relative min-h-[100svh] w-full overflow-hidden bg-[#ecece2] text-[#1c4c3b]"
    >
      <div
        className="pointer-events-none absolute inset-0 paper-grain opacity-[0.16] mix-blend-multiply"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 grid-lines"
        style={{ "--grid-line-color": "rgba(31, 102, 81, 0.045)" } as React.CSSProperties}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1760px] px-[4.5vw] pb-10 pt-[6.5rem] lg:pb-14">
        <div className="grid items-center gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.55fr)] xl:gap-x-20">
          {/* Buyer-facing proposition */}
          <div className="max-w-[33rem] lg:py-4">
            <h2 className="font-display text-[clamp(2.55rem,4.1vw,4.6rem)] font-medium leading-[0.98] tracking-[-0.045em] text-[#173f32]">
              Know your home before you arrive.
            </h2>
            <p className="mt-6 max-w-[30rem] font-body text-[15px] leading-[1.8] text-[#1c4c3b]/75 sm:text-[16px]">
              Explore every room, understand the layout, discover the details and experience the space
              at your own pace.
            </p>
            <div className="mt-8 flex items-center gap-3 text-[#1f6651]/65">
              <span className="h-px w-8 bg-[#1f6651]/30" aria-hidden="true" />
              <span className="font-accent text-[15px] italic">A live digital twin of Casa Verdant.</span>
            </div>
          </div>

          {/* Room experience */}
          <div className="min-w-0">
            <div id="buyer-visual" className="relative h-[clamp(330px,48svh,430px)] w-full overflow-hidden bg-[#0a1b14] lg:h-[clamp(420px,62svh,620px)]">
              {mounted && (
                <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
                  <BuyerTourViewer
                    view={view}
                    onReady={() => setReady(true)}
                    onLook={() => setHasLooked(true)}
                  />
                </div>
              )}

              {/* Loading / preparing state */}
              <div
                aria-hidden={ready}
                className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#0b2119] text-[#f0ede3] transition-opacity duration-700 ${
                  ready ? "pointer-events-none opacity-0" : "opacity-100"
                }`}
              >
                <span className="font-accent text-[22px] italic text-[#b5d5c5]/90">Casa Verdant</span>
                <span className="flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.28em] text-[#f0ede3]/55">
                  <span className="h-3 w-3 animate-spin rounded-full border border-[#b5d5c5]/30 border-t-[#b5d5c5]" />
                  Preparing the walkthrough
                </span>
              </div>

              {/* Cinematic edge + live marker */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between bg-gradient-to-b from-[#071b13]/60 to-transparent px-4 pb-10 pt-4 sm:px-5">
                <span className="font-display text-[9px] uppercase tracking-[0.26em] text-[#f0ede3]/75">
                  Casa Verdant <span className="mx-2 text-[#f0ede3]/35">/</span> <span className="font-accent normal-case tracking-normal text-[13px] italic text-[#f0ede3]/85">Interactive residence</span>
                </span>
                <span className="flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.22em] text-[#f0ede3]/65">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#b5d5c5]/90" />
                  Live 3D
                </span>
              </div>

              {/* Look hint */}
              <div
                className={`pointer-events-none absolute bottom-4 left-4 z-10 flex items-center gap-2.5 rounded-full border border-[#f0ede3]/15 bg-[#071b13]/55 px-3.5 py-2 text-[#f0ede3]/85 backdrop-blur-sm transition-opacity duration-500 sm:bottom-5 sm:left-5 ${
                  hasLooked || !ready ? "opacity-0" : "opacity-100"
                }`}
              >
                <IconDrag />
                <span className="font-display text-[9px] font-medium uppercase tracking-[0.2em]">
                  <span className="hidden sm:inline">Drag to look around</span>
                  <span className="sm:hidden">Swipe to look</span>
                </span>
              </div>

              {/* Soft bottom edge for the controls beneath */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-16 bg-gradient-to-t from-[#071b13]/40 to-transparent"
                aria-hidden="true"
              />
            </div>

            {/* Room dock */}
            <div className="mt-5 border-t border-[#1f6651]/15 pt-4">
              <div className="flex items-center justify-between gap-4">
                <div aria-live="polite" className="min-w-0">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-accent text-[15px] italic text-[#1f6651]/55">{tabIndexLabel}</span>
                    <h3 className="font-display text-[21px] font-medium tracking-[-0.02em] text-[#173f32] sm:text-[24px]">
                      {active.label}
                    </h3>
                  </div>
                  <p className="mt-1 font-body text-[11px] leading-relaxed text-[#1c4c3b]/60 sm:text-[12px]">
                    {active.description}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cycle(-1)}
                    aria-label="Previous room"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1f6651]/25 text-[#1f6651]/75 transition-colors hover:border-[#1f6651]/60 hover:text-[#1f6651]"
                  >
                    <IconArrow dir="prev" />
                  </button>
                  <button
                    type="button"
                    onClick={() => cycle(1)}
                    aria-label="Next room"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1f6651]/25 text-[#1f6651]/75 transition-colors hover:border-[#1f6651]/60 hover:text-[#1f6651]"
                  >
                    <IconArrow dir="next" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 sm:gap-x-7 lg:flex-nowrap lg:justify-end">
                  {TOUR_TABS.map((tab) => {
                    const selected = tab.group === activeGroup;
                    return (
                      <button
                        key={tab.group}
                        type="button"
                        onClick={() => selectGroup(tab.group)}
                        aria-pressed={selected}
                        className={`group relative flex shrink-0 items-baseline gap-1.5 pb-2 font-display text-[12px] font-medium tracking-[0.015em] transition-colors sm:text-[13px] ${
                          selected ? "text-[#173f32]" : "text-[#1c4c3b]/50 hover:text-[#173f32]"
                        }`}
                      >
                        <span className={`hidden font-accent text-[11px] italic 2xl:inline ${selected ? "text-[#1f6651]/70" : "text-[#1f6651]/35"}`}>
                          {tab.index}
                        </span>
                        {tab.label}
                        <span
                          className={`absolute inset-x-0 bottom-0 h-px bg-[#1f6651] transition-opacity ${
                            selected ? "opacity-100" : "opacity-0 group-hover:opacity-30"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <div
                  aria-hidden={activeGroup !== "bedrooms"}
                  inert={activeGroup !== "bedrooms"}
                  className={`flex flex-wrap items-center gap-x-4 gap-y-1 overflow-hidden transition-all duration-300 lg:justify-end ${
                    activeGroup === "bedrooms" ? "max-h-8 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  {bedroomViews.map((id, index) => {
                    const bedroom = TOUR_VIEWS[id];
                    const selected = view === id;
                    return (
                      <span key={id} className="flex items-center gap-4">
                        {index > 0 && <span className="h-2.5 w-px bg-[#1f6651]/20" aria-hidden="true" />}
                        <button
                          type="button"
                          onClick={() => selectView(id)}
                          aria-pressed={selected}
                          className={`font-body text-[10px] uppercase tracking-[0.14em] transition-colors ${
                            selected ? "text-[#173f32]" : "text-[#1c4c3b]/45 hover:text-[#173f32]"
                          }`}
                        >
                          {bedroom.label}
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

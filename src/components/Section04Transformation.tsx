"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

const STAGES = [
  { n: "01", title: "THE PLAN", desc: "Your architectural drawings" },
  { n: "02", title: "THE STRUCTURE", desc: "A coherent 3D representation" },
  { n: "03", title: "THE EXPERIENCE", desc: "A living, explorable environment" },
];

const SCENES = [
  { plan: 1, planScale: 1.06, wire: 0.08, wireScale: 0.96, villa: 0.2, villaScale: 1.04, veil: 0.42, fill: 3 },
  { plan: 0.3, planScale: 0.96, wire: 1, wireScale: 1.08, villa: 0.38, villaScale: 1.02, veil: 0.24, fill: 35 },
  { plan: 0.34, planScale: 1, wire: 0.36, wireScale: 0.98, villa: 1, villaScale: 1, veil: 0, fill: 67 },
];

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export const Section04Transformation: React.FC = () => {
  const [active, setActive] = useState(2);
  const scene = SCENES[active];

  const timelineRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [rangeBox, setRangeBox] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const measure = () => {
      const parent = timelineRef.current;
      const first = dotRefs.current[0];
      const last = dotRefs.current[STAGES.length - 1];
      if (!parent || !first || !last) return;
      const p = parent.getBoundingClientRect();
      const f = first.getBoundingClientRect();
      const l = last.getBoundingClientRect();
      const start = f.left + f.width / 2 - p.left;
      const end = l.left + l.width / 2 - p.left;
      setRangeBox({ left: start, width: end - start });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (timelineRef.current) observer.observe(timelineRef.current);
    return () => observer.disconnect();
  }, []);

  const step = useCallback((delta: number) => {
    setActive((v) => (v + delta + STAGES.length) % STAGES.length);
  }, []);

  return (
    <section id="plan-to-place" className="relative w-full overflow-hidden bg-[#081a12] text-[#F0EDE3]">
      {/* Base tone + warm sunset glow */}
      <div className="absolute inset-0 bg-[#081a12]" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_76%_34%,rgba(146,105,54,0.34),rgba(8,26,18,0)_62%)]" />
        <div
          className="absolute inset-0 transition-opacity duration-[900ms]"
          style={{ opacity: scene.villa, transitionTimingFunction: EASE }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/showcase/plan-to-place/villa-golden-hour.webp"
            alt=""
            className="h-full w-full object-cover object-[58%_42%] select-none"
            style={{
              filter: "brightness(1.08) saturate(1.04)",
              transform: `scale(${scene.villaScale})`,
              transition: `transform 900ms ${EASE}`,
            }}
            draggable={false}
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#081a12_0%,rgba(8,26,18,0.94)_24%,rgba(8,26,18,0.55)_50%,rgba(8,26,18,0.08)_72%,rgba(8,26,18,0)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,26,18,0.92)_0%,rgba(8,26,18,0.6)_9%,rgba(8,26,18,0.22)_24%,rgba(8,26,18,0.04)_44%,rgba(8,26,18,0.3)_74%,rgba(8,26,18,0.72)_100%)]" />
        <div
          className="absolute inset-0 bg-[#071710] transition-opacity duration-[900ms]"
          style={{ opacity: scene.veil, transitionTimingFunction: EASE }}
        />
        <div className="absolute right-0 top-0 h-[38%] w-[36%] bg-[radial-gradient(ellipse_at_top_right,rgba(6,20,13,0.9),rgba(6,20,13,0.35)_48%,rgba(6,20,13,0)_72%)]" />
        <div className="pointer-events-none absolute inset-0 paper-grain opacity-[0.05] mix-blend-soft-light" />
      </div>

      {/* Dedicated lower band for controls */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] h-[26%] bg-[linear-gradient(to_top,#071710_8%,rgba(7,23,16,0.72)_48%,rgba(7,23,16,0)_100%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1760px] flex-col px-[4.5vw] pb-6 pt-[6.5rem]">
        {/* Heading block — clear upper-left area */}
        <div className="relative z-20 flex items-start justify-between gap-10">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-4">
              <span className="font-display text-[12px] font-medium tracking-[0.06em] text-[#F0EDE3]/90">04</span>
              <span className="h-px w-[86px] bg-[#F0EDE3]/30" aria-hidden="true" />
              <span className="font-display text-[10px] font-medium uppercase tracking-[0.32em] text-[#F0EDE3]/70 sm:text-[11px]">
                From Plan to Place
              </span>
            </div>
            <h2 className="mt-5 max-w-[36rem] font-accent text-[clamp(2.55rem,4.3vw,4.6rem)] leading-[0.98] tracking-[-0.01em] text-[#F3EFE3]">
              From plans
              <br />
              to living places.
            </h2>
            <p className="mt-4 w-full max-w-[29rem] font-body text-[clamp(0.92rem,1.08vw,1.12rem)] leading-[1.55] text-[#ded7c7]/90">
              We transform your architectural drawings and renders into fully explorable, photorealistic digital environments.
            </p>
          </div>
          <p className="hidden shrink-0 pt-1 text-right font-display text-[9px] font-medium uppercase leading-[1.9] tracking-[0.24em] text-[#F0EDE3]/60 sm:text-[10px] md:block">
            Same vision.
            <br />
            More possibilities.
          </p>
        </div>

        {/* Panoramic transformation stage */}
        <div className="relative z-0 mt-4 min-h-[clamp(240px,30vh,440px)] flex-1 sm:min-h-[clamp(280px,34vh,440px)]" aria-hidden="true">
          {/* 01 — plan */}
          <div
            className="absolute -left-[2vw] bottom-0 h-[26vh] sm:h-[42vh] lg:h-auto lg:w-[31vw] lg:max-w-[600px]"
            style={{
              opacity: scene.plan,
              transform: `scale(${scene.planScale})`,
              transformOrigin: "left center",
              transition: `opacity 800ms ${EASE}, transform 800ms ${EASE}`,
            }}
          >
            <div
              className={`h-full transition-opacity duration-700 lg:opacity-100 ${
                active === 0 ? "opacity-95" : active === 1 ? "opacity-55" : "opacity-30"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/showcase/plan-to-place/floor-plan.webp"
                alt=""
                className="h-full w-auto max-w-none select-none lg:h-auto lg:w-full"
                style={{
                  filter: "brightness(0.88) saturate(0.86) sepia(0.16)",
                  maskImage:
                    "linear-gradient(to right, #000 0%, #000 66%, rgba(0,0,0,0.5) 88%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 6%, #000 94%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to right, #000 0%, #000 66%, rgba(0,0,0,0.5) 88%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 6%, #000 94%, transparent 100%)",
                  maskComposite: "intersect",
                  WebkitMaskComposite: "source-in",
                }}
                draggable={false}
              />
            </div>
          </div>
          {/* 02 — structure */}
          <div
            className="absolute left-[4%] top-[6%] h-[88%] w-[92%] sm:left-[23%] sm:top-[-6%] sm:h-[112%] sm:w-[62%] lg:left-[24%] lg:w-[56%]"
            style={{
              opacity: scene.wire,
              transform: `scale(${scene.wireScale})`,
              transformOrigin: "center center",
              transition: `opacity 800ms ${EASE}, transform 800ms ${EASE}`,
            }}
          >
            <div className={`h-full w-full ${active === 2 ? "opacity-70 lg:opacity-100" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/showcase/plan-to-place/wireframe.webp"
                alt=""
                className="h-full w-full select-none object-contain object-center"
                draggable={false}
              />
            </div>
          </div>
        </div>

        {/* Transformation timeline */}
        <div ref={timelineRef} className="relative z-20 mt-4">
          <div className="absolute left-[13%] right-[8%] top-[7px] h-px bg-[#F0EDE3]/30" aria-hidden="true" />
          <div
            className="absolute left-[13%] top-[7px] h-px bg-[linear-gradient(90deg,rgba(181,213,197,0.55),rgba(246,229,203,0.9))]"
            style={{ width: `${(scene.fill / 100) * 79}%`, transition: `width 700ms ${EASE}` }}
            aria-hidden="true"
          />
          <input
            type="range"
            min={0}
            max={STAGES.length - 1}
            step={1}
            value={active}
            onChange={(e) => setActive(Number(e.target.value))}
            aria-label="Transformation stage"
            aria-valuetext={`${STAGES[active].n} ${STAGES[active].title}`}
            className="absolute top-[-12px] z-30 h-8 cursor-ew-resize appearance-none bg-transparent opacity-0"
            style={rangeBox ? { left: rangeBox.left, width: rangeBox.width } : { left: "10%", width: "84%" }}
          />
          <div className="grid grid-cols-3 gap-2 pl-[13%] pr-[1%] sm:pr-[10%]">
            {STAGES.map((s, i) => (
              <button
                key={s.n}
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={active === i}
                className="group relative pt-5 text-left focus:outline-none"
              >
                <span
                  ref={(el) => {
                    dotRefs.current[i] = el;
                  }}
                  className={`absolute left-[34px] top-[3px] h-[9px] w-[9px] rounded-full transition-all duration-300 ${
                    active === i
                      ? "scale-[1.35] bg-[#F6E7CF] shadow-[0_0_0_7px_rgba(246,231,207,0.08),0_0_24px_7px_rgba(255,206,148,0.55)]"
                      : "bg-[#F0EDE3]/60 group-hover:bg-[#F0EDE3]/90"
                  }`}
                  aria-hidden="true"
                />
                <span className="block font-display text-[8px] font-medium uppercase tracking-[0.06em] text-[#F0EDE3] sm:text-[11px] sm:tracking-[0.2em]">
                  <span className={`mr-1.5 sm:mr-3 ${active === i ? "text-[#F0EDE3]/75" : "text-[#F0EDE3]/45"}`}>{s.n}</span>
                  {s.title}
                </span>
                <span className="mt-1.5 block font-body text-[10px] leading-[1.35] text-[#d7d1c2]/65 sm:mt-2 sm:text-[13px] sm:leading-[1.4]">
                  {s.desc}
                </span>
              </button>
            ))}
          </div>
          <div className="absolute right-0 bottom-0 hidden items-center gap-2.5 lg:flex">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous stage"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F0EDE3]/35 text-[#F0EDE3]/90 transition-colors hover:border-[#B5D5C5]/70 hover:text-[#B5D5C5]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next stage"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F0EDE3]/35 text-[#F0EDE3]/90 transition-colors hover:border-[#B5D5C5]/70 hover:text-[#B5D5C5]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Footer cues */}
        <div className="relative z-20 mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <span className="font-display text-[9px] font-medium uppercase tracking-[0.26em] text-[#F0EDE3]/70 sm:text-[10px]">
              Drag to transform
            </span>
            <span className="hidden h-px w-[170px] bg-[#F0EDE3]/20 sm:block" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2.5 font-display text-[9px] font-medium uppercase tracking-[0.26em] text-[#F0EDE3]/55 sm:flex sm:text-[10px]">
              Scroll to explore
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M12 4v15M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous stage"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#F0EDE3]/35 text-[#F0EDE3]/90 transition-colors hover:border-[#B5D5C5]/70 hover:text-[#B5D5C5]"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next stage"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#F0EDE3]/35 text-[#F0EDE3]/90 transition-colors hover:border-[#B5D5C5]/70 hover:text-[#B5D5C5]"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

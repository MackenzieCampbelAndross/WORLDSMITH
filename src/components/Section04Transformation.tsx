"use client";

import React, { useCallback, useState } from "react";

const STAGES = [
  { n: "01", title: "THE PLAN", desc: "Your architectural drawings" },
  { n: "02", title: "THE STRUCTURE", desc: "A coherent 3D representation" },
  { n: "03", title: "THE EXPERIENCE", desc: "A living, explorable environment" },
];

export const Section04Transformation: React.FC = () => {
  const [active, setActive] = useState(2);

  const step = useCallback((delta: number) => {
    setActive((v) => (v + delta + STAGES.length) % STAGES.length);
  }, []);

  const planOpacity = [1, 0.92, 0.85][active];
  const wireOpacity = [0.55, 0.72, 0.82][active];
  const planShift = (active - 2) * 10;
  const wireShift = (2 - active) * 12;

  return (
    <section id="plan-to-place" className="relative w-full overflow-hidden bg-[#0b2018] text-[#F0EDE3]">
      {/* Golden-hour villa backdrop */}
      <div className="absolute inset-0" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/showcase/plan-to-place/villa-golden-hour.webp"
          alt=""
          className="h-full w-full object-cover object-[58%_42%] select-none"
          style={{ filter: "brightness(1.08) saturate(1.04)" }}
          draggable={false}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0b2018_0%,rgba(11,32,24,0.94)_24%,rgba(11,32,24,0.55)_50%,rgba(11,32,24,0.08)_72%,rgba(11,32,24,0)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,32,24,0.86)_0%,rgba(11,32,24,0.34)_16%,rgba(11,32,24,0.04)_42%,rgba(11,32,24,0.42)_72%,rgba(11,32,24,0.94)_100%)]" />
        <div className="pointer-events-none absolute inset-0 paper-grain opacity-[0.05] mix-blend-soft-light" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1760px] flex-col px-[4.5vw] pb-7 pt-[5.6rem] sm:pt-[6rem]">
        {/* Heading block */}
        <div className="relative z-20 flex items-start justify-between gap-10">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-4">
              <span className="font-display text-[12px] font-medium tracking-[0.06em] text-[#F0EDE3]/90">04</span>
              <span className="h-px w-[86px] bg-[#F0EDE3]/30" aria-hidden="true" />
              <span className="font-display text-[10px] font-medium uppercase tracking-[0.32em] text-[#F0EDE3]/70 sm:text-[11px]">
                From Plan to Place
              </span>
            </div>
            <h2 className="mt-6 font-accent text-[clamp(2.55rem,4.3vw,4.6rem)] leading-[0.98] tracking-[-0.01em] text-[#F3EFE3]">
              From plans
              <br />
              to living places.
            </h2>
            <p className="mt-5 w-full max-w-[29rem] font-body text-[clamp(0.92rem,1.08vw,1.12rem)] leading-[1.55] text-[#ded7c7]/90">
              We transform your architectural drawings and renders into fully explorable, photorealistic digital environments.
            </p>
          </div>
          <p className="hidden shrink-0 pt-1 text-right font-display text-[9px] font-medium uppercase leading-[1.9] tracking-[0.24em] text-[#F0EDE3]/60 sm:text-[10px] md:block">
            Same vision.
            <br />
            More possibilities.
          </p>
        </div>

        {/* Transformation collage */}
        <div className="relative z-0 min-h-[clamp(300px,40vh,540px)] flex-1" aria-hidden="true">
          <div
            className="absolute -left-[6vw] bottom-0 z-0 w-[52%] max-w-[760px] sm:w-[46%] lg:w-[40%]"
            style={{
              opacity: planOpacity,
              transform: `translate3d(${planShift}px,0,0)`,
              maskImage: "linear-gradient(to right, #000 0%, #000 58%, rgba(0,0,0,0.35) 86%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to right, #000 0%, #000 58%, rgba(0,0,0,0.35) 86%, transparent 100%)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/showcase/plan-to-place/floor-plan.webp"
              alt=""
              className="w-full select-none drop-shadow-[0_35px_70px_rgba(0,0,0,0.6)]"
              style={{ filter: "brightness(0.84) saturate(0.85) sepia(0.16)" }}
              draggable={false}
            />
          </div>
          <div
            className="absolute left-[20%] top-[-4%] z-10 w-[72%] max-w-[960px] sm:left-[24%] sm:w-[58%] lg:left-[27%] lg:w-[50%]"
            style={{ opacity: wireOpacity, transform: `translate3d(${wireShift}px,0,0)` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/showcase/plan-to-place/wireframe.webp"
              alt=""
              className="w-full select-none"
              draggable={false}
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="relative z-20 mt-3">
          <div className="absolute left-[13%] right-[8%] top-[7px] h-px bg-[#F0EDE3]/25" aria-hidden="true" />
          <input
            type="range"
            min={0}
            max={STAGES.length - 1}
            step={1}
            value={active}
            onChange={(e) => setActive(Number(e.target.value))}
            aria-label="Transformation stage"
            className="absolute left-[10%] right-[6%] top-[-6px] z-30 h-6 w-[84%] cursor-ew-resize appearance-none bg-transparent opacity-0"
          />
          <div className="grid grid-cols-3 pl-[13%] pr-[10%]">
            {STAGES.map((s, i) => (
              <button
                key={s.n}
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={active === i}
                className="group relative pt-5 text-left focus:outline-none"
              >
                <span
                  className={`absolute left-[34px] top-[3px] h-[9px] w-[9px] rounded-full transition-all duration-300 ${
                    active === i
                      ? "scale-125 bg-[#F6E7CF] shadow-[0_0_0_7px_rgba(246,231,207,0.08),0_0_22px_6px_rgba(255,206,148,0.5)]"
                      : "bg-[#F0EDE3]/65 group-hover:bg-[#F0EDE3]/90"
                  }`}
                  aria-hidden="true"
                />
                <span className="font-display text-[9px] font-medium uppercase tracking-[0.14em] text-[#F0EDE3] sm:text-[11px] sm:tracking-[0.2em]">
                  <span className={`mr-3 ${active === i ? "text-[#F0EDE3]/70" : "text-[#F0EDE3]/45"}`}>{s.n}</span>
                  {s.title}
                </span>
                <span className="mt-2 hidden font-body text-[12px] leading-[1.4] text-[#d7d1c2]/55 sm:block sm:text-[13px]">
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
        <div className="relative z-20 mt-9 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <span className="font-display text-[9px] font-medium uppercase tracking-[0.26em] text-[#F0EDE3]/65 sm:text-[10px]">
              Drag to transform
            </span>
            <span className="hidden h-px w-[170px] bg-[#F0EDE3]/20 sm:block" aria-hidden="true" />
          </div>
          <div className="hidden items-center gap-2.5 font-display text-[9px] font-medium uppercase tracking-[0.26em] text-[#F0EDE3]/50 sm:flex sm:text-[10px]">
            Scroll to explore
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M12 4v15M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

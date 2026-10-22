"use client";

import React, { useState } from "react";

export const PlanToPlace: React.FC = () => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  return (
    <section
      id="plan-to-place"
      className="relative z-20 w-full min-h-screen bg-[#ecece2] text-[#1f6651] py-24 sm:py-32 px-6 sm:px-10 lg:px-14 border-t border-[#1f6651]/15 flex flex-col justify-between overflow-hidden font-body"
    >
      {/* Ivory architectural grid datum lines */}
      <div className="pointer-events-none absolute inset-0 z-0 grid-lines-ivory" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col gap-12 sm:gap-16">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#1f6651]/20 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#1f6651]" aria-hidden="true" />
              <span className="font-display text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] text-[#1f6651]/75 uppercase">
                From Drawing to Experience
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-[#1f6651] tracking-tight">
              From plan to place.
            </h2>
          </div>
          <p className="font-body text-xs sm:text-sm text-[#1f6651]/85 max-w-md leading-relaxed">
            An architectural vision becomes more useful when people can move through it, understand it and imagine themselves there.
          </p>
        </div>

        {/* Interactive Transformation Stage Controls */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2">
          {[
            { step: 1 as const, num: "01", title: "The Source", sub: "Architectural Inputs" },
            { step: 2 as const, num: "02", title: "The Interpretation", sub: "Spatial Structuring" },
            { step: 3 as const, num: "03", title: "The Experience", sub: "Interactive World" },
          ].map((item) => {
            const isActive = activeStep === item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setActiveStep(item.step)}
                className={`flex-1 min-w-[200px] text-left p-4 sm:p-5 rounded-lg border transition-all duration-300 ${
                  isActive
                    ? "bg-[#1f6651] text-[#f0f1e6] border-[#1f6651] shadow-md"
                    : "bg-[#e5e4df]/70 hover:bg-[#deddd7] text-[#1f6651] border-[#1f6651]/20"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-1 opacity-80">
                  <span>{item.num}</span>
                  <span className="text-[10px] uppercase tracking-wider">{item.sub}</span>
                </div>
                <div className="font-display text-base sm:text-lg font-bold">
                  {item.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Transformation Visual Canvas */}
        <div className="relative w-full bg-[#e5e4df]/90 border border-[#1f6651]/20 rounded-xl p-6 sm:p-10 min-h-[460px] sm:min-h-[520px] flex flex-col justify-between overflow-hidden">
          
          {/* Process Flow Line & Markers */}
          <div className="relative w-full mb-6">
            <div className="h-0.5 w-full bg-[#1f6651]/20 relative">
              <div
                className="h-full bg-[#1f6651] transition-all duration-700 ease-out"
                style={{
                  width: activeStep === 1 ? "33%" : activeStep === 2 ? "66%" : "100%",
                }}
              />
            </div>
          </div>

          {/* SVG Animated Transformation Artwork */}
          <div className="relative w-full h-[280px] sm:h-[340px] flex items-center justify-center my-auto">
            <svg
              viewBox="0 0 960 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full max-w-[920px] select-none"
            >
              {/* Common Datum Coordinate Axes */}
              <line x1="60" y1="200" x2="900" y2="200" stroke="#1f6651" strokeOpacity="0.18" strokeDasharray="4 6" />

              {/* ==============================================================
                  STAGE 1: THE SOURCE (Architectural Drafting Assets)
                 ============================================================== */}
              <g
                className="transition-all duration-700 ease-out"
                style={{
                  opacity: activeStep >= 1 ? 1 : 0.25,
                  transform: activeStep === 1 ? "scale(1.03)" : "scale(1)",
                  transformOrigin: "200px 200px",
                }}
              >
                {/* Blueprint Sheet */}
                <rect x="90" y="80" width="220" height="240" rx="4" fill="#ecece2" stroke="#1f6651" strokeWidth="1.2" />
                <rect x="105" y="95" width="190" height="210" fill="none" stroke="#1f6651" strokeOpacity="0.3" strokeDasharray="2 3" />
                
                {/* Plan Linework */}
                <path d="M125 125 H275 V275 H125 Z" stroke="#1f6651" strokeWidth="1.5" fill="rgba(31, 102, 81, 0.04)" />
                <line x1="175" y1="125" x2="175" y2="275" stroke="#1f6651" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="125" y1="200" x2="275" y2="200" stroke="#1f6651" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="200" cy="160" r="14" stroke="#1f6651" strokeWidth="1" fill="none" />
                
                {/* Document Tags */}
                <text x="110" y="112" fill="#1f6651" fontSize="9" fontWeight="600" letterSpacing="0.1em">
                  DWG // ARCHITECTURAL FLOORPLAN
                </text>
                <text x="110" y="300" fill="#1f6651" fontSize="8" fillOpacity="0.7">
                  SCALE 1:100 // VECTOR GEOMETRY
                </text>
              </g>

              {/* Connecting Assembly Transition 1 -> 2 */}
              <path
                d="M320 200 C360 200, 370 200, 410 200"
                stroke="#1f6651"
                strokeWidth="1.5"
                strokeDasharray={activeStep >= 2 ? "none" : "4 4"}
                strokeOpacity={activeStep >= 2 ? 0.9 : 0.3}
                className="transition-all duration-500"
              />

              {/* ==============================================================
                  STAGE 2: THE INTERPRETATION (Aligned Axonometric Projection)
                 ============================================================== */}
              <g
                className="transition-all duration-700 ease-out"
                style={{
                  opacity: activeStep >= 2 ? 1 : 0.25,
                  transform: activeStep === 2 ? "scale(1.04)" : "scale(1)",
                  transformOrigin: "480px 200px",
                }}
              >
                {/* Lower Plate */}
                <polygon points="480,240 560,285 480,330 400,285" fill="#ecece2" stroke="#1f6651" strokeWidth="1.3" />
                
                {/* Vertical Spatial Extrusion Riser Lines */}
                <line x1="400" y1="285" x2="400" y2="185" stroke="#1f6651" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.6" />
                <line x1="560" y1="285" x2="560" y2="185" stroke="#1f6651" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.6" />
                <line x1="480" y1="330" x2="480" y2="230" stroke="#1f6651" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.6" />
                <line x1="480" y1="240" x2="480" y2="140" stroke="#1f6651" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.6" />

                {/* Mid Plate */}
                <polygon points="480,185 560,230 480,275 400,230" fill="#1f6651" fillOpacity="0.1" stroke="#1f6651" strokeWidth="1.2" />

                {/* Upper Plate */}
                <polygon points="480,130 560,175 480,220 400,175" fill="#ecece2" stroke="#1f6651" strokeWidth="1.4" />

                {/* Stage Tag */}
                <text x="480" y="360" textAnchor="middle" fill="#1f6651" fontSize="9" fontWeight="600" letterSpacing="0.14em">
                  SPATIAL VOLUMETRIC STRUCTURING
                </text>
              </g>

              {/* Connecting Assembly Transition 2 -> 3 */}
              <path
                d="M570 200 C610 200, 620 200, 660 200"
                stroke="#1f6651"
                strokeWidth="1.5"
                strokeDasharray={activeStep === 3 ? "none" : "4 4"}
                strokeOpacity={activeStep === 3 ? 0.9 : 0.3}
                className="transition-all duration-500"
              />

              {/* ==============================================================
                  STAGE 3: THE EXPERIENCE (Resolved Navigable Residence)
                 ============================================================== */}
              <g
                className="transition-all duration-700 ease-out"
                style={{
                  opacity: activeStep === 3 ? 1 : 0.3,
                  transform: activeStep === 3 ? "scale(1.05)" : "scale(1)",
                  transformOrigin: "760px 200px",
                }}
              >
                {/* Fully Unified Solid Axonometric Mass */}
                <polygon points="680,220 760,265 760,150 680,105" fill="#1f6651" stroke="#1f6651" strokeWidth="1.2" />
                <polygon points="760,265 840,220 840,105 760,150" fill="#184834" stroke="#1f6651" strokeWidth="1.2" />
                <polygon points="680,105 760,150 840,105 760,60" fill="#206046" stroke="#1f6651" strokeWidth="1.4" />
                
                {/* Balcony Overhang & Glass Fenestration Lines */}
                <polygon points="670,145 760,195 760,185 670,135" fill="#ecece2" stroke="#1f6651" strokeWidth="0.8" />
                <polygon points="760,195 850,145 850,135 760,185" fill="#ecece2" stroke="#1f6651" strokeWidth="0.8" />
                
                {/* Radiating Interaction Pulse Node */}
                <circle cx="760" cy="150" r="6" fill="#ecece2" stroke="#1f6651" strokeWidth="1.5" />
                <circle cx="760" cy="150" r="14" fill="none" stroke="#1f6651" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

                {/* Stage Tag */}
                <text x="760" y="305" textAnchor="middle" fill="#1f6651" fontSize="9" fontWeight="600" letterSpacing="0.14em">
                  INTERACTIVE PROPERTY EXPERIENCE
                </text>
              </g>
            </svg>
          </div>

          {/* Bottom Explanation Sub-bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-[#1f6651]/15 text-xs text-[#1f6651]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              {activeStep === 1 && "Stage 01: Ingesting CAD, 2D Floorplans, Site Elevations & Renderings"}
              {activeStep === 2 && "Stage 02: Correlating Spatial Datum, Floorplates & Axonometric Massing"}
              {activeStep === 3 && "Stage 03: Delivering Zero-Install Responsive Web Experience"}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#1f6651]/75">
              Automated Transformation Pipeline
            </span>
          </div>

        </div>

        {/* Supporting 3-Column Editorial Statements */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 pt-4">
          <div className="border-t border-[#1f6651]/20 pt-6">
            <span className="font-display text-xs font-bold text-[#1f6651] tracking-widest block mb-2">
              01 — Work with the assets you already have.
            </span>
            <p className="font-body text-xs sm:text-sm text-[#1f6651]/80 leading-relaxed font-normal">
              No need for unbudgeted game-engine rebuilds. WorldSmith utilizes existing blueprints, CAD models, BIM files, and architectural renders directly.
            </p>
          </div>

          <div className="border-t border-[#1f6651]/20 pt-6">
            <span className="font-display text-xs font-bold text-[#1f6651] tracking-widest block mb-2">
              02 — Bring the project together as a coherent spatial experience.
            </span>
            <p className="font-body text-xs sm:text-sm text-[#1f6651]/80 leading-relaxed font-normal">
              Disconnect between scattered renders and flat PDFs is eliminated. The entire precinct, its towers, grounds, and residences unite into a singular connected space.
            </p>
          </div>

          <div className="border-t border-[#1f6651]/20 pt-6">
            <span className="font-display text-xs font-bold text-[#1f6651] tracking-widest block mb-2">
              03 — Give buyers a way to explore before visiting.
            </span>
            <p className="font-body text-xs sm:text-sm text-[#1f6651]/80 leading-relaxed font-normal">
              Prospective purchasers can understand daylight orientation, private outdoor terraces, and amenity proximities before setting foot in a physical sales suite.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

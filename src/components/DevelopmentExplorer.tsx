"use client";

import React, { useState } from "react";

type HierarchyLevel = "development" | "building" | "floor" | "residence" | "interior";

interface LevelDetail {
  id: HierarchyLevel;
  tag: string;
  title: string;
  scale: string;
  context: string;
  description: string;
}

const HIERARCHY_DATA: Record<HierarchyLevel, LevelDetail> = {
  development: {
    id: "development",
    tag: "LEVEL 01",
    title: "Masterplanned Development",
    scale: "1:2500 Master Plan",
    context: "Aethelgard Precinct // 140,000 SQ.M Site",
    description: "Inspect the master development envelope, vehicular access points, central landscaped courtyards, and relationships between all three residential massings.",
  },
  building: {
    id: "building",
    tag: "LEVEL 02",
    title: "Residence B / Central Landmark Tower",
    scale: "1:500 Axonometric Volume",
    context: "12 Storeys // 56 Sky Residences",
    description: "Focus on the landmark tower massing, solar penetration, wind-buffering podium, double-height lobby, and vertical floor plate segmentation.",
  },
  floor: {
    id: "floor",
    tag: "LEVEL 03",
    title: "Level 08 Floor Plate",
    scale: "1:200 Floor Distribution",
    context: "4 Corner Residences // Central Core Lift Lobby",
    description: "Analyze the level plate distribution, dual-aspect corner geometry, acoustic boundary partitions, and direct elevator core access.",
  },
  residence: {
    id: "residence",
    tag: "LEVEL 04",
    title: "Residence 802 — 3 Bedroom Sky Suite",
    scale: "1:100 Architectural Layout",
    context: "168 SQ.M Interior + 34 SQ.M Terrace",
    description: "Review detailed room layout, kitchen island spatial flow, master suite orientation, and seamless connection to the southwest corner balcony.",
  },
  interior: {
    id: "interior",
    tag: "LEVEL 05",
    title: "Living Pavilion & Sunset Terrace",
    scale: "1:25 Human Scale Experience",
    context: "Floor-to-Ceiling 3.1m Glazing",
    description: "Experience spatial volume at eye-level: evaluate natural afternoon light fall, ceiling heights, timber joinery finishes, and terrace vista depths.",
  },
};

const LEVELS: HierarchyLevel[] = ["development", "building", "floor", "residence", "interior"];

export const DevelopmentExplorer: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<HierarchyLevel>("development");

  const current = HIERARCHY_DATA[selectedLevel];
  const currentIndex = LEVELS.indexOf(selectedLevel);

  return (
    <section
      id="hierarchy-explorer"
      className="relative z-20 w-full min-h-screen bg-[#1f5e44] text-[#f0f1e6] py-24 sm:py-32 px-6 sm:px-10 lg:px-14 border-t border-[#a8cebc]/20 flex flex-col justify-between overflow-hidden font-body"
    >
      {/* Vertical architectural grid datum lines */}
      <div className="pointer-events-none absolute inset-0 z-0 grid-lines" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col gap-12 sm:gap-14">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#a8cebc]/20 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#d0e5d3]" aria-hidden="true" />
              <span className="font-display text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] text-[#a8cebc] uppercase">
                Connected Spatial Exploration
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-[#f0f1e6] tracking-tight">
              Every layer. <span className="font-accent italic font-normal text-[#d0e5d3]">One connected world.</span>
            </h2>
          </div>
          <p className="font-body text-xs sm:text-sm text-[#a8cebc]/85 max-w-md leading-relaxed">
            Move from the wider development into individual spaces without losing the context of the place around them.
          </p>
        </div>

        {/* Hierarchy Progress Breadcrumb / Step Switcher */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 border-b border-[#a8cebc]/20">
          {LEVELS.map((lvl, index) => {
            const isSelected = selectedLevel === lvl;
            const isPast = currentIndex > index;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`flex items-center gap-2.5 py-2.5 px-3 sm:px-4 rounded-full transition-all duration-200 shrink-0 text-xs font-semibold tracking-wider ${
                  isSelected
                    ? "bg-[#25231b] text-[#f0f1e6] border border-[#a8cebc]/40 shadow-sm"
                    : isPast
                    ? "text-[#f0f1e6] hover:bg-[#184834]"
                    : "text-[#a8cebc]/60 hover:text-[#f0f1e6]"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? "bg-[#d0e5d3]" : isPast ? "bg-[#a8cebc]" : "bg-[#a8cebc]/30"
                  }`}
                />
                <span className="uppercase">{lvl}</span>
                {index < LEVELS.length - 1 && (
                  <span className="text-[#a8cebc]/40 ml-1 font-normal select-none">→</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Interactive Explorer Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Main Visual Display (8 Columns) */}
          <div className="lg:col-span-8 bg-[#184834]/60 border border-[#a8cebc]/25 rounded-lg p-6 sm:p-8 flex flex-col justify-between min-h-[460px] sm:min-h-[520px] relative overflow-hidden">
            
            {/* Stage Level Top Overlay */}
            <div className="flex items-center justify-between z-20">
              <span className="text-[11px] font-semibold text-[#a8cebc] tracking-wider uppercase">
                {current.scale}
              </span>
              <div className="flex items-center gap-2">
                {currentIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedLevel(LEVELS[currentIndex - 1])}
                    className="px-3 py-1 rounded bg-[#133b2a] border border-[#a8cebc]/20 text-[11px] font-semibold text-[#d0e5d3] hover:text-[#f0f1e6] transition-colors"
                  >
                    ← Zoom Out to {LEVELS[currentIndex - 1].toUpperCase()}
                  </button>
                )}
                {currentIndex < LEVELS.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setSelectedLevel(LEVELS[currentIndex + 1])}
                    className="px-3 py-1 rounded bg-[#133b2a] border border-[#a8cebc]/20 text-[11px] font-semibold text-[#d0e5d3] hover:text-[#f0f1e6] transition-colors"
                  >
                    Drill Down to {LEVELS[currentIndex + 1].toUpperCase()} →
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic Architectural SVG Rendering for Selected Hierarchy State */}
            <div className="relative w-full h-[320px] sm:h-[380px] my-auto flex items-center justify-center">
              <svg
                viewBox="0 0 800 440"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full max-w-[760px] select-none"
              >
                {/* STATE 1: DEVELOPMENT */}
                {selectedLevel === "development" && (
                  <g className="transition-all duration-500">
                    <polygon points="400,60 720,230 400,400 80,230" stroke="#a8cebc" strokeWidth="1" strokeDasharray="3 3" fill="none" />
                    <ellipse cx="400" cy="230" rx="70" ry="35" stroke="#d0e5d3" strokeWidth="1" fill="none" strokeDasharray="2 3" />
                    <text x="400" y="234" textAnchor="middle" fill="#a8cebc" fontSize="9" letterSpacing="0.15em">COMMUNAL PARK</text>
                    {/* Massing A */}
                    <polygon points="200,190 280,235 210,270 130,225" fill="#133b2a" stroke="#a8cebc" strokeWidth="1" />
                    <polygon points="130,225 210,270 210,200 130,155" fill="#164230" stroke="#a8cebc" strokeWidth="1" />
                    <polygon points="210,270 280,235 280,165 210,200" fill="#1a4f39" stroke="#a8cebc" strokeWidth="1" />
                    <text x="210" y="295" textAnchor="middle" fill="#a8cebc" fontSize="9">RESIDENCE A</text>
                    {/* Massing B (Tower) */}
                    <polygon points="360,160 440,205 440,90 360,45" fill="#184834" stroke="#d0e5d3" strokeWidth="1.2" />
                    <polygon points="440,205 520,160 520,45 440,90" fill="#1c553d" stroke="#d0e5d3" strokeWidth="1.2" />
                    <polygon points="360,45 440,90 520,45 440,0" fill="#206046" stroke="#f0f1e6" strokeWidth="1.4" />
                    <circle cx="440" cy="90" r="5" fill="#d0e5d3" />
                    <text x="440" y="225" textAnchor="middle" fill="#f0f1e6" fontSize="10" fontWeight="600">RESIDENCE B (SELECTED)</text>
                    {/* Massing C */}
                    <polygon points="570,190 650,235 580,270 500,225" fill="#133b2a" stroke="#a8cebc" strokeWidth="1" />
                    <polygon points="500,225 580,270 580,200 500,155" fill="#164230" stroke="#a8cebc" strokeWidth="1" />
                    <polygon points="580,270 650,235 650,165 580,200" fill="#1a4f39" stroke="#a8cebc" strokeWidth="1" />
                    <text x="580" y="295" textAnchor="middle" fill="#a8cebc" fontSize="9">RESIDENCE C</text>
                  </g>
                )}

                {/* STATE 2: BUILDING */}
                {selectedLevel === "building" && (
                  <g className="transition-all duration-500">
                    {/* Focused Tower Axonometric */}
                    <polygon points="260,340 400,420 540,340 400,260" fill="none" stroke="#a8cebc" strokeWidth="1" strokeDasharray="3 3" />
                    {/* Lower Tower Base */}
                    <polygon points="280,310 400,380 400,270 280,200" fill="#133b2a" stroke="#a8cebc" strokeWidth="1.2" />
                    <polygon points="400,380 520,310 520,200 400,270" fill="#184834" stroke="#a8cebc" strokeWidth="1.2" />
                    {/* Target Floor L08 Highlighted Plate */}
                    <g className="animate-pulse">
                      <polygon points="280,180 400,248 400,225 280,157" fill="#d0e5d3" fillOpacity="0.4" stroke="#f0f1e6" strokeWidth="1.5" />
                      <polygon points="400,248 520,180 520,157 400,225" fill="#d0e5d3" fillOpacity="0.5" stroke="#f0f1e6" strokeWidth="1.5" />
                      <line x1="400" y1="237" x2="620" y2="237" stroke="#d0e5d3" strokeWidth="1" strokeDasharray="2 3" />
                      <text x="625" y="240" fill="#f0f1e6" fontSize="10" fontWeight="600">LEVEL 08 PLATE (SELECTED)</text>
                    </g>
                    {/* Upper Tower */}
                    <polygon points="280,150 400,218 400,105 280,37" fill="#184834" stroke="#a8cebc" strokeWidth="1.2" />
                    <polygon points="400,218 520,150 520,37 400,105" fill="#1c553d" stroke="#a8cebc" strokeWidth="1.2" />
                    <polygon points="280,37 400,105 520,37 400,-31" fill="#206046" stroke="#f0f1e6" strokeWidth="1.3" />
                  </g>
                )}

                {/* STATE 3: FLOOR */}
                {selectedLevel === "floor" && (
                  <g className="transition-all duration-500">
                    {/* Floorplate Plan Layout */}
                    <polygon points="400,50 640,190 400,330 160,190" fill="#133b2a" stroke="#d0e5d3" strokeWidth="1.5" />
                    {/* Lift Core */}
                    <polygon points="400,150 460,185 400,220 340,185" fill="#1c553d" stroke="#a8cebc" strokeWidth="1.2" />
                    <text x="400" y="188" textAnchor="middle" fill="#a8cebc" fontSize="8">CORE LIFTS</text>
                    {/* Residence Quadrants */}
                    <line x1="160" y1="190" x2="340" y2="185" stroke="#a8cebc" strokeWidth="1" strokeDasharray="2 3" />
                    <line x1="640" y1="190" x2="460" y2="185" stroke="#a8cebc" strokeWidth="1" strokeDasharray="2 3" />
                    <line x1="400" y1="50" x2="400" y2="150" stroke="#a8cebc" strokeWidth="1" strokeDasharray="2 3" />
                    <line x1="400" y1="330" x2="400" y2="220" stroke="#a8cebc" strokeWidth="1" strokeDasharray="2 3" />
                    
                    {/* Selected Suite 802 (Southwest Quadrant) */}
                    <polygon points="400,220 400,330 160,190 340,185" fill="#d0e5d3" fillOpacity="0.25" stroke="#f0f1e6" strokeWidth="1.8" />
                    <text x="320" y="270" textAnchor="middle" fill="#f0f1e6" fontSize="11" fontWeight="600">SUITE 802 (SELECTED)</text>
                    <text x="480" y="270" textAnchor="middle" fill="#a8cebc" fontSize="9">Suite 801</text>
                    <text x="320" y="110" textAnchor="middle" fill="#a8cebc" fontSize="9">Suite 803</text>
                    <text x="480" y="110" textAnchor="middle" fill="#a8cebc" fontSize="9">Suite 804</text>
                  </g>
                )}

                {/* STATE 4: RESIDENCE */}
                {selectedLevel === "residence" && (
                  <g className="transition-all duration-500">
                    {/* 2D Architectural Layout of Suite 802 */}
                    <rect x="180" y="50" width="440" height="320" rx="4" fill="#133b2a" stroke="#d0e5d3" strokeWidth="1.8" />
                    {/* Southwest Corner Balcony */}
                    <rect x="180" y="50" width="120" height="90" fill="#1c553d" stroke="#a8cebc" strokeWidth="1.2" strokeDasharray="3 3" />
                    <text x="240" y="100" textAnchor="middle" fill="#d0e5d3" fontSize="9" fontWeight="600">OUTDOOR TERRACE</text>
                    
                    {/* Living Pavilion (Selected Interior Zone) */}
                    <rect x="310" y="50" width="310" height="180" fill="#d0e5d3" fillOpacity="0.2" stroke="#f0f1e6" strokeWidth="1.5" />
                    <text x="465" y="145" textAnchor="middle" fill="#f0f1e6" fontSize="12" fontWeight="600">LIVING & DINING PAVILION</text>
                    <text x="465" y="165" textAnchor="middle" fill="#d0e5d3" fontSize="9">Click to Enter Interior Space</text>

                    {/* Bedrooms */}
                    <rect x="180" y="150" width="120" height="110" fill="#184834" stroke="#a8cebc" strokeWidth="1" />
                    <text x="240" y="210" textAnchor="middle" fill="#a8cebc" fontSize="9">BEDROOM 02</text>
                    <rect x="180" y="260" width="120" height="110" fill="#184834" stroke="#a8cebc" strokeWidth="1" />
                    <text x="240" y="320" textAnchor="middle" fill="#a8cebc" fontSize="9">BEDROOM 03</text>
                    <rect x="310" y="240" width="310" height="130" fill="#164230" stroke="#a8cebc" strokeWidth="1" />
                    <text x="465" y="310" textAnchor="middle" fill="#a8cebc" fontSize="10">PRIMARY SUITE + ENSUITE</text>
                  </g>
                )}

                {/* STATE 5: INTERIOR */}
                {selectedLevel === "interior" && (
                  <g className="transition-all duration-500">
                    {/* Human Scale Spatial Perspective Viewport */}
                    <polygon points="120,40 680,40 680,380 120,380" fill="#133b2a" stroke="#d0e5d3" strokeWidth="1.5" />
                    {/* Perspective Horizon and Room Lines */}
                    <polygon points="260,120 540,120 540,300 260,300" fill="#184834" stroke="#a8cebc" strokeWidth="1" />
                    {/* Corner Horizon Vanishing Rays */}
                    <line x1="120" y1="40" x2="260" y2="120" stroke="#a8cebc" strokeWidth="1" />
                    <line x1="680" y1="40" x2="540" y2="120" stroke="#a8cebc" strokeWidth="1" />
                    <line x1="120" y1="380" x2="260" y2="300" stroke="#a8cebc" strokeWidth="1" />
                    <line x1="680" y1="380" x2="540" y2="300" stroke="#a8cebc" strokeWidth="1" />
                    
                    {/* Large Floor-to-Ceiling Glazed Facade on Left */}
                    <line x1="180" y1="75" x2="180" y2="345" stroke="#d0e5d3" strokeWidth="1.5" />
                    <line x1="220" y1="98" x2="220" y2="322" stroke="#d0e5d3" strokeWidth="1.5" />
                    <text x="170" y="200" fill="#d0e5d3" fontSize="9" transform="rotate(-90 170 200)" letterSpacing="0.1em">
                      3.1M HIGH GLAZING // NATURAL LIGHT PATH
                    </text>

                    {/* Timber Joinery Island & Furniture Mass */}
                    <polygon points="340,240 460,240 480,280 320,280" fill="#206046" stroke="#f0f1e6" strokeWidth="1.2" />
                    <text x="400" y="264" textAnchor="middle" fill="#f0f1e6" fontSize="9" fontWeight="600">ISLAND JOINERY</text>

                    <text x="400" y="340" textAnchor="middle" fill="#a8cebc" fontSize="10">
                      EYE-LEVEL HUMAN SCALE PERSPECTIVE (1.7M ELEVATION)
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Stage Footer Status */}
            <div className="flex items-center justify-between z-20 pt-3 border-t border-[#a8cebc]/15 text-[10px] sm:text-[11px] text-[#a8cebc]">
              <span>Context: {current.context}</span>
              <span className="text-[#d0e5d3] font-semibold">{current.tag} OF 05</span>
            </div>
          </div>

          {/* Right Information & Layer Navigator (4 Columns) */}
          <div className="lg:col-span-4 bg-[#184834]/80 border border-[#a8cebc]/25 rounded-lg p-6 sm:p-7 flex flex-col justify-between min-h-[460px] sm:min-h-[520px]">
            <div>
              <span className="px-2.5 py-1 rounded-full bg-[#133b2a] border border-[#a8cebc]/25 text-[10px] font-semibold tracking-wider text-[#d0e5d3] uppercase block w-fit mb-3">
                {current.tag}
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#f0f1e6] tracking-tight mb-2">
                {current.title}
              </h3>
              <p className="font-body text-xs text-[#a8cebc]/90 leading-relaxed font-normal mb-6">
                {current.description}
              </p>

              {/* Connected Hierarchy Stack */}
              <div className="space-y-2 border-t border-[#a8cebc]/20 pt-5">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a8cebc] mb-2">
                  Spatial Continuum
                </span>
                {LEVELS.map((lvl, idx) => {
                  const item = HIERARCHY_DATA[lvl];
                  const isSelected = selectedLevel === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSelectedLevel(lvl)}
                      className={`w-full flex items-center justify-between p-2.5 rounded transition-all text-left text-xs ${
                        isSelected
                          ? "bg-[#25231b] text-[#f0f1e6] border border-[#d0e5d3]/40"
                          : "text-[#a8cebc]/70 hover:bg-[#133b2a] hover:text-[#f0f1e6]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] opacity-60">0{idx + 1}</span>
                        <span className="font-semibold uppercase tracking-wider">{item.id}</span>
                      </div>
                      <span className="text-[10px] opacity-75">{item.scale}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Context Notice */}
            <div className="pt-6 border-t border-[#a8cebc]/20 mt-6">
              <p className="text-[11px] text-[#a8cebc]/80 leading-relaxed">
                Demonstration model: all spatial geometries operate in a shared coordinate benchmark, allowing continuous zoom without page reload.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

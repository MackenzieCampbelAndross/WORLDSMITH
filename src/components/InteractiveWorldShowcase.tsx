"use client";

import React, { useState } from "react";

interface BuildingData {
  id: "bldgA" | "bldgB" | "bldgC";
  name: string;
  type: string;
  footprint: string;
  height: string;
  residences: string;
  levels: {
    tag: string;
    label: string;
    desc: string;
  }[];
  notes: string;
}

const BUILDINGS: Record<"bldgA" | "bldgB" | "bldgC", BuildingData> = {
  bldgA: {
    id: "bldgA",
    name: "RESIDENCE A",
    type: "Terraced Western Pavilion",
    footprint: "4,200 SQ.M GFA",
    height: "5 Storeys // 18.5m",
    residences: "24 Dual-Aspect Terraced Homes",
    levels: [
      { tag: "L05", label: "Penthouse Terraces", desc: "Cantilevered biophilic pergolas with panoramic courtyard sightlines." },
      { tag: "L02-04", label: "Stepped Residences", desc: "Private stepped garden verandas with integrated thermal shading." },
      { tag: "L01", label: "Ground Garden Suites", desc: "Direct walkout access to the communal western orchard." },
    ],
    notes: "Designed with low-rise tiered masses to maximize solar penetration across the central communal plaza.",
  },
  bldgB: {
    id: "bldgB",
    name: "RESIDENCE B",
    type: "Central Landmark Tower",
    footprint: "8,900 SQ.M GFA",
    height: "12 Storeys // 42.0m",
    residences: "56 Panoramic Sky Residences",
    levels: [
      { tag: "L11-12", label: "Sky Lounge & Crown", desc: "Aero-foil viewing canopy, private dining gallery, and observation terrace." },
      { tag: "L04-10", label: "Tower Plate Residences", desc: "Double-glazed corner residences with seamless continuous balconies." },
      { tag: "L01-03", label: "Podium & Wellness Core", desc: "Double-height lobby, lap pool, fitness pavilion, and concierge desk." },
    ],
    notes: "Vertical architectural anchor positioned to create a natural wind-deflection envelope for the plaza.",
  },
  bldgC: {
    id: "bldgC",
    name: "RESIDENCE C",
    type: "Courtyard Eastern Wing",
    footprint: "5,400 SQ.M GFA",
    height: "7 Storeys // 24.5m",
    residences: "36 Garden View Apartments",
    levels: [
      { tag: "L06-07", label: "Upper Atelier Penthouses", desc: "High-ceiling loft residences with skylit internal lightwells." },
      { tag: "L02-05", label: "Courtyard Residences", desc: "Acoustically isolated family layouts overlooking reflective water gardens." },
      { tag: "L01", label: "Arcade & Resident Commons", desc: "Sheltered colonnade connecting directly to the central cafe pavilion." },
    ],
    notes: "Oriented along a north-south datum line to provide morning light and sound buffering from surrounding streets.",
  },
};

export const InteractiveWorldShowcase: React.FC = () => {
  const [selectedBuilding, setSelectedBuilding] = useState<"bldgA" | "bldgB" | "bldgC">("bldgB");
  const [hoveredBuilding, setHoveredBuilding] = useState<"bldgA" | "bldgB" | "bldgC" | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "plates" | "specs">("overview");

  // Determine which building is highlighted/exploded
  const activeId = hoveredBuilding || selectedBuilding;
  const currentData = BUILDINGS[selectedBuilding];

  return (
    <section
      id="interactive-showcase"
      className="relative z-20 w-full min-h-screen bg-[#1f5e44] text-[#f0f1e6] py-24 sm:py-32 px-6 sm:px-10 lg:px-14 border-t border-[#a8cebc]/20 flex flex-col justify-between overflow-hidden font-body"
    >
      {/* Subtle vertical architectural grid datum lines */}
      <div className="pointer-events-none absolute inset-0 z-0 grid-lines" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col gap-12">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#a8cebc]/20 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#d0e5d3]" aria-hidden="true" />
              <span className="font-display text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] text-[#a8cebc] uppercase">
                Interactive Property Experience
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-[#f0f1e6] tracking-tight">
              Don’t just see the property. <span className="font-accent italic font-normal text-[#d0e5d3]">Enter it.</span>
            </h2>
          </div>
          <p className="font-body text-xs sm:text-sm text-[#a8cebc]/85 max-w-md leading-relaxed">
            Explore a connected architectural world, from the wider development down to its buildings, residences and shared spaces.
          </p>
        </div>

        {/* Interactive Workspace Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Canvas: Expansive Architectural Viewport (8 Columns) */}
          <div className="lg:col-span-8 relative bg-[#184834]/60 border border-[#a8cebc]/25 rounded-lg p-4 sm:p-8 flex flex-col justify-between min-h-[480px] sm:min-h-[580px] overflow-hidden">
            
            {/* Viewport Top Utilities & Selectors */}
            <div className="flex flex-wrap items-center justify-between gap-4 z-20">
              {/* Building Selectors */}
              <div className="inline-flex items-center p-1 rounded-full bg-[#133b2a]/90 border border-[#a8cebc]/20" role="tablist">
                {(["bldgA", "bldgB", "bldgC"] as const).map((id) => {
                  const b = BUILDINGS[id];
                  const isSelected = selectedBuilding === id;
                  return (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => setSelectedBuilding(id)}
                      onMouseEnter={() => setHoveredBuilding(id)}
                      onMouseLeave={() => setHoveredBuilding(null)}
                      className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#d0e5d3] ${
                        isSelected
                          ? "bg-[#25231b] text-[#f0f1e6] shadow-sm"
                          : "text-[#a8cebc] hover:text-[#f0f1e6]"
                      }`}
                    >
                      {b.name}
                    </button>
                  );
                })}
              </div>

              {/* Viewport Status Indicator */}
              <div className="flex items-center gap-2 text-[10px] font-medium tracking-wider text-[#a8cebc]/75">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a8cebc] animate-pulse" />
                <span>AXONOMETRIC MODEL // EXPLODE ON HOVER / TAP</span>
              </div>
            </div>

            {/* Central Precision SVG Architectural Model */}
            <div className="relative w-full h-[360px] sm:h-[440px] my-auto flex items-center justify-center">
              <svg
                viewBox="0 0 900 520"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full max-w-[840px] overflow-visible select-none"
              >
                <defs>
                  <pattern id="showcaseHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="6" stroke="#a8cebc" strokeWidth="0.5" strokeOpacity="0.2" />
                  </pattern>
                </defs>

                {/* Ground Plane Isometric Grid & Datum Axes */}
                <g stroke="#a8cebc" strokeOpacity="0.2" strokeWidth="1">
                  <polygon points="450,80 820,290 450,500 80,290" fill="none" strokeDasharray="4 4" />
                  <line x1="80" y1="290" x2="820" y2="290" strokeDasharray="2 6" />
                  <line x1="450" y1="80" x2="450" y2="500" strokeDasharray="2 6" />
                  {/* Plaza center oval */}
                  <ellipse cx="450" cy="310" rx="90" ry="45" fill="none" stroke="#d0e5d3" strokeOpacity="0.3" strokeDasharray="3 3" />
                  <text x="450" y="314" textAnchor="middle" fill="#a8cebc" fontSize="9" letterSpacing="0.18em" fillOpacity="0.6">
                    CENTRAL CIVIC PLAZA
                  </text>
                </g>

                {/* ==============================================================
                    BUILDING A: Terraced Western Pavilion (Left: x~230, y~260)
                   ============================================================== */}
                <g
                  className="cursor-pointer transition-all duration-500 ease-out"
                  onClick={() => setSelectedBuilding("bldgA")}
                  onMouseEnter={() => setHoveredBuilding("bldgA")}
                  onMouseLeave={() => setHoveredBuilding(null)}
                  style={{
                    opacity: activeId === "bldgA" ? 1 : 0.38,
                  }}
                >
                  {/* Ground Footprint */}
                  <polygon points="230,230 330,285 240,335 140,280" fill="url(#showcaseHatch)" stroke="#a8cebc" strokeWidth="1" strokeDasharray="2 2" />

                  {/* Level 1: Ground suites */}
                  <g className="transition-transform duration-500" style={{ transform: activeId === "bldgA" ? "translateY(-8px)" : "translateY(0)" }}>
                    <polygon points="140,265 240,320 240,290 140,235" fill="#133b2a" fillOpacity="0.75" stroke="#a8cebc" strokeWidth="1" />
                    <polygon points="240,320 330,270 330,240 240,290" fill="#184834" fillOpacity="0.85" stroke="#a8cebc" strokeWidth="1" />
                    <polygon points="140,235 240,290 330,240 230,185" fill="#1c553d" fillOpacity="0.7" stroke="#a8cebc" strokeWidth="1" />
                  </g>

                  {/* Level 2-4: Stepped Terraces (Explodes upward) */}
                  <g className="transition-transform duration-500" style={{ transform: activeId === "bldgA" ? "translateY(-34px)" : "translateY(0)" }}>
                    {activeId === "bldgA" && (
                      <line x1="160" y1="235" x2="160" y2="201" stroke="#d0e5d3" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
                    )}
                    <polygon points="160,205 240,250 240,225 160,180" fill="#143d2c" stroke="#a8cebc" strokeWidth="1.1" />
                    <polygon points="240,250 310,210 310,185 240,225" fill="#1a4f39" stroke="#a8cebc" strokeWidth="1.1" />
                    <polygon points="160,180 240,225 310,185 230,140" fill="#206046" stroke="#d0e5d3" strokeWidth="1.2" />
                    {/* Window rhythm */}
                    <line x1="180" y1="195" x2="180" y2="210" stroke="#d0e5d3" strokeWidth="0.8" opacity="0.7" />
                    <line x1="200" y1="205" x2="200" y2="220" stroke="#d0e5d3" strokeWidth="0.8" opacity="0.7" />
                    <line x1="260" y1="230" x2="260" y2="245" stroke="#d0e5d3" strokeWidth="0.8" opacity="0.7" />
                    <line x1="285" y1="215" x2="285" y2="230" stroke="#d0e5d3" strokeWidth="0.8" opacity="0.7" />
                  </g>

                  {/* Level 5: Penthouse Crown & Pergola (Explodes further) */}
                  <g className="transition-transform duration-500" style={{ transform: activeId === "bldgA" ? "translateY(-62px)" : "translateY(0)" }}>
                    <polygon points="180,160 230,188 230,170 180,142" fill="#184834" stroke="#d0e5d3" strokeWidth="1" />
                    <polygon points="230,188 290,154 290,136 230,170" fill="#206046" stroke="#d0e5d3" strokeWidth="1" />
                    <polygon points="180,142 230,170 290,136 240,108" fill="#d0e5d3" fillOpacity="0.25" stroke="#f0f1e6" strokeWidth="1.3" />
                  </g>

                  {/* Building Label Tag */}
                  <text x="235" y="355" textAnchor="middle" fill={selectedBuilding === "bldgA" ? "#f0f1e6" : "#a8cebc"} fontSize="11" fontWeight="600" letterSpacing="0.12em">
                    RESIDENCE A
                  </text>
                  <text x="235" y="370" textAnchor="middle" fill="#a8cebc" fontSize="9" opacity="0.8">
                    Terraced Pavilion
                  </text>
                </g>

                {/* ==============================================================
                    BUILDING B: Central Landmark Tower (Center: x~450, y~220)
                   ============================================================== */}
                <g
                  className="cursor-pointer transition-all duration-500 ease-out"
                  onClick={() => setSelectedBuilding("bldgB")}
                  onMouseEnter={() => setHoveredBuilding("bldgB")}
                  onMouseLeave={() => setHoveredBuilding(null)}
                  style={{
                    opacity: activeId === "bldgB" ? 1 : 0.38,
                  }}
                >
                  {/* Ground Footprint */}
                  <polygon points="450,150 540,205 450,258 360,203" fill="url(#showcaseHatch)" stroke="#a8cebc" strokeWidth="1" strokeDasharray="2 2" />

                  {/* Base Podium (L01-L03) */}
                  <g className="transition-transform duration-500" style={{ transform: activeId === "bldgB" ? "translateY(-10px)" : "translateY(0)" }}>
                    <polygon points="360,220 450,275 450,225 360,170" fill="#133b2a" stroke="#a8cebc" strokeWidth="1.1" />
                    <polygon points="450,275 540,220 540,170 450,225" fill="#184834" stroke="#a8cebc" strokeWidth="1.1" />
                    <polygon points="360,170 450,225 540,170 450,115" fill="#1c553d" stroke="#a8cebc" strokeWidth="1.1" />
                  </g>

                  {/* Tower Plate Middle Body (L04-L10) (Explodes upward) */}
                  <g className="transition-transform duration-500" style={{ transform: activeId === "bldgB" ? "translateY(-48px)" : "translateY(0)" }}>
                    {activeId === "bldgB" && (
                      <line x1="450" y1="225" x2="450" y2="177" stroke="#d0e5d3" strokeWidth="1" strokeDasharray="2 3" opacity="0.7" />
                    )}
                    <polygon points="370,165 450,212 450,105 370,58" fill="#164230" stroke="#d0e5d3" strokeWidth="1.2" />
                    <polygon points="450,212 530,165 530,58 450,105" fill="#1a4f39" stroke="#d0e5d3" strokeWidth="1.2" />
                    <polygon points="370,58 450,105 530,58 450,11" fill="#206046" stroke="#f0f1e6" strokeWidth="1.3" />

                    {/* Architectural Floor Plate Ribs */}
                    {[0.25, 0.5, 0.75].map((t, idx) => (
                      <g key={idx}>
                        <line x1="370" y1={58 + (165 - 58) * t} x2="450" y2={105 + (212 - 105) * t} stroke="#d0e5d3" strokeWidth="0.75" opacity="0.6" />
                        <line x1="450" y1={105 + (212 - 105) * t} x2="530" y2={58 + (165 - 58) * t} stroke="#d0e5d3" strokeWidth="0.75" opacity="0.6" />
                      </g>
                    ))}
                  </g>

                  {/* Sky Lounge & Aerofoil Crown (L11-L12) (Explodes highest) */}
                  <g className="transition-transform duration-500" style={{ transform: activeId === "bldgB" ? "translateY(-88px)" : "translateY(0)" }}>
                    <polygon points="380,45 450,86 520,45 450,4" fill="#d0e5d3" fillOpacity="0.25" stroke="#f0f1e6" strokeWidth="1.5" />
                    {/* Floating aerofoil beam */}
                    <line x1="365" y1="36" x2="535" y2="36" stroke="#f0f1e6" strokeWidth="1.8" />
                  </g>

                  {/* Building Label Tag */}
                  <text x="450" y="300" textAnchor="middle" fill={selectedBuilding === "bldgB" ? "#f0f1e6" : "#a8cebc"} fontSize="11" fontWeight="600" letterSpacing="0.12em">
                    RESIDENCE B
                  </text>
                  <text x="450" y="315" textAnchor="middle" fill="#a8cebc" fontSize="9" opacity="0.8">
                    Landmark Tower
                  </text>
                </g>

                {/* ==============================================================
                    BUILDING C: Courtyard Eastern Wing (Right: x~670, y~260)
                   ============================================================== */}
                <g
                  className="cursor-pointer transition-all duration-500 ease-out"
                  onClick={() => setSelectedBuilding("bldgC")}
                  onMouseEnter={() => setHoveredBuilding("bldgC")}
                  onMouseLeave={() => setHoveredBuilding(null)}
                  style={{
                    opacity: activeId === "bldgC" ? 1 : 0.38,
                  }}
                >
                  {/* Ground Footprint */}
                  <polygon points="670,230 770,285 680,335 580,280" fill="url(#showcaseHatch)" stroke="#a8cebc" strokeWidth="1" strokeDasharray="2 2" />

                  {/* Level 1: Arcade Colonnade */}
                  <g className="transition-transform duration-500" style={{ transform: activeId === "bldgC" ? "translateY(-8px)" : "translateY(0)" }}>
                    <polygon points="580,270 680,325 680,290 580,235" fill="#133b2a" stroke="#a8cebc" strokeWidth="1" />
                    <polygon points="680,325 770,275 770,240 680,290" fill="#184834" stroke="#a8cebc" strokeWidth="1" />
                    <polygon points="580,235 680,290 770,240 670,185" fill="#1c553d" stroke="#a8cebc" strokeWidth="1" />
                  </g>

                  {/* Level 2-5: Courtyard Wing Block (Explodes upward) */}
                  <g className="transition-transform duration-500" style={{ transform: activeId === "bldgC" ? "translateY(-40px)" : "translateY(0)" }}>
                    {activeId === "bldgC" && (
                      <line x1="680" y1="290" x2="680" y2="250" stroke="#d0e5d3" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
                    )}
                    <polygon points="590,215 675,260 675,190 590,145" fill="#143d2c" stroke="#a8cebc" strokeWidth="1.1" />
                    <polygon points="675,260 760,215 760,145 675,190" fill="#1a4f39" stroke="#a8cebc" strokeWidth="1.1" />
                    <polygon points="590,145 675,190 760,145 675,100" fill="#206046" stroke="#d0e5d3" strokeWidth="1.2" />

                    {/* Lightwell Void */}
                    <polygon points="645,155 675,172 705,155 675,138" fill="#133b2a" stroke="#d0e5d3" strokeWidth="0.8" />
                  </g>

                  {/* Level 6-7: Atelier Roof Penthouses (Explodes further) */}
                  <g className="transition-transform duration-500" style={{ transform: activeId === "bldgC" ? "translateY(-68px)" : "translateY(0)" }}>
                    <polygon points="610,125 675,160 740,125 675,90" fill="#d0e5d3" fillOpacity="0.25" stroke="#f0f1e6" strokeWidth="1.3" />
                  </g>

                  {/* Building Label Tag */}
                  <text x="675" y="355" textAnchor="middle" fill={selectedBuilding === "bldgC" ? "#f0f1e6" : "#a8cebc"} fontSize="11" fontWeight="600" letterSpacing="0.12em">
                    RESIDENCE C
                  </text>
                  <text x="675" y="370" textAnchor="middle" fill="#a8cebc" fontSize="9" opacity="0.8">
                    Courtyard Wing
                  </text>
                </g>
              </svg>
            </div>

            {/* Bottom Floating Legend / Demonstration Notice */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-[#a8cebc]/15 text-[11px] text-[#a8cebc] z-20">
              <span className="font-medium">
                Prototype Demonstration Model // Coordinates: 51.5074° N, 0.1278° W
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#133b2a] border border-[#a8cebc]/20 text-[#d0e5d3]">
                Fictional Showcase Environment
              </span>
            </div>
          </div>

          {/* Right Panel: Restrained Building Inspector (4 Columns) */}
          <div className="lg:col-span-4 bg-[#184834]/80 border border-[#a8cebc]/25 rounded-lg p-6 sm:p-7 flex flex-col justify-between min-h-[480px] sm:min-h-[580px]">
            <div>
              {/* Header Badge & Title */}
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full bg-[#133b2a] border border-[#a8cebc]/25 text-[10px] font-semibold tracking-wider text-[#d0e5d3]">
                  {currentData.height}
                </span>
                <span className="text-[11px] font-semibold text-[#a8cebc] tracking-wider">
                  {currentData.footprint}
                </span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#f0f1e6] tracking-tight">
                {currentData.name}
              </h3>
              <p className="font-body text-xs text-[#d0e5d3] font-medium mt-1 mb-6">
                {currentData.type}
              </p>

              {/* Inspector Tab Switcher */}
              <div className="flex border-b border-[#a8cebc]/20 mb-6">
                {(["overview", "plates", "specs"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 px-3 text-xs font-semibold uppercase tracking-wider transition-colors relative ${
                      activeTab === tab
                        ? "text-[#f0f1e6]"
                        : "text-[#a8cebc]/70 hover:text-[#f0f1e6]"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#d0e5d3]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab 1: Overview */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a8cebc] mb-1">
                      Residential Capacity
                    </span>
                    <p className="text-sm font-medium text-[#f0f1e6]">
                      {currentData.residences}
                    </p>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a8cebc] mb-1">
                      Architectural Massing Notes
                    </span>
                    <p className="text-xs text-[#a8cebc]/90 leading-relaxed font-normal">
                      {currentData.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Plates (Axonometric component breakdown) */}
              {activeTab === "plates" && (
                <div className="space-y-3">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a8cebc] mb-2">
                    Constituent Floor Plates
                  </span>
                  {currentData.levels.map((lvl, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded bg-[#133b2a]/70 border border-[#a8cebc]/20"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-[#f0f1e6] mb-1">
                        <span>{lvl.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1f5e44] text-[#d0e5d3]">
                          {lvl.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#a8cebc]/85 leading-relaxed font-normal">
                        {lvl.desc}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Technical Specs */}
              {activeTab === "specs" && (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[#a8cebc]/15">
                    <span className="text-[#a8cebc]">Solar Orientation</span>
                    <span className="text-[#f0f1e6] font-medium">South-Southwest (Optimized)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#a8cebc]/15">
                    <span className="text-[#a8cebc]">Thermal Envelope</span>
                    <span className="text-[#f0f1e6] font-medium">Triple Glazed // Low-E</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#a8cebc]/15">
                    <span className="text-[#a8cebc]">Direct Amenity Link</span>
                    <span className="text-[#f0f1e6] font-medium">Sub-grade Parking & Spa</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#a8cebc]/15">
                    <span className="text-[#a8cebc]">Visualization Fidelity</span>
                    <span className="text-[#f0f1e6] font-medium">100% Client-Side Rendered</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Building Selector CTA */}
            <div className="pt-6 border-t border-[#a8cebc]/20 mt-6">
              <a
                href="#hierarchy-explorer"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#25231b] text-[#f0f1e6] text-xs font-semibold tracking-wider border border-[#444238] hover:border-[#d0e5d3] hover:bg-[#1a1813] transition-all duration-300 shadow-sm"
              >
                <span>Inspect All Spatial Layers</span>
                <span>↓</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

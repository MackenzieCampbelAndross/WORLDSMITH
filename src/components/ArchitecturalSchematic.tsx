"use client";

import React, { useState } from "react";

interface ArchitecturalSchematicProps {
  pointerOffset?: { x: number; y: number };
}

/**
 * ArchitecturalSchematic is an original vector-based blueprint drafting system
 * inspired by technical development masterplans, building footprints, axial datum lines,
 * concentric orbital spatial markers, and measurement indicators.
 */
export const ArchitecturalSchematic: React.FC<ArchitecturalSchematicProps> = ({
  pointerOffset = { x: 0, y: 0 },
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Parallax subtle translation values
  const translateX = pointerOffset.x * 24;
  const translateY = pointerOffset.y * 18;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
      style={{
        transform: `translate3d(${translateX}px, ${translateY}px, 0)`,
        transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <svg
        viewBox="0 0 1200 680"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[94%] max-w-[1240px] h-[78%] max-h-[580px] overflow-visible pointer-events-auto"
      >
        <defs>
          {/* Subtle line glow */}
          <filter id="subtleGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ---------------- 1. DATUM AXIS & HORIZONTAL GUIDES ---------------- */}
        <g stroke="#a8cebc" strokeOpacity="0.25" strokeWidth="1">
          {/* Main datum spine */}
          <line x1="80" y1="360" x2="1120" y2="360" strokeDasharray="3 6" />
          <line x1="80" y1="210" x2="1120" y2="210" strokeDasharray="2 8" strokeOpacity="0.18" />
          <line x1="80" y1="490" x2="1120" y2="490" strokeDasharray="2 8" strokeOpacity="0.18" />
          
          {/* Vertical coordinate markers */}
          <line x1="280" y1="120" x2="280" y2="580" strokeDasharray="2 8" strokeOpacity="0.18" />
          <line x1="480" y1="100" x2="480" y2="600" strokeDasharray="2 8" strokeOpacity="0.22" />
          <line x1="680" y1="100" x2="680" y2="600" strokeDasharray="2 8" strokeOpacity="0.22" />
          <line x1="880" y1="120" x2="880" y2="580" strokeDasharray="2 8" strokeOpacity="0.18" />
        </g>

        {/* ---------------- 2. PRIMARY THREE SPATIAL CLUSTERS ---------------- */}
        {/* CLUSTER A: Left Quadrant (x=380, y=360) */}
        <g
          className="cursor-pointer"
          onMouseEnter={() => setHoveredNode("zoneA")}
          onMouseLeave={() => setHoveredNode(null)}
          tabIndex={0}
          role="button"
          aria-label="Zone Alpha: Podium & Plaza Structure"
          onFocus={() => setHoveredNode("zoneA")}
          onBlur={() => setHoveredNode(null)}
        >
          {/* Outer concentric rings */}
          <circle
            cx="380"
            cy="360"
            r="120"
            stroke="#a8cebc"
            strokeWidth="1"
            strokeOpacity="0.28"
          />
          <circle
            cx="380"
            cy="360"
            r="90"
            stroke="#a8cebc"
            strokeWidth="1.25"
            strokeOpacity="0.45"
            strokeDasharray="4 4"
          />
          <circle
            cx="380"
            cy="360"
            r="60"
            stroke="#d0e5d3"
            strokeWidth="1.5"
            strokeOpacity="0.75"
          />
          <circle
            cx="380"
            cy="360"
            r="32"
            stroke="#f0f1e6"
            strokeWidth="1.5"
            fill={hoveredNode === "zoneA" ? "rgba(240, 241, 230, 0.15)" : "none"}
            className="transition-colors duration-300"
          />
          <circle cx="380" cy="360" r="12" stroke="#f0f1e6" strokeWidth="1.5" />
          <circle cx="380" cy="360" r="4" fill="#f0f1e6" />

          {/* Rotating architectural reticle / dial */}
          <g className="animate-rotate-slow" style={{ transformOrigin: "380px 360px" }}>
            <path
              d="M 380 280 A 80 80 0 0 1 460 360"
              stroke="#d0e5d3"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
            {/* Radial tick tabs */}
            <rect x="376" y="235" width="8" height="14" fill="#a8cebc" opacity="0.6" />
            <rect x="475" y="420" width="14" height="8" fill="#a8cebc" opacity="0.6" />
            <rect x="270" y="380" width="14" height="8" fill="#a8cebc" opacity="0.6" />
          </g>

          {/* Secondary upper satellite node */}
          <g>
            <circle cx="430" cy="240" r="42" stroke="#a8cebc" strokeWidth="1" strokeOpacity="0.5" />
            <circle cx="430" cy="240" r="22" stroke="#d0e5d3" strokeWidth="1.2" strokeOpacity="0.8" />
            <circle cx="430" cy="240" r="6" fill="#f0f1e6" />
            <line x1="380" y1="360" x2="430" y2="240" stroke="#a8cebc" strokeWidth="1" strokeOpacity="0.35" />
          </g>

          {/* Lower ground anchor */}
          <g>
            <circle cx="320" cy="460" r="54" stroke="#a8cebc" strokeWidth="1" strokeOpacity="0.4" />
            <circle cx="320" cy="460" r="24" stroke="#d0e5d3" strokeWidth="1.2" />
            <circle cx="320" cy="460" r="5" fill="#a8cebc" />
            <line x1="380" y1="360" x2="320" y2="460" stroke="#a8cebc" strokeWidth="1" strokeOpacity="0.35" />
          </g>
        </g>

        {/* CLUSTER B: Central Core (x=600, y=340) */}
        <g
          className="cursor-pointer"
          onMouseEnter={() => setHoveredNode("zoneB")}
          onMouseLeave={() => setHoveredNode(null)}
          tabIndex={0}
          role="button"
          aria-label="Zone Beta: Central Tower & Atrium Core"
          onFocus={() => setHoveredNode("zoneB")}
          onBlur={() => setHoveredNode(null)}
        >
          {/* Concentric rings */}
          <circle
            cx="600"
            cy="340"
            r="130"
            stroke="#a8cebc"
            strokeWidth="1"
            strokeOpacity="0.25"
          />
          <circle
            cx="600"
            cy="340"
            r="96"
            stroke="#a8cebc"
            strokeWidth="1.25"
            strokeOpacity="0.45"
            strokeDasharray="6 4"
          />
          <circle
            cx="600"
            cy="340"
            r="64"
            stroke="#d0e5d3"
            strokeWidth="1.5"
            strokeOpacity="0.8"
          />
          <circle
            cx="600"
            cy="340"
            r="34"
            stroke="#f0f1e6"
            strokeWidth="1.5"
            fill={hoveredNode === "zoneB" ? "rgba(240, 241, 230, 0.15)" : "none"}
            className="transition-colors duration-300"
          />
          <circle cx="600" cy="340" r="14" stroke="#f0f1e6" strokeWidth="1.5" />
          <circle cx="600" cy="340" r="4" fill="#f0f1e6" />

          {/* Rotating architectural reticle in reverse */}
          <g className="animate-rotate-reverse" style={{ transformOrigin: "600px 340px" }}>
            <path
              d="M 600 244 A 96 96 0 0 1 696 340"
              stroke="#d0e5d3"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity="0.85"
            />
            {/* Dimensional lugs */}
            <rect x="595" y="205" width="10" height="15" fill="#a8cebc" opacity="0.7" />
            <rect x="670" y="405" width="16" height="9" fill="#a8cebc" opacity="0.7" />
            <rect x="495" y="325" width="15" height="9" fill="#a8cebc" opacity="0.7" />
          </g>

          {/* Upper spire coordinate */}
          <g>
            <circle cx="620" cy="190" r="46" stroke="#a8cebc" strokeWidth="1" strokeOpacity="0.45" />
            <circle cx="620" cy="190" r="24" stroke="#d0e5d3" strokeWidth="1.2" />
            <circle cx="620" cy="190" r="6" fill="#f0f1e6" />
            <line x1="600" y1="340" x2="620" y2="190" stroke="#a8cebc" strokeWidth="1" strokeOpacity="0.35" />
          </g>

          {/* Lower subterranean foundation link */}
          <g>
            <circle cx="530" cy="470" r="50" stroke="#a8cebc" strokeWidth="1" strokeOpacity="0.4" />
            <circle cx="530" cy="470" r="26" stroke="#d0e5d3" strokeWidth="1.2" />
            <circle cx="530" cy="470" r="5" fill="#a8cebc" />
            <line x1="600" y1="340" x2="530" y2="470" stroke="#a8cebc" strokeWidth="1" strokeOpacity="0.35" />
          </g>
        </g>

        {/* CLUSTER C: Right Quadrant (x=820, y=360) */}
        <g
          className="cursor-pointer"
          onMouseEnter={() => setHoveredNode("zoneC")}
          onMouseLeave={() => setHoveredNode(null)}
          tabIndex={0}
          role="button"
          aria-label="Zone Gamma: Terraced Residential Wings"
          onFocus={() => setHoveredNode("zoneC")}
          onBlur={() => setHoveredNode(null)}
        >
          {/* Concentric rings */}
          <circle
            cx="820"
            cy="360"
            r="124"
            stroke="#a8cebc"
            strokeWidth="1"
            strokeOpacity="0.25"
          />
          <circle
            cx="820"
            cy="360"
            r="92"
            stroke="#a8cebc"
            strokeWidth="1.25"
            strokeOpacity="0.45"
            strokeDasharray="4 4"
          />
          <circle
            cx="820"
            cy="360"
            r="62"
            stroke="#d0e5d3"
            strokeWidth="1.5"
            strokeOpacity="0.75"
          />
          <circle
            cx="820"
            cy="360"
            r="32"
            stroke="#f0f1e6"
            strokeWidth="1.5"
            fill={hoveredNode === "zoneC" ? "rgba(240, 241, 230, 0.15)" : "none"}
            className="transition-colors duration-300"
          />
          <circle cx="820" cy="360" r="12" stroke="#f0f1e6" strokeWidth="1.5" />
          <circle cx="820" cy="360" r="4" fill="#f0f1e6" />

          {/* Rotating architectural reticle */}
          <g className="animate-rotate-slow" style={{ transformOrigin: "820px 360px" }}>
            <path
              d="M 820 268 A 92 92 0 0 1 912 360"
              stroke="#d0e5d3"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
            {/* Reticle lugs */}
            <rect x="815" y="228" width="10" height="14" fill="#a8cebc" opacity="0.65" />
            <rect x="900" y="415" width="14" height="9" fill="#a8cebc" opacity="0.65" />
            <rect x="715" y="375" width="14" height="9" fill="#a8cebc" opacity="0.65" />
          </g>

          {/* Upper satellite */}
          <g>
            <circle cx="860" cy="230" r="42" stroke="#a8cebc" strokeWidth="1" strokeOpacity="0.45" />
            <circle cx="860" cy="230" r="22" stroke="#d0e5d3" strokeWidth="1.2" />
            <circle cx="860" cy="230" r="6" fill="#f0f1e6" />
            <line x1="820" y1="360" x2="860" y2="230" stroke="#a8cebc" strokeWidth="1" strokeOpacity="0.35" />
          </g>

          {/* Lower satellite */}
          <g>
            <circle cx="730" cy="480" r="52" stroke="#a8cebc" strokeWidth="1" strokeOpacity="0.4" />
            <circle cx="730" cy="480" r="26" stroke="#d0e5d3" strokeWidth="1.2" />
            <circle cx="730" cy="480" r="5" fill="#a8cebc" />
            <line x1="820" y1="360" x2="730" y2="480" stroke="#a8cebc" strokeWidth="1" strokeOpacity="0.35" />
          </g>
        </g>

        {/* ---------------- 3. INTER-NODAL BRIDGES & LINKAGE BEAMS ---------------- */}
        {/* Horizontal connector arm from left border */}
        <g stroke="#a8cebc" strokeWidth="1.25" opacity="0.75">
          <line x1="120" y1="380" x2="310" y2="380" />
          <line x1="120" y1="392" x2="310" y2="392" />
          <circle cx="210" cy="386" r="10" stroke="#d0e5d3" strokeWidth="1.2" fill="#1f5e44" />
          <circle cx="210" cy="386" r="3" fill="#f0f1e6" />
          {/* Orthogonal plumb bracket */}
          <rect x="140" y="345" width="22" height="120" stroke="#a8cebc" strokeWidth="1" fill="none" opacity="0.4" />
        </g>

        {/* Diagonal link: Cluster A to Cluster B */}
        <g stroke="#a8cebc" strokeWidth="1.2" opacity="0.7">
          <line x1="435" y1="395" x2="540" y2="445" />
          <line x1="445" y1="410" x2="550" y2="460" />
          <rect x="480" y="415" width="14" height="24" stroke="#d0e5d3" strokeWidth="1" fill="none" transform="rotate(25 487 427)" />
        </g>

        {/* Diagonal link: Cluster B to Cluster C */}
        <g stroke="#a8cebc" strokeWidth="1.2" opacity="0.7">
          <line x1="660" y1="435" x2="760" y2="385" />
          <line x1="670" y1="450" x2="770" y2="400" />
          <rect x="705" y="405" width="14" height="24" stroke="#d0e5d3" strokeWidth="1" fill="none" transform="rotate(-25 712 417)" />
        </g>

        {/* Horizontal dual cantilever beams extending to right margin */}
        <g stroke="#a8cebc" strokeWidth="1.2" opacity="0.8">
          {/* Upper beam */}
          <line x1="750" y1="230" x2="980" y2="230" />
          <line x1="750" y1="244" x2="980" y2="244" />
          <circle cx="980" cy="237" r="12" stroke="#d0e5d3" strokeWidth="1.2" fill="#1f5e44" />
          <circle cx="980" cy="237" r="4" fill="#f0f1e6" />

          {/* Middle beam */}
          <line x1="750" y1="330" x2="1020" y2="330" />
          <line x1="750" y1="344" x2="1020" y2="344" />
          <circle cx="1020" cy="337" r="12" stroke="#d0e5d3" strokeWidth="1.2" fill="#1f5e44" />
          <circle cx="1020" cy="337" r="4" fill="#f0f1e6" />
        </g>

        {/* ---------------- 4. TECHNICAL MEASUREMENT INDICATORS (CROSSWALK STYLE) ---------------- */}
        {/* Top elevation ticks */}
        <g stroke="#a8cebc" strokeWidth="1" opacity="0.7">
          {[
            { x: 350, y: 195, label: "01" },
            { x: 430, y: 175, label: "02" },
            { x: 505, y: 195, label: "03" },
            { x: 585, y: 190, label: "04" },
            { x: 670, y: 190, label: "05" },
            { x: 750, y: 220, label: "06" },
          ].map((item, i) => (
            <g key={i}>
              <line x1={item.x} y1={item.y} x2={item.x} y2={item.y + 12} />
              <circle cx={item.x} cy={item.y} r="7" stroke="#d0e5d3" fill="none" />
              <line x1={item.x} y1={item.y - 7} x2={item.x} y2={item.y + 7} stroke="#a8cebc" strokeDasharray="1 1" />
            </g>
          ))}
        </g>

        {/* Bottom elevation benchmark circles with dashed plumb lines */}
        <g stroke="#a8cebc" strokeWidth="1" opacity="0.6">
          {[
            { x: 350, y: 550, lineStart: 460 },
            { x: 430, y: 590, lineStart: 490 },
            { x: 510, y: 560, lineStart: 470 },
            { x: 590, y: 580, lineStart: 480 },
            { x: 670, y: 570, lineStart: 490 },
            { x: 750, y: 580, lineStart: 500 },
            { x: 820, y: 610, lineStart: 520 },
          ].map((item, i) => (
            <g key={i}>
              <line
                x1={item.x}
                y1={item.lineStart}
                x2={item.x}
                y2={item.y}
                strokeDasharray="2 4"
                strokeOpacity="0.4"
              />
              <rect x={item.x - 8} y={item.y - 8} width="16" height="16" stroke="#a8cebc" strokeOpacity="0.3" fill="none" />
              <circle cx={item.x} cy={item.y} r="6" stroke="#d0e5d3" fill="#1f5e44" />
              <line x1={item.x - 6} y1={item.y} x2={item.x + 6} y2={item.y} stroke="#d0e5d3" />
            </g>
          ))}
        </g>

        {/* ---------------- 5. DYNAMIC INTERACTIVE LABELS ---------------- */}
        {hoveredNode && (
          <g className="transition-all duration-300">
            {hoveredNode === "zoneA" && (
              <g transform="translate(380, 290)">
                <rect x="-70" y="-30" width="140" height="26" rx="4" fill="#171713" stroke="#a8cebc" strokeWidth="1" opacity="0.95" />
                <text x="0" y="-13" textAnchor="middle" fill="#f0f1e6" fontSize="10" fontFamily="monospace" letterSpacing="1.5">
                  ZONE_A // PODIUM
                </text>
              </g>
            )}
            {hoveredNode === "zoneB" && (
              <g transform="translate(600, 270)">
                <rect x="-80" y="-30" width="160" height="26" rx="4" fill="#171713" stroke="#a8cebc" strokeWidth="1" opacity="0.95" />
                <text x="0" y="-13" textAnchor="middle" fill="#f0f1e6" fontSize="10" fontFamily="monospace" letterSpacing="1.5">
                  ZONE_B // CENTRAL_ATRIUM
                </text>
              </g>
            )}
            {hoveredNode === "zoneC" && (
              <g transform="translate(820, 290)">
                <rect x="-75" y="-30" width="150" height="26" rx="4" fill="#171713" stroke="#a8cebc" strokeWidth="1" opacity="0.95" />
                <text x="0" y="-13" textAnchor="middle" fill="#f0f1e6" fontSize="10" fontFamily="monospace" letterSpacing="1.5">
                  ZONE_C // RESIDENCES
                </text>
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};

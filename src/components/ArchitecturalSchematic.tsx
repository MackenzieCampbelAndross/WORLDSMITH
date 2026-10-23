"use client";

import React, { useEffect, useState } from "react";

/**
 * ArchitecturalSchematic: An intricate architectural drawing of an entire residential development.
 *
 * Interaction Philosophy:
 * - The illustration remains stationary with NO cursor parallax or pointer-following movement.
 * - When a user hovers over/focuses on any building:
 *   1. Its individual floor plates gently isolate and elevate in an exploded axonometric view.
 *   2. Components (base, floor plates, rooftop terraces, penthouse, aerofoil canopy) separate along the vertical axis.
 *   3. Delicate vertical alignment and spatial datum lines connect the separated plates.
 *   4. Restrained architectural labels identify the revealed components (e.g. SKY LOUNGE, RESIDENCES L3-L5, ATRIUM BASE).
 *   5. Unrelated buildings slightly reduce in opacity (0.35) to focus attention without leaving the scene.
 *   6. When the pointer leaves, the building smoothly re-assembles into its unified state.
 */
export const ArchitecturalSchematic: React.FC = () => {
  const [activeBuilding, setActiveBuilding] = useState<"bldgA" | "bldgB" | "bldgC" | "plaza" | null>(null);
  const [signalsEnabled, setSignalsEnabled] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setSignalsEnabled(!query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden font-body">
      <svg
        viewBox="0 0 1200 680"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[94%] max-w-[1240px] h-[78%] max-h-[580px] overflow-visible pointer-events-auto"
      >
        <defs>
          <pattern id="planHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#a8cebc" strokeWidth="0.6" strokeOpacity="0.25" />
          </pattern>
        </defs>

        {/* =========================================================================
            STAGE 1: SITE BOUNDARY, DATUM GRIDS & COORDINATE BENCHMARKS
           ========================================================================= */}
        <g stroke="#a8cebc" strokeOpacity="0.28" strokeWidth="1">
          {/* Main site planning alignment axes */}
          <line x1="100" y1="370" x2="1100" y2="370" strokeDasharray="3 6" />
          <line x1="330" y1="120" x2="330" y2="580" strokeDasharray="2 6" strokeOpacity="0.18" />
          <line x1="600" y1="90" x2="600" y2="610" strokeDasharray="2 6" strokeOpacity="0.22" />
          <line x1="870" y1="120" x2="870" y2="580" strokeDasharray="2 6" strokeOpacity="0.18" />

          {/* Master Site Boundary Envelope (Isometric Ground Plane) */}
          <polygon
            points="600,140 1020,380 600,620 180,380"
            stroke="#a8cebc"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            fill="none"
            strokeOpacity="0.35"
            className="animate-draw-site"
          />

          {/* Corner Datum Benchmarks */}
          {[
            { x: 180, y: 380, label: "BM-01" },
            { x: 600, y: 140, label: "BM-02" },
            { x: 1020, y: 380, label: "BM-03" },
            { x: 600, y: 620, label: "BM-04" },
          ].map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r="6" stroke="#d0e5d3" strokeWidth="1" fill="#1f5e44" />
              <circle cx={pt.x} cy={pt.y} r="2" fill="#f0f1e6" />
              <text
                x={pt.x + (pt.x > 600 ? 10 : -10)}
                y={pt.y + 3.5}
                textAnchor={pt.x > 600 ? "start" : "end"}
                fill="#a8cebc"
                fontSize="9"
                fontFamily="var(--font-manrope)"
                fontWeight="500"
                letterSpacing="0.8"
                opacity="0.85"
              >
                {pt.label}
              </text>
            </g>
          ))}
        </g>

        {/* =========================================================================
            STAGE 2: SITE MASTERPLAN (ROADS, PATHS, COURTYARDS, CIVIC PLAZA)
           ========================================================================= */}
        <g
          className={`animate-draw-site transition-opacity duration-500 ${
            activeBuilding && activeBuilding !== "plaza" ? "opacity-35" : "opacity-100"
          }`}
        >
          {/* Internal Access Boulevard & Loop Road */}
          <polygon
            points="600,190 940,380 600,570 260,380"
            stroke="#a8cebc"
            strokeWidth="1"
            strokeOpacity="0.4"
            fill="none"
          />
          <polygon
            points="600,210 900,380 600,550 300,380"
            stroke="#a8cebc"
            strokeWidth="0.8"
            strokeDasharray="2 4"
            strokeOpacity="0.3"
            fill="none"
          />

          {/* Central Civic Water Fountain & Plaza Oval */}
          <g
            className="cursor-pointer"
            onMouseEnter={() => setActiveBuilding("plaza")}
            onMouseLeave={() => setActiveBuilding(null)}
            tabIndex={0}
            role="button"
            aria-label="Central Plaza & Promenade"
            onFocus={() => setActiveBuilding("plaza")}
            onBlur={() => setActiveBuilding(null)}
          >
            <ellipse
              cx="600"
              cy="480"
              rx="56"
              ry="28"
              stroke="#d0e5d3"
              strokeWidth="1.2"
              strokeOpacity="0.75"
              fill={activeBuilding === "plaza" ? "rgba(168, 206, 188, 0.2)" : "rgba(168, 206, 188, 0.08)"}
              className="transition-colors duration-300"
            />
            <ellipse cx="600" cy="480" rx="34" ry="17" stroke="#a8cebc" strokeWidth="0.8" strokeOpacity="0.5" fill="none" />
            <ellipse cx="600" cy="480" rx="12" ry="6" stroke="#f0f1e6" strokeWidth="1" fill="#f0f1e6" />

            {/* Pedestrian Promenade Radial Walkways */}
            <line x1="600" y1="508" x2="600" y2="570" stroke="#a8cebc" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="550" y1="470" x2="440" y2="445" stroke="#a8cebc" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="650" y1="470" x2="760" y2="445" stroke="#a8cebc" strokeWidth="1" strokeOpacity="0.4" />
          </g>

          {/* Landscaped Arbor Groves */}
          {[
            { cx: 370, cy: 460 },
            { cx: 400, cy: 480 },
            { cx: 430, cy: 465 },
            { cx: 770, cy: 465 },
            { cx: 800, cy: 485 },
            { cx: 830, cy: 470 },
            { cx: 520, cy: 260 },
            { cx: 680, cy: 260 },
          ].map((tree, idx) => (
            <g key={idx} opacity="0.6">
              <circle cx={tree.cx} cy={tree.cy} r="9" stroke="#a8cebc" strokeWidth="0.8" fill="rgba(168, 206, 188, 0.06)" />
              <line x1={tree.cx - 6} y1={tree.cy} x2={tree.cx + 6} y2={tree.cy} stroke="#a8cebc" strokeWidth="0.6" />
              <line x1={tree.cx} y1={tree.cy - 6} x2={tree.cx} y2={tree.cy + 6} stroke="#a8cebc" strokeWidth="0.6" />
            </g>
          ))}
        </g>

        {/* =========================================================================
            STAGE 3: INTERACTIVE EXPLODED AXONOMETRIC BUILDINGS
           ========================================================================= */}

        {/* -------------------------------------------------------------------------
            BUILDING A: WEST TERRACED RESIDENCES
            Explodes vertically into 3 distinct tiers (Base, Mid Residences, Penthouse Deck)
           ------------------------------------------------------------------------- */}
        <g
          className={`cursor-pointer animate-rise-b1 transition-opacity duration-500 focus:outline-none ${
            activeBuilding && activeBuilding !== "bldgA" ? "opacity-35" : "opacity-100"
          }`}
          onMouseEnter={() => setActiveBuilding("bldgA")}
          onMouseLeave={() => setActiveBuilding(null)}
          tabIndex={0}
          role="button"
          aria-label="Building A: West Terraced Residences. Hover or focus to view exploded axonometric floor plates."
          onFocus={() => setActiveBuilding("bldgA")}
          onBlur={() => setActiveBuilding(null)}
        >
          {/* Ground Footprint Datum */}
          <polygon
            points="330,340 430,395 330,450 230,395"
            stroke="#a8cebc"
            strokeWidth="1.2"
            strokeOpacity="0.45"
            fill="url(#planHatch)"
          />

          {/* Exploded Connecting Spatial Guidelines (revealed on hover) */}
          {activeBuilding === "bldgA" && (
            <g stroke="#d0e5d3" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.75" className="transition-opacity duration-300">
              <line x1="230" y1="395" x2="230" y2="335" />
              <line x1="430" y1="395" x2="430" y2="335" />
              <line x1="330" y1="450" x2="330" y2="150" />
              <line x1="260" y1="320" x2="260" y2="230" />
              <line x1="400" y1="320" x2="400" y2="230" />
            </g>
          )}

          {/* Tier 1: Base Podium Floor (Remains stationary at ground) */}
          <g>
            <polygon
              points="230,395 330,450 330,390 230,335"
              stroke="#d0e5d3"
              strokeWidth="1.2"
              fill="rgba(16, 50, 36, 0.75)"
            />
            <polygon
              points="330,450 430,395 430,335 330,390"
              stroke="#d0e5d3"
              strokeWidth="1.2"
              fill="rgba(24, 75, 54, 0.85)"
            />
            <polygon
              points="330,390 430,335 330,280 230,335"
              stroke="#f0f1e6"
              strokeWidth="1.4"
              fill="rgba(240, 241, 230, 0.08)"
            />
            {/* Fenestration lines */}
            <line x1="255" y1="350" x2="310" y2="380" stroke="#a8cebc" strokeWidth="0.8" strokeOpacity="0.7" />
            <line x1="255" y1="365" x2="310" y2="395" stroke="#a8cebc" strokeWidth="0.8" strokeOpacity="0.7" />
            <line x1="350" y1="380" x2="405" y2="350" stroke="#a8cebc" strokeWidth="0.8" strokeOpacity="0.7" />
            <line x1="350" y1="395" x2="405" y2="365" stroke="#a8cebc" strokeWidth="0.8" strokeOpacity="0.7" />
          </g>

          {/* Tier 2: Mid-Tier Terraced Residences (Elevates by -24px on hover) */}
          <g
            style={{
              transform: activeBuilding === "bldgA" ? "translateY(-26px)" : "translateY(0px)",
              transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <polygon
              points="260,320 330,358 330,290 260,252"
              stroke="#d0e5d3"
              strokeWidth="1.2"
              fill="rgba(16, 50, 36, 0.82)"
            />
            <polygon
              points="330,358 400,320 400,252 330,290"
              stroke="#d0e5d3"
              strokeWidth="1.2"
              fill="rgba(24, 75, 54, 0.9)"
            />
            <polygon
              points="330,290 400,252 330,214 260,252"
              stroke="#f0f1e6"
              strokeWidth="1.4"
              fill="rgba(240, 241, 230, 0.12)"
            />
            {/* Balcony railings */}
            <line x1="230" y1="330" x2="260" y2="315" stroke="#d0e5d3" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="400" y1="315" x2="430" y2="330" stroke="#d0e5d3" strokeWidth="1" strokeDasharray="3 2" />
          </g>

          {/* Tier 3: Top Penthouse & Pergola Canopy (Elevates by -54px on hover) */}
          <g
            style={{
              transform: activeBuilding === "bldgA" ? "translateY(-54px)" : "translateY(0px)",
              transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <polygon
              points="285,240 330,264 330,220 285,196"
              stroke="#d0e5d3"
              strokeWidth="1.1"
              fill="rgba(16, 50, 36, 0.88)"
            />
            <polygon
              points="330,264 375,240 375,196 330,220"
              stroke="#d0e5d3"
              strokeWidth="1.1"
              fill="rgba(24, 75, 54, 0.96)"
            />
            <polygon
              points="330,220 375,196 330,172 285,196"
              stroke="#f0f1e6"
              strokeWidth="1.4"
              fill="rgba(240, 241, 230, 0.18)"
            />
            {/* Pergola timber canopy lines */}
            <line x1="295" y1="185" x2="320" y2="172" stroke="#f0f1e6" strokeWidth="0.8" strokeOpacity="0.85" />
            <line x1="305" y1="190" x2="330" y2="177" stroke="#f0f1e6" strokeWidth="0.85" strokeOpacity="0.85" />
            <line x1="315" y1="195" x2="340" y2="182" stroke="#f0f1e6" strokeWidth="0.85" strokeOpacity="0.85" />
          </g>

          {/* Restrained Architectural Labels for Revealed Components */}
          {activeBuilding === "bldgA" && (
            <g className="transition-opacity duration-300">
              {/* Penthouse Tag */}
              <g transform="translate(180, 140)">
                <line x1="0" y1="0" x2="105" y2="20" stroke="#d0e5d3" strokeWidth="0.8" />
                <rect x="-8" y="-14" width="105" height="18" rx="2" fill="#171713" stroke="#a8cebc" strokeWidth="0.8" opacity="0.95" />
                <text x="44" y="-2" textAnchor="middle" fill="#f0f1e6" fontSize="8" fontFamily="var(--font-manrope)" fontWeight="600" letterSpacing="0.8">
                  PENTHOUSE DECK
                </text>
              </g>

              {/* Mid Residences Tag */}
              <g transform="translate(160, 260)">
                <line x1="0" y1="0" x2="100" y2="20" stroke="#d0e5d3" strokeWidth="0.8" />
                <rect x="-8" y="-14" width="105" height="18" rx="2" fill="#171713" stroke="#a8cebc" strokeWidth="0.8" opacity="0.95" />
                <text x="44" y="-2" textAnchor="middle" fill="#f0f1e6" fontSize="8" fontFamily="var(--font-manrope)" fontWeight="600" letterSpacing="0.8">
                  TERRACED FLATS
                </text>
              </g>

              {/* Podium Base Tag */}
              <g transform="translate(160, 380)">
                <line x1="0" y1="0" x2="70" y2="10" stroke="#d0e5d3" strokeWidth="0.8" />
                <rect x="-8" y="-14" width="85" height="18" rx="2" fill="#171713" stroke="#a8cebc" strokeWidth="0.8" opacity="0.95" />
                <text x="34" y="-2" textAnchor="middle" fill="#f0f1e6" fontSize="8" fontFamily="var(--font-manrope)" fontWeight="600" letterSpacing="0.8">
                  PODIUM BASE
                </text>
              </g>
            </g>
          )}
        </g>

        {/* -------------------------------------------------------------------------
            BUILDING B: CENTRAL ATRIUM TOWER
            Explodes vertically into 4 segments:
            - Ground Lobby Atrium
            - Lower Floor Plates (Levels 1-3)
            - Upper Floor Plates (Levels 4-6)
            - Penthouse Roof & Floating Aerofoil Crown
           ------------------------------------------------------------------------- */}
        <g
          className={`cursor-pointer animate-rise-b2 transition-opacity duration-500 focus:outline-none ${
            activeBuilding && activeBuilding !== "bldgB" ? "opacity-35" : "opacity-100"
          }`}
          onMouseEnter={() => setActiveBuilding("bldgB")}
          onMouseLeave={() => setActiveBuilding(null)}
          tabIndex={0}
          role="button"
          aria-label="Building B: Central Atrium Tower. Hover or focus to view exploded axonometric floor plates."
          onFocus={() => setActiveBuilding("bldgB")}
          onBlur={() => setActiveBuilding(null)}
        >
          {/* Ground Footprint */}
          <polygon
            points="600,280 690,332 600,384 510,332"
            stroke="#a8cebc"
            strokeWidth="1.2"
            strokeOpacity="0.45"
            fill="none"
          />

          {/* Exploded Connecting Spatial Guidelines (revealed on hover) */}
          {activeBuilding === "bldgB" && (
            <g stroke="#d0e5d3" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.75" className="transition-opacity duration-300">
              <line x1="510" y1="332" x2="510" y2="80" />
              <line x1="690" y1="332" x2="690" y2="80" />
              <line x1="600" y1="384" x2="600" y2="130" />
              <line x1="600" y1="280" x2="600" y2="30" />
            </g>
          )}

          {/* Segment 1: Ground Glazed Entrance Portico & Double-Height Lobby (Stationary) */}
          <g>
            <polygon
              points="510,332 600,384 600,330 510,278"
              stroke="#d0e5d3"
              strokeWidth="1.2"
              fill="rgba(16, 50, 36, 0.85)"
            />
            <polygon
              points="600,384 690,332 690,278 600,330"
              stroke="#d0e5d3"
              strokeWidth="1.2"
              fill="rgba(26, 80, 58, 0.9)"
            />
            <polygon
              points="600,330 690,278 600,226 510,278"
              stroke="#f0f1e6"
              strokeWidth="1.4"
              fill="rgba(240, 241, 230, 0.1)"
            />
            {/* Double-Height Glazed Entry Portico */}
            <polygon
              points="580,395 620,372 620,342 580,365"
              stroke="#f0f1e6"
              strokeWidth="1.2"
              fill="rgba(240, 241, 230, 0.2)"
            />
            <line x1="580" y1="395" x2="560" y2="420" stroke="#d0e5d3" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="620" y1="372" x2="640" y2="397" stroke="#d0e5d3" strokeWidth="1" strokeDasharray="2 2" />
          </g>

          {/* Segment 2: Lower Tower Floor Plates (Levels 1-3, Elevates by -24px) */}
          <g
            style={{
              transform: activeBuilding === "bldgB" ? "translateY(-24px)" : "translateY(0px)",
              transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <polygon
              points="510,278 600,330 600,260 510,208"
              stroke="#d0e5d3"
              strokeWidth="1.2"
              fill="rgba(16, 50, 36, 0.85)"
            />
            <polygon
              points="600,330 690,278 690,208 600,260"
              stroke="#d0e5d3"
              strokeWidth="1.2"
              fill="rgba(26, 80, 58, 0.9)"
            />
            <polygon
              points="600,260 690,208 600,156 510,208"
              stroke="#f0f1e6"
              strokeWidth="1.4"
              fill="rgba(240, 241, 230, 0.12)"
            />
            {/* Louvers */}
            {[530, 550, 570].map((lx, idx) => (
              <line key={`b-l1-${idx}`} x1={lx} y1={220 + (lx - 510) * 0.58} x2={lx} y2={270 + (lx - 510) * 0.58} stroke="#a8cebc" strokeWidth="0.75" strokeOpacity="0.45" />
            ))}
            {[630, 650, 670].map((rx, idx) => (
              <line key={`b-r1-${idx}`} x1={rx} y1={250 - (rx - 600) * 0.58} x2={rx} y2={300 - (rx - 600) * 0.58} stroke="#a8cebc" strokeWidth="0.75" strokeOpacity="0.45" />
            ))}
          </g>

          {/* Segment 3: Upper Tower Floor Plates (Levels 4-6, Elevates by -50px) */}
          <g
            style={{
              transform: activeBuilding === "bldgB" ? "translateY(-50px)" : "translateY(0px)",
              transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <polygon
              points="510,208 600,260 600,194 510,142"
              stroke="#d0e5d3"
              strokeWidth="1.2"
              fill="rgba(16, 50, 36, 0.85)"
            />
            <polygon
              points="600,260 690,208 690,142 600,194"
              stroke="#d0e5d3"
              strokeWidth="1.2"
              fill="rgba(26, 80, 58, 0.9)"
            />
            <polygon
              points="600,194 690,142 600,90 510,142"
              stroke="#f0f1e6"
              strokeWidth="1.5"
              fill="rgba(240, 241, 230, 0.15)"
            />
            {/* Louvers */}
            {[530, 550, 570].map((lx, idx) => (
              <line key={`b-l2-${idx}`} x1={lx} y1={155 + (lx - 510) * 0.58} x2={lx} y2={205 + (lx - 510) * 0.58} stroke="#a8cebc" strokeWidth="0.75" strokeOpacity="0.45" />
            ))}
            {[630, 650, 670].map((rx, idx) => (
              <line key={`b-r2-${idx}`} x1={rx} y1={185 - (rx - 600) * 0.58} x2={rx} y2={235 - (rx - 600) * 0.58} stroke="#a8cebc" strokeWidth="0.75" strokeOpacity="0.45" />
            ))}
          </g>

          {/* Segment 4: Penthouse Aerofoil Canopy (Elevates by -78px) */}
          <g
            style={{
              transform: activeBuilding === "bldgB" ? "translateY(-78px)" : "translateY(0px)",
              transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <polygon
              points="600,172 705,112 600,52 495,112"
              stroke="#d0e5d3"
              strokeWidth="1.2"
              strokeDasharray="4 2"
              fill="rgba(240, 241, 230, 0.08)"
            />
            <line x1="510" y1="142" x2="495" y2="112" stroke="#d0e5d3" strokeWidth="0.8" />
            <line x1="690" y1="142" x2="705" y2="112" stroke="#d0e5d3" strokeWidth="0.8" />
            <line x1="600" y1="194" x2="600" y2="172" stroke="#d0e5d3" strokeWidth="1" />
            <line x1="600" y1="90" x2="600" y2="52" stroke="#d0e5d3" strokeWidth="1" />
          </g>

          {/* Restrained Architectural Labels for Revealed Components */}
          {activeBuilding === "bldgB" && (
            <g className="transition-opacity duration-300">
              {/* Crown Tag */}
              <g transform="translate(715, 20)">
                <line x1="0" y1="10" x2="-20" y2="30" stroke="#d0e5d3" strokeWidth="0.8" />
                <rect x="0" y="0" width="105" height="18" rx="2" fill="#171713" stroke="#a8cebc" strokeWidth="0.8" opacity="0.95" />
                <text x="52" y="12" textAnchor="middle" fill="#f0f1e6" fontSize="8" fontFamily="var(--font-manrope)" fontWeight="600" letterSpacing="0.8">
                  AEROFOIL CROWN
                </text>
              </g>

              {/* Upper Suites Tag */}
              <g transform="translate(715, 115)">
                <line x1="0" y1="10" x2="-25" y2="25" stroke="#d0e5d3" strokeWidth="0.8" />
                <rect x="0" y="0" width="105" height="18" rx="2" fill="#171713" stroke="#a8cebc" strokeWidth="0.8" opacity="0.95" />
                <text x="52" y="12" textAnchor="middle" fill="#f0f1e6" fontSize="8" fontFamily="var(--font-manrope)" fontWeight="600" letterSpacing="0.8">
                  PENTHOUSE SUITES
                </text>
              </g>

              {/* Mid Tower Tag */}
              <g transform="translate(715, 200)">
                <line x1="0" y1="10" x2="-25" y2="30" stroke="#d0e5d3" strokeWidth="0.8" />
                <rect x="0" y="0" width="115" height="18" rx="2" fill="#171713" stroke="#a8cebc" strokeWidth="0.8" opacity="0.95" />
                <text x="57" y="12" textAnchor="middle" fill="#f0f1e6" fontSize="8" fontFamily="var(--font-manrope)" fontWeight="600" letterSpacing="0.8">
                  RESIDENCES L3-L5
                </text>
              </g>

              {/* Atrium Lobby Tag */}
              <g transform="translate(715, 285)">
                <line x1="0" y1="10" x2="-35" y2="35" stroke="#d0e5d3" strokeWidth="0.8" />
                <rect x="0" y="0" width="105" height="18" rx="2" fill="#171713" stroke="#a8cebc" strokeWidth="0.8" opacity="0.95" />
                <text x="52" y="12" textAnchor="middle" fill="#f0f1e6" fontSize="8" fontFamily="var(--font-manrope)" fontWeight="600" letterSpacing="0.8">
                  GLAZED ATRIUM
                </text>
              </g>
            </g>
          )}
        </g>

        {/* -------------------------------------------------------------------------
            BUILDING C: EAST COURTYARD PAVILION
            Explodes vertically into 3 distinct tiers:
            - Ground Colonnade Portico
            - Mid Wing Residences with Garden Void
            - Stepped Upper Penthouse Wing
           ------------------------------------------------------------------------- */}
        <g
          className={`cursor-pointer animate-rise-b3 transition-opacity duration-500 focus:outline-none ${
            activeBuilding && activeBuilding !== "bldgC" ? "opacity-35" : "opacity-100"
          }`}
          onMouseEnter={() => setActiveBuilding("bldgC")}
          onMouseLeave={() => setActiveBuilding(null)}
          tabIndex={0}
          role="button"
          aria-label="Building C: East Courtyard Pavilion. Hover or focus to view exploded axonometric floor plates."
          onFocus={() => setActiveBuilding("bldgC")}
          onBlur={() => setActiveBuilding(null)}
        >
          {/* Ground Footprint */}
          <polygon
            points="870,340 970,395 870,450 770,395"
            stroke="#a8cebc"
            strokeWidth="1.2"
            strokeOpacity="0.45"
            fill="none"
          />

          {/* Exploded Connecting Spatial Guidelines (revealed on hover) */}
          {activeBuilding === "bldgC" && (
            <g stroke="#d0e5d3" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.75" className="transition-opacity duration-300">
              <line x1="770" y1="395" x2="770" y2="310" />
              <line x1="970" y1="395" x2="970" y2="310" />
              <line x1="870" y1="450" x2="870" y2="180" />
              <line x1="820" y1="290" x2="820" y2="200" />
              <line x1="920" y1="290" x2="920" y2="200" />
            </g>
          )}

          {/* Tier 1: Colonnade Ground Floor (Stationary) */}
          <g>
            <polygon
              points="770,395 870,450 870,395 770,340"
              stroke="#d0e5d3"
              strokeWidth="1.2"
              fill="rgba(16, 50, 36, 0.75)"
            />
            <polygon
              points="870,450 970,395 970,340 870,395"
              stroke="#d0e5d3"
              strokeWidth="1.2"
              fill="rgba(24, 75, 54, 0.85)"
            />
            <polygon
              points="870,395 970,340 870,285 770,340"
              stroke="#f0f1e6"
              strokeWidth="1.4"
              fill="rgba(240, 241, 230, 0.08)"
            />
            {/* Colonnade Posts */}
            {[795, 820, 845].map((px, idx) => (
              <line
                key={`col-${idx}`}
                x1={px}
                y1={410 + (px - 770) * 0.55}
                x2={px}
                y2={435 + (px - 770) * 0.55}
                stroke="#f0f1e6"
                strokeWidth="1"
                strokeOpacity="0.8"
              />
            ))}
          </g>

          {/* Tier 2: Mid Wing Residences with Garden Void (Elevates by -26px) */}
          <g
            style={{
              transform: activeBuilding === "bldgC" ? "translateY(-26px)" : "translateY(0px)",
              transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <polygon
              points="770,340 870,395 870,340 770,285"
              stroke="#d0e5d3"
              strokeWidth="1.2"
              fill="rgba(16, 50, 36, 0.8)"
            />
            <polygon
              points="870,395 970,340 970,285 870,340"
              stroke="#d0e5d3"
              strokeWidth="1.2"
              fill="rgba(24, 75, 54, 0.9)"
            />
            <polygon
              points="870,340 970,285 870,230 770,285"
              stroke="#f0f1e6"
              strokeWidth="1.4"
              fill="rgba(240, 241, 230, 0.12)"
            />
            {/* Internal Garden Void in Roof */}
            <polygon
              points="870,310 915,285 870,260 825,285"
              stroke="#a8cebc"
              strokeWidth="1.1"
              strokeDasharray="3 3"
              fill="rgba(16, 50, 36, 0.95)"
            />
            {/* Ribbon Window Bands */}
            <line x1="770" y1="310" x2="870" y2="365" stroke="#d0e5d3" strokeWidth="0.85" />
            <line x1="870" y1="365" x2="970" y2="310" stroke="#d0e5d3" strokeWidth="0.85" />
          </g>

          {/* Tier 3: Upper Penthouse Wing (Elevates by -52px) */}
          <g
            style={{
              transform: activeBuilding === "bldgC" ? "translateY(-52px)" : "translateY(0px)",
              transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <polygon
              points="820,290 870,318 870,265 820,237"
              stroke="#d0e5d3"
              strokeWidth="1.1"
              fill="rgba(16, 50, 36, 0.85)"
            />
            <polygon
              points="870,318 920,290 920,237 870,265"
              stroke="#d0e5d3"
              strokeWidth="1.1"
              fill="rgba(24, 75, 54, 0.95)"
            />
            <polygon
              points="870,265 920,237 870,209 820,237"
              stroke="#f0f1e6"
              strokeWidth="1.3"
              fill="rgba(240, 241, 230, 0.18)"
            />
          </g>

          {/* Restrained Architectural Labels for Revealed Components */}
          {activeBuilding === "bldgC" && (
            <g className="transition-opacity duration-300">
              {/* Upper Wing Tag */}
              <g transform="translate(975, 175)">
                <line x1="0" y1="10" x2="-55" y2="30" stroke="#d0e5d3" strokeWidth="0.8" />
                <rect x="0" y="0" width="105" height="18" rx="2" fill="#171713" stroke="#a8cebc" strokeWidth="0.8" opacity="0.95" />
                <text x="52" y="12" textAnchor="middle" fill="#f0f1e6" fontSize="8" fontFamily="var(--font-manrope)" fontWeight="600" letterSpacing="0.8">
                  UPPER RETREAT
                </text>
              </g>

              {/* Garden Atrium Tag */}
              <g transform="translate(975, 260)">
                <line x1="0" y1="10" x2="-65" y2="25" stroke="#d0e5d3" strokeWidth="0.8" />
                <rect x="0" y="0" width="105" height="18" rx="2" fill="#171713" stroke="#a8cebc" strokeWidth="0.8" opacity="0.95" />
                <text x="52" y="12" textAnchor="middle" fill="#f0f1e6" fontSize="8" fontFamily="var(--font-manrope)" fontWeight="600" letterSpacing="0.8">
                  COURTYARD VOID
                </text>
              </g>

              {/* Colonnade Tag */}
              <g transform="translate(975, 345)">
                <line x1="0" y1="10" x2="-45" y2="30" stroke="#d0e5d3" strokeWidth="0.8" />
                <rect x="0" y="0" width="115" height="18" rx="2" fill="#171713" stroke="#a8cebc" strokeWidth="0.8" opacity="0.95" />
                <text x="57" y="12" textAnchor="middle" fill="#f0f1e6" fontSize="8" fontFamily="var(--font-manrope)" fontWeight="600" letterSpacing="0.8">
                  PORTICO GALLERY
                </text>
              </g>
            </g>
          )}
        </g>

        {/* =========================================================================
            STAGE 4: ARCHITECTURAL ANNOTATIONS, ELEVATION MARKS & DIMENSIONS
           ========================================================================= */}
        <g
          className={`animate-emerge-details transition-opacity duration-500 ${
            activeBuilding ? "opacity-40" : "opacity-100"
          }`}
        >
          {/* Dimension string between West and Central Buildings */}
          <g stroke="#a8cebc" strokeWidth="0.9" opacity="0.75">
            <line x1="330" y1="465" x2="600" y2="600" strokeDasharray="3 3" />
            {signalsEnabled && (
              <line
                x1="330"
                y1="465"
                x2="600"
                y2="600"
                pathLength={1}
                className="diagram-signal"
                stroke="#f0f1e6"
                strokeWidth="1.6"
                style={{ "--signal-delay": "-2s" } as React.CSSProperties}
              />
            )}
            <line x1="324" y1="458" x2="336" y2="472" stroke="#d0e5d3" />
            <line x1="594" y1="593" x2="606" y2="607" stroke="#d0e5d3" />
            <text
              x="445"
              y="538"
              fill="#a8cebc"
              fontSize="9"
              fontFamily="var(--font-manrope)"
              fontWeight="600"
              letterSpacing="1.2"
              transform="rotate(26 445 538)"
            >
              DIST: 68.40 M
            </text>
          </g>

          {/* Dimension string between Central and East Buildings */}
          <g stroke="#a8cebc" strokeWidth="0.9" opacity="0.75">
            <line x1="600" y1="600" x2="870" y2="465" strokeDasharray="3 3" />
            {signalsEnabled && (
              <line
                x1="600"
                y1="600"
                x2="870"
                y2="465"
                pathLength={1}
                className="diagram-signal diagram-signal--reverse"
                stroke="#f0f1e6"
                strokeWidth="1.6"
                style={{ "--signal-delay": "-7.5s" } as React.CSSProperties}
              />
            )}
            <line x1="594" y1="607" x2="606" y2="593" stroke="#d0e5d3" />
            <line x1="864" y1="472" x2="876" y2="458" stroke="#d0e5d3" />
            <text
              x="715"
              y="538"
              fill="#a8cebc"
              fontSize="9"
              fontFamily="var(--font-manrope)"
              fontWeight="600"
              letterSpacing="1.2"
              transform="rotate(-26 715 538)"
            >
              DIST: 68.40 M
            </text>
          </g>

          {/* Top Elevation Height Datum Markers */}
          {[
            { x: 330, y: 155, height: "+28.50M", label: "PH CASCADE" },
            { x: 600, y: 35, height: "+64.20M", label: "CROWN PINNACLE" },
            { x: 870, y: 190, height: "+24.00M", label: "TERRACE COURT" },
          ].map((mark, i) => (
            <g key={i}>
              <line x1={mark.x} y1={mark.y} x2={mark.x} y2={mark.y + 16} stroke="#a8cebc" strokeWidth="1" />
              <polygon points={`${mark.x},${mark.y} ${mark.x - 5},${mark.y - 8} ${mark.x + 5},${mark.y - 8}`} fill="#d0e5d3" />
              <text
                x={mark.x}
                y={mark.y - 12}
                textAnchor="middle"
                fill="#f0f1e6"
                fontSize="9"
                fontFamily="var(--font-manrope)"
                fontWeight="600"
                letterSpacing="0.8"
              >
                {mark.height}
              </text>
              <text
                x={mark.x}
                y={mark.y - 23}
                textAnchor="middle"
                fill="#a8cebc"
                fontSize="8"
                fontFamily="var(--font-manrope)"
                fontWeight="500"
                letterSpacing="1.2"
                opacity="0.85"
              >
                {mark.label}
              </text>
            </g>
          ))}

          {/* Section Cut Indicator Plumb Lines along Bottom Margin */}
          <g stroke="#a8cebc" strokeWidth="1" opacity="0.6">
            {[240, 420, 600, 780, 960].map((cx, i) => (
              <g key={`sec-${i}`}>
                <line x1={cx} y1={625} x2={cx} y2={645} strokeDasharray="2 3" />
                <circle cx={cx} cy={648} r="5.5" stroke="#d0e5d3" fill="#1f5e44" />
                <text
                  x={cx}
                  y={651}
                  textAnchor="middle"
                  fill="#f0f1e6"
                  fontSize="7.5"
                  fontFamily="var(--font-manrope)"
                  fontWeight="600"
                >
                  {`S${i + 1}`}
                </text>
              </g>
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
};

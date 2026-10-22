"use client";

import React, { useState } from "react";

type ChannelId = "website" | "campaign" | "sales" | "sharing";

interface ChannelConfig {
  id: ChannelId;
  label: string;
  sub: string;
  headline: string;
  description: string;
  mockupTitle: string;
  mockupContext: string;
}

const CHANNELS: Record<ChannelId, ChannelConfig> = {
  website: {
    id: "website",
    label: "Developer website",
    sub: "Direct Embedded Experience",
    headline: "Seamlessly native inside your project web presentation.",
    description: "Replace static perspective galleries and flat floorplan downloads with an interactive canvas directly embedded in your development’s landing page. Prospective buyers explore units, orientations, and shared amenities without leaving your website.",
    mockupTitle: "desktop-browser-frame",
    mockupContext: "https://meridian-residences.com/explore-precinct",
  },
  campaign: {
    id: "campaign",
    label: "Campaign link",
    sub: "High-Fidelity Ad Previews",
    headline: "Transform paid campaigns into instant spatial discovery.",
    description: "Direct targeted digital ads, institutional newsletters, and press features straight to a lightweight zero-install link. Visitors arrive immediately in a fluid, high-resolution interactive model optimized for desktop and high-end mobile displays.",
    mockupTitle: "campaign-preview-frame",
    mockupContext: "https://worldsmith.live/view/aethelgard-q4",
  },
  sales: {
    id: "sales",
    label: "QR / sales gallery",
    sub: "Physical Showroom Immersion",
    headline: "Bring physical sales suites and showroom displays to life.",
    description: "Place high-precision QR codes on print brochures, showroom podiums, and hoardings. Buyers can scan with their smartphone or touch a gallery display table to walk through the digital development during real-time sales consultations.",
    mockupTitle: "mobile-showroom-touch",
    mockupContext: "Physical Sales Gallery // Standalone Display Station",
  },
  sharing: {
    id: "sharing",
    label: "Direct sharing",
    sub: "Private Client Transmissions",
    headline: "Equip your sales team with personalized private links.",
    description: "Sales directors can send a deep link configured to a specific residence (e.g. Suite 802) directly to high-net-worth prospects via email or messaging apps. The buyer opens the exact view discussed, with no logins, passwords, or bulky app downloads required.",
    mockupTitle: "private-client-viewport",
    mockupContext: "Direct Client Link // Configured to Residence 802",
  },
};

export const DeveloperUseCases: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState<ChannelId>("website");
  const current = CHANNELS[activeChannel];

  return (
    <section
      id="use-cases"
      className="relative z-20 w-full min-h-screen bg-[#ecece2] text-[#1f6651] py-24 sm:py-32 px-6 sm:px-10 lg:px-14 border-t border-[#1f6651]/15 flex flex-col justify-between overflow-hidden font-body"
    >
      {/* Ivory architectural grid datum lines */}
      <div className="pointer-events-none absolute inset-0 z-0 grid-lines-ivory" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col gap-12 sm:gap-14">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#1f6651]/20 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#1f6651]" aria-hidden="true" />
              <span className="font-display text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] text-[#1f6651]/75 uppercase">
                Built for Property Marketing
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-[#1f6651] tracking-tight">
              Give every first impression <span className="font-accent italic font-normal text-[#1f6651]">more depth.</span>
            </h2>
          </div>
          <p className="font-body text-xs sm:text-sm text-[#1f6651]/85 max-w-md leading-relaxed">
            Bring the property experience into the places where buyers discover, consider and evaluate their next home.
          </p>
        </div>

        {/* 4 Interactive Selector Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {(["website", "campaign", "sales", "sharing"] as const).map((id) => {
            const ch = CHANNELS[id];
            const isSelected = activeChannel === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveChannel(id)}
                className={`p-4 sm:p-5 rounded-lg border text-left transition-all duration-300 flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#1f6651] text-[#f0f1e6] border-[#1f6651] shadow-md"
                    : "bg-[#e5e4df]/80 hover:bg-[#deddd7] text-[#1f6651] border-[#1f6651]/20"
                }`}
              >
                <div>
                  <span className="block text-[10px] uppercase tracking-wider opacity-75 mb-1">
                    {ch.sub}
                  </span>
                  <span className="font-display text-sm sm:text-base font-bold block">
                    {ch.label}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold">
                  <span>{isSelected ? "Active View" : "Switch Context"}</span>
                  <span>{isSelected ? "●" : "→"}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Context Mockup Canvas (visibly shifts based on selection) */}
        <div className="relative w-full bg-[#dedcd3] border border-[#1f6651]/25 rounded-xl p-6 sm:p-10 min-h-[460px] sm:min-h-[520px] flex flex-col justify-between overflow-hidden">
          
          {/* Top Browser / Device Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1f6651]/20 z-20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1f6651]/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#1f6651]/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#1f6651]/40" />
              <div className="ml-3 px-3 py-1 rounded bg-[#ecece2] border border-[#1f6651]/20 text-[10px] font-mono text-[#1f6651]/80 max-w-[260px] sm:max-w-md truncate">
                {current.mockupContext}
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-[#1f6651]/75 font-semibold">
              Live Mockup Preview
            </span>
          </div>

          {/* Center Dynamic Visual Simulation */}
          <div className="relative w-full h-[280px] sm:h-[340px] my-auto flex items-center justify-center">
            
            {/* VIEW 1: DEVELOPER WEBSITE (Desktop Embed inside Project Page) */}
            {activeChannel === "website" && (
              <div className="w-full h-full max-w-4xl bg-[#ecece2] border border-[#1f6651]/25 rounded shadow-inner p-4 sm:p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-[#1f6651]/15 pb-2 text-xs font-display font-bold text-[#1f6651]">
                  <span>MERIDIAN CAPITAL // AETHELGARD PRECINCT</span>
                  <span className="text-[10px] font-sans font-normal text-[#1f6651]/70">NAVIGABLE EMBED</span>
                </div>
                <div className="relative w-full h-[180px] sm:h-[220px] bg-[#1f6651] rounded flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 grid-lines opacity-40 pointer-events-none" />
                  <div className="text-center z-10 px-4">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#d0e5d3] block mb-1">
                      WorldSmith Embedded Iframe / Canvas
                    </span>
                    <p className="font-display text-lg sm:text-xl font-bold text-[#f0f1e6]">
                      Interactive Spatial Precinct Engine
                    </p>
                    <span className="inline-block mt-3 px-3 py-1 rounded-full bg-[#25231b] text-[10px] text-[#f0f1e6] border border-[#d0e5d3]/40">
                      Zero Page Disruption // Zero App Installs
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#1f6651]/80">
                  <span>Responsive WebGL Canvas API</span>
                  <span>Direct Integration with Project CMS</span>
                </div>
              </div>
            )}

            {/* VIEW 2: CAMPAIGN LINK (Standalone Ultra-fast Preview) */}
            {activeChannel === "campaign" && (
              <div className="w-full h-full max-w-2xl bg-[#ecece2] border border-[#1f6651]/30 rounded shadow-md p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1f6651]">
                  <span className="px-2 py-0.5 rounded bg-[#1f6651] text-[#f0f1e6] text-[10px]">DIRECT AD DESTINATION</span>
                  <span className="text-[10px] text-[#1f6651]/70">LOAD TIME &lt; 850MS</span>
                </div>
                <div className="p-6 bg-[#184834] rounded text-[#f0f1e6] flex flex-col items-center justify-center text-center space-y-3">
                  <span className="text-xs uppercase tracking-widest text-[#a8cebc]">The Sky Residences at Aethelgard</span>
                  <h4 className="font-display text-2xl font-bold text-[#f0f1e6]">Explore Penthouse Collection in 3D</h4>
                  <p className="text-xs text-[#a8cebc]/90 max-w-sm">
                    Campaign traffic lands immediately into an interactive axonometric model rather than a passive lead capture page.
                  </p>
                  <button className="px-5 py-2 rounded-full bg-[#f0f1e6] text-[#1f6651] font-semibold text-xs shadow">
                    Launch Interactive Tour →
                  </button>
                </div>
                <span className="text-[10px] text-center text-[#1f6651]/70">Compatible with Google, Meta, LinkedIn, and Email Campaigns</span>
              </div>
            )}

            {/* VIEW 3: SALES GALLERY / QR (Mobile Tablet Pod Layout) */}
            {activeChannel === "sales" && (
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 max-w-3xl">
                {/* QR Pod Box */}
                <div className="p-4 bg-[#ecece2] border border-[#1f6651]/30 rounded-lg shadow-sm flex flex-col items-center text-center">
                  <div className="w-28 h-28 bg-[#1f6651] rounded p-2 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-[#ecece2]">
                      <rect x="10" y="10" width="30" height="30" rx="3" />
                      <rect x="60" y="10" width="30" height="30" rx="3" />
                      <rect x="10" y="60" width="30" height="30" rx="3" />
                      <rect x="18" y="18" width="14" height="14" fill="#1f6651" />
                      <rect x="68" y="18" width="14" height="14" fill="#1f6651" />
                      <rect x="18" y="68" width="14" height="14" fill="#1f6651" />
                      <rect x="50" y="50" width="12" height="12" />
                      <rect x="70" y="70" width="15" height="15" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold tracking-wider text-[#1f6651] mt-2 uppercase">Scan to Open Model</span>
                </div>

                {/* Mobile Device Mockup */}
                <div className="w-56 h-80 bg-[#1f6651] rounded-2xl border-4 border-[#25231b] p-3 shadow-xl flex flex-col justify-between text-[#f0f1e6]">
                  <div className="flex items-center justify-between text-[9px] text-[#a8cebc]">
                    <span>9:41</span>
                    <span className="w-2 h-2 rounded-full bg-[#d0e5d3]" />
                  </div>
                  <div className="my-auto text-center">
                    <span className="text-[9px] uppercase tracking-widest text-[#a8cebc]">On-Device Model</span>
                    <div className="text-sm font-display font-bold mt-1">Aethelgard 3D</div>
                    <div className="w-20 h-20 mx-auto my-2 border border-[#a8cebc]/40 rounded flex items-center justify-center text-[10px] text-[#d0e5d3]">
                      [Spatial Model]
                    </div>
                  </div>
                  <div className="text-[9px] text-center text-[#a8cebc]/70">Instant Mobile Touch Interaction</div>
                </div>
              </div>
            )}

            {/* VIEW 4: DIRECT CLIENT SHARING (Personalized Deep-link View) */}
            {activeChannel === "sharing" && (
              <div className="w-full h-full max-w-2xl bg-[#ecece2] border border-[#1f6651]/30 rounded shadow-md p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1f6651]">
                  <span>VIP CLIENT TRANSMISSION</span>
                  <span className="px-2 py-0.5 rounded bg-[#1f6651]/15 text-[#1f6651] text-[10px]">DEEP-LINKED: SUITE 802</span>
                </div>
                <div className="p-5 bg-[#143d2c] rounded text-[#f0f1e6] space-y-2">
                  <div className="text-[10px] uppercase tracking-widest text-[#d0e5d3]">Personalized Presentation Link</div>
                  <div className="font-display text-xl font-bold">Suite 802 — Southwest Sky Residence</div>
                  <p className="text-xs text-[#a8cebc] leading-relaxed">
                    Sent directly via private link. The prospect opens the exact apartment with sunset orientation pre-selected, ready to review with family or investment advisors.
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-[10px] px-2 py-1 rounded bg-[#25231b] text-[#f0f1e6]">No Password Required</span>
                    <span className="text-[10px] text-[#a8cebc]">Session Analytics Tracked</span>
                  </div>
                </div>
                <span className="text-[10px] text-center text-[#1f6651]/70">Ideal for high-touch brokerage, offshore buyers, and private sales directors</span>
              </div>
            )}

          </div>

          {/* Bottom Active Channel Meta */}
          <div className="pt-4 border-t border-[#1f6651]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <span className="font-display text-sm font-bold text-[#1f6651]">
              {current.headline}
            </span>
            <span className="text-[11px] text-[#1f6651]/80 max-w-lg text-left sm:text-right font-normal">
              {current.description}
            </span>
          </div>

        </div>

        {/* 3 Core Commercial Value Statements */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 pt-4">
          <div className="border-t border-[#1f6651]/20 pt-6">
            <span className="font-display text-xs font-bold text-[#1f6651] tracking-widest block mb-2">
              Give buyers more context before arranging a visit.
            </span>
            <p className="font-body text-xs sm:text-sm text-[#1f6651]/80 leading-relaxed font-normal">
              Purchasers arrive at meetings with spatial literacy already formed. Conversations focus on purchase commitments rather than basic layout orientation.
            </p>
          </div>

          <div className="border-t border-[#1f6651]/20 pt-6">
            <span className="font-display text-xs font-bold text-[#1f6651] tracking-widest block mb-2">
              Make the development easier to understand as a connected place.
            </span>
            <p className="font-body text-xs sm:text-sm text-[#1f6651]/80 leading-relaxed font-normal">
              Show how private apartments relate directly to landscaped courtyards, subterranean amenities, and vehicular routes without relying on imagination.
            </p>
          </div>

          <div className="border-t border-[#1f6651]/20 pt-6">
            <span className="font-display text-xs font-bold text-[#1f6651] tracking-widest block mb-2">
              Extend the property presentation beyond static marketing assets.
            </span>
            <p className="font-body text-xs sm:text-sm text-[#1f6651]/80 leading-relaxed font-normal">
              Static brochures and glossy renders only capture single angles. WorldSmith allows continuous exploration across devices anytime, anywhere.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

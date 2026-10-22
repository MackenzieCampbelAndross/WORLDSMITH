"use client";

import React from "react";

export const HeroTypography: React.FC = () => {
  return (
    <div className="relative z-20 flex w-full flex-col justify-end px-6 pb-12 pt-4 font-body pointer-events-none sm:px-10 sm:pb-10 lg:px-14 lg:pb-12">
      <div className="grid grid-cols-1 items-end gap-8 sm:gap-10 lg:grid-cols-12 lg:gap-10">
        <div className="pointer-events-auto lg:col-span-8">
          <h1 className="max-w-4xl select-text font-display text-[clamp(2.4rem,6.6vw,5.85rem)] font-bold leading-[0.98] tracking-[-0.035em] text-[#f0f1e6]">
            A world before <br />
            it’s <span className="font-accent font-normal italic tracking-tight text-[#d0e5d3]">built.</span>
          </h1>
        </div>

        <div className="flex justify-start pointer-events-auto lg:col-span-4 lg:justify-end">
          <div className="max-w-[22rem] lg:pb-1">
            <div className="mb-4 h-px w-10 bg-[#a8cebc]/45" aria-hidden="true" />
            <p className="font-body text-[13px] font-normal leading-[1.75] tracking-[-0.005em] text-[#f0f1e6]/80 sm:text-[14px]">
              We transform architectural plans, renders and project assets into interactive places buyers can explore before they visit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

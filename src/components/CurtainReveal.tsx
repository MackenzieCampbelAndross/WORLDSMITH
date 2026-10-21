"use client";

import React, { useEffect, useState } from "react";

interface CurtainRevealProps {
  onComplete?: () => void;
}

/**
 * CurtainReveal recreates the precise opening transition observed in the Crosswalk reference video:
 * A series of vertical columns (cream / architectural parchment color #ecece2) that slide
 * downwards in a staggered wave from left to right, smoothly revealing the deep architectural green canvas.
 */
export const CurtainReveal: React.FC<CurtainRevealProps> = ({ onComplete }) => {
  const [columns] = useState(() => Array.from({ length: 10 }, (_, i) => i));
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Total animation runs ~1.8s (first column starts at 0.1s, last finishes around 1.6s)
    const timer = setTimeout(() => {
      setIsFinished(true);
      if (onComplete) onComplete();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (isFinished) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none flex w-full h-full overflow-hidden"
      aria-hidden="true"
    >
      {columns.map((index) => {
        // Stagger delay from left to right (70ms each step)
        const delay = index * 0.075;
        return (
          <div
            key={index}
            className="flex-1 h-full bg-[#ecece2] relative border-r border-[#deded4]/40"
            style={{
              animation: `curtainDrop 1.05s cubic-bezier(0.76, 0, 0.24, 1) forwards`,
              animationDelay: `${delay}s`,
              transformOrigin: "top",
              willChange: "transform",
            }}
          >
            {/* Subtle vertical measurement notch on each column */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-mono tracking-widest text-[#7a7a72] opacity-40 select-none">
              {(index + 1).toString().padStart(2, "0")}
            </div>
          </div>
        );
      })}
    </div>
  );
};

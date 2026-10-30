import React from "react";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export const ProjectCover = ({
  src,
  name,
  className = "",
}: {
  src?: string | null;
  name: string;
  className?: string;
}) => {
  if (src) {
    return (
      // Signed, short-lived storage URL; Next Image cannot optimise it.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${name} cover`}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-[#1b4a36] ${className}`}
      aria-label={`${name} cover placeholder`}
    >
      <div className="absolute inset-0 opacity-30">
        <svg viewBox="0 0 120 80" className="h-full w-full" fill="none" aria-hidden="true">
          <path d="M8 68h104M16 68V38l20-13 20 13v30M56 68V30l24-14 24 14v38" stroke="#e9e3d2" strokeWidth="0.7" />
          <path d="M16 50h40M56 44h48M16 56h40M56 52h48" stroke="#e9e3d2" strokeWidth="0.4" />
        </svg>
      </div>
      <span className="relative font-cormorant text-[18px] uppercase tracking-[0.18em] text-[#f2edde]">
        {initials(name) || "WS"}
      </span>
    </div>
  );
};

import React from "react";

const MailIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-3.5 w-3.5 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    aria-hidden="true"
  >
    <rect x="3" y="5.5" width="18" height="13" rx="1.2" />
    <path d="m3.6 7 8.4 6 8.4-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SiteFooter: React.FC = () => {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-black font-body text-[#f0f1e6]">
      <div
        className="pointer-events-none absolute inset-0 paper-grain opacity-50 mix-blend-soft-light"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 grid-lines"
        style={{ "--grid-line-color": "rgba(233, 230, 219, 0.04)" } as React.CSSProperties}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex min-h-[clamp(200px,16vw,260px)] w-full max-w-[1760px] flex-col px-6 pb-3 pt-6 sm:px-10 sm:pb-4 sm:pt-7 lg:px-14">
        <div className="flex justify-end">
          <a
            href="mailto:worldsmith.in@gmail.com"
            className="inline-flex items-center gap-2.5 rounded-sm py-1 font-body text-[12px] tracking-[0.02em] text-[#f0f1e6]/65 transition-colors duration-200 hover:text-[#f0f1e6] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#d0e5d3]/70 sm:text-[13px]"
          >
            <MailIcon />
            worldsmith.in@gmail.com
          </a>
        </div>

        <div className="flex flex-1 items-end justify-center">
          <p
            className="footer-wordmark text-center whitespace-nowrap font-anton font-normal uppercase leading-none tracking-[-0.01em]"
            style={{ fontSize: "calc(clamp(2.5rem, 8.5vw, 9rem) + 5px)" }}
          >
            WORLDSMITH
          </p>
        </div>
      </div>
    </footer>
  );
};

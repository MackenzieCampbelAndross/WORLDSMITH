import React from "react";
import Link from "next/link";

export const EmptyState = ({
  title,
  body,
  actionLabel,
  actionHref,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
}) => (
  <div className="flex flex-col items-start border border-[#e2ddd1] bg-[#fbf9f3] px-7 py-10 sm:px-10">
    <p className="font-accent text-[24px] leading-tight text-[#171713]">{title}</p>
    <p className="mt-3 max-w-[440px] font-body text-[13px] leading-6 text-[#716b5d]">{body}</p>
    {actionLabel && actionHref && (
      <Link
        href={actionHref}
        className="mt-6 inline-flex items-center gap-2 bg-[#1f5e44] px-5 py-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f7f4ec] transition-colors hover:bg-[#174d37]"
      >
        <span aria-hidden="true">+</span>
        {actionLabel}
      </Link>
    )}
  </div>
);

export const LoadingBlock = ({ className = "h-24" }: { className?: string }) => (
  <div className={`animate-pulse bg-[#e9e4d8] ${className}`} aria-hidden="true" />
);

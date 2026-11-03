"use client";

import React from "react";
import Link from "next/link";
import { STATUS_LABELS, type Project, type ProjectStatus } from "@/lib/portal";

const statusDot: Record<ProjectStatus, string> = {
  DRAFT: "bg-[#a08a5c]",
  SUBMITTED: "bg-[#5a7d68]",
  REVIEWING: "bg-[#b3914e]",
  ASSETS_RECEIVED: "bg-[#4c8b7d]",
  PROCESSING: "bg-[#5d7f99]",
  INTERNAL_REVIEW: "bg-[#7c6b9e]",
  CLIENT_REVIEW: "bg-[#a97b56]",
  COMPLETED: "bg-[#4e8a5c]",
};

export const ProjectCard = ({
  project,
  coverUrl,
}: {
  project: Project;
  coverUrl?: string | null;
}) => {
  const openHref = project.status === "DRAFT" ? `/projects/new?draft=${project.id}` : `/projects/${project.id}`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[12px] border border-[#e2ddd1] bg-[#fdfbf6] transition-colors duration-300 hover:border-[#c8c0ae]">
      <Link
        href={openHref}
        aria-hidden="true"
        tabIndex={-1}
        className="block h-[168px] overflow-hidden border-b border-[#eee9df] bg-[#f2ecdf]"
      >
        {coverUrl ? (
          // Signed, short-lived storage URL.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={`${project.name} cover`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
          />
        ) : (
          <span className="sr-only">{project.name}</span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-5 pb-4 pt-4">
        <Link href={openHref} className="font-accent text-[24px] leading-none text-[#171713] transition-colors hover:text-[#1f5e44]">
          {project.name}
        </Link>
        <p className="mt-2 font-body text-[11.5px] text-[#716b5d]">
          {[project.type, project.location].filter(Boolean).join(" · ") || "Project"}
        </p>

        <div className="mt-5 flex items-end justify-between gap-3">
          <span className="inline-flex items-center gap-2 font-body text-[11px] text-[#3f3b33]">
            <span className={`h-1.5 w-1.5 rounded-full ${statusDot[project.status]}`} />
            {STATUS_LABELS[project.status]}
          </span>

          <details className="relative">
            <summary
              aria-label={`Actions for ${project.name}`}
              className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-full text-[#8a8374] transition-colors hover:bg-[#f1ebdf] hover:text-[#171713] [&::-webkit-details-marker]:hidden"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                <circle cx="3" cy="8" r="1" fill="currentColor" />
                <circle cx="8" cy="8" r="1" fill="currentColor" />
                <circle cx="13" cy="8" r="1" fill="currentColor" />
              </svg>
            </summary>
            <div className="absolute bottom-full right-0 mb-1 w-40 rounded-[8px] border border-[#e2ddd1] bg-[#fdfbf6] py-1 shadow-[0_10px_24px_-16px_rgba(0,0,0,0.35)]">
              <Link href={openHref} className="block px-3 py-2 font-body text-[11px] text-[#3f3b33] hover:bg-[#f5f0e5]">
                {project.status === "DRAFT" ? "Continue setup" : "Open project"}
              </Link>
              <Link href={`/projects/${project.id}/activity`} className="block px-3 py-2 font-body text-[11px] text-[#3f3b33] hover:bg-[#f5f0e5]">
                Activity
              </Link>
            </div>
          </details>
        </div>
      </div>
    </article>
  );
};

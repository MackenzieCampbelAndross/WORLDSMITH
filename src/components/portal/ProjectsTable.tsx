"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatRelative } from "@/lib/format";
import { STATUS_LABELS, type Project, type ProjectStatus } from "@/lib/portal";
import { SUBMISSION_STAGES, submissionStageIndex } from "@/lib/productionStatus";

const STATUS_STYLES: Record<ProjectStatus, string> = {
  DRAFT: "bg-black/[0.05] text-[#555d56]",
  SUBMITTED: "bg-[#eef5f1] text-[#1f5e44]",
  REVIEWING: "bg-[#fef9eb] text-[#8a681b]",
  ASSETS_RECEIVED: "bg-[#e8f4ed] text-[#1b5e43]",
  PROCESSING: "bg-[#ebf3f7] text-[#2c5f78]",
  INTERNAL_REVIEW: "bg-[#f3eff8] text-[#5c4a75]",
  CLIENT_REVIEW: "bg-[#e3f4ea] text-[#1b6b41]",
  COMPLETED: "bg-[#e3f4ea] text-[#1b6b41]",
};

const MoreIcon = () => (
  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <circle cx="4.5" cy="10" r="1.2" />
    <circle cx="10" cy="10" r="1.2" />
    <circle cx="15.5" cy="10" r="1.2" />
  </svg>
);

export const StatusChip = ({ status }: { status: ProjectStatus }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 font-body text-[10px] font-medium ${STATUS_STYLES[status]}`}>
    {STATUS_LABELS[status]}
  </span>
);

const progressFor = (status: ProjectStatus) => {
  const index = submissionStageIndex(status);
  if (index < 0) return 0;
  return Math.round(((index + 1) / SUBMISSION_STAGES.length) * 100);
};

export const ProjectsTable = ({ projects }: { projects: Project[] }) => {
  const router = useRouter();

  return (
    <div className="min-h-0 overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-black/[0.06]">
            {["Project", "Type", "Stage", "Progress", "Updated", ""].map((heading) => (
              <th
                key={heading}
                className="whitespace-nowrap py-2.5 pr-4 font-body text-[8.5px] font-semibold uppercase tracking-[0.14em] text-[#868d83] last:pr-1"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const href = `/projects/${project.id}`;
            const progress = progressFor(project.status);
            return (
              <tr
                key={project.id}
                onClick={() => router.push(href)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") router.push(href);
                }}
                tabIndex={0}
                className="cursor-pointer border-b border-black/[0.04] transition-colors last:border-b-0 hover:bg-[#f9faf9] focus-visible:bg-[#f9faf9] focus-visible:outline-none"
              >
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#eef5f1] font-body text-[12px] font-bold text-[#1f5e44]">
                      {project.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={href}
                        onClick={(event) => event.stopPropagation()}
                        className="block truncate font-body text-[12px] font-semibold text-[#17201b] hover:text-[#1f5e44]"
                      >
                        {project.name}
                      </Link>
                      <p className="mt-0.5 truncate font-body text-[10px] text-[#868d83]">
                        {project.developer || project.location || "—"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap py-2.5 pr-4 font-body text-[11px] text-[#48524a]">
                  {[project.type, project.location].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="whitespace-nowrap py-2.5 pr-4">
                  <StatusChip status={project.status} />
                </td>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-black/[0.06]">
                      <div
                        className="h-full rounded-full bg-[#1f5e44]"
                        style={{ width: `${Math.max(progress, 2)}%` }}
                      />
                    </div>
                    <span className="font-body text-[10.5px] font-medium text-[#5d675f]">{progress}%</span>
                  </div>
                </td>
                <td className="whitespace-nowrap py-2.5 pr-4 font-body text-[10.5px] text-[#868d83]">
                  {project.updatedAt ? formatRelative(project.updatedAt) : "—"}
                </td>
                <td className="py-2.5 pr-1 text-right">
                  <details className="relative" onClick={(event) => event.stopPropagation()}>
                    <summary
                      aria-label={`Open menu for ${project.name}`}
                      className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-full text-[#868d83] transition-colors hover:bg-black/[0.05] hover:text-[#17201b] [&::-webkit-details-marker]:hidden"
                    >
                      <MoreIcon />
                    </summary>
                    <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-[12px] border border-black/[0.08] bg-white py-1 shadow-[0_16px_36px_-16px_rgba(0,0,0,0.15)]">
                      <Link
                        href={href}
                        className="block px-3 py-2 font-body text-[11px] text-[#333d36] hover:bg-[#f7f9f7]"
                      >
                        Open project
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard?.writeText(`${window.location.origin}${href}`);
                        }}
                        className="block w-full px-3 py-2 text-left font-body text-[11px] text-[#333d36] hover:bg-[#f7f9f7]"
                      >
                        Copy link
                      </button>
                      <Link
                        href={`${href}/source`}
                        className="block px-3 py-2 font-body text-[11px] text-[#333d36] hover:bg-[#f7f9f7]"
                      >
                        Source files
                      </Link>
                    </div>
                  </details>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

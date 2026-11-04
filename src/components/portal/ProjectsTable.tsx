"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatRelative } from "@/lib/format";
import { STATUS_LABELS, type Project, type ProjectStatus } from "@/lib/portal";
import { SUBMISSION_STAGES, submissionStageIndex } from "@/lib/productionStatus";

const STATUS_STYLES: Record<ProjectStatus, string> = {
  DRAFT: "bg-[#efede4] text-[#6d7168]",
  SUBMITTED: "bg-[#e9efe6] text-[#4b6a52]",
  REVIEWING: "bg-[#f4ecd0] text-[#8a6a2b]",
  ASSETS_RECEIVED: "bg-[#e4efe8] text-[#3d6b4b]",
  PROCESSING: "bg-[#e4ecf1] text-[#456179]",
  INTERNAL_REVIEW: "bg-[#ece8f2] text-[#655780]",
  CLIENT_REVIEW: "bg-[#dfedd9] text-[#3b6a49]",
  COMPLETED: "bg-[#dfedd9] text-[#3b6a49]",
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
          <tr className="border-b border-[#ebe7dc]">
            {["Project", "Type", "Stage", "Progress", "Updated", ""].map((heading) => (
              <th
                key={heading}
                className="whitespace-nowrap py-2.5 pr-4 font-body text-[8.5px] font-semibold uppercase tracking-[0.13em] text-[#93988f] last:pr-1"
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
                className="cursor-pointer border-b border-[#f0ede4] transition-colors last:border-b-0 hover:bg-[#faf7ef] focus-visible:bg-[#faf7ef] focus-visible:outline-none"
              >
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] bg-[#e6e3d7] font-body text-[12px] font-semibold text-[#3c4430]">
                      {project.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={href}
                        onClick={(event) => event.stopPropagation()}
                        className="block truncate font-body text-[11.5px] font-semibold text-[#1c2620] hover:text-[#2c5b45]"
                      >
                        {project.name}
                      </Link>
                      <p className="mt-0.5 truncate font-body text-[9.5px] text-[#8d938b]">
                        {project.developer || project.location || "—"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap py-2.5 pr-4 font-body text-[10.5px] text-[#4f5a52]">
                  {[project.type, project.location].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="whitespace-nowrap py-2.5 pr-4">
                  <StatusChip status={project.status} />
                </td>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#e9ece4]">
                      <div
                        className="h-full rounded-full bg-[#204936]"
                        style={{ width: `${Math.max(progress, 2)}%` }}
                      />
                    </div>
                    <span className="font-body text-[10px] text-[#5d675f]">{progress}%</span>
                  </div>
                </td>
                <td className="whitespace-nowrap py-2.5 pr-4 font-body text-[10.5px] text-[#5d675f]">
                  {project.updatedAt ? formatRelative(project.updatedAt) : "—"}
                </td>
                <td className="py-2.5 pr-1 text-right">
                  <details className="relative" onClick={(event) => event.stopPropagation()}>
                    <summary
                      aria-label={`Open menu for ${project.name}`}
                      className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-full text-[#8d938b] transition-colors hover:bg-[#efede4] hover:text-[#3f4a42] [&::-webkit-details-marker]:hidden"
                    >
                      <MoreIcon />
                    </summary>
                    <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-[10px] border border-[#ded7c9] bg-white py-1 shadow-[0_18px_40px_-24px_rgba(20,35,28,0.4)]">
                      <Link
                        href={href}
                        className="block px-3 py-2 font-body text-[11px] text-[#3f4a42] hover:bg-[#f6f3ea]"
                      >
                        Open project
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard?.writeText(`${window.location.origin}${href}`);
                        }}
                        className="block w-full px-3 py-2 text-left font-body text-[11px] text-[#3f4a42] hover:bg-[#f6f3ea]"
                      >
                        Copy link
                      </button>
                      <Link
                        href={`${href}/source`}
                        className="block px-3 py-2 font-body text-[11px] text-[#3f4a42] hover:bg-[#f6f3ea]"
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

"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatRelative } from "@/lib/format";
import type { Project } from "@/lib/portal";
import { ProjectCover } from "@/components/portal/ProjectCover";
import { StatusPill } from "@/components/portal/StatusPill";

export const ProjectTable = ({
  projects,
  covers,
  emptyLabel = "No projects yet.",
}: {
  projects: Project[];
  covers: Record<string, string>;
  emptyLabel?: string;
}) => {
  const router = useRouter();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-left">
        <thead>
          <tr className="border-y border-[#e2ddd1]">
            {["Project", "Location", "Type", "Status", "Last Updated"].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="py-3 pr-6 font-body text-[9px] font-medium uppercase tracking-[0.16em] text-[#8a8374] last:pr-0"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projects.length === 0 ? (
            <tr className="border-b border-[#e2ddd1]">
              <td colSpan={5} className="py-8 font-body text-[12.5px] text-[#8a8374]">
                {emptyLabel}
              </td>
            </tr>
          ) : (
            projects.map((project) => (
              <tr
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="group cursor-pointer border-b border-[#e2ddd1] transition-colors hover:bg-[#fbf8f1]"
              >
                <td className="py-3.5 pr-6">
                  <div className="flex items-center gap-3">
                    <span className="block h-9 w-12 shrink-0 overflow-hidden rounded-[3px]">
                      <ProjectCover
                        src={project.coverPath ? covers[project.coverPath] : null}
                        name={project.name}
                      />
                    </span>
                    <Link
                      href={`/projects/${project.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="font-body text-[12.5px] font-medium text-[#171713] transition-colors group-hover:text-[#1f5e44]"
                    >
                      {project.name}
                    </Link>
                  </div>
                </td>
                <td className="py-3.5 pr-6 font-body text-[12px] text-[#716b5d]">{project.location}</td>
                <td className="py-3.5 pr-6 font-body text-[12px] text-[#716b5d]">{project.type}</td>
                <td className="py-3.5 pr-6">
                  <StatusPill status={project.status} />
                </td>
                <td className="py-3.5 font-body text-[11.5px] text-[#8a8374]">
                  {formatRelative(project.updatedAt)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

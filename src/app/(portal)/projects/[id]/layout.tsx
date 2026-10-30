"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { LoadingBlock } from "@/components/portal/EmptyState";
import { ProjectWorkspaceProvider } from "@/components/portal/ProjectWorkspaceContext";
import { StatusPill } from "@/components/portal/StatusPill";
import { formatRelative } from "@/lib/format";
import { fetchProject, type Project } from "@/lib/portal";

const TABS = [
  { href: "", label: "Overview", exact: true },
  { href: "/plans", label: "2D Plans" },
  { href: "/processing", label: "Processing" },
  { href: "/world", label: "3D World" },
  { href: "/files", label: "Files" },
  { href: "/analytics", label: "Project Analytics" },
];

export default function ProjectWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const projectId = typeof params?.id === "string" ? params.id : "";
  const pathname = usePathname();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [showSubmitted, setShowSubmitted] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const next = await fetchProject(projectId);
      setProject(next);
    } catch {
      setProject(null);
    }
  }, [projectId]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void (async () => {
      try {
        const next = await fetchProject(projectId);
        if (active) setProject(next);
      } catch {
        if (active) setProject(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, projectId]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setShowSubmitted(new URLSearchParams(window.location.search).get("submitted") === "1");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  if (project === undefined) {
    return (
      <div aria-busy="true">
        <LoadingBlock className="h-4 w-36" />
        <LoadingBlock className="mt-4 h-9 w-72" />
        <LoadingBlock className="mt-6 h-10 w-full" />
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="border border-[#e2ddd1] bg-[#fdfbf6] px-6 py-10">
        <p className="font-accent text-[24px] text-[#171713]">You don&apos;t have access to this project.</p>
        <p className="mt-2 max-w-[440px] font-body text-[12.5px] leading-6 text-[#716b5d]">
          It may have been removed, or it belongs to another account.
        </p>
        <Link
          href="/projects"
          className="mt-5 inline-flex bg-[#1f5e44] px-4 py-2.5 font-body text-[10px] uppercase tracking-[0.13em] text-[#f7f4ec]"
        >
          Back to projects
        </Link>
      </div>
    );
  }

  const base = `/projects/${project.id}`;
  const current = (href: string) => (href === "" ? pathname === base : pathname.startsWith(`${base}${href}`));

  return (
    <ProjectWorkspaceProvider project={project} refresh={load}>
      <Link
        href="/projects"
        className="font-body text-[9.5px] uppercase tracking-[0.16em] text-[#8a8374] transition-colors hover:text-[#1f5e44]"
      >
        ← All projects
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="font-body text-[9.5px] uppercase tracking-[0.18em] text-[#8a8374]">
            {project.type}
            {project.developmentStage ? ` · ${project.developmentStage}` : ""}
          </p>
          <h1 className="mt-2 font-display text-[31px] font-medium leading-none tracking-[-0.035em] text-[#171713] sm:text-[40px]">
            {project.name}
          </h1>
          <p className="mt-3 font-body text-[12px] text-[#716b5d]">
            {project.location} · Updated {formatRelative(project.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <StatusPill status={project.status} />
          <button
            type="button"
            onClick={() => void load()}
            className="border border-[#d8d2c4] px-2.5 py-1.5 font-body text-[9px] uppercase tracking-[0.12em] text-[#716b5d] transition-colors hover:border-[#1f5e44] hover:text-[#1f5e44]"
          >
            Refresh
          </button>
        </div>
      </div>

      {project.status === "DRAFT" && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-l-2 border-[#b3914e] bg-[#f6f0e1] px-4 py-3">
          <p className="font-body text-[11.5px] text-[#6f6249]">
            This project is a draft. Finish the brief and submit it to production.
          </p>
          <Link
            href={`/projects/new?draft=${project.id}`}
            className="font-body text-[9.5px] uppercase tracking-[0.12em] text-[#6f6249] underline decoration-[#b3914e]/50 underline-offset-4"
          >
            Continue setup
          </Link>
        </div>
      )}

      {showSubmitted && (
        <div className="mt-5 flex items-start justify-between gap-4 border-l-2 border-[#1f5e44] bg-[#e9f0e9] px-4 py-3">
          <p className="font-body text-[11.5px] leading-5 text-[#2d5c3a]">
            Project submitted. Our production team is reviewing your brief and will update the
            status here.
          </p>
          <button
            type="button"
            onClick={() => setShowSubmitted(false)}
            aria-label="Dismiss submission notice"
            className="shrink-0 font-body text-[11px] text-[#2d5c3a]/60 hover:text-[#2d5c3a]"
          >
            ×
          </button>
        </div>
      )}

      <div className="mt-7 flex gap-6 overflow-x-auto border-b border-[#e2ddd1]">
        {TABS.map((tab) => {
          const active = current(tab.href);
          return (
            <Link
              key={tab.href}
              href={`${base}${tab.href}`}
              className={`shrink-0 border-b py-3 font-body text-[10.5px] uppercase tracking-[0.12em] transition-colors ${
                active
                  ? "border-[#1f5e44] text-[#171713]"
                  : "border-transparent text-[#8a8374] hover:text-[#1f5e44]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-7">{children}</div>
    </ProjectWorkspaceProvider>
  );
}

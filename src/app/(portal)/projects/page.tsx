"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { EmptyState, LoadingBlock } from "@/components/portal/EmptyState";
import { ProjectCard } from "@/components/portal/ProjectCard";
import { fetchProjects, type Project } from "@/lib/portal";
import { isDeliveredStatus } from "@/lib/productionStatus";
import { useSignedUrls } from "@/lib/use-signed-urls";

type SectionKey = "CREATE" | "COMPLETED";

const SECTIONS: Array<{ key: SectionKey; label: string }> = [
  { key: "CREATE", label: "Create" },
  { key: "COMPLETED", label: "Completed" },
];

const SectionIcon = ({ name }: { name: SectionKey }) => {
  if (name === "CREATE") {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M10 4.2v11.6M4.2 10h11.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="6.6" stroke="currentColor" strokeWidth="1.2" />
      <path d="m6.8 10.2 2.2 2.1 4.2-4.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("q") ?? "";
  });
  const [section, setSection] = useState<SectionKey>("CREATE");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void fetchProjects(user.id)
      .then((next) => {
        if (!active) return;
        setProjects(next);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, refreshKey]);

  const covers = useSignedUrls(projects.map((project) => project.coverPath));

  const deliveredCount = useMemo(
    () => projects.filter((project) => isDeliveredStatus(project.status)).length,
    [projects],
  );
  const submittedCount = projects.length - deliveredCount;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects
      .filter((project) => {
        if (q && !`${project.name} ${project.location} ${project.type}`.toLowerCase().includes(q)) return false;
        return section === "COMPLETED"
          ? isDeliveredStatus(project.status)
          : !isDeliveredStatus(project.status);
      })
      .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  }, [projects, search, section]);

  const countFor = (key: SectionKey) => (key === "COMPLETED" ? deliveredCount : submittedCount);

  const sectionNav = (variant: "sidebar" | "inline") => (
    <div className={variant === "sidebar" ? "flex flex-col gap-1" : "flex gap-2"}>
      {SECTIONS.map((item) => {
        const active = section === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => setSection(item.key)}
            aria-current={active ? "page" : undefined}
            className={
              variant === "sidebar"
                ? `flex items-center justify-between gap-2 rounded-[9px] px-2.5 py-2 font-body text-[11.5px] transition-colors ${
                    active ? "bg-[#1b4a36] text-[#e8e2d5]" : "text-[#4d5a50] hover:bg-[#f2ece0]"
                  }`
                : `inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-body text-[11px] transition-colors ${
                    active
                      ? "border-[#1b4a36] bg-[#1b4a36] text-[#e8e2d5]"
                      : "border-[#dbd4c5] bg-[#f3efe4] text-[#716b5d]"
                  }`
            }
          >
            <span className="flex items-center gap-2">
              <SectionIcon name={item.key} />
              {item.label}
            </span>
            <span
              className={`font-body text-[10px] ${
                active
                  ? "text-[#e8e2d5]/60"
                  : variant === "sidebar"
                    ? "text-[#8a8374]"
                    : "text-[#8a8374]"
              }`}
            >
              {countFor(item.key)}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      <aside className="hidden w-[200px] shrink-0 md:block">
        <div className="sticky top-0 rounded-[14px] border border-[#dbd4c5] bg-[#f3efe4] p-2">
          <p className="px-2.5 pb-2 pt-1.5 font-body text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8a8374]">
            Projects
          </p>
          {sectionNav("sidebar")}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-body text-[24px] font-semibold leading-none tracking-[-0.02em] text-[#171713]">
              {section === "CREATE" ? "Create" : "Completed"}
            </h1>
            <p className="mt-2 font-body text-[11.5px] text-[#716b5d]">
              {section === "CREATE"
                ? `${submittedCount} ${submittedCount === 1 ? "project" : "projects"} in production.`
                : `${deliveredCount} delivered ${deliveredCount === 1 ? "world" : "worlds"} ready to explore.`}
            </p>
          </div>
          {section === "CREATE" && projects.length > 0 && (
            <Link
              href="/projects/new"
              className="inline-flex shrink-0 items-center gap-2 rounded-[8px] bg-[#143f2d] px-4 py-2.5 font-body text-[11px] font-medium text-[#efe9dd] transition-colors hover:bg-[#0f3626]"
            >
              <span aria-hidden="true" className="text-[14px] leading-none">
                +
              </span>
              New project
            </Link>
          )}
        </div>

        <div className="mt-3 md:hidden">{sectionNav("inline")}</div>

        {loading ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <LoadingBlock key={item} className="h-[286px] rounded-[12px]" />
            ))}
          </div>
        ) : error ? (
          <div className="mt-6">
            <EmptyState
              title="We couldn't load your projects."
              body="The project list did not come through. Check your connection and try again."
            />
            <button
              type="button"
              onClick={() => {
                setError(false);
                setLoading(true);
                setRefreshKey((key) => key + 1);
              }}
              className="mt-4 inline-flex rounded-[7px] bg-[#1f5e44] px-5 py-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e8e2d5]"
            >
              Try again
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Your first world starts here."
              body="Send us a floor plan. Creston handles the architectural interpretation and builds the interactive world."
              actionLabel="Submit New Project"
              actionHref="/projects/new"
            />
          </div>
        ) : (
          <>
            <label className="mt-5 flex h-9 w-full max-w-[320px] items-center gap-2 rounded-full border border-[#dbd4c5] bg-[#f3efe4] px-4 text-[#8a8374] transition-colors focus-within:border-[#b9b09c]">
              <svg viewBox="0 0 18 18" className="h-4 w-4" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="4.6" stroke="currentColor" strokeWidth="1.2" />
                <path d="m11.4 11.4 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects..."
                aria-label="Search projects"
                className="min-w-0 flex-1 bg-transparent font-body text-[11.5px] text-[#171713] outline-none placeholder:text-[#a0988a]"
              />
            </label>

            {filtered.length === 0 ? (
              <div className="mt-5 rounded-[12px] border border-[#dbd4c5] bg-[#f3efe4] px-6 py-10 text-center">
                <p className="font-body text-[15px] font-semibold text-[#171713]">
                  {search.trim() ? "No matching projects." : "Nothing here yet."}
                </p>
                <p className="mx-auto mt-2 max-w-[360px] font-body text-[11.5px] leading-5 text-[#716b5d]">
                  {search.trim()
                    ? "Try a different name, location or property type."
                    : section === "COMPLETED"
                      ? "Delivered worlds will appear here once Creston finishes processing."
                      : "Submit a floor plan to start a new project."}
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {filtered.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    coverUrl={project.coverPath ? covers[project.coverPath] : null}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

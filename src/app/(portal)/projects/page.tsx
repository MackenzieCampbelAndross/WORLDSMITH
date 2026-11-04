"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { EmptyState, LoadingBlock } from "@/components/portal/EmptyState";
import { ProjectCard } from "@/components/portal/ProjectCard";
import { fetchProjects, type Project } from "@/lib/portal";
import { isDeliveredStatus } from "@/lib/productionStatus";
import { useSignedUrls } from "@/lib/use-signed-urls";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("q") ?? "";
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const onSearch = (event: Event) => {
      setSearch((event as CustomEvent<string>).detail ?? "");
    };
    window.addEventListener("crestion:search", onSearch);
    return () => window.removeEventListener("crestion:search", onSearch);
  }, []);

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

  // Extract all completed/delivered projects
  const completedProjects = useMemo(() => {
    return projects
      .filter((project) => isDeliveredStatus(project.status))
      .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  }, [projects]);

  const covers = useSignedUrls(completedProjects.map((project) => project.coverPath));

  // Search filter across completed projects
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return completedProjects;
    return completedProjects.filter((project) =>
      `${project.name} ${project.location} ${project.type} ${project.developer}`
        .toLowerCase()
        .includes(q)
    );
  }, [completedProjects, search]);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      {/* Top Header Row matching Dashboard size and alignment */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-1">
        <div>
          <h1 className="font-body text-[32px] font-bold leading-[1.06] tracking-[-0.035em] text-[#17201b] sm:text-[40px] lg:text-[46px]">
            Projects
          </h1>

          <p className="mt-2 font-body text-[13px] text-neutral-600 sm:text-[14px]">
            Explore, presentation-share, and embed all delivered 3D digital twins.
          </p>
        </div>

        {/* Right side "+ New Project" Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/projects/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-[12px] bg-[#143f2d] px-4 py-2.5 font-body text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-[#0d2f21] hover:shadow-md"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3v10M3 8h10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            New project
          </Link>
        </div>
      </div>

      {/* Search & Quick Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex h-10 w-full max-w-[340px] items-center gap-2.5 rounded-full border border-black/[0.08] bg-white px-4 text-neutral-500 shadow-2xs transition-colors focus-within:border-black/30">
          <svg viewBox="0 0 18 18" className="h-4 w-4 shrink-0 text-neutral-400" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="4.6" stroke="currentColor" strokeWidth="1.3" />
            <path d="m11.4 11.4 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search completed projects..."
            aria-label="Search completed projects"
            className="min-w-0 flex-1 bg-transparent font-body text-[12px] text-[#171713] outline-none placeholder:text-neutral-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-neutral-400 hover:text-neutral-600 font-mono text-[10px]"
            >
              Clear
            </button>
          )}
        </label>

        <span className="font-mono text-[11px] text-neutral-400">
          Showing {filtered.length} of {completedProjects.length} worlds
        </span>
      </div>

      {/* Main Single Tab Content */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <LoadingBlock key={item} className="h-[290px] rounded-[16px]" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[20px] border border-black/[0.08] bg-white p-8 text-center shadow-sm">
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
            className="mt-4 inline-flex rounded-[10px] bg-[#143f2d] px-5 py-2.5 font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#0d2f21]"
          >
            Try again
          </button>
        </div>
      ) : completedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[20px] border border-black/[0.08] bg-white px-6 py-16 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef5f1] text-[#1f5e44]">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 3 2 9l10 6 10-6-10-6ZM2 15l10 6 10-6M2 9.5l10 6 10-6" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="mt-4 font-body text-[16px] font-bold text-[#171713]">
            No completed worlds yet
          </h2>
          <p className="mx-auto mt-2 max-w-[420px] font-body text-[12.5px] leading-relaxed text-neutral-600">
            Once Creston completes 3D reconstruction and quality review for an architectural plan, your interactive twin will be cataloged here.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#143f2d] px-4 py-2.5 font-body text-[11.5px] font-semibold text-white shadow-sm transition-all hover:bg-[#0d2f21]"
            >
              Submit a floor plan
            </Link>
            <Link
              href="/dashboard"
              className="font-body text-[11.5px] font-medium text-neutral-600 hover:text-black"
            >
              Check pipeline status →
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[20px] border border-black/[0.08] bg-white px-6 py-12 text-center shadow-sm">
          <p className="font-body text-[15px] font-semibold text-[#171713]">
            No completed projects match &ldquo;{search.trim()}&rdquo;
          </p>
          <p className="mx-auto mt-2 max-w-[360px] font-body text-[12px] text-neutral-600">
            Try searching with a different property name, developer, or location.
          </p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="mt-4 rounded-[8px] border border-black/[0.08] bg-white px-3.5 py-1.5 font-body text-[11px] font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              coverUrl={project.coverPath ? covers[project.coverPath] : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

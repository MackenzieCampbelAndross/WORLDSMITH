"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { EmptyState, LoadingBlock } from "@/components/portal/EmptyState";
import { ProjectCard } from "@/components/portal/ProjectCard";
import {
  fetchProjects,
  type Project,
} from "@/lib/portal";
import { isDeliveredStatus } from "@/lib/productionStatus";
import { useSignedUrls } from "@/lib/use-signed-urls";

type FilterKey = "SUBMISSIONS" | "DELIVERED";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "SUBMISSIONS", label: "Submissions" },
  { key: "DELIVERED", label: "Delivered" },
];

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("SUBMISSIONS");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q") ?? "";
    if (q) setSearch(q);
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

  const covers = useSignedUrls(projects.map((project) => project.coverPath));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects
      .filter((project) => {
        if (q && !`${project.name} ${project.location} ${project.type}`.toLowerCase().includes(q)) return false;
        return filter === "DELIVERED" ? isDeliveredStatus(project.status) : !isDeliveredStatus(project.status);
      })
      .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  }, [projects, search, filter]);

  if (loading) {
    return (
      <div>
        <LoadingBlock className="h-12 w-56" />
        <LoadingBlock className="mt-3 h-4 w-80" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <LoadingBlock key={item} className="h-[286px] rounded-[12px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-accent text-[42px] leading-none tracking-[-0.02em] text-[#171713] sm:text-[50px]">
            Projects
          </h1>
          <p className="mt-3 font-body text-[12.5px] text-[#716b5d]">
            {projects.length} {projects.length === 1 ? "development" : "developments"} in your workspace.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-[7px] bg-[#1f5e44] px-4 py-2.5 font-body text-[11px] font-medium text-[#f7f4ec] transition-colors hover:bg-[#174d37]"
        >
          <span aria-hidden="true">+</span>
          Submit new project
        </Link>
      </div>

      {error ? (
        <div className="mt-8">
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
            className="mt-4 inline-flex rounded-[7px] bg-[#1f5e44] px-5 py-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f7f4ec]"
          >
            Try again
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Your first world starts here."
            body="Send us a floor plan. Creston handles the architectural interpretation and builds the interactive world."
            actionLabel="Submit New Project"
            actionHref="/projects/new"
          />
        </div>
      ) : (
        <>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <label className="flex h-9 w-full max-w-[320px] items-center gap-2 rounded-full border border-[#e2ddd1] bg-[#fbf8f1] px-4 text-[#8a8374] transition-colors focus-within:border-[#b9b09c]">
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
          </div>

          <div className="mt-4 flex gap-6 overflow-x-auto border-b border-[#e2ddd1]">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`shrink-0 border-b py-2.5 font-body text-[11px] transition-colors ${
                  filter === item.key
                    ? "border-[#1f5e44] text-[#171713]"
                    : "border-transparent text-[#8a8374] hover:text-[#1f5e44]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="mt-6 rounded-[12px] border border-[#e2ddd1] bg-[#fdfbf6] px-6 py-10 text-center">
              <p className="font-accent text-[24px] text-[#171713]">Nothing here yet.</p>
              <p className="mx-auto mt-2 max-w-[360px] font-body text-[11.5px] leading-5 text-[#716b5d]">
                {filter === "DELIVERED"
                  ? "Delivered worlds will appear here once Creston finishes processing."
                  : "Submit a floor plan to start a new project."}
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
    </div>
  );
}

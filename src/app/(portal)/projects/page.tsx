"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { EmptyState, LoadingBlock } from "@/components/portal/EmptyState";
import { ProjectTable } from "@/components/portal/ProjectTable";
import {
  fetchProjects,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  STATUS_LABELS,
  type Project,
  type ProjectStatus,
} from "@/lib/portal";
import { useSignedUrls } from "@/lib/use-signed-urls";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | ProjectStatus>("ALL");
  const [type, setType] = useState("ALL");
  const [sort, setSort] = useState<"updated" | "name" | "created">("updated");
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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const next = projects.filter((project) => {
      if (query && !`${project.name} ${project.location} ${project.type}`.toLowerCase().includes(query)) {
        return false;
      }
      if (status !== "ALL" && project.status !== status) return false;
      if (type !== "ALL" && project.type !== type) return false;
      return true;
    });
    return next.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "created") return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
      return (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0);
    });
  }, [projects, search, status, type, sort]);

  if (loading) {
    return (
      <div>
        <LoadingBlock className="h-9 w-48" />
        <LoadingBlock className="mt-3 h-4 w-80" />
        <LoadingBlock className="mt-8 h-10 w-full" />
        <LoadingBlock className="mt-6 h-72 w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="font-body text-[9.5px] uppercase tracking-[0.2em] text-[#8a8374]">Projects</p>
          <h1 className="mt-2 font-display text-[32px] font-medium leading-none tracking-[-0.035em] text-[#171713] sm:text-[40px]">
            Projects
          </h1>
          <p className="mt-3 font-body text-[12.5px] text-[#716b5d]">
            {projects.length} {projects.length === 1 ? "development" : "developments"} in your account
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 bg-[#1f5e44] px-5 py-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f7f4ec] transition-colors hover:bg-[#174d37]"
        >
          <span aria-hidden="true">+</span>
          New Project
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
            className="mt-4 inline-flex bg-[#1f5e44] px-5 py-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f7f4ec]"
          >
            Try again
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Your first world starts here."
            body="Create a project and give us your architectural plans. We'll transform them into an interactive environment your buyers can explore."
            actionLabel="New Project"
            actionHref="/projects/new"
          />
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-3 border-y border-[#e2ddd1] py-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects, locations…"
              className="h-9 min-w-[220px] flex-1 border border-[#ddd7c9] bg-transparent px-3 font-body text-[12px] text-[#171713] outline-none transition-colors placeholder:text-[#a0988a] focus:border-[#1f5e44]"
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as "ALL" | ProjectStatus)}
              className="h-9 border border-[#ddd7c9] bg-[#f7f4ec] px-3 font-body text-[11.5px] text-[#514c42] outline-none focus:border-[#1f5e44]"
            >
              <option value="ALL">All statuses</option>
              {PROJECT_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {STATUS_LABELS[option]}
                </option>
              ))}
            </select>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="h-9 border border-[#ddd7c9] bg-[#f7f4ec] px-3 font-body text-[11.5px] text-[#514c42] outline-none focus:border-[#1f5e44]"
            >
              <option value="ALL">All types</option>
              {PROJECT_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as "updated" | "name" | "created")}
              className="h-9 border border-[#ddd7c9] bg-[#f7f4ec] px-3 font-body text-[11.5px] text-[#514c42] outline-none focus:border-[#1f5e44]"
            >
              <option value="updated">Last updated</option>
              <option value="created">Newest</option>
              <option value="name">Name A–Z</option>
            </select>
            {(search || status !== "ALL" || type !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatus("ALL");
                  setType("ALL");
                }}
                className="font-body text-[10.5px] text-[#1f5e44] underline decoration-[#1f5e44]/30 underline-offset-4"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="mt-1">
            {filtered.length === 0 ? (
              <p className="border-b border-[#e2ddd1] py-8 font-body text-[12.5px] text-[#8a8374]">
                No projects match those filters.
              </p>
            ) : (
              <ProjectTable projects={filtered} covers={covers} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

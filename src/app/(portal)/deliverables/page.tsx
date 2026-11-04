"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { EmptyState, LoadingBlock } from "@/components/portal/EmptyState";
import { formatRelative } from "@/lib/format";
import { fetchProjects, type Project } from "@/lib/portal";
import { isDeliveredStatus } from "@/lib/productionStatus";
import { useSignedUrls } from "@/lib/use-signed-urls";

export default function DeliverablesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

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
  }, [user]);

  // Extract all delivered projects
  const delivered = useMemo(
    () =>
      projects
        .filter((project) => isDeliveredStatus(project.status))
        .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0)),
    [projects]
  );

  const covers = useSignedUrls(delivered.map((project) => project.coverPath));

  // Compute total area delivered
  const totalDeliveredAreaM2 = useMemo(() => {
    return delivered.reduce((acc, p) => {
      if (p.planWidthMeters && p.planLengthMeters) {
        return acc + p.planWidthMeters * p.planLengthMeters;
      }
      return acc;
    }, 0);
  }, [delivered]);

  // Filtered deliverables by search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return delivered;
    return delivered.filter((p) =>
      `${p.name} ${p.developer} ${p.location} ${p.type}`.toLowerCase().includes(q)
    );
  }, [delivered, search]);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      {/* Top Header Row matching Dashboard and Projects */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-1">
        <div>
          <h1 className="font-body text-[32px] font-bold leading-[1.06] tracking-[-0.035em] text-[#17201b] sm:text-[40px] lg:text-[46px]">
            Deliverables
          </h1>

          <p className="mt-2 font-body text-[13px] text-neutral-600 sm:text-[14px]">
            Ready-to-deploy 3D digital twins, interactive client presentations, and website embed codes.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="hidden sm:inline-flex items-center gap-2 rounded-[12px] border border-black/[0.08] bg-white px-4 py-2.5 font-body text-[12px] font-semibold text-[#17201b] shadow-2xs transition-all hover:bg-neutral-50 hover:border-black/15"
          >
            All Projects
          </Link>

          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-[12px] bg-[#143f2d] px-4 py-2.5 font-body text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-[#0d2f21] hover:shadow-md"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3v10M3 8h10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            New Project
          </Link>
        </div>
      </div>

      {/* Search & Telemetry Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex h-10 w-full max-w-[340px] items-center gap-2.5 rounded-full border border-black/[0.08] bg-white px-4 text-neutral-500 shadow-2xs transition-colors focus-within:border-black/30">
          <svg viewBox="0 0 18 18" className="h-4 w-4 shrink-0 text-neutral-400" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="4.6" stroke="currentColor" strokeWidth="1.3" />
            <path d="m11.4 11.4 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search deliverables by name or location..."
            aria-label="Search deliverables"
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
          Showing {filtered.length} of {delivered.length} deliverables
        </span>
      </div>

      {/* Main Deliverables Table */}
      {loading ? (
        <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-sm space-y-4">
          <LoadingBlock className="h-8 w-full rounded-[10px]" />
          {[0, 1, 2, 3].map((item) => (
            <LoadingBlock key={item} className="h-16 w-full rounded-[12px]" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[24px] border border-black/[0.08] bg-white p-10 text-center shadow-sm">
          <EmptyState
            title="Unable to load deliverables"
            body="We couldn't synchronize your delivered project assets. Please verify your connection."
          />
          <button
            type="button"
            onClick={() => {
              setError(false);
              setLoading(true);
            }}
            className="mt-5 rounded-[10px] bg-[#143f2d] px-5 py-2.5 font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#0d2f21]"
          >
            Retry Connection
          </button>
        </div>
      ) : delivered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-black/[0.06] bg-white px-6 py-16 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef5f1] text-[#1f5e44]">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 3 2 9l10 6 10-6-10-6ZM2 15l10 6 10-6M2 9.5l10 6 10-6" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="mt-4 font-body text-[16px] font-bold text-[#171713]">
            No deliverables registered yet
          </h2>
          <p className="mx-auto mt-2 max-w-[420px] font-body text-[12.5px] leading-relaxed text-neutral-600">
            Once Creston completes 3D procedural reconstruction and quality review for a floor plan, your delivered worlds will appear here in ready-to-deploy rows.
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
              View dashboard pipeline →
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[24px] border border-black/[0.06] bg-white px-6 py-12 text-center shadow-sm">
          <p className="font-body text-[15px] font-semibold text-[#171713]">
            No deliverables match &ldquo;{search.trim()}&rdquo;
          </p>
          <p className="mx-auto mt-2 max-w-[360px] font-body text-[12px] text-neutral-600">
            Try searching by property name, developer, or property category.
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
        <section className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="min-h-0 overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#fafafa]/80">
                  <th className="py-3.5 pl-6 pr-4 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                    DIGITAL TWIN ASSET
                  </th>
                  <th className="py-3.5 pr-4 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                    SPECIFICATIONS
                  </th>
                  <th className="py-3.5 pr-4 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                    DELIVERABLE FORMATS
                  </th>
                  <th className="py-3.5 pr-4 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                    STATUS & VERIFICATION
                  </th>
                  <th className="py-3.5 pl-4 pr-6 text-right font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {filtered.map((project) => {
                  const coverUrl = project.coverPath ? covers[project.coverPath] : null;
                  const worldHref = `/projects/${project.id}/world`;
                  const presHref = `/projects/${project.id}/presentation`;
                  const areaM2 =
                    project.planWidthMeters && project.planLengthMeters
                      ? Math.round(project.planWidthMeters * project.planLengthMeters)
                      : null;

                  return (
                    <tr
                      key={project.id}
                      onClick={() => router.push(worldHref)}
                      className="group cursor-pointer transition-colors hover:bg-[#f9faf9] focus-visible:bg-[#f9faf9] focus-visible:outline-none"
                    >
                      {/* Column 1: Asset / Name / Preview */}
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3.5">
                          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-black/[0.08] bg-[#f2f5f3]">
                            {coverUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={coverUrl}
                                alt={project.name}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <span className="font-mono text-[14px] font-bold text-[#1f5e44]">
                                {project.name.slice(0, 1).toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <Link
                              href={worldHref}
                              onClick={(e) => e.stopPropagation()}
                              className="block truncate font-body text-[13.5px] font-bold text-[#17201b] transition-colors hover:text-[#1f5e44]"
                            >
                              {project.name}
                            </Link>
                            <p className="mt-0.5 truncate font-body text-[11px] text-neutral-500">
                              {[project.developer, project.location].filter(Boolean).join(" · ") || "Creston Labs World"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Specifications */}
                      <td className="whitespace-nowrap py-4 pr-4">
                        <div className="flex flex-col font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[9.5px] font-semibold text-neutral-700">
                              {project.type || "Residential"}
                            </span>
                            {areaM2 && (
                              <span className="font-semibold text-[#17201b]">
                                {areaM2.toLocaleString()} m²
                              </span>
                            )}
                          </div>
                          <span className="mt-1 text-[10px] text-neutral-400">
                            {project.floors || 1} {project.floors === 1 ? "Level" : "Levels"} · {project.units || 1} {project.units === 1 ? "Unit" : "Units"}
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Deliverable Formats */}
                      <td className="whitespace-nowrap py-4 pr-4">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-[#eef5f1] px-2 py-0.5 font-mono text-[9px] font-semibold text-[#1f5e44]">
                            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <circle cx="6" cy="6" r="4.5" />
                              <path d="M6 3.5v2.5l1.5 1" strokeLinecap="round" />
                            </svg>
                            3D Walkthrough
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-black/[0.06] bg-[#f7f9f7] px-2 py-0.5 font-mono text-[9px] font-medium text-neutral-700">
                            Share Link
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-black/[0.06] bg-[#f7f9f7] px-2 py-0.5 font-mono text-[9px] font-medium text-neutral-700">
                            Web Embed
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Status & Verification */}
                      <td className="whitespace-nowrap py-4 pr-4">
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1.5 font-body text-[11px] font-bold text-[#1f5e44]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1f5e44]" />
                            Ready for Deployment
                          </span>
                          <span className="mt-0.5 font-mono text-[10px] text-neutral-400">
                            {project.updatedAt ? `Delivered ${formatRelative(project.updatedAt)}` : "Verified"}
                          </span>
                        </div>
                      </td>

                      {/* Column 5: Action Buttons */}
                      <td className="whitespace-nowrap py-4 pl-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={worldHref}
                            className="inline-flex items-center gap-1.5 rounded-[9px] bg-[#143f2d] px-3.5 py-1.5 font-body text-[11px] font-semibold text-white shadow-2xs transition-all hover:bg-[#0d2f21] hover:shadow-xs"
                          >
                            Enter World
                            <span aria-hidden="true">↗</span>
                          </Link>

                          <Link
                            href={presHref}
                            title="Open Presentation and Embed links"
                            className="inline-flex items-center gap-1 rounded-[9px] border border-black/[0.08] bg-white px-3 py-1.5 font-body text-[11px] font-semibold text-[#17201b] shadow-2xs transition-all hover:bg-neutral-50 hover:border-black/20"
                          >
                            Presentation
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

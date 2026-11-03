"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { EmptyState, LoadingBlock } from "@/components/portal/EmptyState";
import { formatRelative } from "@/lib/format";
import {
  fetchDashboard,
  STATUS_LABELS,
  type DashboardData,
  type Project,
  type ProjectStatus,
} from "@/lib/portal";
import {
  STATUS_DESCRIPTIONS,
  SUBMISSION_STAGES,
  isDeliveredStatus,
  submissionStageIndex,
} from "@/lib/productionStatus";

type FilterKey = "SUBMISSIONS" | "DELIVERED";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "SUBMISSIONS", label: "Submissions" },
  { key: "DELIVERED", label: "Delivered" },
];

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

const MetricIcon = ({ name }: { name: "projects" | "worlds" | "plans" | "processing" }) => {
  if (name === "projects") {
    return (
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
        <path d="M3.2 6.1h13.6v9.7H3.2zM3.2 6.1l1.6-2.3h5l1.6 2.3M7.2 9.5h5.6M7.2 12.1h3.8" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  if (name === "worlds") {
    return (
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
        <path d="M10 2.8 16.8 6.5v7L10 17.2 3.2 13.5v-7L10 2.8ZM3.5 6.6 10 10.2l6.5-3.6M10 10.2v6.7" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  if (name === "plans") {
    return (
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
        <path d="M5.5 2.7h6l3 3v11.6h-9zM11.5 2.7v3h3M8 9h4M8 11.6h4" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="M4 13.8a4.2 4.2 0 0 1 1.1-8.2 5 5 0 0 1 9.7 1.2A3.4 3.4 0 0 1 15.6 14H4Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10 8v3.3l2 1.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};

export default function DashboardOverviewPage() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filter, setFilter] = useState<FilterKey>("SUBMISSIONS");
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const hour = new Date().getHours();
      setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void fetchDashboard(user.id)
      .then((next) => {
        if (!active) return;
        setData(next);
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

  const projects = data?.projects ?? [];
  const delivered = useMemo(() => projects.filter((project) => isDeliveredStatus(project.status)), [projects]);
  const rows = useMemo(
    () => (filter === "DELIVERED" ? delivered : projects.filter((project) => !isDeliveredStatus(project.status))),
    [projects, delivered, filter],
  );

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-2.5">
        <LoadingBlock className="h-7 w-64" />
        <div className="grid shrink-0 grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((item) => (
            <LoadingBlock key={item} className="h-14 rounded-[10px]" />
          ))}
        </div>
        <div className="grid min-h-0 flex-1 gap-2.5 xl:grid-cols-[1.15fr_0.85fr]">
          <LoadingBlock className="h-full rounded-[12px]" />
          <LoadingBlock className="h-full rounded-[12px]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-[360px] text-center">
          <EmptyState
            title="We couldn't load your workspace."
            body="The account data did not come through. Check your connection and try again."
          />
          <button
            type="button"
            onClick={() => {
              setError(false);
              setLoading(true);
              setRefreshKey((key) => key + 1);
            }}
            className="mt-3 rounded-[6px] bg-[#1b4a36] px-4 py-2 font-body text-[9px] font-semibold uppercase tracking-[0.12em] text-white"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const firstName =
    profile?.firstName ||
    String((user?.user_metadata as Record<string, unknown> | undefined)?.first_name ?? "");
  const active = data.activeProject;
  const stageIndex = active ? submissionStageIndex(active.status) : -1;
  const stagePercent = stageIndex >= 0 ? Math.round(((stageIndex + 1) / SUBMISSION_STAGES.length) * 100) : 0;
  const worldReady = Boolean(
    active && (isDeliveredStatus(active.status) || data.activeWorld?.status === "ready"),
  );
  const cta =
    active?.status === "DRAFT"
      ? { label: "Continue setup", href: `/projects/new?draft=${active.id}` }
      : worldReady
        ? { label: "Enter World", href: `/projects/${active?.id}/world` }
        : { label: "Open Project", href: `/projects/${active?.id}` };

  const stageCounts = SUBMISSION_STAGES.map((label, index) => ({
    label,
    count: projects.filter((project) => submissionStageIndex(project.status) === index).length,
  }));
  const maxStageCount = Math.max(1, ...stageCounts.map((stage) => stage.count));
  const deliveredPercent = projects.length ? Math.round((delivered.length / projects.length) * 100) : 0;

  const metrics = [
    { label: "Projects", value: projects.length, icon: "projects" as const },
    { label: "Delivered", value: delivered.length, icon: "worlds" as const },
    { label: "Plans", value: data.plans, icon: "plans" as const },
    { label: "In production", value: data.processingCount, icon: "processing" as const },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <div className="flex shrink-0 items-end justify-between gap-3">
        <div>
          <h1 className="font-body text-[21px] font-semibold leading-none tracking-[-0.03em] text-[#171713]">
            {greeting}
            {firstName ? `, ${firstName}.` : "."}
          </h1>
          <p className="mt-1.5 font-body text-[10.5px] text-[#69736b]">
            Turn architectural plans into immersive, real-world property experiences.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[6px] bg-[#1b4a36] px-3 py-2 font-body text-[9.5px] font-medium text-[#f7f4ec] hover:bg-[#153b2b]"
        >
          <span aria-hidden="true">+</span>
          Submit new project
        </Link>
      </div>

      <div className="grid shrink-0 grid-cols-4 gap-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-[10px] border border-[#e3e8e1] bg-[#fbfcf9] px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <p className="font-body text-[8.5px] uppercase tracking-[0.1em] text-[#7a847b]">{metric.label}</p>
              <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#eaf1eb] text-[#1b4a36]">
                <MetricIcon name={metric.icon} />
              </span>
            </div>
            <p className="mt-1 font-body text-[21px] font-semibold leading-none tracking-[-0.04em] text-[#14231c]">
              {String(metric.value).padStart(2, "0")}
            </p>
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-2.5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="flex min-h-0 flex-col rounded-[12px] border border-[#e3e8e1] bg-white p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="font-body text-[8px] font-semibold uppercase tracking-[0.18em] text-[#7a847b]">
              Continue working
            </p>
            {active && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef4ef] px-2.5 py-0.5 font-body text-[9px] text-[#315b3f]">
                <span className={`h-1 w-1 rounded-full ${statusDot[active.status]}`} />
                {STATUS_LABELS[active.status]}
              </span>
            )}
          </div>

          {active ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <h2 className="mt-2.5 font-body text-[20px] font-semibold leading-none tracking-[-0.03em] text-[#14231c]">
                {active.name}
              </h2>
              <p className="mt-1.5 max-w-[440px] font-body text-[10px] leading-4 text-[#69736b]">
                {STATUS_DESCRIPTIONS[active.status]}
              </p>

              <div className="mt-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-body text-[8px] uppercase tracking-[0.14em] text-[#7a847b]">Progress</span>
                  <span className="font-body text-[9.5px] font-semibold text-[#315b3f]">{stagePercent}%</span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[#edf1eb]">
                  <div className="h-full rounded-full bg-[#1b4a36]" style={{ width: `${stagePercent}%` }} />
                </div>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1">
                {SUBMISSION_STAGES.map((label, index) => {
                  const done = stageIndex >= index;
                  return (
                    <div key={label} className="flex items-center gap-1.5">
                      <span
                        className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-full border text-[7px] ${
                          done ? "border-[#1b4a36] bg-[#1b4a36] text-white" : "border-[#d5ddd4] text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span className={`font-body text-[9px] ${done ? "text-[#2f3a32]" : "text-[#8a938b]"}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                <Link
                  href={cta.href}
                  className="inline-flex items-center gap-1 rounded-[5px] bg-[#1b4a36] px-2.5 py-1.5 font-body text-[9.5px] font-medium text-[#f7f4ec] hover:bg-[#153b2b]"
                >
                  {cta.label}
                  <span aria-hidden="true">→</span>
                </Link>
                <span className="font-body text-[8.5px] text-[#8a938b]">
                  Updated {formatRelative(active.updatedAt)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col justify-center">
              <h2 className="font-body text-[20px] font-semibold leading-none tracking-[-0.03em] text-[#14231c]">
                No active project yet.
              </h2>
              <p className="mt-1.5 max-w-[380px] font-body text-[10px] leading-4 text-[#69736b]">
                Send a floor plan. Creston handles the architectural interpretation and builds the world.
              </p>
              <Link
                href="/projects/new"
                className="mt-3 inline-flex w-fit rounded-[5px] bg-[#1b4a36] px-2.5 py-1.5 font-body text-[9.5px] font-medium text-[#f7f4ec] hover:bg-[#153b2b]"
              >
                Submit a floor plan
              </Link>
            </div>
          )}
        </section>

        <div className="grid min-h-0 grid-rows-[1fr_auto] gap-2.5">
          <section className="flex min-h-0 flex-col rounded-[12px] border border-[#e3e8e1] bg-white p-3.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-body text-[10.5px] font-semibold text-[#14231c]">Production stages</h2>
              <span className="font-body text-[8.5px] text-[#8a938b]">{projects.length} projects</span>
            </div>
            {projects.length === 0 ? (
              <p className="flex flex-1 items-center font-body text-[9.5px] text-[#8a938b]">
                No submissions to chart yet.
              </p>
            ) : (
              <div className="mt-2 grid min-h-0 flex-1 grid-cols-[1.15fr_0.85fr] gap-2">
                <div className="flex min-h-0 flex-col justify-between gap-1">
                  {stageCounts.map((stage) => (
                    <div key={stage.label}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-body text-[8.5px] text-[#4d5a50]">{stage.label}</span>
                        <span className="font-body text-[8px] text-[#8a938b]">{stage.count}</span>
                      </div>
                      <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-[#edf1eb]">
                        <div
                          className="h-full rounded-full bg-[#1b4a36]"
                          style={{ width: `${(stage.count / maxStageCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-center justify-center gap-1">
                  <div
                    className="relative flex h-14 w-14 items-center justify-center rounded-full"
                    style={{ background: `conic-gradient(#1b4a36 ${deliveredPercent}%, #edf1eb 0)` }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                      <span className="font-body text-[10px] font-semibold text-[#14231c]">{deliveredPercent}%</span>
                    </div>
                  </div>
                  <p className="text-center font-body text-[8px] leading-3 text-[#8a938b]">
                    {delivered.length} of {projects.length} delivered
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="relative overflow-hidden rounded-[12px] bg-[#1b4a36] px-4 py-3.5 text-[#f7f4ec]">
            <svg viewBox="0 0 180 100" className="pointer-events-none absolute -bottom-5 -right-3 h-[90px] w-[160px] opacity-20" fill="none" aria-hidden="true">
              <path d="M8 92 70 32l34 28 62-52M70 32v60M104 60v32" stroke="#f7f4ec" strokeWidth="1" />
            </svg>
            <div className="relative">
              <p className="font-body text-[7.5px] uppercase tracking-[0.16em] text-[#f7f4ec]/55">New world</p>
              <h2 className="mt-1.5 font-body text-[16px] font-semibold leading-tight tracking-[-0.02em]">
                Start your next world.
              </h2>
              <p className="mt-1 max-w-[210px] font-body text-[9px] leading-4 text-[#f7f4ec]/65">
                Send a floor plan. Creston handles the rest.
              </p>
              <Link
                href="/projects/new"
                className="mt-2.5 inline-flex rounded-[5px] bg-[#f7f4ec] px-2.5 py-1.5 font-body text-[9px] font-semibold text-[#1b4a36] hover:bg-white"
              >
                Submit a floor plan
              </Link>
            </div>
          </section>
        </div>
      </div>

      <section className="hidden min-h-0 shrink-0 flex-col overflow-hidden rounded-[12px] border border-[#e3e8e1] bg-white p-3 xl:flex">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-body text-[10.5px] font-semibold text-[#14231c]">Your projects</h2>
          <div className="flex gap-3">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`border-b pb-0.5 font-body text-[8.5px] transition-colors ${
                  filter === item.key
                    ? "border-[#1b4a36] text-[#171713]"
                    : "border-transparent text-[#8a938b] hover:text-[#1b4a36]"
                }`}
              >
                {item.label}
                <span className="ml-1 text-[7.5px] text-[#a3aca4]">
                  {item.key === "DELIVERED" ? delivered.length : projects.length - delivered.length}
                </span>
              </button>
            ))}
          </div>
          <Link href="/projects" className="font-body text-[8.5px] text-[#1b4a36] hover:opacity-70">
            View all →
          </Link>
        </div>

        {rows.length === 0 ? (
          <p className="py-2 font-body text-[9px] text-[#8a938b]">
            {filter === "DELIVERED" ? "No delivered worlds yet." : "Submit a floor plan to start a project."}
          </p>
        ) : (
          <table className="mt-1 w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#eef1ea]">
                {["Project", "Type", "Status", "Updated", ""].map((heading) => (
                  <th key={heading} className="py-1 pr-3 font-body text-[7.5px] uppercase tracking-[0.12em] text-[#8a938b] last:pr-0">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 2).map((project: Project) => {
                const deliveredRow = isDeliveredStatus(project.status);
                return (
                  <tr key={project.id} className="border-b border-[#f0f3ee] last:border-b-0">
                    <td className="py-1.5 pr-3">
                      <Link href={`/projects/${project.id}`} className="font-body text-[9px] font-medium text-[#14231c] hover:text-[#1b4a36]">
                        {project.name}
                      </Link>
                    </td>
                    <td className="py-1.5 pr-3 font-body text-[8.5px] text-[#69736b]">
                      {[project.type, project.location].filter(Boolean).join(" · ")}
                    </td>
                    <td className="py-1.5 pr-3">
                      <span className="inline-flex items-center gap-1.5 font-body text-[8.5px] text-[#4d5a50]">
                        <span className={`h-1 w-1 rounded-full ${statusDot[project.status]}`} />
                        {STATUS_LABELS[project.status]}
                      </span>
                    </td>
                    <td className="py-1.5 pr-3 font-body text-[8px] text-[#8a938b]">
                      {formatRelative(project.updatedAt)}
                    </td>
                    <td className="py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {deliveredRow ? (
                          <>
                            <Link href={`/projects/${project.id}/world`} className="rounded-[4px] bg-[#1b4a36] px-2 py-1 font-body text-[8px] text-white hover:bg-[#153b2b]">
                              Enter
                            </Link>
                            <Link href={`/projects/${project.id}/presentation`} className="rounded-[4px] border border-[#d5ddd4] px-2 py-1 font-body text-[8px] text-[#4d5a50] hover:border-[#1b4a36]">
                              Share
                            </Link>
                          </>
                        ) : (
                          <Link
                            href={project.status === "DRAFT" ? `/projects/new?draft=${project.id}` : `/projects/${project.id}`}
                            className="rounded-[4px] border border-[#d5ddd4] px-2 py-1 font-body text-[8px] text-[#4d5a50] hover:border-[#1b4a36]"
                          >
                            {project.status === "DRAFT" ? "Continue" : "Open"}
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

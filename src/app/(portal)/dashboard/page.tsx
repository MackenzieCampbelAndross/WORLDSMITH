"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { EmptyState, LoadingBlock } from "@/components/portal/EmptyState";
import { formatRelative } from "@/lib/format";
import {
  fetchActivity,
  fetchDashboard,
  STATUS_LABELS,
  type Activity,
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
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M3.2 6.1h13.6v9.7H3.2zM3.2 6.1l1.6-2.3h5l1.6 2.3M7.2 9.5h5.6M7.2 12.1h3.8" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  if (name === "worlds") {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M10 2.8 16.8 6.5v7L10 17.2 3.2 13.5v-7L10 2.8ZM3.5 6.6 10 10.2l6.5-3.6M10 10.2v6.7" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  if (name === "plans") {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M5.5 2.7h6l3 3v11.6h-9zM11.5 2.7v3h3M8 9h4M8 11.6h4" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M4 13.8a4.2 4.2 0 0 1 1.1-8.2 5 5 0 0 1 9.7 1.2A3.4 3.4 0 0 1 15.6 14H4Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10 8v3.3l2 1.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};

const ActivityGlyph = ({ type }: { type: string }) => {
  if (type === "file_uploaded" || type === "file_removed") {
    return (
      <svg viewBox="0 0 18 18" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M5 2.8h5l3 3v9.4H5zM10 2.8v3h3M7 9h4M7 11.5h4" stroke="currentColor" strokeWidth="1.1" />
      </svg>
    );
  }
  if (type === "project_submitted") {
    return (
      <svg viewBox="0 0 18 18" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M9 2.5 15 6v6l-6 3.5L3 12V6l6-3.5ZM3 6l6 3.5L15 6M9 9.5v6" stroke="currentColor" strokeWidth="1.1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.1" />
      <path d="M6.5 9H9V6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
};

export default function DashboardOverviewPage() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [allActivity, setAllActivity] = useState<Activity[] | null>(null);
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
  const activity = allActivity ?? data?.activity ?? [];

  if (loading) {
    return (
      <div>
        <LoadingBlock className="h-8 w-64" />
        <LoadingBlock className="mt-3 h-4 w-80" />
        <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <LoadingBlock key={item} className="h-28 rounded-[12px]" />
          ))}
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.7fr]">
          <LoadingBlock className="h-[300px] rounded-[14px]" />
          <LoadingBlock className="h-[300px] rounded-[14px]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
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
          className="mt-4 rounded-[7px] bg-[#1b4a36] px-5 py-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
        >
          Try again
        </button>
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
    { label: "Projects", value: projects.length, caption: "Total submissions", icon: "projects" as const },
    { label: "Delivered", value: delivered.length, caption: "Worlds ready", icon: "worlds" as const },
    { label: "Plans", value: data.plans, caption: "Source files received", icon: "plans" as const },
    { label: "In production", value: data.processingCount, caption: "With Creston", icon: "processing" as const },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-body text-[9px] uppercase tracking-[0.2em] text-[#7a847b]">Workspace</p>
          <h1 className="mt-2 font-body text-[28px] font-semibold leading-none tracking-[-0.03em] text-[#171713] sm:text-[34px]">
            {greeting}
            {firstName ? `, ${firstName}.` : "."}
          </h1>
          <p className="mt-2 max-w-[560px] font-body text-[12.5px] leading-5 text-[#69736b]">
            Turn architectural plans into immersive, real-world property experiences.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-[7px] bg-[#1b4a36] px-4 py-2.5 font-body text-[11px] font-medium text-[#f7f4ec] transition-colors hover:bg-[#153b2b]"
        >
          <span aria-hidden="true">+</span>
          Submit new project
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-[12px] border border-[#e3e8e1] bg-[#fbfcf9] px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-body text-[10px] uppercase tracking-[0.12em] text-[#7a847b]">{metric.label}</p>
                <p className="mt-2 font-body text-[28px] font-semibold leading-none tracking-[-0.04em] text-[#14231c]">
                  {String(metric.value).padStart(2, "0")}
                </p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#eaf1eb] text-[#1b4a36]">
                <MetricIcon name={metric.icon} />
              </span>
            </div>
            <p className="mt-3 font-body text-[10px] text-[#8a938b]">{metric.caption}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.7fr)]">
        <section className="rounded-[14px] border border-[#e3e8e1] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-body text-[9px] font-semibold uppercase tracking-[0.2em] text-[#7a847b]">
              Continue working
            </p>
            {active && (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#eef4ef] px-3 py-1 font-body text-[10px] text-[#315b3f]">
                <span className={`h-1.5 w-1.5 rounded-full ${statusDot[active.status]}`} />
                {STATUS_LABELS[active.status]}
              </span>
            )}
          </div>

          {active ? (
            <div className="mt-5 grid gap-7 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="min-w-0">
                <h2 className="font-body text-[26px] font-semibold leading-none tracking-[-0.03em] text-[#14231c] sm:text-[30px]">
                  {active.name}
                </h2>
                <p className="mt-3 max-w-[420px] font-body text-[12.5px] leading-5 text-[#69736b]">
                  {STATUS_DESCRIPTIONS[active.status]}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href={cta.href}
                    className="inline-flex items-center gap-2 rounded-[7px] bg-[#1b4a36] px-4 py-2.5 font-body text-[11px] font-medium text-[#f7f4ec] transition-colors hover:bg-[#153b2b]"
                  >
                    {cta.label}
                    <span aria-hidden="true">→</span>
                  </Link>
                  <span className="font-body text-[10.5px] text-[#8a938b]">
                    Updated {formatRelative(active.updatedAt)}
                  </span>
                </div>
              </div>

              <div className="border-t border-[#eef1ea] pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-body text-[9px] uppercase tracking-[0.16em] text-[#7a847b]">Project progress</p>
                  <p className="font-body text-[11px] font-semibold text-[#315b3f]">{stagePercent}%</p>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#edf1eb]">
                  <div className="h-full rounded-full bg-[#1b4a36]" style={{ width: `${stagePercent}%` }} />
                </div>
                <div className="mt-4 space-y-2">
                  {SUBMISSION_STAGES.map((label, index) => {
                    const done = stageIndex >= index;
                    return (
                      <div key={label} className="flex items-center gap-2.5">
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] ${
                            done
                              ? "border-[#1b4a36] bg-[#1b4a36] text-white"
                              : "border-[#d5ddd4] text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                        <span className={`font-body text-[11.5px] ${done ? "text-[#2f3a32]" : "text-[#8a938b]"}`}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <h2 className="font-body text-[26px] font-semibold leading-none tracking-[-0.03em] text-[#14231c]">
                No active project yet.
              </h2>
              <p className="mt-3 max-w-[420px] font-body text-[12.5px] leading-5 text-[#69736b]">
                Send us a floor plan. Creston handles the architectural interpretation and builds the world.
              </p>
              <Link
                href="/projects/new"
                className="mt-6 inline-flex rounded-[7px] bg-[#1b4a36] px-4 py-2.5 font-body text-[11px] font-medium text-[#f7f4ec] transition-colors hover:bg-[#153b2b]"
              >
                Submit a floor plan
              </Link>
            </div>
          )}
        </section>

        <div className="grid gap-5">
          <section className="rounded-[14px] border border-[#e3e8e1] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-body text-[13px] font-semibold text-[#14231c]">Production stages</h2>
              <span className="font-body text-[10px] text-[#8a938b]">{projects.length} projects</span>
            </div>
            {projects.length === 0 ? (
              <p className="py-6 font-body text-[11.5px] text-[#8a938b]">No submissions to chart yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {stageCounts.map((stage) => (
                  <div key={stage.label}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-body text-[10.5px] text-[#4d5a50]">{stage.label}</span>
                      <span className="font-body text-[10px] text-[#8a938b]">{stage.count}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#edf1eb]">
                      <div
                        className="h-full rounded-full bg-[#1b4a36]"
                        style={{ width: `${(stage.count / maxStageCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[14px] border border-[#e3e8e1] bg-white p-5">
            <h2 className="font-body text-[13px] font-semibold text-[#14231c]">Delivery</h2>
            <div className="mt-4 flex items-center gap-4">
              <div
                className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
                style={{ background: `conic-gradient(#1b4a36 ${deliveredPercent}%, #edf1eb 0)` }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white">
                  <span className="font-body text-[14px] font-semibold text-[#14231c]">{deliveredPercent}%</span>
                </div>
              </div>
              <div>
                <p className="font-body text-[11.5px] text-[#4d5a50]">
                  {delivered.length} of {projects.length} worlds ready
                </p>
                <p className="mt-1 font-body text-[10px] leading-4 text-[#8a938b]">
                  Delivered worlds can be entered, shared or embedded.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.7fr)]">
        <section className="rounded-[14px] border border-[#e3e8e1] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-body text-[13px] font-semibold text-[#14231c]">Your projects</h2>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#1b4a36] px-3.5 py-2 font-body text-[10px] font-medium text-[#f7f4ec] hover:bg-[#153b2b]"
            >
              + Submit new project
            </Link>
          </div>

          <div className="mt-3 flex gap-5 border-b border-[#eef1ea]">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`border-b py-2 font-body text-[10.5px] transition-colors ${
                  filter === item.key
                    ? "border-[#1b4a36] text-[#171713]"
                    : "border-transparent text-[#8a938b] hover:text-[#1b4a36]"
                }`}
              >
                {item.label}
                <span className="ml-1 text-[9.5px] text-[#a3aca4]">
                  {item.key === "DELIVERED" ? delivered.length : projects.length - delivered.length}
                </span>
              </button>
            ))}
          </div>

          {rows.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-body text-[12px] text-[#4d5a50]">
                {filter === "DELIVERED" ? "No delivered worlds yet." : "No submissions yet."}
              </p>
              <p className="mt-1 font-body text-[10.5px] text-[#8a938b]">
                {filter === "DELIVERED"
                  ? "They will appear here when Creston finishes processing."
                  : "Submit a floor plan to start a new project."}
              </p>
            </div>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#eef1ea]">
                    {["Project", "Type", "Status", "Updated", ""].map((heading) => (
                      <th key={heading} className="py-2.5 pr-4 font-body text-[9px] uppercase tracking-[0.14em] text-[#8a938b] last:pr-0">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((project: Project) => {
                    const deliveredRow = isDeliveredStatus(project.status);
                    return (
                      <tr key={project.id} className="border-b border-[#f0f3ee] last:border-b-0">
                        <td className="py-3 pr-4">
                          <Link href={`/projects/${project.id}`} className="font-body text-[11.5px] font-medium text-[#14231c] hover:text-[#1b4a36]">
                            {project.name}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 font-body text-[10.5px] text-[#69736b]">
                          {[project.type, project.location].filter(Boolean).join(" · ")}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex items-center gap-2 font-body text-[10.5px] text-[#4d5a50]">
                            <span className={`h-1.5 w-1.5 rounded-full ${statusDot[project.status]}`} />
                            {STATUS_LABELS[project.status]}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-body text-[10px] text-[#8a938b]">
                          {formatRelative(project.updatedAt)}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {deliveredRow ? (
                              <>
                                <Link href={`/projects/${project.id}/world`} className="rounded-[5px] bg-[#1b4a36] px-2.5 py-1.5 font-body text-[9.5px] text-white hover:bg-[#153b2b]">
                                  Enter world
                                </Link>
                                <Link href={`/projects/${project.id}/presentation`} className="rounded-[5px] border border-[#d5ddd4] px-2.5 py-1.5 font-body text-[9.5px] text-[#4d5a50] hover:border-[#1b4a36]">
                                  Share
                                </Link>
                              </>
                            ) : (
                              <Link href={project.status === "DRAFT" ? `/projects/new?draft=${project.id}` : `/projects/${project.id}`} className="rounded-[5px] border border-[#d5ddd4] px-2.5 py-1.5 font-body text-[9.5px] text-[#4d5a50] hover:border-[#1b4a36]">
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
            </div>
          )}
        </section>

        <div className="grid gap-5">
          <section className="relative overflow-hidden rounded-[14px] bg-[#1b4a36] p-6 text-[#f7f4ec]">
            <svg viewBox="0 0 220 160" className="pointer-events-none absolute -bottom-6 -right-4 h-[150px] w-[210px] opacity-20" fill="none" aria-hidden="true">
              <path d="M10 140 90 60l40 40 80-80M90 60v80M130 100v40" stroke="#f7f4ec" strokeWidth="1" />
              <path d="M40 140V90l30-20 30 20v50" stroke="#f7f4ec" strokeWidth="0.7" />
            </svg>
            <div className="relative">
              <p className="font-body text-[9px] uppercase tracking-[0.18em] text-[#f7f4ec]/55">New world</p>
              <h2 className="mt-3 font-body text-[24px] font-semibold leading-tight tracking-[-0.02em]">
                Start your next world.
              </h2>
              <p className="mt-2 max-w-[250px] font-body text-[11px] leading-5 text-[#f7f4ec]/65">
                Send a floor plan. Creston handles the interpretation, reconstruction and world generation.
              </p>
              <Link
                href="/projects/new"
                className="mt-5 inline-flex rounded-[6px] bg-[#f7f4ec] px-4 py-2 font-body text-[10.5px] font-semibold text-[#1b4a36] transition-colors hover:bg-white"
              >
                Submit a floor plan
              </Link>
            </div>
          </section>

          <section className="rounded-[14px] border border-[#e3e8e1] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-body text-[13px] font-semibold text-[#14231c]">Recent activity</h2>
            </div>
            <div className="mt-2">
              {activity.length === 0 ? (
                <p className="py-5 font-body text-[11px] text-[#8a938b]">Project events will appear here.</p>
              ) : (
                (allActivity ? activity : activity.slice(0, 4)).map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2.5 border-b border-[#f0f3ee] py-2.5 last:border-b-0">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] bg-[#eef4ef] text-[#315b3f]">
                      <ActivityGlyph type={entry.eventType} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-[10.5px] text-[#4d5a50]">{entry.message}</p>
                      <p className="mt-0.5 truncate font-body text-[9.5px] text-[#8a938b]">{entry.projectName}</p>
                    </div>
                    <span className="shrink-0 font-body text-[9px] text-[#a3aca4]">
                      {formatRelative(entry.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
            {activity.length > 4 && (
              <button
                type="button"
                onClick={async () => {
                  if (allActivity) {
                    setAllActivity(null);
                    return;
                  }
                  if (!user) return;
                  try {
                    setAllActivity(await fetchActivity(user.id, 30));
                  } catch {
                    setAllActivity(data.activity);
                  }
                }}
                className="mt-2 inline-flex items-center gap-1 font-body text-[10px] text-[#1b4a36] hover:opacity-70"
              >
                {allActivity ? "Show less" : "View all activity"}
                <span aria-hidden="true">→</span>
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

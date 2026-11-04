"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { EmptyState, LoadingBlock } from "@/components/portal/EmptyState";
import { ProjectsTable } from "@/components/portal/ProjectsTable";
import { formatRelative } from "@/lib/format";
import { fetchDashboard, type Activity, type DashboardData } from "@/lib/portal";
import {
  STATUS_DESCRIPTIONS,
  SUBMISSION_STAGES,
  isDeliveredStatus,
  submissionStageIndex,
} from "@/lib/productionStatus";

const PIPELINE_COLORS = ["#1f4a36", "#3a6b52", "#5c8a70", "#82a891", "#a9c6b5", "#d2e2d8"];

function computeGradient(stageCounts: Array<{ count: number }>, pipelineTotal: number): string {
  let acc = 0;
  const segments: string[] = [];
  for (let i = 0; i < stageCounts.length; i++) {
    const start = acc;
    acc += pipelineTotal ? (stageCounts[i].count / pipelineTotal) * 100 : 0;
    segments.push(`${PIPELINE_COLORS[i]} ${start}% ${acc}%`);
  }
  return segments.join(", ");
}

const MetricIcon = ({ name }: { name: "projects" | "delivered" | "plans" | "production" }) => {
  switch (name) {
    case "projects":
      return (
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="m10 2.8 6.4 3.4L10 9.6 3.6 6.2 10 2.8ZM3.6 10l6.4 3.4 6.4-3.4M3.6 13.8 10 17.2l6.4-3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "delivered":
      return (
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M10 2.8 16.8 6.5v7L10 17.2 3.2 13.5v-7L10 2.8ZM3.5 6.6 10 10.2l6.5-3.6M10 10.2v6.7" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      );
    case "plans":
      return (
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M5.5 2.7h6l3 3v11.6h-9zM11.5 2.7v3h3M8 9h4M8 11.6h4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M4 13.8a4.2 4.2 0 0 1 1.1-8.2 5 5 0 0 1 9.7 1.2A3.4 3.4 0 0 1 15.6 14H4Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M10 8v3.3l2 1.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
  }
};

const ActivityIcon = ({ activity }: { activity: Activity }) => {
  if (activity.eventType === "file_uploaded" || activity.eventType === "file_removed") {
    return (
      <svg viewBox="0 0 18 18" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
        <path d="M9 12V4.6M6.4 7 9 4.4 11.6 7M4 12.6v1.6h10v-1.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (activity.eventType === "project_submitted") {
    return (
      <svg viewBox="0 0 18 18" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
        <path d="M9 2.8 14.6 6v6L9 15.2 3.4 12V6L9 2.8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 18 18" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 5.6V9l2.2 1.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};

export default function DashboardOverviewPage() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const hour = new Date().getHours();
      setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

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

  const projects = useMemo(() => data?.projects ?? [], [data?.projects]);
  const delivered = useMemo(() => projects.filter((project) => isDeliveredStatus(project.status)), [projects]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const active = projects.filter((project) => !isDeliveredStatus(project.status));
    if (!query) return active;
    return active.filter((project) =>
      `${project.name} ${project.developer} ${project.type} ${project.location} ${project.status}`
        .toLowerCase()
        .includes(query),
    );
  }, [projects, search]);

  const firstName =
    profile?.firstName ||
    String((user?.user_metadata as Record<string, unknown> | undefined)?.first_name ?? "");

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <LoadingBlock className="h-14 w-72" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <LoadingBlock key={item} className="h-[86px] rounded-[12px]" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,1fr)]">
          <LoadingBlock className="h-[330px] rounded-[14px]" />
          <LoadingBlock className="h-[330px] rounded-[14px]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-[420px]">
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
          className="mt-4 rounded-[7px] bg-[#143f2d] px-4 py-2 font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#efe9dd]"
        >
          Try again
        </button>
      </div>
    );
  }

  const metrics = [
    { key: "projects" as const, label: "Projects", value: projects.length, caption: "In your workspace" },
    { key: "delivered" as const, label: "Delivered", value: delivered.length, caption: "Worlds ready" },
    { key: "plans" as const, label: "Plans", value: data.plans, caption: "Source files received" },
    { key: "production" as const, label: "In Production", value: data.processingCount, caption: "With Creston" },
  ];

  const stageCounts = SUBMISSION_STAGES.map((label, index) => ({
    label,
    count: projects.filter((project) => submissionStageIndex(project.status) === index).length,
  }));
  const pipelineTotal = stageCounts.reduce((sum, stage) => sum + stage.count, 0);
  const gradient = computeGradient(stageCounts, pipelineTotal);

  const active = data.activeProject;
  const activeStage = active ? submissionStageIndex(active.status) : -1;
  const activeHref = !active
    ? "/projects/new"
    : active.status === "DRAFT"
      ? `/projects/new?draft=${active.id}`
      : isDeliveredStatus(active.status)
        ? `/projects/${active.id}/world`
        : `/projects/${active.id}`;
  const activeCta = !active
    ? "Submit a floor plan"
    : active.status === "DRAFT"
      ? "Continue setup"
      : isDeliveredStatus(active.status)
        ? "Enter world"
        : "Open project";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-body text-[26px] font-semibold leading-none tracking-[-0.03em] text-[#17201b] sm:text-[30px]">
            {greeting}
            {firstName ? `, ${firstName}.` : "."}
          </h1>
          <p className="mt-2 font-body text-[12px] text-[#6f756d]">
            Turn architectural plans into immersive, real-world property experiences.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-[8px] bg-[#143f2d] px-4 py-2.5 font-body text-[11px] font-medium text-[#efe9dd] transition-colors hover:bg-[#0f3626]"
        >
          <span aria-hidden="true" className="text-[14px] leading-none">
            +
          </span>
          New project
        </Link>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.key} className="rounded-[12px] border border-[#ded7c9] bg-white px-4 py-3.5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#e6e3d7] text-[#2f6b4c]">
                <MetricIcon name={metric.key} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-body text-[8.5px] font-semibold uppercase tracking-[0.14em] text-[#93988f]">
                  {metric.label}
                </p>
                <p className="mt-1 font-body text-[26px] font-semibold leading-none tracking-[-0.04em] text-[#17201b]">
                  {metric.value}
                </p>
                <p className="mt-1 font-body text-[9px] text-[#9aa096]">{metric.caption}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,1fr)]">
        <section className="flex min-w-0 flex-col rounded-[14px] border border-[#ded7c9] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-body text-[13px] font-semibold text-[#17201b]">
              Active projects ({filtered.length})
            </h2>
            <Link href="/projects" className="font-body text-[10.5px] text-[#2f6b4c] hover:text-[#143f2d]">
              View all projects →
            </Link>
          </div>

          <div className="mt-2">
            {filtered.length === 0 ? (
              <div className="py-10 text-center">
                <p className="font-body text-[12px] text-[#4f5a52]">
                  {search.trim() ? `No projects match “${search.trim()}”.` : "No active projects yet."}
                </p>
                <p className="mt-1 font-body text-[10.5px] text-[#8d938b]">
                  {search.trim() ? "Try a different name, developer or type." : "Submit a floor plan to start production."}
                </p>
                {!search.trim() && (
                  <Link
                    href="/projects/new"
                    className="mt-3 inline-flex rounded-[7px] bg-[#143f2d] px-3.5 py-2 font-body text-[10px] font-medium text-[#efe9dd]"
                  >
                    Submit a floor plan
                  </Link>
                )}
              </div>
            ) : (
              <ProjectsTable projects={filtered} />
            )}
          </div>
        </section>

        <section className="flex flex-col rounded-[14px] border border-[#ded7c9] bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-body text-[13px] font-semibold text-[#17201b]">Production pipeline</h2>
            <span className="font-body text-[10px] text-[#8d938b]">{projects.length} projects</span>
          </div>

          {pipelineTotal === 0 ? (
            <div className="flex flex-1 items-center justify-center py-12">
              <p className="max-w-[220px] text-center font-body text-[10.5px] leading-5 text-[#8d938b]">
                Stage counts appear here as soon as Creston starts production on a project.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-6 flex items-center gap-5">
                <div
                  className="relative flex h-[150px] w-[150px] shrink-0 items-center justify-center rounded-full"
                  style={{ background: `conic-gradient(${gradient})` }}
                >
                  <div className="flex h-[106px] w-[106px] flex-col items-center justify-center rounded-full bg-white">
                    <span className="font-body text-[26px] font-semibold leading-none tracking-[-0.03em] text-[#17201b]">
                      {pipelineTotal}
                    </span>
                    <span className="mt-1 text-center font-body text-[8.5px] leading-[11px] text-[#8d938b]">
                      Projects
                      <br />
                      in production
                    </span>
                  </div>
                </div>

                <ul className="min-w-0 flex-1 space-y-2">
                  {stageCounts.map((stage, index) => (
                    <li key={stage.label} className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: PIPELINE_COLORS[index] }} />
                      <span className="min-w-0 flex-1 truncate font-body text-[10.5px] text-[#4f5a52]">{stage.label}</span>
                      <span className="w-4 text-right font-body text-[10px] text-[#8d938b]">{stage.count}</span>
                      <span className="w-9 text-right font-body text-[10px] text-[#8d938b]">
                        {Math.round((stage.count / pipelineTotal) * 100)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex gap-1">
                {stageCounts.map((stage, index) => {
                  const current = index === activeStage;
                  return (
                    <div
                      key={stage.label}
                      className={`flex-1 px-1.5 py-1.5 text-center ${
                        current ? "bg-[#1f4a36] text-[#efe9dd]" : "bg-[#eef2e9] text-[#4f5a52]"
                      }`}
                      style={{ clipPath: "polygon(0 0, calc(100% - 9px) 0, 100% 50%, calc(100% - 9px) 100%, 0 100%, 9px 50%)" }}
                    >
                      <p className={`truncate font-body text-[7px] ${current ? "text-[#efe9dd]/70" : "text-[#7d857c]"}`}>
                        {stage.label}
                      </p>
                      <p className="mt-0.5 font-body text-[11px] font-semibold">{stage.count}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,1fr)]">
        <section className="rounded-[14px] border border-[#ded7c9] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-body text-[13px] font-semibold text-[#17201b]">Recent activity</h2>
            <Link href="/projects" className="font-body text-[10.5px] text-[#2f6b4c] hover:text-[#143f2d]">
              View projects →
            </Link>
          </div>

          {data.activity.length === 0 ? (
            <p className="py-8 text-center font-body text-[10.5px] text-[#8d938b]">
              No activity yet. Updates from Creston will appear here.
            </p>
          ) : (
            <ol className="relative mt-4">
              <span className="absolute bottom-4 left-[13px] top-4 w-px bg-[#ebe7dc]" aria-hidden="true" />
              {data.activity.map((item) => (
                <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
                  <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e6e3d7] text-[#3f6a4d]">
                    <ActivityIcon activity={item} />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="font-body text-[11px] font-medium text-[#263129]">
                      {item.projectName || "Workspace"}
                    </p>
                    <p className="mt-0.5 font-body text-[10px] leading-4 text-[#8d938b]">{item.message}</p>
                  </div>
                  <span className="shrink-0 pt-0.5 font-body text-[9px] text-[#9aa096]">
                    {item.createdAt ? formatRelative(item.createdAt) : ""}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="relative min-h-[228px] overflow-hidden rounded-[14px] bg-[#123c2b]">
          <Image
            src="/showcase/contact-cantilever.png"
            alt=""
            fill
            sizes="(min-width: 1280px) 480px, 100vw"
            className="object-cover object-right"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#123c2b_0%,#123c2b_48%,rgba(18,60,43,0.35)_78%,rgba(18,60,43,0.05)_100%)]" />
          <div className="relative z-10 flex h-full flex-col justify-center p-5">
            <p className="font-body text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[#efe9dd]/50">
              {active ? "Next action" : "New world"}
            </p>
            <h2 className="mt-2 max-w-[260px] font-body text-[21px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#efe9dd]">
              {active ? active.name : "Start your next world."}
            </h2>
            <p className="mt-2 max-w-[260px] font-body text-[10.5px] leading-4 text-[#efe9dd]/65">
              {active
                ? activeStage >= 0
                  ? STATUS_DESCRIPTIONS[active.status]
                  : STATUS_DESCRIPTIONS.DRAFT
                : "Send a floor plan. Creston handles the architectural interpretation and builds the world."}
            </p>
            <Link
              href={activeHref}
              className="mt-4 inline-flex w-fit items-center gap-2 rounded-[7px] bg-[#efe9dd] px-3.5 py-2 font-body text-[10.5px] font-semibold text-[#143f2d] transition-colors hover:bg-white"
            >
              {activeCta}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

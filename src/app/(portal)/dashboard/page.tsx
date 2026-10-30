"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { EmptyState, LoadingBlock } from "@/components/portal/EmptyState";
import { ProjectCover } from "@/components/portal/ProjectCover";
import { ProjectTable } from "@/components/portal/ProjectTable";
import { StatusPill } from "@/components/portal/StatusPill";
import { formatRelative } from "@/lib/format";
import {
  fetchActivity,
  fetchDashboard,
  type Activity,
  type DashboardData,
} from "@/lib/portal";
import { useSignedUrls } from "@/lib/use-signed-urls";

export default function DashboardOverviewPage() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [allActivity, setAllActivity] = useState<Activity[] | null>(null);
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

  const covers = useSignedUrls(
    data
      ? [
          data.activeProject?.coverPath,
          ...data.projects.slice(0, 5).map((project) => project.coverPath),
        ]
      : [],
  );

  if (loading) {
    return (
      <div>
        <LoadingBlock className="h-8 w-72" />
        <LoadingBlock className="mt-4 h-4 w-96" />
        <div className="mt-8 grid grid-cols-2 gap-px bg-[#e2ddd1] sm:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="bg-[#f7f4ec] p-5">
              <LoadingBlock className="h-3 w-24" />
              <LoadingBlock className="mt-4 h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <LoadingBlock className="h-80" />
          <LoadingBlock className="h-80" />
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
          className="mt-4 inline-flex bg-[#1f5e44] px-5 py-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f7f4ec]"
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
  const activeCover = active?.coverPath ? covers[active.coverPath] : null;
  const progress = data.activeJob?.progress ?? 0;
  const activity = allActivity ?? data.activity;

  const metrics = [
    {
      label: "Total Projects",
      value: String(data.projects.length),
      caption: `${data.newProjectsThisMonth} new this month`,
    },
    {
      label: "3D Worlds",
      value: String(data.worlds),
      caption: "Delivered to clients",
    },
    {
      label: "Plans Processed",
      value: String(data.plans),
      caption: "Architectural files received",
    },
    {
      label: "Currently Processing",
      value: String(data.processingCount),
      caption: data.processingCount > 0 ? "In production" : "All clear",
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="font-display text-[30px] font-medium leading-tight tracking-[-0.035em] text-[#171713] sm:text-[38px]">
            {greeting}
            {firstName ? `, ${firstName}.` : "."}
          </h1>
          <p className="mt-2 font-body text-[13.5px] text-[#716b5d]">
            Here&apos;s what&apos;s happening with your Crestion Labs account.
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

      <div className="mt-9 grid grid-cols-2 gap-px bg-[#e2ddd1] sm:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-[#f7f4ec] p-5 sm:p-6">
            <p className="font-body text-[9px] uppercase tracking-[0.17em] text-[#8a8374]">
              {metric.label}
            </p>
            <p className="mt-3 font-display text-[30px] font-normal leading-none tracking-[-0.03em] text-[#171713] sm:text-[36px]">
              {metric.value}
            </p>
            <p className="mt-2 font-body text-[10.5px] text-[#8a8374]">{metric.caption}</p>
          </div>
        ))}
      </div>

      {data.projects.length === 0 ? (
        <div className="mt-9">
          <EmptyState
            title="Your first world starts here."
            body="Create a project and give us your architectural plans. We'll turn them into an interactive environment your buyers can explore."
            actionLabel="New Project"
            actionHref="/projects/new"
          />
        </div>
      ) : (
        <>
          <div className="mt-9 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="border border-[#e2ddd1] bg-[#fdfbf6]">
              <div className="flex items-center justify-between px-5 py-4 sm:px-6">
                <h2 className="font-accent text-[23px] leading-none text-[#171713]">Recent Activity</h2>
                {data.activity.length >= 6 && (
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
                    className="font-body text-[10.5px] text-[#1f5e44] transition-opacity hover:opacity-70"
                  >
                    {allActivity ? "Show less" : "View all"}
                  </button>
                )}
              </div>
              <div className="border-t border-[#e2ddd1]">
                {activity.length === 0 ? (
                  <p className="px-5 py-6 font-body text-[12.5px] text-[#8a8374] sm:px-6">
                    Project events will appear here as your account grows.
                  </p>
                ) : (
                  activity.map((entry) => {
                    const inner = (
                      <div className="flex items-start gap-3 px-5 py-3.5 sm:px-6">
                        <span
                          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                            entry.eventType === "project_submitted" ||
                            entry.eventType === "file_uploaded"
                              ? "bg-[#1f5e44]"
                              : "bg-[#b9b09c]"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-body text-[12px] leading-5 text-[#3f3b33]">
                            {entry.message}
                          </p>
                          {entry.projectName && (
                            <p className="mt-0.5 font-body text-[10.5px] text-[#8a8374]">
                              {entry.projectName}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 font-body text-[10px] text-[#a0988a]">
                          {formatRelative(entry.createdAt)}
                        </span>
                      </div>
                    );
                    return entry.projectId ? (
                      <Link
                        key={entry.id}
                        href={`/projects/${entry.projectId}`}
                        className="block border-t border-[#ece7dc] transition-colors hover:bg-[#f8f4ea] first:border-t-0"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div key={entry.id} className="border-t border-[#ece7dc] first:border-t-0">
                        {inner}
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className="relative flex min-h-[320px] flex-col justify-end overflow-hidden border border-[#e2ddd1] bg-[#1b4a36]">
              {active ? (
                <>
                  {activeCover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeCover}
                      alt={`${active.name} cover`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 opacity-60">
                      <ProjectCover name={active.name} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e2b1f]/90 via-[#0e2b1f]/25 to-transparent" />
                  <div className="relative z-10 p-6">
                    <p className="font-body text-[9.5px] uppercase tracking-[0.2em] text-[#f4f1e6]/60">
                      Continue Working
                    </p>
                    <p className="mt-2 font-display text-[25px] leading-tight text-[#fbf8ee]">
                      {active.name}
                    </p>
                    <p className="mt-1 font-body text-[11.5px] text-[#f4f1e6]/60">
                      {active.location}
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <StatusPill status={active.status} />
                      <span className="font-body text-[10.5px] text-[#f4f1e6]/55">
                        {data.activeJob?.currentStageKey
                          ? data.activeJob.currentStageKey.replaceAll("_", " ").toLowerCase()
                          : "Awaiting production"}
                      </span>
                    </div>
                    {data.activeJob && (
                      <div className="mt-4">
                        <div className="h-[3px] w-full overflow-hidden bg-white/20">
                          <div
                            className="h-full bg-[#e9e3d2]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between font-body text-[10px] text-[#f4f1e6]/55">
                          <span>Production progress</span>
                          <span>{progress}%</span>
                        </div>
                      </div>
                    )}
                    <Link
                      href={active.status === "DRAFT" ? `/projects/new?draft=${active.id}` : `/projects/${active.id}`}
                      className="mt-5 inline-flex items-center gap-2 border border-[#f4f1e6]/35 px-4 py-2 font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f4f1e6] transition-colors hover:bg-[#f4f1e6] hover:text-[#1b4a36]"
                    >
                      {active.status === "DRAFT" ? "Continue setup" : "Open Project"}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="p-6">
                  <p className="font-accent text-[24px] text-[#fbf8ee]">No active project yet.</p>
                  <p className="mt-2 max-w-[320px] font-body text-[12px] leading-5 text-[#f4f1e6]/60">
                    Start a project to see production progress here.
                  </p>
                  <Link
                    href="/projects/new"
                    className="mt-5 inline-flex bg-[#f4f1e6] px-4 py-2 font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1b4a36]"
                  >
                    New Project
                  </Link>
                </div>
              )}
            </section>
          </div>

          <section className="mt-9">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-accent text-[25px] leading-none text-[#171713]">Recent Projects</h2>
              <Link
                href="/projects"
                className="font-body text-[10.5px] uppercase tracking-[0.12em] text-[#1f5e44] transition-opacity hover:opacity-70"
              >
                All projects →
              </Link>
            </div>
            <div className="mt-5">
              <ProjectTable projects={data.projects.slice(0, 5)} covers={covers} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

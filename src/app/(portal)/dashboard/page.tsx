"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { EmptyState, LoadingBlock } from "@/components/portal/EmptyState";
import { ProjectCard } from "@/components/portal/ProjectCard";
import { formatRelative } from "@/lib/format";
import {
  fetchActivity,
  fetchDashboard,
  type Activity,
  type DashboardData,
} from "@/lib/portal";
import {
  STATUS_DESCRIPTIONS,
  SUBMISSION_STAGES,
  isDeliveredStatus,
  submissionStageIndex,
} from "@/lib/productionStatus";
import { useSignedUrls } from "@/lib/use-signed-urls";

type FilterKey = "SUBMISSIONS" | "DELIVERED";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "SUBMISSIONS", label: "Submissions" },
  { key: "DELIVERED", label: "Delivered" },
];

const Check = ({ done, optional = false }: { done: boolean; optional?: boolean }) => (
  <span
    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
      done ? "border-[#1f5e44] bg-[#1f5e44]" : optional ? "border-[#cfc8b8]" : "border-[#c8c0ae]"
    }`}
  >
    {done ? (
      <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 text-[#f7f4ec]" fill="none" aria-hidden="true">
        <path d="m2 5 2 2 4-4" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ) : (
      <span className="h-1 w-1 rounded-full bg-[#b9b09c]" />
    )}
  </span>
);

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

  const covers = useSignedUrls(
    data ? data.projects.map((project) => project.coverPath) : [],
  );

  const filtered = useMemo(
    () =>
      data
        ? data.projects.filter((project) =>
            filter === "DELIVERED" ? isDeliveredStatus(project.status) : !isDeliveredStatus(project.status),
          )
        : [],
    [data, filter],
  );

  const activity = allActivity ?? data?.activity ?? [];

  if (loading) {
    return (
      <div>
        <LoadingBlock className="h-12 w-80" />
        <LoadingBlock className="mt-3 h-4 w-96" />
        <div className="mt-8 grid gap-5 xl:grid-cols-[1.55fr_0.75fr]">
          <LoadingBlock className="h-[310px] rounded-[14px]" />
          <div className="space-y-5">
            <LoadingBlock className="h-[190px] rounded-[14px]" />
            <LoadingBlock className="h-[240px] rounded-[14px]" />
          </div>
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
          className="mt-4 inline-flex rounded-[7px] bg-[#1f5e44] px-5 py-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f7f4ec]"
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
  const stageIndex = active ? submissionStageIndex(active.status) : -1;
  const worldReady = Boolean(
    active && (isDeliveredStatus(active.status) || data.activeWorld?.status === "ready"),
  );

  const cta =
    active?.status === "DRAFT"
      ? { label: "Continue setup", href: `/projects/new?draft=${active.id}` }
      : worldReady
        ? { label: "Enter World", href: `/projects/${active?.id}/world` }
        : { label: "Open Project", href: `/projects/${active?.id}` };

  return (
    <div>
      <div>
        <h1 className="font-accent text-[42px] leading-[0.98] tracking-[-0.02em] text-[#171713] sm:text-[52px]">
          {greeting}
          {firstName ? `, ${firstName}.` : "."}
        </h1>
        <p className="mt-3 max-w-[620px] font-body text-[13.5px] leading-6 text-[#716b5d]">
          Turn architectural plans into immersive, real-world property experiences.
        </p>
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.72fr)]">
        <section className="rounded-[14px] border border-[#e2ddd1] bg-[#fdfbf6] px-6 py-7 sm:px-8">
          <p className="font-body text-[9px] font-semibold uppercase tracking-[0.22em] text-[#8a8374]">
            Continue working
          </p>
          {active ? (
            <div className="mt-5 grid gap-8 md:grid-cols-[1.05fr_0.95fr]">
              <div className="min-w-0">
                <h2 className="font-accent text-[34px] leading-none tracking-[-0.02em] text-[#171713] sm:text-[40px]">
                  {active.name}
                </h2>
                <p className="mt-3 font-body text-[12.5px] text-[#716b5d]">
                  {STATUS_DESCRIPTIONS[active.status]}
                </p>
                {activeCover ? (
                  <div className="mt-5 h-24 w-full max-w-[300px] overflow-hidden rounded-[8px] border border-[#e2ddd1]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activeCover} alt={`${active.name} cover`} className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <Link
                  href={cta.href}
                  className="mt-6 inline-flex items-center gap-2 rounded-[7px] bg-[#1f5e44] px-5 py-3 font-body text-[11.5px] font-medium text-[#f7f4ec] transition-colors hover:bg-[#174d37]"
                >
                  {cta.label}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              <div className="md:border-l md:border-[#eee9df] md:pl-8">
                <p className="font-body text-[9px] uppercase tracking-[0.18em] text-[#8a8374]">
                  Project progress
                </p>
                <div className="mt-4 space-y-3.5">
                  {SUBMISSION_STAGES.map((label, index) => {
                    const done = stageIndex >= index;
                    return (
                      <div key={label} className="flex items-center gap-3">
                        <Check done={done} />
                        <span className={`font-body text-[12px] ${done ? "text-[#171713]" : "text-[#716b5d]"}`}>
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
              <h2 className="font-accent text-[32px] leading-none text-[#171713]">No active project yet.</h2>
              <p className="mt-3 max-w-[420px] font-body text-[12.5px] leading-6 text-[#716b5d]">
                Send us a floor plan. Creston handles the architectural interpretation and builds the world.
              </p>
              <Link
                href="/projects/new"
                className="mt-6 inline-flex rounded-[7px] bg-[#1f5e44] px-5 py-3 font-body text-[11.5px] font-medium text-[#f7f4ec] transition-colors hover:bg-[#174d37]"
              >
                Submit a floor plan
              </Link>
            </div>
          )}
        </section>

        <div className="space-y-5">
          <section className="rounded-[14px] border border-[#e2ddd1] bg-[#fdfbf6] px-5 py-5">
            <h2 className="font-accent text-[24px] leading-none text-[#171713]">Your workspace</h2>
            <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[8px] bg-[#eee9df]">
              {[
                { label: "Projects", value: data.projects.length },
                { label: "3D worlds", value: data.worlds },
                { label: "Plans processed", value: data.plans },
                { label: "In processing", value: data.processingCount },
              ].map((item) => (
                <div key={item.label} className="bg-[#fdfbf6] px-4 py-4">
                  <p className="font-accent text-[26px] leading-none text-[#171713]">
                    {String(item.value).padStart(2, "0")}
                  </p>
                  <p className="mt-2 font-body text-[10.5px] text-[#716b5d]">{item.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[14px] border border-[#e2ddd1] bg-[#fdfbf6] px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-accent text-[24px] leading-none text-[#171713]">Recent activity</h2>
            </div>
            <div className="mt-3">
              {activity.length === 0 ? (
                <p className="py-4 font-body text-[11.5px] leading-5 text-[#8a8374]">
                  Project events will appear here.
                </p>
              ) : (
                (allActivity ? activity : activity.slice(0, 4)).map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 border-b border-[#f0ebe0] py-3 last:border-b-0">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-[#f1ebdf] text-[#5f5a4e]">
                      <ActivityGlyph type={entry.eventType} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-body text-[11.5px] leading-4 text-[#3f3b33]">{entry.message}</p>
                      <p className="mt-0.5 truncate font-body text-[10px] text-[#8a8374]">{entry.projectName}</p>
                    </div>
                    <span className="shrink-0 font-body text-[9.5px] text-[#a0988a]">
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
                className="mt-3 inline-flex items-center gap-1.5 font-body text-[10.5px] text-[#1f5e44] transition-opacity hover:opacity-70"
              >
                {allActivity ? "Show less" : "View all activity"}
                <span aria-hidden="true">→</span>
              </button>
            )}
          </section>
        </div>
      </div>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-accent text-[30px] leading-none text-[#171713]">Your projects</h2>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-[7px] bg-[#1f5e44] px-4 py-2.5 font-body text-[11px] font-medium text-[#f7f4ec] transition-colors hover:bg-[#174d37]"
          >
            <span aria-hidden="true">+</span>
            Submit new project
          </Link>
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

        {data.projects.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Your first world starts here."
              body="Send us a floor plan. Creston handles the architectural interpretation and builds the interactive world."
              actionLabel="Submit New Project"
              actionHref="/projects/new"
            />
          </div>
        ) : filtered.length === 0 ? (
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
              <ProjectCard key={project.id} project={project} coverUrl={project.coverPath ? covers[project.coverPath] : null} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

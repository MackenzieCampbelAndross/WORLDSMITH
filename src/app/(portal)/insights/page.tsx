"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { EmptyState, LoadingBlock } from "@/components/portal/EmptyState";
import {
  fetchAnalytics,
  fetchProjects,
  type AnalyticsRow,
  type Project,
} from "@/lib/portal";

const formatDuration = (seconds: number) => {
  if (!seconds) return "—";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return minutes > 0 ? `${minutes}m ${remaining}s` : `${remaining}s`;
};

export default function InsightsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [rows, setRows] = useState<AnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void (async () => {
      try {
        const nextProjects = await fetchProjects(user.id);
        const analytics = await Promise.all(
          nextProjects.map((project) => fetchAnalytics(project.id).catch(() => [])),
        );
        if (!active) return;
        setProjects(nextProjects);
        setRows(analytics.flat());
        setLoading(false);
      } catch {
        if (!active) return;
        setError(true);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const summary = useMemo(() => {
    const visits = rows.reduce((total, row) => total + row.visits, 0);
    const uniqueVisitors = rows.reduce((total, row) => total + row.uniqueVisitors, 0);
    const weightedSeconds = rows.reduce(
      (total, row) => total + row.avgSessionSeconds * Math.max(1, row.visits),
      0,
    );
    const weightedCount = rows.reduce((total, row) => total + Math.max(1, row.visits), 0);
    const areas: Record<string, number> = {};
    const engagement: Record<string, number> = {};
    rows.forEach((row) => {
      Object.entries(row.areas).forEach(([name, value]) => {
        areas[name] = (areas[name] ?? 0) + Number(value || 0);
      });
      Object.entries(row.engagement).forEach(([name, value]) => {
        engagement[name] = (engagement[name] ?? 0) + Number(value || 0);
      });
    });
    return {
      visits,
      uniqueVisitors,
      avgSessionSeconds: weightedCount ? Math.round(weightedSeconds / weightedCount) : 0,
      areas: Object.entries(areas).sort((a, b) => b[1] - a[1]).slice(0, 6),
      engagement: Object.entries(engagement).sort((a, b) => b[1] - a[1]).slice(0, 6),
    };
  }, [rows]);

  if (loading) {
    return (
      <div>
        <LoadingBlock className="h-12 w-48" />
        <LoadingBlock className="mt-3 h-4 w-80" />
        <LoadingBlock className="mt-8 h-24 w-full rounded-[12px]" />
        <LoadingBlock className="mt-5 h-56 w-full rounded-[12px]" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-accent text-[42px] leading-none tracking-[-0.02em] text-[#171713] sm:text-[50px]">
        Insights
      </h1>
      <p className="mt-3 max-w-[560px] font-body text-[12.5px] leading-6 text-[#716b5d]">
        How buyers use your delivered worlds, and where each project stands.
      </p>

      {error ? (
        <div className="mt-8">
          <EmptyState
            title="We couldn't load insights."
            body="The analytics record did not come through. Try again in a moment."
          />
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[12px] border border-[#e2ddd1] bg-[#fdfbf6] px-6 py-8">
            <p className="font-body text-[9px] uppercase tracking-[0.18em] text-[#8a8374]">World usage</p>
            <h2 className="mt-3 font-accent text-[27px] leading-tight text-[#171713]">
              Analytics will appear when your world receives visitors.
            </h2>
            <p className="mt-3 max-w-[460px] font-body text-[11.5px] leading-5 text-[#716b5d]">
              Usage data is supplied by the production backend once a delivered world is shared with buyers.
            </p>
          </div>
          <div className="rounded-[12px] border border-[#e2ddd1] bg-[#fdfbf6] px-6 py-8">
            <p className="font-body text-[9px] uppercase tracking-[0.18em] text-[#8a8374]">Your workspace</p>
            <div className="mt-4 divide-y divide-[#eee9df]">
              <div className="flex items-baseline justify-between py-2.5">
                <span className="font-body text-[11.5px] text-[#716b5d]">Projects</span>
                <span className="font-accent text-[22px] text-[#171713]">{String(projects.length).padStart(2, "0")}</span>
              </div>
              <div className="flex items-baseline justify-between py-2.5">
                <span className="font-body text-[11.5px] text-[#716b5d]">Delivered worlds</span>
                <span className="font-accent text-[22px] text-[#171713]">
                  {String(projects.filter((project) => project.status === "COMPLETED").length).padStart(2, "0")}
                </span>
              </div>
            </div>
            <Link href="/projects" className="mt-4 inline-flex font-body text-[10.5px] text-[#1f5e44] hover:opacity-70">
              View projects →
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-[#e2ddd1] bg-[#eee9df] sm:grid-cols-3">
            {[
              { label: "Total visits", value: String(summary.visits) },
              { label: "Unique visitors", value: String(summary.uniqueVisitors) },
              { label: "Avg. session", value: formatDuration(summary.avgSessionSeconds) },
            ].map((item) => (
              <div key={item.label} className="bg-[#fdfbf6] px-5 py-5">
                <p className="font-body text-[9px] uppercase tracking-[0.16em] text-[#8a8374]">{item.label}</p>
                <p className="mt-2 font-accent text-[30px] leading-none text-[#171713]">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {[
              { title: "Most visited areas", rows: summary.areas, empty: "Area data will appear with usage." },
              { title: "Engagement", rows: summary.engagement, empty: "Engagement data will appear with usage." },
            ].map((panel) => (
              <section key={panel.title} className="rounded-[12px] border border-[#e2ddd1] bg-[#fdfbf6]">
                <h2 className="border-b border-[#eee9df] px-5 py-4 font-accent text-[22px] leading-none text-[#171713]">
                  {panel.title}
                </h2>
                <div className="px-5 py-2">
                  {panel.rows.length === 0 ? (
                    <p className="py-4 font-body text-[11.5px] text-[#8a8374]">{panel.empty}</p>
                  ) : (
                    panel.rows.map(([name, value]) => (
                      <div key={name} className="flex items-baseline justify-between border-b border-[#eee9df] py-3 last:border-b-0">
                        <span className="font-body text-[11.5px] text-[#3f3b33]">{name}</span>
                        <span className="font-body text-[10.5px] text-[#8a8374]">{value}</span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

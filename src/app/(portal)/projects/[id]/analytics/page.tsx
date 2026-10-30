"use client";

import React, { useEffect, useMemo, useState } from "react";
import { EmptyState, LoadingBlock } from "@/components/portal/EmptyState";
import { useProjectWorkspace } from "@/components/portal/ProjectWorkspaceContext";
import {
  fetchAnalytics,
  fetchProcessing,
  STATUS_LABELS,
  type AnalyticsRow,
  type ProcessingJob,
} from "@/lib/portal";

const formatDuration = (seconds: number) => {
  if (!seconds) return "—";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return minutes > 0 ? `${minutes}m ${remaining}s` : `${remaining}s`;
};

const mergeCounts = (rows: AnalyticsRow[], key: "areas" | "engagement") => {
  const merged: Record<string, number> = {};
  rows.forEach((row) => {
    Object.entries(row[key]).forEach(([name, value]) => {
      merged[name] = (merged[name] ?? 0) + Number(value || 0);
    });
  });
  return Object.entries(merged).sort((a, b) => b[1] - a[1]);
};

export default function ProjectAnalyticsPage() {
  const { project } = useProjectWorkspace();
  const [rows, setRows] = useState<AnalyticsRow[]>([]);
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([fetchAnalytics(project.id), fetchProcessing(project.id)])
      .then(([analytics, processing]) => {
        if (!active) return;
        setRows(analytics);
        setJob(processing.job);
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
  }, [project.id]);

  const summary = useMemo(() => {
    const visits = rows.reduce((total, row) => total + row.visits, 0);
    const uniqueVisitors = rows.reduce((total, row) => total + row.uniqueVisitors, 0);
    const weightedSession = rows.reduce(
      (total, row) => total + row.avgSessionSeconds * Math.max(1, row.visits),
      0,
    );
    const weightedCount = rows.reduce((total, row) => total + Math.max(1, row.visits), 0);
    return {
      visits,
      uniqueVisitors,
      avgSessionSeconds: weightedCount ? Math.round(weightedSession / weightedCount) : 0,
      areas: mergeCounts(rows, "areas"),
      engagement: mergeCounts(rows, "engagement"),
    };
  }, [rows]);

  if (loading) {
    return (
      <div className="space-y-5">
        <LoadingBlock className="h-7 w-56" />
        <LoadingBlock className="h-24 w-full" />
        <LoadingBlock className="h-56 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="We couldn't load project analytics."
        body="The analytics record did not come through. Try again in a moment."
      />
    );
  }

  return (
    <div>
      <h2 className="font-accent text-[26px] leading-none text-[#171713]">Project Analytics</h2>
      <p className="mt-2 max-w-[560px] font-body text-[12px] leading-5 text-[#716b5d]">
        How buyers use this world, and where the project stands in production.
      </p>

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Analytics will appear once your world receives visitors."
            body="World usage and engagement metrics are recorded when the interactive experience is shared with buyers."
          />
        </div>
      ) : (
        <div className="mt-6">
          <h3 className="font-body text-[9px] uppercase tracking-[0.18em] text-[#8a8374]">World usage</h3>
          <div className="mt-3 grid grid-cols-2 gap-px bg-[#e2ddd1] sm:grid-cols-3">
            {[
              { label: "Total visits", value: String(summary.visits) },
              { label: "Unique visitors", value: String(summary.uniqueVisitors) },
              { label: "Avg. session", value: formatDuration(summary.avgSessionSeconds) },
            ].map((metric) => (
              <div key={metric.label} className="bg-[#fdfbf6] px-5 py-5">
                <p className="font-body text-[9px] uppercase tracking-[0.14em] text-[#8a8374]">{metric.label}</p>
                <p className="mt-2 font-display text-[27px] leading-none text-[#171713]">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="border border-[#e2ddd1] bg-[#fdfbf6]">
              <div className="border-b border-[#e2ddd1] px-5 py-4">
                <h3 className="font-accent text-[21px] leading-none text-[#171713]">Most visited areas</h3>
              </div>
              <div className="px-5 py-2">
                {summary.areas.length === 0 ? (
                  <p className="py-4 font-body text-[11.5px] text-[#8a8374]">Area data will appear with usage.</p>
                ) : (
                  summary.areas.slice(0, 6).map(([name, value]) => (
                    <div key={name} className="flex items-baseline justify-between border-b border-[#eee9df] py-3 last:border-b-0">
                      <span className="font-body text-[11.5px] text-[#3f3b33]">{name}</span>
                      <span className="font-body text-[10.5px] text-[#8a8374]">{value}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="border border-[#e2ddd1] bg-[#fdfbf6]">
              <div className="border-b border-[#e2ddd1] px-5 py-4">
                <h3 className="font-accent text-[21px] leading-none text-[#171713]">Engagement</h3>
              </div>
              <div className="px-5 py-2">
                {summary.engagement.length === 0 ? (
                  <p className="py-4 font-body text-[11.5px] text-[#8a8374]">Engagement data will appear with usage.</p>
                ) : (
                  summary.engagement.slice(0, 6).map(([name, value]) => (
                    <div key={name} className="flex items-baseline justify-between border-b border-[#eee9df] py-3 last:border-b-0">
                      <span className="font-body text-[11.5px] text-[#3f3b33]">{name}</span>
                      <span className="font-body text-[10.5px] text-[#8a8374]">{value}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      <section className="mt-6 border border-[#e2ddd1] bg-[#fdfbf6]">
        <div className="border-b border-[#e2ddd1] px-5 py-4">
          <h3 className="font-accent text-[21px] leading-none text-[#171713]">Production</h3>
        </div>
        <div className="md:grid md:grid-cols-2 md:divide-x md:divide-[#eee9df]">
          <div className="px-5 py-2">
            {[
              { label: "Current stage", value: job?.currentStageKey?.replaceAll("_", " ") ?? "Awaiting production" },
              { label: "Progress", value: `${job?.progress ?? 0}%` },
              { label: "Production status", value: job?.status ?? "Not started" },
            ].map((item) => (
              <div key={item.label} className="flex items-baseline justify-between border-b border-[#eee9df] py-3 last:border-b-0">
                <span className="font-body text-[9px] uppercase tracking-[0.12em] text-[#8a8374]">{item.label}</span>
                <span className="text-right font-body text-[11.5px] text-[#3f3b33]">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-2">
            {[
              { label: "Project status", value: STATUS_LABELS[project.status] },
              {
                label: "Review",
                value:
                  project.status === "CLIENT_REVIEW"
                    ? "Awaiting your review"
                    : project.status === "INTERNAL_REVIEW"
                      ? "With Crestion Labs"
                      : "—",
              },
              {
                label: "World",
                value: project.status === "COMPLETED" ? "Delivered" : "Not delivered",
              },
            ].map((item) => (
              <div key={item.label} className="flex items-baseline justify-between border-b border-[#eee9df] py-3 last:border-b-0 md:border-b-0">
                <span className="font-body text-[9px] uppercase tracking-[0.12em] text-[#8a8374]">{item.label}</span>
                <span className="text-right font-body text-[11.5px] text-[#3f3b33]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

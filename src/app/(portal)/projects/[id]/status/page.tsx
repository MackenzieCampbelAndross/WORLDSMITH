"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState, LoadingBlock } from "@/components/portal/EmptyState";
import { useProjectWorkspace } from "@/components/portal/ProjectWorkspaceContext";
import { StatusPill } from "@/components/portal/StatusPill";
import { formatDate, formatRelative } from "@/lib/format";
import { STATUS_LABELS, fetchProjectActivity, type Activity } from "@/lib/portal";
import { STATUS_DESCRIPTIONS } from "@/lib/productionStatus";

export default function ProjectStatusPage() {
  const { project } = useProjectWorkspace();
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setActivity(await fetchProjectActivity(project.id, 40));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const next = await fetchProjectActivity(project.id, 40);
        if (active) setActivity(next);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [project.id, refreshKey]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-accent text-[26px] leading-none text-[#171713]">Production status</h2>
          <p className="mt-2 max-w-[560px] font-body text-[12px] leading-5 text-[#716b5d]">
            The Crestion Labs team handles production directly. This page mirrors the status they
            publish for your project.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void load();
            setRefreshKey((key) => key + 1);
          }}
          className="border border-[#d8d2c4] px-3 py-2 font-body text-[9px] uppercase tracking-[0.12em] text-[#716b5d] transition-colors hover:border-[#1f5e44] hover:text-[#1f5e44]"
        >
          Refresh
        </button>
      </div>

      <div className="mt-6 border border-[#e2ddd1] bg-[#fdfbf6] px-5 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-body text-[9px] uppercase tracking-[0.18em] text-[#8a8374]">
              Current status
            </p>
            <div className="mt-3">
              <StatusPill status={project.status} />
            </div>
            <p className="mt-4 max-w-[560px] font-body text-[12.5px] leading-6 text-[#3f3b33]">
              {STATUS_DESCRIPTIONS[project.status]}
            </p>
          </div>
          <div className="text-right font-body text-[10px] text-[#8a8374]">
            <p>Updated {formatRelative(project.updatedAt)}</p>
            <p className="mt-1">Created {formatDate(project.createdAt)}</p>
          </div>
        </div>

        {project.status === "DRAFT" && (
          <Link
            href={`/projects/new?draft=${project.id}`}
            className="mt-5 inline-flex bg-[#1f5e44] px-4 py-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f7f4ec]"
          >
            Continue setup
          </Link>
        )}
        {project.status === "COMPLETED" && (
          <Link
            href={`/projects/${project.id}/world`}
            className="mt-5 inline-flex bg-[#1f5e44] px-4 py-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f7f4ec]"
          >
            Open 3D World →
          </Link>
        )}
      </div>

      <div className="mt-8">
        <h3 className="font-body text-[9px] uppercase tracking-[0.18em] text-[#8a8374]">
          Production updates
        </h3>
        {loading ? (
          <div className="mt-4 space-y-3">
            <LoadingBlock className="h-12 w-full" />
            <LoadingBlock className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="mt-4">
            <EmptyState
              title="We couldn't load production updates."
              body="The status is available above, but the activity history did not come through. Try refreshing in a moment."
            />
          </div>
        ) : activity.length === 0 ? (
          <div className="mt-4 border border-[#e2ddd1] bg-[#fdfbf6] px-5 py-8">
            <p className="font-accent text-[21px] leading-tight text-[#171713]">
              {project.status === "DRAFT" ? "No request has been sent yet." : "Your request is queued."}
            </p>
            <p className="mt-2 max-w-[520px] font-body text-[11.5px] leading-5 text-[#716b5d]">
              {project.status === "DRAFT"
                ? "Finish the brief and plans, then submit the project. Updates will appear here once the team starts."
                : "The Crestion Labs team will post status changes here as your world moves through production."}
            </p>
          </div>
        ) : (
          <div className="mt-4 border-t border-[#e2ddd1]">
            {activity.map((entry) => (
              <div key={entry.id} className="flex gap-4 border-b border-[#eee9df] py-4">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1f5e44]" />
                <div className="min-w-0 flex-1">
                  <p className="font-body text-[12.5px] leading-5 text-[#3f3b33]">{entry.message}</p>
                  <p className="mt-1 font-body text-[9px] uppercase tracking-[0.12em] text-[#8a8374]">
                    {entry.eventType.replaceAll("_", " ")} · {formatDate(entry.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-6 font-body text-[10px] text-[#8a8374]">
        Current label: {STATUS_LABELS[project.status]}
      </p>
    </div>
  );
}

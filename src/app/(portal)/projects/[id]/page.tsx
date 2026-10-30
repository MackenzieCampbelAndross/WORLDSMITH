"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LoadingBlock } from "@/components/portal/EmptyState";
import { useProjectWorkspace } from "@/components/portal/ProjectWorkspaceContext";
import { formatDate, formatRelative } from "@/lib/format";
import {
  fetchProcessing,
  fetchProjectActivity,
  type Activity,
  type ProcessingJob,
  type ProcessingStage,
} from "@/lib/portal";

export default function ProjectOverviewPage() {
  const { project } = useProjectWorkspace();
  const [activity, setActivity] = useState<Activity[]>([]);
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [stages, setStages] = useState<ProcessingStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetchProjectActivity(project.id, 8),
      fetchProcessing(project.id),
    ])
      .then(([nextActivity, processing]) => {
        if (!active) return;
        setActivity(nextActivity);
        setJob(processing.job);
        setStages(processing.stages);
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

  const currentStage =
    stages.find((stage) => stage.state === "active") ??
    stages.find((stage) => stage.stageKey === job?.currentStageKey) ??
    null;

  const summary = [
    { label: "Location", value: project.location },
    { label: "Type", value: project.type },
    { label: "Developer", value: project.developer || "—" },
    { label: "Stage", value: project.developmentStage || "—" },
    { label: "Buildings", value: String(project.buildings || "—") },
    { label: "Floors", value: String(project.floors || "—") },
    { label: "Units", value: String(project.units || "—") },
    { label: "Unit types", value: project.unitTypes.join(", ") || "—" },
  ];

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="border border-[#e2ddd1] bg-[#fdfbf6]">
          <div className="border-b border-[#e2ddd1] px-5 py-4">
            <h2 className="font-accent text-[22px] leading-none text-[#171713]">Project summary</h2>
          </div>
          <dl className="grid grid-cols-2 px-5 py-2">
            {summary.map((item) => (
              <div key={item.label} className="border-b border-[#eee9df] py-3 last:border-b-0">
                <dt className="font-body text-[9px] uppercase tracking-[0.14em] text-[#8a8374]">
                  {item.label}
                </dt>
                <dd className="mt-1 font-body text-[12px] leading-5 text-[#3f3b33]">{item.value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex items-center justify-between border-t border-[#e2ddd1] px-5 py-3.5">
            <span className="font-body text-[10px] text-[#8a8374]">
              Created {formatDate(project.createdAt)}
            </span>
            <span className="font-body text-[10px] text-[#8a8374]">
              Updated {formatRelative(project.updatedAt)}
            </span>
          </div>
        </section>

        <section className="border border-[#e2ddd1] bg-[#fdfbf6]">
          <div className="flex items-center justify-between border-b border-[#e2ddd1] px-5 py-4">
            <h2 className="font-accent text-[22px] leading-none text-[#171713]">Current processing</h2>
            <Link
              href={`/projects/${project.id}/processing`}
              className="font-body text-[10px] text-[#1f5e44] transition-opacity hover:opacity-70"
            >
              View pipeline →
            </Link>
          </div>
          <div className="px-5 py-6">
            {loading ? (
              <div className="space-y-3">
                <LoadingBlock className="h-3 w-36" />
                <LoadingBlock className="h-10 w-24" />
                <LoadingBlock className="h-2 w-full" />
              </div>
            ) : error ? (
              <p className="font-body text-[12px] text-[#8a5a2f]">
                Processing information is unavailable right now.
              </p>
            ) : job ? (
              <>
                <p className="font-body text-[9.5px] uppercase tracking-[0.18em] text-[#8a8374]">
                  {job.currentStageKey?.replaceAll("_", " ") ?? "Production"}
                </p>
                <p className="mt-2 font-display text-[34px] font-normal leading-none tracking-[-0.03em] text-[#171713]">
                  {job.progress}%
                </p>
                <div className="mt-4 h-[3px] w-full overflow-hidden bg-[#e5e0d4]">
                  <div className="h-full bg-[#1f5e44]" style={{ width: `${job.progress}%` }} />
                </div>
                <p className="mt-3 font-body text-[11.5px] leading-5 text-[#716b5d]">
                  {currentStage?.message ||
                    (job.status === "queued"
                      ? "Queued for the Crestion Labs production team."
                      : job.status === "processing"
                        ? "Architectural reconstruction in progress."
                        : job.status === "review"
                          ? "In review before the world is released."
                          : job.status === "completed"
                            ? "Production is complete."
                            : "Production needs attention. Our team is looking into it.")}
                </p>
                <div className="mt-4 flex gap-6 font-body text-[10px] text-[#8a8374]">
                  <span>Started {formatDate(job.startedAt)}</span>
                  <span>Updated {formatRelative(project.updatedAt)}</span>
                </div>
              </>
            ) : (
              <div>
                <p className="font-accent text-[21px] leading-tight text-[#171713]">
                  {project.status === "DRAFT" ? "Waiting for your plans." : "In the production queue."}
                </p>
                <p className="mt-2 max-w-[340px] font-body text-[11.5px] leading-5 text-[#716b5d]">
                  {project.status === "DRAFT"
                    ? "Complete the project brief to send it to the Crestion Labs production team."
                    : "Your brief has been received. The production pipeline will appear here as work begins."}
                </p>
                {project.status === "DRAFT" && (
                  <Link
                    href={`/projects/new?draft=${project.id}`}
                    className="mt-4 inline-flex bg-[#1f5e44] px-4 py-2 font-body text-[9.5px] uppercase tracking-[0.12em] text-[#f7f4ec]"
                  >
                    Continue setup
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <section className="border border-[#e2ddd1] bg-[#fdfbf6]">
          <div className="flex items-center justify-between border-b border-[#e2ddd1] px-5 py-4">
            <h2 className="font-accent text-[22px] leading-none text-[#171713]">Project activity</h2>
          </div>
          <div>
            {loading ? (
              <div className="space-y-3 px-5 py-5">
                <LoadingBlock className="h-4 w-2/3" />
                <LoadingBlock className="h-4 w-1/2" />
              </div>
            ) : activity.length === 0 ? (
              <p className="px-5 py-6 font-body text-[12px] text-[#8a8374]">
                Project events will appear here.
              </p>
            ) : (
              activity.map((entry) => (
                <div key={entry.id} className="flex items-start justify-between gap-4 border-t border-[#eee9df] px-5 py-3.5 first:border-t-0">
                  <div>
                    <p className="font-body text-[11.5px] leading-5 text-[#3f3b33]">{entry.message}</p>
                    <p className="mt-0.5 font-body text-[10px] uppercase tracking-[0.08em] text-[#8a8374]">
                      {entry.eventType.replaceAll("_", " ")}
                    </p>
                  </div>
                  <span className="shrink-0 font-body text-[10px] text-[#a0988a]">
                    {formatRelative(entry.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="border border-[#e2ddd1] bg-[#fdfbf6]">
          <div className="border-b border-[#e2ddd1] px-5 py-4">
            <h2 className="font-accent text-[22px] leading-none text-[#171713]">Quick actions</h2>
          </div>
          <div className="grid grid-cols-1">
            {[
              { href: `/projects/${project.id}/plans`, label: "View 2D plans", hint: "Architectural inputs" },
              { href: `/projects/${project.id}/processing`, label: "View processing", hint: "Production pipeline" },
              { href: `/projects/${project.id}/world`, label: "Open 3D world", hint: "Interactive experience" },
              { href: `/projects/${project.id}/files`, label: "View files", hint: "Project repository" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center justify-between border-b border-[#eee9df] px-5 py-3.5 transition-colors last:border-b-0 hover:bg-[#f8f4ea]"
              >
                <span>
                  <span className="block font-body text-[12px] text-[#3f3b33]">{action.label}</span>
                  <span className="mt-0.5 block font-body text-[10px] text-[#8a8374]">{action.hint}</span>
                </span>
                <span className="font-body text-[13px] text-[#1f5e44]" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

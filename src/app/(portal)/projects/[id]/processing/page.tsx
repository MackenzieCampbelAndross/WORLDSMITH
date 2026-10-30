"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState, LoadingBlock } from "@/components/portal/EmptyState";
import { useProjectWorkspace } from "@/components/portal/ProjectWorkspaceContext";
import { formatDate } from "@/lib/format";
import { fetchProcessing, type ProcessingJob, type ProcessingStage } from "@/lib/portal";

export default function ProjectProcessingPage() {
  const { project } = useProjectWorkspace();
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [stages, setStages] = useState<ProcessingStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    void fetchProcessing(project.id)
      .then((processing) => {
        if (!active) return;
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
  }, [project.id, refreshKey]);

  if (loading) {
    return (
      <div>
        <LoadingBlock className="h-7 w-56" />
        <LoadingBlock className="mt-5 h-24 w-full" />
        <LoadingBlock className="mt-4 h-72 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <EmptyState
          title="We couldn't load the production pipeline."
          body="The processing record did not come through. Try again in a moment."
        />
        <button
          type="button"
          onClick={() => {
            setError(false);
            setLoading(true);
            setRefreshKey((key) => key + 1);
          }}
          className="mt-4 inline-flex bg-[#1f5e44] px-5 py-2.5 font-body text-[10px] uppercase tracking-[0.12em] text-[#f7f4ec]"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!job) {
    return (
      <div>
        <h2 className="font-accent text-[26px] leading-none text-[#171713]">Processing</h2>
        <div className="mt-6">
          <EmptyState
            title={project.status === "DRAFT" ? "Processing starts after submission." : "Your brief is in the queue."}
            body={
              project.status === "DRAFT"
                ? "Finish the project brief and submit it. The production pipeline will appear here once Crestion Labs receives the project."
                : "The project has been submitted. Our production team will begin the pipeline shortly and this page will update as work progresses."
            }
            actionLabel={project.status === "DRAFT" ? "Continue setup" : undefined}
            actionHref={project.status === "DRAFT" ? `/projects/new?draft=${project.id}` : undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-accent text-[26px] leading-none text-[#171713]">Processing</h2>
          <p className="mt-2 max-w-[560px] font-body text-[12px] leading-5 text-[#716b5d]">
            Live production stages for this development. Progress updates as the Crestion Labs team
            moves the project toward a finished world.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setRefreshKey((key) => key + 1);
          }}
          className="border border-[#d8d2c4] px-3 py-2 font-body text-[9px] uppercase tracking-[0.12em] text-[#716b5d] transition-colors hover:border-[#1f5e44] hover:text-[#1f5e44]"
        >
          Refresh
        </button>
      </div>

      <div className={`mt-6 border px-5 py-5 ${job.status === "failed" ? "border-[#d8b6a0] bg-[#f8ece4]" : "border-[#e2ddd1] bg-[#fdfbf6]"}`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-body text-[9px] uppercase tracking-[0.18em] text-[#8a8374]">
              Current stage
            </p>
            <p className="mt-2 font-display text-[25px] leading-none text-[#171713]">
              {stages.find((stage) => stage.stageKey === job.currentStageKey)?.label ??
                job.currentStageKey?.replaceAll("_", " ") ??
                "Production"}
            </p>
          </div>
          <p className="font-display text-[34px] leading-none text-[#171713]">{job.progress}%</p>
        </div>
        <div className="mt-4 h-[3px] w-full overflow-hidden bg-[#e5e0d4]">
          <div className="h-full bg-[#1f5e44]" style={{ width: `${job.progress}%` }} />
        </div>
        {job.status === "failed" ? (
          <p className="mt-4 max-w-[560px] font-body text-[12px] leading-5 text-[#8a5a2f]">
            Production needs attention. Our team is reviewing the issue and will update the project
            here. You don&apos;t need to resubmit anything.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-6 font-body text-[10.5px] text-[#8a8374]">
            <span>Started {formatDate(job.startedAt)}</span>
            {job.completedAt && <span>Completed {formatDate(job.completedAt)}</span>}
            <span>
              {job.status === "queued"
                ? "Queued for production"
                : job.status === "processing"
                  ? "In production"
                  : job.status === "review"
                    ? "In review"
                    : "Completed"}
            </span>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="font-body text-[9px] uppercase tracking-[0.18em] text-[#8a8374]">
          Production pipeline
        </h3>
        <div className="mt-4 border-t border-[#e2ddd1]">
          {stages.map((stage, index) => {
            const active = stage.state === "active" || stage.stageKey === job.currentStageKey;
            const completed = stage.state === "completed";
            const failed = stage.state === "failed";
            return (
              <div key={stage.id} className="flex gap-4 border-b border-[#eee9df] py-4">
                <div className="flex w-6 flex-col items-center">
                  <span
                    className={`mt-1 flex h-3 w-3 items-center justify-center rounded-full border ${
                      failed
                        ? "border-[#8a5a2f] bg-[#8a5a2f]"
                        : completed
                          ? "border-[#1f5e44] bg-[#1f5e44]"
                          : active
                            ? "border-[#1f5e44]"
                            : "border-[#cfc8b8]"
                    }`}
                  >
                    {completed && !failed && (
                      <svg viewBox="0 0 8 8" className="h-1.5 w-1.5 text-[#f7f4ec]" fill="none" aria-hidden="true">
                        <path d="M1 4.2 3 6.1 7 2" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                    )}
                    {active && !completed && !failed && <span className="h-1 w-1 rounded-full bg-[#1f5e44]" />}
                  </span>
                  {index < stages.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-[#e5e0d4]" />}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className={`font-body text-[12.5px] ${active || completed ? "text-[#171713]" : "text-[#716b5d]"}`}>
                      {stage.label}
                    </p>
                    <span className="font-body text-[9.5px] uppercase tracking-[0.1em] text-[#8a8374]">
                      {failed
                        ? "Needs attention"
                        : completed
                          ? `Completed ${formatDate(stage.completedAt)}`
                          : active
                            ? "In progress"
                            : "Pending"}
                    </span>
                  </div>
                  {stage.message && (
                    <p className="mt-1 font-body text-[11px] leading-5 text-[#716b5d]">{stage.message}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {project.status === "COMPLETED" && (
        <Link
          href={`/projects/${project.id}/world`}
          className="mt-6 inline-flex bg-[#1f5e44] px-5 py-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f7f4ec]"
        >
          Open 3D World →
        </Link>
      )}
    </div>
  );
}

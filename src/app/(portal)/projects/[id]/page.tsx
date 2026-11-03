"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LoadingBlock } from "@/components/portal/EmptyState";
import { useProjectWorkspace } from "@/components/portal/ProjectWorkspaceContext";
import { StatusPill } from "@/components/portal/StatusPill";
import { formatDate, formatRelative } from "@/lib/format";
import { fetchProjectActivity, type Activity } from "@/lib/portal";
import { STATUS_DESCRIPTIONS } from "@/lib/productionStatus";

export default function ProjectOverviewPage() {
  const { project } = useProjectWorkspace();
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchProjectActivity(project.id, 8)
      .then((nextActivity) => {
        if (!active) return;
        setActivity(nextActivity);
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
        <section className="rounded-[12px] border border-[#e2ddd1] bg-[#fdfbf6]">
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

        <section className="rounded-[12px] border border-[#e2ddd1] bg-[#fdfbf6]">
          <div className="flex items-center justify-between border-b border-[#e2ddd1] px-5 py-4">
            <h2 className="font-accent text-[22px] leading-none text-[#171713]">Production status</h2>
            <Link
              href={`/projects/${project.id}/activity`}
              className="font-body text-[10px] text-[#1f5e44] transition-opacity hover:opacity-70"
            >
              View activity →
            </Link>
          </div>
          <div className="px-5 py-6">
            {loading ? (
              <div className="space-y-3">
                <LoadingBlock className="h-5 w-24" />
                <LoadingBlock className="h-10 w-full" />
                <LoadingBlock className="h-3 w-40" />
              </div>
            ) : error ? (
              <p className="font-body text-[12px] text-[#8a5a2f]">
                Status information is unavailable right now.
              </p>
            ) : (
              <>
                <StatusPill status={project.status} />
                <p className="mt-4 max-w-[360px] font-body text-[12px] leading-6 text-[#3f3b33]">
                  {STATUS_DESCRIPTIONS[project.status]}
                </p>
                <p className="mt-4 font-body text-[10px] text-[#8a8374]">
                  Updated {formatRelative(project.updatedAt)}
                </p>
                {project.status === "DRAFT" && (
                  <Link
                    href={`/projects/new?draft=${project.id}`}
                    className="mt-4 inline-flex bg-[#1f5e44] px-4 py-2 font-body text-[9.5px] uppercase tracking-[0.12em] text-[#f7f4ec]"
                  >
                    Continue setup
                  </Link>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <section className="rounded-[12px] border border-[#e2ddd1] bg-[#fdfbf6]">
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

        <section className="rounded-[12px] border border-[#e2ddd1] bg-[#fdfbf6]">
          <div className="border-b border-[#e2ddd1] px-5 py-4">
            <h2 className="font-accent text-[22px] leading-none text-[#171713]">Quick actions</h2>
          </div>
          <div className="grid grid-cols-1">
            {[
              { href: `/projects/${project.id}/source`, label: "Source assets", hint: "Plans and files" },
              { href: `/projects/${project.id}/activity`, label: "Project activity", hint: "Production updates" },
              { href: `/projects/${project.id}/world`, label: "Open world", hint: "Interactive experience" },
              { href: `/projects/${project.id}/presentation`, label: "Presentation", hint: "Share with buyers" },
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

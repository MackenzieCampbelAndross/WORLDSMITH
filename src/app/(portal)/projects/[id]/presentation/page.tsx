"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState, LoadingBlock } from "@/components/portal/EmptyState";
import { StatusPill } from "@/components/portal/StatusPill";
import { useProjectWorkspace } from "@/components/portal/ProjectWorkspaceContext";
import { fetchWorld, type World } from "@/lib/portal";
import { STATUS_DESCRIPTIONS } from "@/lib/productionStatus";

export default function ProjectPresentationPage() {
  const { project } = useProjectWorkspace();
  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchWorld(project.id)
      .then((next) => {
        if (!active) return;
        setWorld(next);
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

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      // The value remains visible so it can be copied manually.
    }
  };

  const shareUrl = world?.worldUrl ?? null;
  const embedUrl = world?.embedUrl ?? null;
  const ready = world?.status === "ready";

  return (
    <div>
      <div>
        <h2 className="font-accent text-[30px] leading-none text-[#171713]">Presentation</h2>
        <p className="mt-2 max-w-[560px] font-body text-[12px] leading-5 text-[#716b5d]">
          Share the finished world with buyers, or embed it in your own website.
        </p>
      </div>

      <div className="mt-6 rounded-[12px] border border-[#e2ddd1] bg-[#fdfbf6] px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-body text-[9px] uppercase tracking-[0.18em] text-[#8a8374]">
              Presentation status
            </p>
            <div className="mt-2">
              <StatusPill status={project.status} />
            </div>
          </div>
          <Link href={`/projects/${project.id}/activity`} className="font-body text-[10.5px] text-[#1f5e44] hover:opacity-70">
            View activity →
          </Link>
        </div>
        <p className="mt-4 max-w-[560px] font-body text-[11.5px] leading-5 text-[#716b5d]">
          {STATUS_DESCRIPTIONS[project.status]}
        </p>
      </div>

      {loading ? (
        <div className="mt-5 space-y-3">
          <LoadingBlock className="h-20 rounded-[12px]" />
          <LoadingBlock className="h-20 rounded-[12px]" />
        </div>
      ) : error ? (
        <div className="mt-5">
          <EmptyState
            title="We couldn't load the presentation."
            body="The delivery details did not come through. Try again in a moment."
          />
        </div>
      ) : !ready || (!shareUrl && !embedUrl) ? (
        <div className="mt-5">
          <EmptyState
            title="Presentation not delivered yet."
            body="The team builds the presentation alongside your world. Share links and embed details will appear here when the world is ready."
          />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {shareUrl && (
            <section className="rounded-[12px] border border-[#e2ddd1] bg-[#fdfbf6] px-5 py-5">
              <p className="font-body text-[9px] uppercase tracking-[0.18em] text-[#8a8374]">Shareable link</p>
              <p className="mt-2 break-all font-body text-[11.5px] text-[#3f3b33]">{shareUrl}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-[7px] bg-[#1f5e44] px-4 py-2 font-body text-[10.5px] font-medium text-[#f7f4ec] hover:bg-[#174d37]"
                >
                  Open world ↗
                </a>
                <button
                  type="button"
                  onClick={() => void copy(shareUrl, "link")}
                  className="rounded-[7px] border border-[#d8d2c4] px-4 py-2 font-body text-[10.5px] text-[#3f3b33] hover:border-[#1f5e44]"
                >
                  {copied === "link" ? "Copied" : "Copy link"}
                </button>
              </div>
            </section>
          )}

          {embedUrl && (
            <section className="rounded-[12px] border border-[#e2ddd1] bg-[#fdfbf6] px-5 py-5">
              <p className="font-body text-[9px] uppercase tracking-[0.18em] text-[#8a8374]">Website embed</p>
              <p className="mt-2 break-all font-body text-[11.5px] text-[#3f3b33]">{embedUrl}</p>
              <button
                type="button"
                onClick={() =>
                  void copy(
                    `<iframe src="${embedUrl}" width="100%" height="640" style="border:0" allowfullscreen></iframe>`,
                    "embed",
                  )
                }
                className="mt-4 rounded-[7px] border border-[#d8d2c4] px-4 py-2 font-body text-[10.5px] text-[#3f3b33] hover:border-[#1f5e44]"
              >
                {copied === "embed" ? "Copied" : "Copy embed"}
              </button>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LoadingBlock } from "@/components/portal/EmptyState";
import { StatusPill } from "@/components/portal/StatusPill";
import { useProjectWorkspace } from "@/components/portal/ProjectWorkspaceContext";
import { fetchWorld, type World } from "@/lib/portal";
import { STATUS_DESCRIPTIONS } from "@/lib/productionStatus";
import { createFileSignedUrl } from "@/lib/storage";
import { useSignedUrls } from "@/lib/use-signed-urls";

export default function ProjectWorldPage() {
  const { project } = useProjectWorkspace();
  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState<"share" | "embed" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchWorld(project.id)
      .then((nextWorld) => {
        if (!active) return;
        setWorld(nextWorld);
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

  const previews = useSignedUrls([world?.previewPath]);

  const copy = async (value: string, kind: "share" | "embed") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setExportError("Your browser blocked copying. Select the link manually.");
    }
  };

  const openExport = async (path: string) => {
    setExportError(null);
    try {
      const url = await createFileSignedUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setExportError("We couldn't create a secure export link. Please try again.");
    }
  };

  if (loading) {
    return (
      <div>
        <LoadingBlock className="h-7 w-48" />
        <LoadingBlock className="mt-5 h-80 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-[#e2ddd1] px-5 py-7">
        <p className="font-body text-[12px] text-[#8a5a2f]">We couldn&apos;t load the world state.</p>
      </div>
    );
  }

  if (!world || world.status !== "ready") {
    const waiting = ["SUBMITTED", "REVIEWING", "ASSETS_RECEIVED"].includes(project.status);
    const inProduction = ["PROCESSING", "INTERNAL_REVIEW"].includes(project.status);
    return (
      <div>
        <div className="relative overflow-hidden rounded-[12px] border border-[#e2ddd1] bg-[#1b4a36] px-6 py-12 text-center sm:px-12">
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <svg viewBox="0 0 400 200" className="h-full w-full" fill="none" aria-hidden="true">
              <path d="M40 160h320M80 160V95l45-28 45 28v65M170 160V72l60-34 60 34v88M230 160v-46h52M80 118h90M170 92h120" stroke="#f4f1e6" strokeWidth="0.7" />
            </svg>
          </div>
          <p className="relative font-body text-[9.5px] uppercase tracking-[0.22em] text-[#f4f1e6]/50">
            {project.status === "DRAFT"
              ? "Awaiting submission"
              : project.status === "COMPLETED"
                ? "Delivery pending"
                : project.status === "CLIENT_REVIEW"
                  ? "Ready for review"
                  : waiting
                    ? "Request received"
                    : "World in production"}
          </p>
          <h2 className="relative mt-4 font-display text-[28px] leading-tight text-[#fbf8ee] sm:text-[34px]">
            {project.status === "DRAFT"
              ? "Your world hasn't started yet."
              : project.status === "COMPLETED"
                ? "Delivery details are being prepared."
                : project.status === "CLIENT_REVIEW"
                  ? "Your world is ready for review."
                  : waiting
                    ? "Your request is with the Crestion Labs team."
                    : inProduction
                      ? "Your world is being created."
                      : "Production update available."}
          </h2>
          <p className="relative mx-auto mt-3 max-w-[480px] font-body text-[12.5px] leading-6 text-[#f4f1e6]/60">
            {STATUS_DESCRIPTIONS[project.status]}
          </p>
          <div className="relative mt-6 flex justify-center">
            <StatusPill status={project.status} />
          </div>
          {project.status === "DRAFT" && (
            <Link
              href={`/projects/new?draft=${project.id}`}
              className="relative mt-8 inline-flex bg-[#f4f1e6] px-5 py-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.13em] text-[#1b4a36]"
            >
              Continue setup
            </Link>
          )}
        </div>
      </div>
    );
  }

  const readyWorld = world;
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-accent text-[26px] leading-none text-[#171713]">3D World</h2>
          <p className="mt-2 font-body text-[12px] text-[#716b5d]">
            Your interactive architectural environment.
          </p>
        </div>
        {readyWorld.worldUrl ? (
          <a
            href={readyWorld.worldUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-[#1f5e44] px-5 py-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.13em] text-[#f7f4ec] transition-colors hover:bg-[#174d37]"
          >
            Open World
            <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <span className="font-body text-[10px] text-[#8a8374]">Delivery details pending</span>
        )}
      </div>

      <div className="relative mt-6 aspect-[16/9] overflow-hidden border border-[#e2ddd1] bg-[#1b4a36]">
        {readyWorld.previewPath && previews[readyWorld.previewPath] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previews[readyWorld.previewPath]}
            alt={`${project.name} world preview`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-cormorant text-[28px] uppercase tracking-[0.18em] text-[#f4f1e6]/60">
              {project.name}
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <section className="rounded-[12px] border border-[#e2ddd1] bg-[#fdfbf6]">
          <div className="border-b border-[#e2ddd1] px-5 py-4">
            <h3 className="font-accent text-[21px] leading-none text-[#171713]">Delivery</h3>
          </div>
          <div className="divide-y divide-[#eee9df]">
            {readyWorld.worldUrl && (
              <div className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div>
                  <p className="font-body text-[11.5px] text-[#3f3b33]">Shareable link</p>
                  <p className="mt-0.5 max-w-[360px] truncate font-body text-[10px] text-[#8a8374]">{readyWorld.worldUrl}</p>
                </div>
                <button type="button" onClick={() => void copy(readyWorld.worldUrl ?? "", "share")} className="font-body text-[9.5px] uppercase tracking-[0.12em] text-[#1f5e44]">
                  {copied === "share" ? "Copied" : "Copy"}
                </button>
              </div>
            )}
            {readyWorld.embedUrl && (
              <div className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div>
                  <p className="font-body text-[11.5px] text-[#3f3b33]">Website embed</p>
                  <p className="mt-0.5 font-body text-[10px] text-[#8a8374]">Embed the world in your website.</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    void copy(
                      `<iframe src="${readyWorld.embedUrl}" width="100%" height="640" style="border:0" allowfullscreen></iframe>`,
                      "embed",
                    )
                  }
                  className="font-body text-[9.5px] uppercase tracking-[0.12em] text-[#1f5e44]"
                >
                  {copied === "embed" ? "Copied" : "Copy embed"}
                </button>
              </div>
            )}
            {[
              { path: readyWorld.glbPath, label: "GLB" },
              { path: readyWorld.fbxPath, label: "FBX" },
              { path: readyWorld.objPath, label: "OBJ" },
            ]
              .filter((entry) => Boolean(entry.path))
              .map((entry) => (
                <div key={entry.label} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div>
                    <p className="font-body text-[11.5px] text-[#3f3b33]">{entry.label} asset export</p>
                    <p className="mt-0.5 font-body text-[10px] text-[#8a8374]">Textures and materials included where available.</p>
                  </div>
                  <button type="button" onClick={() => void openExport(entry.path as string)} className="font-body text-[9.5px] uppercase tracking-[0.12em] text-[#1f5e44]">
                    Download
                  </button>
                </div>
              ))}
            {readyWorld.sourceAvailable && (
              <div className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div>
                  <p className="font-body text-[11.5px] text-[#3f3b33]">Source project</p>
                  <p className="mt-0.5 font-body text-[10px] text-[#8a8374]">Enterprise delivery available on request.</p>
                </div>
                <a href="mailto:crestionlabs@gmail.com?subject=Source%20project%20delivery" className="font-body text-[9.5px] uppercase tracking-[0.12em] text-[#1f5e44]">
                  Contact
                </a>
              </div>
            )}
            {!readyWorld.worldUrl && !readyWorld.embedUrl && !readyWorld.glbPath && !readyWorld.fbxPath && !readyWorld.objPath && !readyWorld.sourceAvailable && (
              <p className="px-5 py-5 font-body text-[11.5px] text-[#8a8374]">
                Delivery options will appear here when your world is published.
              </p>
            )}
          </div>
          {exportError && <p className="px-5 pb-4 font-body text-[11px] text-[#8a5a2f]">{exportError}</p>}
        </section>

        <section className="rounded-[12px] border border-[#e2ddd1] bg-[#fdfbf6]">
          <div className="border-b border-[#e2ddd1] px-5 py-4">
            <h3 className="font-accent text-[21px] leading-none text-[#171713]">World record</h3>
          </div>
          <div className="px-5 py-2">
            {[
              { label: "Project", value: project.name },
              { label: "Status", value: "World ready" },
              { label: "Location", value: project.location },
            ].map((item) => (
              <div key={item.label} className="flex items-baseline justify-between gap-4 border-b border-[#eee9df] py-3 last:border-b-0">
                <span className="font-body text-[9px] uppercase tracking-[0.12em] text-[#8a8374]">{item.label}</span>
                <span className="text-right font-body text-[11.5px] text-[#3f3b33]">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

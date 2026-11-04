"use client";

import React, { useEffect, useState } from "react";
import DeliveredWorld from "@/components/portal/DeliveredWorld";

interface SharedData {
  project: { name: string; type: string; location: string; developer: string };
  glbUrl: string;
  collisionUrl: string;
}

export function SharedWorld({ slug, chrome }: { slug: string; chrome: boolean }) {
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    void (async () => {
      try {
        const response = await fetch(`/api/w/${encodeURIComponent(slug)}`);
        const body = (await response.json()) as Partial<SharedData> & { message?: string };
        if (!active) return;
        if (!response.ok || !body.glbUrl) {
          setError(body.message ?? "That walkthrough isn't available.");
          return;
        }
        setData(body as SharedData);
        if (chrome) document.title = `${body.project?.name ?? "Walkthrough"} · Crestion Labs`;
      } catch {
        if (active) setError("The walkthrough could not be reached.");
      }
    })();
    return () => {
      active = false;
    };
  }, [slug, chrome]);

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#1f5e44] px-6">
        <div className="max-w-[420px] rounded-[12px] border border-[#dbd4c5]/25 bg-[#171713]/70 px-6 py-7 text-center">
          <p className="font-body text-[10px] uppercase tracking-[0.22em] text-[#a8cebc]">Crestion Labs</p>
          <p className="mt-3 font-accent text-[22px] text-[#f0f1e6]">This walkthrough isn&apos;t available</p>
          <p className="mt-2 font-body text-[12px] leading-6 text-[#f0f1e6]/60">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#1f5e44]">
        <p className="font-body text-[11px] uppercase tracking-[0.2em] text-[#f0f1e6]/60">Opening walkthrough…</p>
      </div>
    );
  }

  if (!chrome) {
    return (
      <div className="h-dvh w-full bg-[#0e1310]">
        <DeliveredWorld glbUrl={data.glbUrl} collisionUrl={data.collisionUrl || null} className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="rule-lines rule-lines--on-dark min-h-dvh bg-[#1f5e44] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-[1180px]">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="font-body text-[9px] uppercase tracking-[0.24em] text-[#a8cebc]">
              {data.project.developer || "Crestion Labs"}
            </p>
            <h1 className="mt-2 font-accent text-[30px] uppercase leading-none tracking-[0.01em] text-[#f0f1e6] sm:text-[38px]">
              {data.project.name}
            </h1>
            <p className="mt-2 font-body text-[11.5px] text-[#f0f1e6]/60">
              {[data.project.type, data.project.location].filter(Boolean).join(" · ")}
            </p>
          </div>
          <p className="font-body text-[10px] uppercase tracking-[0.16em] text-[#f0f1e6]/45">
            Interactive walkthrough · Crestion Labs
          </p>
        </header>

        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-[18px] border border-[#f0f1e6]/12 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.75)]">
          <DeliveredWorld glbUrl={data.glbUrl} collisionUrl={data.collisionUrl || null} className="h-full w-full" />
        </div>

        <p className="mt-4 font-body text-[10.5px] text-[#f0f1e6]/45">
          Built from the client&apos;s floor plan by Crestion Labs.
        </p>
      </div>
    </div>
  );
}

export default SharedWorld;

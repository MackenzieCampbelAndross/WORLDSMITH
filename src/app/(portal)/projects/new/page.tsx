"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { formatBytes } from "@/lib/format";
import { submitProductionRequest } from "@/lib/production";
import {
  createDraftProject,
  fetchProject,
  fetchProjectFiles,
  PROJECT_TYPES,
  uploadProjectFile,
  type Project,
} from "@/lib/portal";

const ACCEPTED = ".pdf,.dwg,.dxf,.rvt,.jpg,.jpeg,.png,.webp";

export default function NewProjectPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof PROJECT_TYPES)[number]>(PROJECT_TYPES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftProject, setDraftProject] = useState<Project | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [existingPlan, setExistingPlan] = useState<string | null>(null);
  const [busy, setBusy] = useState<"saving" | "uploading" | "submitting" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const id = new URLSearchParams(window.location.search).get("draft");
    if (!id) return;

    let active = true;
    void (async () => {
      try {
        const existing = await fetchProject(id);
        if (!active) return;
        if (!existing) {
          setError("We couldn't open that draft. It may have been removed.");
          return;
        }
        if (existing.status !== "DRAFT") {
          router.replace(`/projects/${existing.id}`);
          return;
        }
        const files = await fetchProjectFiles(existing.id);
        const plan = files.find((item) => item.kind === "plan");
        if (!active) return;
        setDraftId(existing.id);
        setDraftProject(existing);
        setName(existing.name);
        setType(
          PROJECT_TYPES.includes(existing.type as (typeof PROJECT_TYPES)[number])
            ? (existing.type as (typeof PROJECT_TYPES)[number])
            : PROJECT_TYPES[0],
        );
        if (plan) {
          setUploaded(true);
          setExistingPlan(plan.name);
        }
      } catch {
        if (active) setError("We couldn't open that draft. Please try again.");
      }
    })();

    return () => {
      active = false;
    };
  }, [user, router]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !user) return;
    setError(null);

    if (!name.trim()) {
      setError("Add a project name.");
      return;
    }
    if (!file && !uploaded) {
      setError("Upload the floor plan to continue.");
      return;
    }

    let id = draftId;
    let project = draftProject;

    try {
      if (!id) {
        setBusy("saving");
        id = await createDraftProject(user.id, profile?.companyId ?? null, {
          name: name.trim(),
          developer: profile?.companyName ?? "",
          location: "",
          type,
          developmentStage: "",
        });
        project = await fetchProject(id);
        if (!project) throw new Error("The project could not be created.");
        setDraftId(id);
        setDraftProject(project);
        window.history.replaceState({}, "", `/projects/new?draft=${id}`);
      }

      if (file && !uploaded) {
        setBusy("uploading");
        await uploadProjectFile(user.id, project!, file, "floor_plans");
        setUploaded(true);
        setExistingPlan(file.name);
      }

      setBusy("submitting");
      await submitProductionRequest(id);
      router.push(`/projects/${id}?submitted=1`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The submission could not be completed.");
      setBusy(null);
    }
  };

  const busyLabel =
    busy === "saving"
      ? "Creating project…"
      : busy === "uploading"
        ? "Uploading floor plan…"
        : busy === "submitting"
          ? "Sending to Creston…"
          : "Submit to Creston";

  return (
    <div className="mx-auto max-w-[760px]">
      <Link href="/projects" className="font-body text-[10px] uppercase tracking-[0.16em] text-[#8a8374] transition-colors hover:text-[#1f5e44]">
        ← Projects
      </Link>

      <h1 className="mt-5 font-accent text-[42px] leading-none tracking-[-0.02em] text-[#171713] sm:text-[50px]">
        Submit a floor plan.
      </h1>
      <p className="mt-3 max-w-[560px] font-body text-[12.5px] leading-6 text-[#716b5d]">
        Send Creston the plan. We handle the architectural interpretation, spatial reconstruction and
        world generation. No room dimensions or material schedules required.
      </p>

      <form onSubmit={onSubmit} className="mt-8 rounded-[14px] border border-[#e2ddd1] bg-[#fdfbf6] px-6 py-7 sm:px-8">
        <div>
          <label htmlFor="submission-name" className="font-body text-[9px] uppercase tracking-[0.16em] text-[#8a8374]">
            Project name
          </label>
          <input
            id="submission-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="The Grove"
            className="mt-2 h-11 w-full rounded-[7px] border border-[#d8d2c4] bg-transparent px-3 font-body text-[13px] text-[#171713] outline-none transition-colors placeholder:text-[#a0988a] focus:border-[#1f5e44]"
          />
        </div>

        <div className="mt-5">
          <label htmlFor="submission-type" className="font-body text-[9px] uppercase tracking-[0.16em] text-[#8a8374]">
            Property type
          </label>
          <select
            id="submission-type"
            value={type}
            onChange={(event) => setType(event.target.value as (typeof PROJECT_TYPES)[number])}
            className="mt-2 h-11 w-full rounded-[7px] border border-[#d8d2c4] bg-transparent px-3 font-body text-[13px] text-[#171713] outline-none transition-colors focus:border-[#1f5e44]"
          >
            {PROJECT_TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5">
          <p className="font-body text-[9px] uppercase tracking-[0.16em] text-[#8a8374]">Floor plan</p>
          {uploaded ? (
            <div className="mt-2 flex items-center justify-between gap-4 rounded-[7px] border border-[#d8d2c4] bg-[#f7f2e7] px-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-body text-[12px] text-[#3f3b33]">{existingPlan ?? "Floor plan uploaded"}</p>
                <p className="mt-0.5 font-body text-[10px] text-[#8a8374]">Source plan ready for Creston.</p>
              </div>
              <span className="font-body text-[10px] text-[#2d5c3a]">Uploaded</span>
            </div>
          ) : (
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-[7px] border border-dashed border-[#cfc8b8] bg-[#faf6ec] px-5 py-8 text-center transition-colors hover:border-[#1f5e44]">
              <span className="font-body text-[12px] text-[#3f3b33]">Choose the floor plan</span>
              <span className="mt-1 font-body text-[10px] text-[#8a8374]">PDF, DWG, DXF, RVT or image · up to 25 MB</span>
              <span className="mt-3 rounded-[6px] border border-[#d8d2c4] bg-[#fdfbf6] px-3 py-1.5 font-body text-[9px] uppercase tracking-[0.12em] text-[#3f3b33]">
                Browse
              </span>
              <input
                type="file"
                accept={ACCEPTED}
                className="sr-only"
                onChange={(event) => {
                  const next = event.target.files?.[0] ?? null;
                  setFile(next);
                }}
              />
            </label>
          )}
          {file && !uploaded && (
            <p className="mt-2 font-body text-[10.5px] text-[#716b5d]">
              {file.name} · {formatBytes(file.size)}
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-5 rounded-[7px] bg-[#f8ece4] px-3.5 py-2.5 font-body text-[11.5px] leading-5 text-[#8a5a2f]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy !== null}
          className="mt-6 inline-flex w-full items-center justify-center rounded-[7px] bg-[#1f5e44] px-5 py-3 font-body text-[12px] font-medium text-[#f7f4ec] transition-colors hover:bg-[#174d37] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {busyLabel}
        </button>

        <p className="mt-4 font-body text-[10.5px] leading-5 text-[#8a8374]">
          Creston reads the plan directly. You&apos;ll see a simple status as the world is built.
        </p>
      </form>
    </div>
  );
}

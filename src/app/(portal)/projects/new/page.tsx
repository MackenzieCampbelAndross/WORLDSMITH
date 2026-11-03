"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { formatBytes } from "@/lib/format";
import { inspectPlanFile, PLAN_EXTENSIONS, planFormatError } from "@/lib/planCheck";
import { submitProductionRequest } from "@/lib/production";
import {
  createDraftProject,
  fetchProject,
  fetchProjectFiles,
  FURNISHING_STYLES,
  FURNISHING_STYLE_LABELS,
  PROJECT_TYPES,
  updateDraftProject,
  uploadProjectFile,
  type FurnishingStyle,
  type Project,
} from "@/lib/portal";

const ACCEPTED = PLAN_EXTENSIONS.join(",");

const isSpan = (value: number): boolean => Number.isFinite(value) && value >= 2 && value <= 100;

interface Requirement {
  label: string;
  hint: string;
  passed: boolean;
}

export default function NewProjectPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof PROJECT_TYPES)[number]>(PROJECT_TYPES[0]);
  const [width, setWidth] = useState("");
  const [length, setLength] = useState("");
  const [style, setStyle] = useState<FurnishingStyle>("modern");
  const [file, setFile] = useState<File | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftProject, setDraftProject] = useState<Project | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [existingPlan, setExistingPlan] = useState<string | null>(null);
  const [planProblems, setPlanProblems] = useState<string[]>([]);
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
        if (
          FURNISHING_STYLES.includes(existing.furnishingStyle as FurnishingStyle)
        ) {
          setStyle(existing.furnishingStyle as FurnishingStyle);
        }
        if (existing.planWidthMeters) setWidth(String(existing.planWidthMeters));
        if (existing.planLengthMeters) setLength(String(existing.planLengthMeters));
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

  const requirements: Requirement[] = useMemo(() => {
    const widthMeters = Number(width);
    const lengthMeters = Number(length);
    const stored = uploaded || Boolean(existingPlan);
    const formatProblem = file ? planFormatError(file) : null;
    const readable = file ? planProblems.length === 0 : stored;

    return [
      {
        label: "Project name",
        hint: "Name the project.",
        passed: name.trim().length > 0,
      },
      {
        label: "Floor plan",
        hint: formatProblem ?? "PNG, JPG or PDF, 15 MB or smaller.",
        passed: file ? formatProblem === null : stored,
      },
      {
        label: "Plan quality",
        hint:
          planProblems[0] ??
          (stored && !file
            ? "Checked when the plan was uploaded."
            : "250px on both axes, with wall lines the reader can follow."),
        passed: readable,
      },
      {
        label: "Plan width",
        hint: "Outer width in metres, between 2 and 100.",
        passed: isSpan(widthMeters),
      },
      {
        label: "Plan length",
        hint: "Outer length in metres, between 2 and 100.",
        passed: isSpan(lengthMeters),
      },
      {
        label: "Furnishing style",
        hint: "Pick one of the four styles Creston can build.",
        passed: (FURNISHING_STYLES as readonly string[]).includes(style),
      },
    ];
  }, [name, width, length, style, file, uploaded, existingPlan, planProblems]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !user) return;
    setError(null);

    const unmet = requirements.filter((item) => !item.passed);
    if (unmet.length > 0) {
      setError(`${unmet[0].label}: ${unmet[0].hint}`);
      return;
    }

    const widthMeters = Number(width);
    const lengthMeters = Number(length);

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
          planWidthMeters: widthMeters,
          planLengthMeters: lengthMeters,
          furnishingStyle: style,
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

      // A new draft already carries the measurements; only a resumed one needs them rewritten.
      if (draftId) {
        setBusy("saving");
        await updateDraftProject(id, {
          planWidthMeters: widthMeters,
          planLengthMeters: lengthMeters,
          furnishingStyle: style,
        });
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
      ? "Saving project…"
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

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="submission-width" className="font-body text-[9px] uppercase tracking-[0.16em] text-[#8a8374]">
              Plan width (m)
            </label>
            <input
              id="submission-width"
              type="number"
              inputMode="decimal"
              min={2}
              max={100}
              step="0.1"
              value={width}
              onChange={(event) => setWidth(event.target.value)}
              placeholder="12.0"
              className="mt-2 h-11 w-full rounded-[7px] border border-[#d8d2c4] bg-transparent px-3 font-body text-[13px] text-[#171713] outline-none transition-colors placeholder:text-[#a0988a] focus:border-[#1f5e44]"
            />
          </div>
          <div>
            <label htmlFor="submission-length" className="font-body text-[9px] uppercase tracking-[0.16em] text-[#8a8374]">
              Plan length (m)
            </label>
            <input
              id="submission-length"
              type="number"
              inputMode="decimal"
              min={2}
              max={100}
              step="0.1"
              value={length}
              onChange={(event) => setLength(event.target.value)}
              placeholder="9.0"
              className="mt-2 h-11 w-full rounded-[7px] border border-[#d8d2c4] bg-transparent px-3 font-body text-[13px] text-[#171713] outline-none transition-colors placeholder:text-[#a0988a] focus:border-[#1f5e44]"
            />
          </div>
        </div>
        <p className="mt-2 font-body text-[10.5px] leading-5 text-[#8a8374]">
          Measure the outer edge of the plan on both axes. With both numbers Creston builds your world
          at true scale; without them room sizes are estimated.
        </p>

        <div className="mt-5">
          <label htmlFor="submission-style" className="font-body text-[9px] uppercase tracking-[0.16em] text-[#8a8374]">
            Furnishing style
          </label>
          <select
            id="submission-style"
            value={style}
            onChange={(event) => setStyle(event.target.value as FurnishingStyle)}
            className="mt-2 h-11 w-full rounded-[7px] border border-[#d8d2c4] bg-transparent px-3 font-body text-[13px] text-[#171713] outline-none transition-colors focus:border-[#1f5e44]"
          >
            {FURNISHING_STYLES.map((option) => (
              <option key={option} value={option}>
                {FURNISHING_STYLE_LABELS[option]}
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
              <span className="mt-1 font-body text-[10px] text-[#8a8374]">PNG, JPG or PDF · up to 15 MB</span>
              <span className="mt-1 font-body text-[10px] text-[#8a8374]">
                Use the line drawing of the plan, not a 3D view or a furnished render.
              </span>
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
                  setPlanProblems([]);
                  setError(null);
                  if (!next) return;
                  const format = planFormatError(next);
                  if (format) {
                    setPlanProblems([format]);
                    return;
                  }
                  void inspectPlanFile(next).then((result) => setPlanProblems(result.errors));
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

        <div className="mt-6 rounded-[10px] border border-[#e2ddd1] bg-[#fbf8f1] px-4 py-3.5">
          <p className="font-body text-[9px] uppercase tracking-[0.16em] text-[#8a8374]">
            What Creston needs
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {requirements.map((item) => (
              <li key={item.label} className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className={`mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full ${
                    item.passed ? "bg-[#1f5e44]" : "bg-[#a13328]"
                  }`}
                />
                <span
                  className={`font-body text-[11px] leading-5 ${
                    item.passed ? "text-[#4d5a50]" : "text-[#a13328]"
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                  {item.passed ? "" : ` — ${item.hint}`}
                </span>
              </li>
            ))}
          </ul>
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

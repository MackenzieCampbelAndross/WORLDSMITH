"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { WizardFileUpload } from "@/components/portal/WizardFileUpload";
import { formatBytes } from "@/lib/format";
import {
  createDraftProject,
  DEVELOPMENT_STAGES,
  fetchProject,
  fetchProjectFiles,
  FILE_CATEGORY_LABELS,
  PLAN_CATEGORIES,
  PROJECT_TYPES,
  setProjectCover,
  submitProject,
  UNIT_TYPES,
  updateDraftProject,
  type FileCategory,
  type Project,
  type ProjectDraftPatch,
  type ProjectFile,
} from "@/lib/portal";

const STEPS = [
  { n: 1, label: "Project Information", hint: "The development and its context." },
  { n: 2, label: "Development Structure", hint: "Buildings, floors and unit mix." },
  { n: 3, label: "Architectural Assets", hint: "Plans, drawings and CAD files." },
  { n: 4, label: "Visual Direction", hint: "Material, landscape and lighting cues." },
  { n: 5, label: "Visualization Requirements", hint: "What the world needs to show." },
  { n: 6, label: "Review & Submit", hint: "Confirm and send to production." },
];

const SPACES = ["Living", "Dining", "Kitchen", "Bedrooms", "Balcony", "Amenities", "Landscape"];
const INTERACTIONS = [
  "First person",
  "Third person",
  "Room navigation",
  "Day / night",
  "Furnishing",
  "Landscape",
];

interface FormState {
  name: string;
  developer: string;
  location: string;
  type: string;
  developmentStage: string;
  buildings: string;
  floors: string;
  units: string;
  unitTypes: string[];
  interiorStyle: string;
  exteriorStyle: string;
  materials: string;
  landscape: string;
  lighting: string;
  referenceProjects: string;
  visualizationNeeds: string;
  spaces: string[];
  interactions: string[];
  delivery: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  developer: "",
  location: "",
  type: "Residential",
  developmentStage: "Concept",
  buildings: "1",
  floors: "1",
  units: "1",
  unitTypes: ["3 BHK"],
  interiorStyle: "Contemporary",
  exteriorStyle: "Contemporary",
  materials: "",
  landscape: "",
  lighting: "",
  referenceProjects: "",
  visualizationNeeds: "",
  spaces: ["Living", "Dining"],
  interactions: ["First person", "Room navigation"],
  delivery: "Hosted world",
  notes: "",
};

const formFromProject = (project: Project): FormState => {
  const scope = project.visualizationScope;
  return {
    name: project.name,
    developer: project.developer,
    location: project.location,
    type: project.type || "Residential",
    developmentStage: project.developmentStage || "Concept",
    buildings: String(project.buildings || 1),
    floors: String(project.floors || 1),
    units: String(project.units || 1),
    unitTypes: project.unitTypes.length ? project.unitTypes : ["3 BHK"],
    interiorStyle: project.interiorStyle || "Contemporary",
    exteriorStyle: project.exteriorStyle || "Contemporary",
    materials: project.materials,
    landscape: project.landscape,
    lighting: project.lighting,
    referenceProjects: project.referenceProjects,
    visualizationNeeds: String(scope.needs ?? ""),
    spaces: Array.isArray(scope.spaces) ? scope.spaces.map(String) : ["Living", "Dining"],
    interactions: Array.isArray(scope.interactions)
      ? scope.interactions.map(String)
      : ["First person", "Room navigation"],
    delivery: String(scope.delivery ?? "Hosted world"),
    notes: String(scope.notes ?? ""),
  };
};

const inputClass =
  "mt-1.5 h-10 w-full border border-[#d8d2c4] bg-transparent px-3 font-body text-[12.5px] text-[#171713] outline-none transition-colors placeholder:text-[#a0988a] focus:border-[#1f5e44]";
const labelClass = "font-body text-[9px] uppercase tracking-[0.16em] text-[#8a8374]";
const selectClass = inputClass;

export default function NewProjectPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [coverPath, setCoverPath] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [assetsBusy, setAssetsBusy] = useState(false);
  const [refsBusy, setRefsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const draftId = new URLSearchParams(window.location.search).get("draft");
    if (!draftId) return;

    let active = true;
    void (async () => {
      try {
        const existing = await fetchProject(draftId);
        if (!active) return;
        if (!existing) {
          setError("We couldn't open that draft. It may have been removed.");
          return;
        }
        if (existing.status !== "DRAFT") {
          router.replace(`/projects/${existing.id}`);
          return;
        }
        const existingFiles = await fetchProjectFiles(existing.id);
        if (!active) return;
        setProject(existing);
        setProjectId(existing.id);
        setForm(formFromProject(existing));
        setFiles(existingFiles);
        setCoverPath(existing.coverPath);
        setMaxStep(6);
      } catch {
        if (!active) return;
        setError("We couldn't open that draft. Please try again.");
      }
    })();

    return () => {
      active = false;
    };
  }, [user, router]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleList = (key: "unitTypes" | "spaces" | "interactions", value: string) =>
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));

  const ensureProject = async (): Promise<string> => {
    if (!user) throw new Error("not-signed-in");
    if (projectId) return projectId;
    const id = await createDraftProject(user.id, profile?.companyId ?? null, {
      name: form.name,
      developer: form.developer || profile?.companyName || "",
      location: form.location,
      type: form.type,
      developmentStage: form.developmentStage,
    });
    window.history.replaceState({}, "", `/projects/new?draft=${id}`);
    const created = await fetchProject(id);
    setProjectId(id);
    setProject(created);
    setCoverPath(created?.coverPath ?? null);
    return id;
  };

  const save = async (patch: ProjectDraftPatch) => {
    const id = await ensureProject();
    await updateDraftProject(id, patch);
  };

  const handleUploaded = async (file: ProjectFile) => {
    setFiles((current) => [file, ...current]);
    if (!coverPath && file.mimeType.startsWith("image/") && project) {
      try {
        await setProjectCover(project.id, file.path);
        setCoverPath(file.path);
        setProject((current) => (current ? { ...current, coverPath: file.path } : current));
      } catch {
        // A cover is optional; the file remains uploaded.
      }
    }
  };

  const handleDeleted = (file: ProjectFile) => {
    setFiles((current) => current.filter((item) => item.id !== file.id));
    if (coverPath === file.path) setCoverPath(null);
  };

  const scopePayload = () => ({
    needs: form.visualizationNeeds,
    spaces: form.spaces,
    interactions: form.interactions,
    delivery: form.delivery,
    notes: form.notes,
  });

  const next = async () => {
    if (saving || assetsBusy || refsBusy) return;
    setError(null);

    if (step === 1) {
      const developer = form.developer.trim() || profile?.companyName || "";
      if (!form.name.trim() || !form.location.trim() || !developer) {
        setError("Add the project name, developer and location to continue.");
        return;
      }
      setSaving(true);
      try {
        setForm((current) => ({ ...current, developer }));
        await save({
          name: form.name,
          developer,
          location: form.location,
          type: form.type,
          developmentStage: form.developmentStage,
        });
        setStep(2);
        setMaxStep((current) => Math.max(current, 2));
      } catch {
        setError("This project could not be created. Please try again.");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (step === 2) {
      const buildings = Number(form.buildings);
      const floors = Number(form.floors);
      const units = Number(form.units);
      if (
        !Number.isFinite(buildings) ||
        buildings < 1 ||
        !Number.isFinite(floors) ||
        floors < 1 ||
        !Number.isFinite(units) ||
        units < 1 ||
        form.unitTypes.length === 0
      ) {
        setError("Add the building, floor and unit counts, and at least one unit type.");
        return;
      }
      setSaving(true);
      try {
        await save({
          buildings,
          floors,
          units,
          unitTypes: form.unitTypes,
        });
        setStep(3);
        setMaxStep((current) => Math.max(current, 3));
      } catch {
        setError("We couldn't save the development structure. Please try again.");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (step === 3) {
      if (!files.some((file) => file.kind === "plan")) {
        setError("Upload at least one architectural plan before continuing.");
        return;
      }
      setStep(4);
      setMaxStep((current) => Math.max(current, 4));
      return;
    }

    if (step === 4) {
      setSaving(true);
      try {
        await save({
          interiorStyle: form.interiorStyle,
          exteriorStyle: form.exteriorStyle,
          materials: form.materials,
          landscape: form.landscape,
          lighting: form.lighting,
          referenceProjects: form.referenceProjects,
        });
        setStep(5);
        setMaxStep((current) => Math.max(current, 5));
      } catch {
        setError("We couldn't save the visual direction. Please try again.");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (step === 5) {
      setSaving(true);
      try {
        await save({ visualizationScope: scopePayload() });
        setStep(6);
        setMaxStep(6);
      } catch {
        setError("We couldn't save your requirements. Please try again.");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (step === 6) {
      if (!projectId) return;
      setSaving(true);
      try {
        await submitProject(projectId);
        router.push(`/projects/${projectId}?submitted=1`);
      } catch {
        setError("This project could not be submitted. Please try again.");
        setSaving(false);
      }
    }
  };

  const selectedStep = STEPS[step - 1];
  const canGoBack = step > 1;

  return (
    <div>
      <Link
        href="/projects"
        className="font-body text-[9.5px] uppercase tracking-[0.16em] text-[#8a8374] transition-colors hover:text-[#1f5e44]"
      >
        ← Projects
      </Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-body text-[9.5px] uppercase tracking-[0.2em] text-[#8a8374]">
            {projectId ? "Draft project" : "New project"}
          </p>
          <h1 className="mt-2 font-display text-[30px] font-medium leading-none tracking-[-0.035em] text-[#171713] sm:text-[38px]">
            Set up your development.
          </h1>
          <p className="mt-3 max-w-[560px] font-body text-[12.5px] leading-6 text-[#716b5d]">
            Tell us about the architecture and visual intent. We&apos;ll use it to shape the
            interactive world.
          </p>
        </div>
        <p className="font-body text-[10px] uppercase tracking-[0.16em] text-[#8a8374]">
          Step {step} of {STEPS.length}
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[210px_1fr]">
        <aside className="hidden lg:block">
          <div className="space-y-1">
            {STEPS.map((item) => {
              const active = item.n === step;
              const complete = item.n < step;
              const reachable = item.n <= maxStep;
              return (
                <button
                  key={item.n}
                  type="button"
                  disabled={!reachable}
                  onClick={() => reachable && setStep(item.n)}
                  className={`flex w-full items-start gap-3 border-l py-3 pl-4 text-left transition-colors ${
                    active
                      ? "border-[#1f5e44]"
                      : complete
                        ? "border-[#cfc8b8] hover:border-[#1f5e44]"
                        : "border-[#e2ddd1]"
                  } ${reachable ? "" : "cursor-default opacity-50"}`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-body text-[9px] ${
                      active
                        ? "border-[#1f5e44] bg-[#1f5e44] text-[#f7f4ec]"
                        : complete
                          ? "border-[#1f5e44] text-[#1f5e44]"
                          : "border-[#cfc8b8] text-[#8a8374]"
                    }`}
                  >
                    {complete ? "✓" : item.n}
                  </span>
                  <span>
                    <span
                      className={`block font-body text-[11.5px] ${
                        active ? "text-[#171713]" : "text-[#716b5d]"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="mt-1 block font-body text-[9.5px] leading-4 text-[#a0988a]">
                      {item.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="border border-[#e2ddd1] bg-[#fdfbf6]">
          <div className="border-b border-[#e2ddd1] px-5 py-4 sm:px-7">
            <p className="font-body text-[9px] uppercase tracking-[0.18em] text-[#8a8374]">
              {selectedStep.label}
            </p>
            <p className="mt-1 font-accent text-[21px] leading-none text-[#171713]">
              {selectedStep.hint}
            </p>
          </div>

          <div className="px-5 py-6 sm:px-7 sm:py-7">
            {error && (
              <p role="alert" className="mb-5 border-l-2 border-[#8a5a2f] bg-[#f6eee3] px-3 py-2 font-body text-[11.5px] text-[#8a5a2f]">
                {error}
              </p>
            )}

            {step === 1 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="project-name" className={labelClass}>Project name</label>
                  <input
                    id="project-name"
                    value={form.name}
                    onChange={(event) => update("name", event.target.value)}
                    placeholder="Palm Grove"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="project-developer" className={labelClass}>Developer / company</label>
                  <input
                    id="project-developer"
                    value={form.developer}
                    onChange={(event) => update("developer", event.target.value)}
                    placeholder={profile?.companyName || "Developer name"}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="project-location" className={labelClass}>Location</label>
                  <input
                    id="project-location"
                    value={form.location}
                    onChange={(event) => update("location", event.target.value)}
                    placeholder="Chennai, India"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="project-type" className={labelClass}>Project type</label>
                  <select
                    id="project-type"
                    value={form.type}
                    onChange={(event) => update("type", event.target.value)}
                    className={selectClass}
                  >
                    {PROJECT_TYPES.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="project-stage" className={labelClass}>Development stage</label>
                  <select
                    id="project-stage"
                    value={form.developmentStage}
                    onChange={(event) => update("developmentStage", event.target.value)}
                    className={selectClass}
                  >
                    {DEVELOPMENT_STAGES.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="grid gap-5 sm:grid-cols-3">
                  {(["buildings", "floors", "units"] as const).map((key) => (
                    <div key={key}>
                      <label htmlFor={`project-${key}`} className={labelClass}>
                        {key === "buildings" ? "Buildings" : key === "floors" ? "Floors" : "Units"}
                      </label>
                      <input
                        id={`project-${key}`}
                        type="number"
                        min={1}
                        value={form[key]}
                        onChange={(event) => update(key, event.target.value)}
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <p className={labelClass}>Unit types</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {UNIT_TYPES.map((unit) => {
                      const selected = form.unitTypes.includes(unit);
                      return (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => toggleList("unitTypes", unit)}
                          className={`border px-3.5 py-2 font-body text-[11px] transition-colors ${
                            selected
                              ? "border-[#1f5e44] bg-[#e8efe8] text-[#1f5e44]"
                              : "border-[#d8d2c4] text-[#716b5d] hover:border-[#1f5e44]"
                          }`}
                        >
                          {unit}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 3 &&
              (project ? (
                <div>
                  <WizardFileUpload
                    project={project}
                    files={files.filter((file) => PLAN_CATEGORIES.includes(file.category))}
                    categories={PLAN_CATEGORIES}
                    onUploaded={handleUploaded}
                    onDeleted={handleDeleted}
                    onBusyChange={setAssetsBusy}
                  />
                  <p className="mt-4 font-body text-[10.5px] leading-5 text-[#8a8374]">
                    Upload at least one floor plan, elevation, site plan or CAD file. The first
                    image becomes the project cover.
                  </p>
                </div>
              ) : (
                <p className="font-body text-[12px] text-[#8a8374]">
                  Complete step 1 to create the draft project, then upload files.
                </p>
              ))}

            {step === 4 && (
              <div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="interior-style" className={labelClass}>Interior style</label>
                    <select
                      id="interior-style"
                      value={form.interiorStyle}
                      onChange={(event) => update("interiorStyle", event.target.value)}
                      className={selectClass}
                    >
                      {["Contemporary", "Minimal", "Warm modern", "Japandi", "Classic", "Industrial"].map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="exterior-style" className={labelClass}>Exterior style</label>
                    <select
                      id="exterior-style"
                      value={form.exteriorStyle}
                      onChange={(event) => update("exteriorStyle", event.target.value)}
                      className={selectClass}
                    >
                      {["Contemporary", "Modern tropical", "Minimal", "Classical", "Brutalist"].map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="materials" className={labelClass}>Materials</label>
                    <input
                      id="materials"
                      value={form.materials}
                      onChange={(event) => update("materials", event.target.value)}
                      placeholder="Stone, teak, lime plaster…"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="landscape" className={labelClass}>Landscape preferences</label>
                    <input
                      id="landscape"
                      value={form.landscape}
                      onChange={(event) => update("landscape", event.target.value)}
                      placeholder="Courtyards, native planting…"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="lighting" className={labelClass}>Lighting preference</label>
                    <input
                      id="lighting"
                      value={form.lighting}
                      onChange={(event) => update("lighting", event.target.value)}
                      placeholder="Golden hour, warm evening…"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="reference-projects" className={labelClass}>Reference projects</label>
                    <input
                      id="reference-projects"
                      value={form.referenceProjects}
                      onChange={(event) => update("referenceProjects", event.target.value)}
                      placeholder="Names or links"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="mt-6 border-t border-[#e2ddd1] pt-5">
                  <p className={labelClass}>Reference images</p>
                  {project ? (
                    <div className="mt-2">
                      <WizardFileUpload
                        project={project}
                        files={files.filter((file) => file.category === "references")}
                        categories={["references"] as FileCategory[]}
                        fixedCategory="references"
                        onUploaded={handleUploaded}
                        onDeleted={handleDeleted}
                        onBusyChange={setRefsBusy}
                      />
                    </div>
                  ) : (
                    <p className="mt-2 font-body text-[12px] text-[#8a8374]">
                      Complete step 1 before adding references.
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <div>
                  <label htmlFor="needs" className={labelClass}>What needs visualization?</label>
                  <textarea
                    id="needs"
                    value={form.visualizationNeeds}
                    onChange={(event) => update("visualizationNeeds", event.target.value)}
                    rows={3}
                    placeholder="The full residence, amenity level and arrival sequence…"
                    className={`${inputClass} h-auto py-2.5 leading-5`}
                  />
                </div>
                <div className="mt-6">
                  <p className={labelClass}>Spaces to include</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SPACES.map((space) => {
                      const selected = form.spaces.includes(space);
                      return (
                        <button
                          key={space}
                          type="button"
                          onClick={() => toggleList("spaces", space)}
                          className={`border px-3.5 py-2 font-body text-[11px] transition-colors ${
                            selected
                              ? "border-[#1f5e44] bg-[#e8efe8] text-[#1f5e44]"
                              : "border-[#d8d2c4] text-[#716b5d] hover:border-[#1f5e44]"
                          }`}
                        >
                          {space}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-6">
                  <p className={labelClass}>Required interactions</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {INTERACTIONS.map((interaction) => {
                      const selected = form.interactions.includes(interaction);
                      return (
                        <button
                          key={interaction}
                          type="button"
                          onClick={() => toggleList("interactions", interaction)}
                          className={`border px-3.5 py-2 font-body text-[11px] transition-colors ${
                            selected
                              ? "border-[#1f5e44] bg-[#e8efe8] text-[#1f5e44]"
                              : "border-[#d8d2c4] text-[#716b5d] hover:border-[#1f5e44]"
                          }`}
                        >
                          {interaction}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="delivery" className={labelClass}>Expected delivery</label>
                    <select
                      id="delivery"
                      value={form.delivery}
                      onChange={(event) => update("delivery", event.target.value)}
                      className={selectClass}
                    >
                      {["Hosted world", "Share link", "Website embed", "Full export", "3D asset export"].map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="notes" className={labelClass}>Additional requirements</label>
                    <textarea
                      id="notes"
                      value={form.notes}
                      onChange={(event) => update("notes", event.target.value)}
                      rows={3}
                      className={`${inputClass} h-auto py-2.5 leading-5`}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-7">
                <ReviewSection title="Project Information" onEdit={() => setStep(1)}>
                  <ReviewRow label="Project" value={form.name} />
                  <ReviewRow label="Developer" value={form.developer} />
                  <ReviewRow label="Location" value={form.location} />
                  <ReviewRow label="Type" value={form.type} />
                  <ReviewRow label="Stage" value={form.developmentStage} />
                </ReviewSection>
                <ReviewSection title="Development Structure" onEdit={() => setStep(2)}>
                  <ReviewRow label="Buildings" value={form.buildings} />
                  <ReviewRow label="Floors" value={form.floors} />
                  <ReviewRow label="Units" value={form.units} />
                  <ReviewRow label="Unit types" value={form.unitTypes.join(", ")} />
                </ReviewSection>
                <ReviewSection title="Architectural Assets" onEdit={() => setStep(3)}>
                  {files.length === 0 ? (
                    <p className="font-body text-[11.5px] text-[#8a8374]">No files uploaded.</p>
                  ) : (
                    files.map((file) => (
                      <ReviewRow
                        key={file.id}
                        label={FILE_CATEGORY_LABELS[file.category]}
                        value={`${file.name} · ${formatBytes(file.size)}`}
                      />
                    ))
                  )}
                </ReviewSection>
                <ReviewSection title="Visual Direction" onEdit={() => setStep(4)}>
                  <ReviewRow label="Interior" value={form.interiorStyle} />
                  <ReviewRow label="Exterior" value={form.exteriorStyle} />
                  <ReviewRow label="Materials" value={form.materials || "—"} />
                  <ReviewRow label="Landscape" value={form.landscape || "—"} />
                  <ReviewRow label="Lighting" value={form.lighting || "—"} />
                </ReviewSection>
                <ReviewSection title="Visualization Requirements" onEdit={() => setStep(5)}>
                  <ReviewRow label="Needs" value={form.visualizationNeeds || "—"} />
                  <ReviewRow label="Spaces" value={form.spaces.join(", ") || "—"} />
                  <ReviewRow label="Interactions" value={form.interactions.join(", ") || "—"} />
                  <ReviewRow label="Delivery" value={form.delivery} />
                </ReviewSection>
                <p className="border-t border-[#e2ddd1] pt-5 font-body text-[10.5px] leading-5 text-[#8a8374]">
                  Submitting sends this brief to the Crestion Labs production team. Once submitted,
                  the project enters the production pipeline and its details can no longer be edited.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-[#e2ddd1] px-5 py-4 sm:px-7">
            {canGoBack ? (
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(1, current - 1))}
                disabled={saving}
                className="font-body text-[10px] uppercase tracking-[0.14em] text-[#716b5d] transition-colors hover:text-[#1f5e44] disabled:opacity-50"
              >
                ← Back
              </button>
            ) : (
              <Link
                href="/projects"
                className="font-body text-[10px] uppercase tracking-[0.14em] text-[#716b5d] transition-colors hover:text-[#1f5e44]"
              >
                Back to projects
              </Link>
            )}
            <button
              type="button"
              onClick={() => void next()}
              disabled={saving || assetsBusy || refsBusy}
              className="inline-flex items-center gap-2 bg-[#1f5e44] px-5 py-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f7f4ec] transition-colors hover:bg-[#174d37] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving…"
                : step === 6
                  ? "Submit Project"
                  : assetsBusy || refsBusy
                    ? "Uploading…"
                    : "Continue"}
              {step < 6 && <span aria-hidden="true">→</span>}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-4 border-b border-[#e2ddd1] pb-2">
        <h2 className="font-accent text-[20px] leading-none text-[#171713]">{title}</h2>
        <button
          type="button"
          onClick={onEdit}
          className="font-body text-[9.5px] uppercase tracking-[0.12em] text-[#1f5e44] transition-opacity hover:opacity-70"
        >
          Edit
        </button>
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-5 border-b border-[#eee9df] py-2 last:border-b-0">
      <span className="font-body text-[10px] uppercase tracking-[0.12em] text-[#8a8374]">{label}</span>
      <span className="max-w-[70%] text-right font-body text-[11.5px] leading-5 text-[#3f3b33]">
        {value}
      </span>
    </div>
  );
}

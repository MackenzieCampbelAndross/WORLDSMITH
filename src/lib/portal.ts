import { getSupabaseClient } from "@/lib/supabase";
import { createFileSignedUrls, deleteProjectObject, uploadProjectObject } from "@/lib/storage";

export const PROJECT_TYPES = [
  "Residential",
  "Apartment",
  "Villa",
  "Commercial",
  "Mixed Use",
  "Hospitality",
  "Other",
] as const;

export const DEVELOPMENT_STAGES = [
  "Concept",
  "Design Development",
  "Approvals",
  "Under Construction",
  "Completed",
] as const;

export const UNIT_TYPES = ["2 BHK", "3 BHK", "4 BHK", "Penthouse", "Villa"] as const;

export const PROJECT_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "REVIEWING",
  "ASSETS_RECEIVED",
  "PROCESSING",
  "INTERNAL_REVIEW",
  "CLIENT_REVIEW",
  "COMPLETED",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  REVIEWING: "Reviewing",
  ASSETS_RECEIVED: "Assets Received",
  PROCESSING: "Processing",
  INTERNAL_REVIEW: "Internal Review",
  CLIENT_REVIEW: "Client Review",
  COMPLETED: "Completed",
};

export const FILE_CATEGORIES = [
  "floor_plans",
  "elevations",
  "site_plans",
  "cad",
  "references",
  "documents",
  "models",
  "textures",
  "exports",
  "other",
] as const;

export type FileCategory = (typeof FILE_CATEGORIES)[number];

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  floor_plans: "Floor Plans",
  elevations: "Elevations",
  site_plans: "Site Plans",
  cad: "CAD",
  references: "References",
  documents: "Documents",
  models: "Models",
  textures: "Textures",
  exports: "Exports",
  other: "Other",
};

export const PLAN_CATEGORIES: FileCategory[] = [
  "floor_plans",
  "elevations",
  "site_plans",
  "cad",
  "documents",
];

export const PROCESSING_STAGE_COUNT = 11;

export interface NotificationPrefs {
  production_updates: boolean;
  review_requests: boolean;
  world_ready: boolean;
  newsletter: boolean;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  email: string;
  companyId: string | null;
  notificationPrefs: NotificationPrefs;
  createdAt: Date | null;
}

export interface Company {
  id: string;
  ownerId: string;
  name: string;
  website: string;
  details: string;
  createdAt: Date | null;
}

export interface Project {
  id: string;
  ownerId: string;
  companyId: string | null;
  name: string;
  developer: string;
  location: string;
  type: string;
  developmentStage: string;
  status: ProjectStatus;
  buildings: number;
  floors: number;
  units: number;
  unitTypes: string[];
  interiorStyle: string;
  exteriorStyle: string;
  materials: string;
  landscape: string;
  lighting: string;
  referenceProjects: string;
  visualizationScope: Record<string, unknown>;
  coverPath: string | null;
  submittedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  path: string;
  size: number;
  kind: "plan" | "file";
  category: FileCategory;
  uploadedBy: string | null;
  processingStatus: "pending" | "processing" | "complete" | "failed";
  mimeType: string;
  createdAt: Date | null;
}

export interface Activity {
  id: string;
  projectId: string | null;
  projectName: string;
  message: string;
  eventType: string;
  createdAt: Date | null;
}

export interface ProcessingStage {
  id: string;
  jobId: string;
  stageKey: string;
  label: string;
  sortOrder: number;
  state: "pending" | "active" | "completed" | "failed";
  startedAt: Date | null;
  completedAt: Date | null;
  message: string;
}

export interface ProcessingJob {
  id: string;
  projectId: string;
  status: "queued" | "processing" | "review" | "completed" | "failed";
  currentStageKey: string | null;
  progress: number;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string;
}

export interface World {
  id: string;
  projectId: string;
  status: "processing" | "review" | "ready" | "failed";
  worldUrl: string | null;
  previewPath: string | null;
  shareSlug: string | null;
  embedUrl: string | null;
  glbPath: string | null;
  fbxPath: string | null;
  objPath: string | null;
  sourceAvailable: boolean;
}

export interface AnalyticsRow {
  id: string;
  projectId: string;
  recordedOn: string;
  visits: number;
  uniqueVisitors: number;
  avgSessionSeconds: number;
  areas: Record<string, number>;
  engagement: Record<string, number>;
}

export interface ProjectDraftInput {
  name: string;
  developer: string;
  location: string;
  type: string;
  developmentStage: string;
}

export interface ProjectDraftPatch extends Partial<ProjectDraftInput> {
  buildings?: number;
  floors?: number;
  units?: number;
  unitTypes?: string[];
  interiorStyle?: string;
  exteriorStyle?: string;
  materials?: string;
  landscape?: string;
  lighting?: string;
  referenceProjects?: string;
  visualizationScope?: Record<string, unknown>;
  coverPath?: string | null;
}

type Row = Record<string, unknown>;

const toDate = (value: unknown): Date | null =>
  typeof value === "string" ? new Date(value) : null;

const toNumber = (value: unknown): number => Number(value ?? 0);

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String) : [];

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const mapProfile = (row: Row): UserProfile => {
  const prefs = toRecord(row.notification_prefs);
  return {
    firstName: String(row.first_name ?? ""),
    lastName: String(row.last_name ?? ""),
    companyName: String(row.company_name ?? ""),
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    companyId: typeof row.company_id === "string" ? row.company_id : null,
    notificationPrefs: {
      production_updates: prefs.production_updates !== false,
      review_requests: prefs.review_requests !== false,
      world_ready: prefs.world_ready !== false,
      newsletter: prefs.newsletter === true,
    },
    createdAt: toDate(row.created_at),
  };
};

const mapProject = (row: Row): Project => ({
  id: String(row.id ?? ""),
  ownerId: String(row.owner_id ?? ""),
  companyId: typeof row.company_id === "string" ? row.company_id : null,
  name: String(row.name ?? ""),
  developer: String(row.developer ?? ""),
  location: String(row.location ?? ""),
  type: String(row.type ?? ""),
  developmentStage: String(row.development_stage ?? ""),
  status: (row.status as ProjectStatus) ?? "DRAFT",
  buildings: toNumber(row.buildings),
  floors: toNumber(row.floors),
  units: toNumber(row.units),
  unitTypes: toStringArray(row.unit_types),
  interiorStyle: String(row.interior_style ?? ""),
  exteriorStyle: String(row.exterior_style ?? ""),
  materials: String(row.materials ?? ""),
  landscape: String(row.landscape ?? ""),
  lighting: String(row.lighting ?? ""),
  referenceProjects: String(row.reference_projects ?? ""),
  visualizationScope: toRecord(row.visualization_scope),
  coverPath: typeof row.cover_path === "string" ? row.cover_path : null,
  submittedAt: toDate(row.submitted_at),
  createdAt: toDate(row.created_at),
  updatedAt: toDate(row.updated_at),
});

const mapFile = (row: Row): ProjectFile => ({
  id: String(row.id ?? ""),
  projectId: String(row.project_id ?? ""),
  name: String(row.name ?? ""),
  path: String(row.storage_path ?? ""),
  size: toNumber(row.size_bytes),
  kind: row.kind === "plan" ? "plan" : "file",
  category: (row.category as FileCategory) ?? "documents",
  uploadedBy: typeof row.uploaded_by === "string" ? row.uploaded_by : null,
  processingStatus:
    row.processing_status === "processing" ||
    row.processing_status === "complete" ||
    row.processing_status === "failed"
      ? row.processing_status
      : "pending",
  mimeType: String(row.mime_type ?? ""),
  createdAt: toDate(row.created_at),
});

const mapActivity = (row: Row): Activity => ({
  id: String(row.id ?? ""),
  projectId: typeof row.project_id === "string" ? row.project_id : null,
  projectName: String(row.project_name ?? ""),
  message: String(row.message ?? ""),
  eventType: String(row.event_type ?? "general"),
  createdAt: toDate(row.created_at),
});

const mapStage = (row: Row): ProcessingStage => ({
  id: String(row.id ?? ""),
  jobId: String(row.job_id ?? ""),
  stageKey: String(row.stage_key ?? ""),
  label: String(row.label ?? ""),
  sortOrder: toNumber(row.sort_order),
  state:
    row.state === "active" || row.state === "completed" || row.state === "failed"
      ? row.state
      : "pending",
  startedAt: toDate(row.started_at),
  completedAt: toDate(row.completed_at),
  message: String(row.message ?? ""),
});

const mapJob = (row: Row): ProcessingJob => ({
  id: String(row.id ?? ""),
  projectId: String(row.project_id ?? ""),
  status:
    row.status === "processing" ||
    row.status === "review" ||
    row.status === "completed" ||
    row.status === "failed"
      ? row.status
      : "queued",
  currentStageKey: typeof row.current_stage_key === "string" ? row.current_stage_key : null,
  progress: Math.min(100, Math.max(0, toNumber(row.progress))),
  startedAt: toDate(row.started_at),
  completedAt: toDate(row.completed_at),
  errorMessage: String(row.error_message ?? ""),
});

const mapWorld = (row: Row): World => ({
  id: String(row.id ?? ""),
  projectId: String(row.project_id ?? ""),
  status:
    row.status === "review" || row.status === "ready" || row.status === "failed"
      ? row.status
      : "processing",
  worldUrl: typeof row.world_url === "string" ? row.world_url : null,
  previewPath: typeof row.preview_path === "string" ? row.preview_path : null,
  shareSlug: typeof row.share_slug === "string" ? row.share_slug : null,
  embedUrl: typeof row.embed_url === "string" ? row.embed_url : null,
  glbPath: typeof row.glb_path === "string" ? row.glb_path : null,
  fbxPath: typeof row.fbx_path === "string" ? row.fbx_path : null,
  objPath: typeof row.obj_path === "string" ? row.obj_path : null,
  sourceAvailable: row.source_available === true,
});

const mapAnalytics = (row: Row): AnalyticsRow => ({
  id: String(row.id ?? ""),
  projectId: String(row.project_id ?? ""),
  recordedOn: String(row.recorded_on ?? ""),
  visits: toNumber(row.visits),
  uniqueVisitors: toNumber(row.unique_visitors),
  avgSessionSeconds: toNumber(row.avg_session_seconds),
  areas: toRecord(row.areas) as Record<string, number>,
  engagement: toRecord(row.engagement) as Record<string, number>,
});

const fail = (error: { message?: string } | null): never => {
  throw new Error(error?.message || "Crestion Labs request failed.");
};

export async function fetchProfile(uid: string): Promise<UserProfile | null> {
  const { data, error } = await getSupabaseClient()
    .from("profiles")
    .select("*")
    .eq("id", uid)
    .maybeSingle();
  if (error) fail(error);
  return data ? mapProfile(data) : null;
}

export async function ensureProfile(
  uid: string,
  email: string,
  metadata: Record<string, unknown>,
): Promise<UserProfile> {
  const existing = await fetchProfile(uid);
  if (existing) return existing;

  const payload = {
    id: uid,
    email,
    first_name: String(metadata.first_name ?? ""),
    last_name: String(metadata.last_name ?? ""),
    company_name: String(metadata.company_name ?? ""),
    phone: String(metadata.phone ?? ""),
  };
  const { data, error } = await getSupabaseClient()
    .from("profiles")
    .insert(payload)
    .select("*")
    .single();
  if (error) fail(error);
  return mapProfile(data);
}

export async function saveProfile(
  uid: string,
  fields: Pick<UserProfile, "firstName" | "lastName" | "phone">,
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("profiles")
    .update({
      first_name: fields.firstName,
      last_name: fields.lastName,
      phone: fields.phone,
    })
    .eq("id", uid);
  if (error) fail(error);
}

export async function saveNotificationPrefs(
  uid: string,
  prefs: NotificationPrefs,
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("profiles")
    .update({ notification_prefs: prefs })
    .eq("id", uid);
  if (error) fail(error);
}

export async function fetchCompany(uid: string): Promise<Company | null> {
  const { data, error } = await getSupabaseClient()
    .from("companies")
    .select("*")
    .eq("owner_id", uid)
    .maybeSingle();
  if (error) fail(error);
  if (!data) return null;
  return {
    id: String(data.id),
    ownerId: String(data.owner_id),
    name: String(data.name ?? ""),
    website: String(data.website ?? ""),
    details: String(data.details ?? ""),
    createdAt: toDate(data.created_at),
  };
}

export async function saveCompany(
  uid: string,
  fields: { name: string; website: string; details: string },
): Promise<Company> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("companies")
    .upsert({ owner_id: uid, ...fields }, { onConflict: "owner_id" })
    .select("*")
    .single();
  if (error) fail(error);

  await supabase
    .from("profiles")
    .update({ company_id: data.id, company_name: fields.name })
    .eq("id", uid);

  return {
    id: String(data.id),
    ownerId: String(data.owner_id),
    name: String(data.name ?? ""),
    website: String(data.website ?? ""),
    details: String(data.details ?? ""),
    createdAt: toDate(data.created_at),
  };
}

export async function fetchProjects(uid: string): Promise<Project[]> {
  const { data, error } = await getSupabaseClient()
    .from("projects")
    .select("*")
    .eq("owner_id", uid)
    .order("updated_at", { ascending: false });
  if (error) fail(error);
  return (data ?? []).map(mapProject);
}

export async function fetchProject(id: string): Promise<Project | null> {
  const { data, error } = await getSupabaseClient()
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) fail(error);
  return data ? mapProject(data) : null;
}

export async function fetchProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const { data, error } = await getSupabaseClient()
    .from("project_files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) fail(error);
  return (data ?? []).map(mapFile);
}

export async function fetchActivity(uid: string, limit = 8): Promise<Activity[]> {
  const { data, error } = await getSupabaseClient()
    .from("activity")
    .select("*")
    .eq("owner_id", uid)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) fail(error);
  return (data ?? []).map(mapActivity);
}

export async function fetchProjectActivity(
  projectId: string,
  limit = 8,
): Promise<Activity[]> {
  const { data, error } = await getSupabaseClient()
    .from("activity")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) fail(error);
  return (data ?? []).map(mapActivity);
}

export async function fetchProcessing(
  projectId: string,
): Promise<{ job: ProcessingJob | null; stages: ProcessingStage[] }> {
  const supabase = getSupabaseClient();
  const { data: jobRow, error: jobError } = await supabase
    .from("processing_jobs")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();
  if (jobError) fail(jobError);
  if (!jobRow) return { job: null, stages: [] };

  const { data: stageRows, error: stageError } = await supabase
    .from("processing_stages")
    .select("*")
    .eq("job_id", jobRow.id)
    .order("sort_order", { ascending: true });
  if (stageError) fail(stageError);

  return {
    job: mapJob(jobRow),
    stages: (stageRows ?? []).map(mapStage),
  };
}

export async function fetchWorld(projectId: string): Promise<World | null> {
  const { data, error } = await getSupabaseClient()
    .from("worlds")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) fail(error);
  return data ? mapWorld(data) : null;
}

export async function fetchAnalytics(projectId: string): Promise<AnalyticsRow[]> {
  const { data, error } = await getSupabaseClient()
    .from("project_analytics")
    .select("*")
    .eq("project_id", projectId)
    .order("recorded_on", { ascending: true });
  if (error) fail(error);
  return (data ?? []).map(mapAnalytics);
}

export async function countWorlds(): Promise<number> {
  const { count, error } = await getSupabaseClient()
    .from("worlds")
    .select("id", { count: "exact" })
    .eq("status", "ready")
    .limit(1);
  if (error) fail(error);
  return count ?? 0;
}

export async function countPlanFiles(): Promise<number> {
  const { count, error } = await getSupabaseClient()
    .from("project_files")
    .select("id", { count: "exact" })
    .eq("kind", "plan")
    .limit(1);
  if (error) fail(error);
  return count ?? 0;
}

export async function createDraftProject(
  uid: string,
  companyId: string | null,
  input: ProjectDraftInput,
): Promise<string> {
  const { data, error } = await getSupabaseClient()
    .from("projects")
    .insert({
      owner_id: uid,
      company_id: companyId,
      name: input.name.trim(),
      developer: input.developer.trim(),
      location: input.location.trim(),
      type: input.type,
      development_stage: input.developmentStage,
      status: "DRAFT",
    })
    .select("id")
    .single();
  if (error) fail(error);
  if (!data) throw new Error("The project could not be created.");
  return String(data.id);
}

export async function updateDraftProject(
  id: string,
  patch: ProjectDraftPatch,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name.trim();
  if (patch.developer !== undefined) payload.developer = patch.developer.trim();
  if (patch.location !== undefined) payload.location = patch.location.trim();
  if (patch.type !== undefined) payload.type = patch.type;
  if (patch.developmentStage !== undefined) payload.development_stage = patch.developmentStage;
  if (patch.buildings !== undefined) payload.buildings = patch.buildings;
  if (patch.floors !== undefined) payload.floors = patch.floors;
  if (patch.units !== undefined) payload.units = patch.units;
  if (patch.unitTypes !== undefined) payload.unit_types = patch.unitTypes;
  if (patch.interiorStyle !== undefined) payload.interior_style = patch.interiorStyle;
  if (patch.exteriorStyle !== undefined) payload.exterior_style = patch.exteriorStyle;
  if (patch.materials !== undefined) payload.materials = patch.materials;
  if (patch.landscape !== undefined) payload.landscape = patch.landscape;
  if (patch.lighting !== undefined) payload.lighting = patch.lighting;
  if (patch.referenceProjects !== undefined) payload.reference_projects = patch.referenceProjects;
  if (patch.visualizationScope !== undefined) payload.visualization_scope = patch.visualizationScope;
  if (patch.coverPath !== undefined) payload.cover_path = patch.coverPath;
  if (Object.keys(payload).length === 0) return;

  const { error } = await getSupabaseClient().from("projects").update(payload).eq("id", id);
  if (error) fail(error);
}

export async function submitProject(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("projects")
    .update({ status: "SUBMITTED" })
    .eq("id", id);
  if (error) fail(error);
}

export async function uploadProjectFile(
  uid: string,
  project: Project,
  file: File,
  category: FileCategory,
): Promise<ProjectFile> {
  const supabase = getSupabaseClient();
  const uploaded = await uploadProjectObject(project.id, category, file);
  const kind = PLAN_CATEGORIES.includes(category) ? "plan" : "file";
  const { data, error } = await supabase
    .from("project_files")
    .insert({
      project_id: project.id,
      name: file.name,
      storage_path: uploaded.path,
      size_bytes: file.size,
      kind,
      category,
      uploaded_by: uid,
      mime_type: file.type,
    })
    .select("*")
    .single();
  if (error) {
    await deleteProjectObject(uploaded.path).catch(() => {});
    fail(error);
  }

  await logActivity(
    uid,
    project.id,
    project.name,
    `${FILE_CATEGORY_LABELS[category]} file “${file.name}” uploaded`,
    "file_uploaded",
  );

  return mapFile(data);
}

export async function deleteProjectFile(
  uid: string,
  project: Project,
  file: ProjectFile,
): Promise<void> {
  const supabase = getSupabaseClient();
  await deleteProjectObject(file.path).catch(() => {});
  const { error } = await supabase.from("project_files").delete().eq("id", file.id);
  if (error) fail(error);

  if (project.coverPath === file.path && project.status === "DRAFT") {
    await supabase.from("projects").update({ cover_path: null }).eq("id", project.id);
  }

  await logActivity(
    uid,
    project.id,
    project.name,
    `“${file.name}” removed`,
    "file_removed",
  );
}

export async function setProjectCover(id: string, path: string | null): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("projects")
    .update({ cover_path: path })
    .eq("id", id);
  if (error) fail(error);
}

export async function logActivity(
  ownerId: string,
  projectId: string,
  projectName: string,
  message: string,
  eventType = "general",
): Promise<void> {
  await getSupabaseClient().from("activity").insert({
    owner_id: ownerId,
    project_id: projectId,
    project_name: projectName,
    message,
    event_type: eventType,
    actor_id: ownerId,
  });
}

export async function getSignedUrls(paths: string[]): Promise<Record<string, string>> {
  return createFileSignedUrls(paths);
}

export interface DashboardData {
  projects: Project[];
  activity: Activity[];
  worlds: number;
  plans: number;
  newProjectsThisMonth: number;
  processingCount: number;
  activeProject: Project | null;
  activeJob: ProcessingJob | null;
  activeStages: ProcessingStage[];
}

export async function fetchDashboard(uid: string): Promise<DashboardData> {
  const [projects, activity, worlds, plans] = await Promise.all([
    fetchProjects(uid),
    fetchActivity(uid, 8),
    countWorlds(),
    countPlanFiles(),
  ]);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const activeStatuses: ProjectStatus[] = [
    "PROCESSING",
    "INTERNAL_REVIEW",
    "CLIENT_REVIEW",
    "REVIEWING",
    "ASSETS_RECEIVED",
    "SUBMITTED",
  ];
  const activeProject =
    projects.find((project) => activeStatuses.includes(project.status)) ??
    projects.find((project) => project.status !== "COMPLETED") ??
    projects[0] ??
    null;

  let activeJob: ProcessingJob | null = null;
  let activeStages: ProcessingStage[] = [];
  if (activeProject) {
    try {
      const processing = await fetchProcessing(activeProject.id);
      activeJob = processing.job;
      activeStages = processing.stages;
    } catch {
      activeJob = null;
      activeStages = [];
    }
  }

  return {
    projects,
    activity,
    worlds,
    plans,
    newProjectsThisMonth: projects.filter(
      (project) => project.createdAt && project.createdAt >= monthStart,
    ).length,
    processingCount: projects.filter((project) =>
      ["PROCESSING", "INTERNAL_REVIEW", "CLIENT_REVIEW"].includes(project.status),
    ).length,
    activeProject,
    activeJob,
    activeStages,
  };
}

import { SUPABASE_URL } from "@/lib/supabaseConfig";

type Row = Record<string, unknown>;

export type PayloadResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; message: string; status: number };

const numericOrNull = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

// Without both spans the engine has to estimate real-world size from room areas.
const isMeasured = (value: number | null): value is number =>
  value !== null && value >= 2 && value <= 100;

const PLAN_EXTENSIONS = [".png", ".jpg", ".jpeg", ".pdf"];
const MAX_PLAN_BYTES = 15 * 1024 * 1024;

const isReadablePlan = (file: Row): boolean => {
  const name = String(file.name ?? "").toLowerCase();
  const size = Number(file.size_bytes ?? 0);
  return (
    file.kind === "plan" &&
    PLAN_EXTENSIONS.some((extension) => name.endsWith(extension)) &&
    size > 0 &&
    size <= MAX_PLAN_BYTES
  );
};

const rest = (table: string, filter: string) =>
  `${SUPABASE_URL}/rest/v1/${table}?${filter}&select=*`;

/**
 * Assembles the exact body the reconstruction engine expects for one project.
 * Both legs of the bridge use it: the submit route pushes it straight away, and
 * the queue route hands it to a studio machine that could not be reached at
 * submission time. `headers` is either the owner's session or the service role.
 */
export async function buildProductionPayload(
  project: Row,
  headers: Record<string, string>,
): Promise<PayloadResult> {
  const projectId = String(project.id ?? "");
  const jsonHeaders = { ...headers, "Content-Type": "application/json" };

  const planWidthMeters = numericOrNull(project.plan_width_meters);
  const planLengthMeters = numericOrNull(project.plan_length_meters);
  if (!isMeasured(planWidthMeters) || !isMeasured(planLengthMeters)) {
    return {
      ok: false,
      status: 422,
      message:
        "Enter the floor plan's overall width and length in metres (2 to 100) so the world is built at true scale.",
    };
  }

  const [profileResponse, filesResponse] = await Promise.all([
    fetch(rest("profiles", `id=eq.${encodeURIComponent(String(project.owner_id ?? ""))}`), {
      headers,
    }),
    fetch(rest("project_files", `project_id=eq.${encodeURIComponent(projectId)}`), { headers }),
  ]);
  const profile = ((await profileResponse.json().catch(() => [])) as Row[])[0] ?? {};
  const files = (await filesResponse.json()) as Row[];

  if (!Array.isArray(files) || files.length === 0) {
    return { ok: false, status: 422, message: "Upload at least one project file before submitting." };
  }
  if (!files.some((file) => file.kind === "plan")) {
    return { ok: false, status: 422, message: "Upload at least one architectural plan before submitting." };
  }
  if (!files.some(isReadablePlan)) {
    return {
      ok: false,
      status: 422,
      message:
        "Plans are read from PNG, JPG or PDF files up to 15 MB. CAD and Revit exports are not readable yet, so re-upload the floor plan as an image or PDF.",
    };
  }

  const companyId = typeof project.company_id === "string" ? project.company_id : null;
  let company: Row | null = null;
  if (companyId) {
    const companyResponse = await fetch(
      rest("companies", `id=eq.${encodeURIComponent(companyId)}`),
      { headers },
    );
    company = ((await companyResponse.json().catch(() => [])) as Row[])[0] ?? null;
  }

  const packagedFiles: Array<Record<string, unknown>> = [];
  for (const file of files) {
    const path = typeof file.storage_path === "string" ? file.storage_path : "";
    if (!path) continue;
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const signResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/sign/project-files/${encodedPath}`,
      {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ expiresIn: 3600 }),
      },
    );
    if (!signResponse.ok) {
      return {
        ok: false,
        status: 502,
        message: "Project files could not be packaged. Check the storage policy and try again.",
      };
    }
    const signed = (await signResponse.json()) as { signedURL?: string };
    if (!signed.signedURL) {
      return { ok: false, status: 502, message: "Project files could not be packaged." };
    }
    packagedFiles.push({
      name: file.name,
      category: file.category,
      kind: file.kind,
      mimeType: file.mime_type,
      sizeBytes: file.size_bytes,
      signedUrl: `${SUPABASE_URL}/storage/v1${signed.signedURL}`,
      expiresIn: 3600,
    });
  }

  return {
    ok: true,
    payload: {
      version: 1,
      requestId: projectId,
      submittedAt: new Date().toISOString(),
      portal: "crestionlabs",
      client: {
        id: String(project.owner_id ?? ""),
        email: profile.email ?? "",
        firstName: profile.first_name ?? "",
        lastName: profile.last_name ?? "",
        phone: profile.phone ?? "",
      },
      company: company
        ? {
            id: company.id,
            name: company.name,
            website: company.website,
            details: company.details,
          }
        : null,
      project: {
        id: projectId,
        name: project.name,
        developer: project.developer,
        location: project.location,
        type: project.type,
        developmentStage: project.development_stage,
        buildings: project.buildings,
        floors: project.floors,
        units: project.units,
        unitTypes: project.unit_types,
        interiorStyle: project.interior_style,
        exteriorStyle: project.exterior_style,
        planWidthMeters,
        planLengthMeters,
        furnishingStyle: String(project.furnishing_style ?? "modern"),
        materials: project.materials,
        landscape: project.landscape,
        lighting: project.lighting,
        referenceProjects: project.reference_projects,
        visualizationScope: project.visualization_scope,
        createdAt: project.created_at,
      },
      files: packagedFiles,
    },
  };
}

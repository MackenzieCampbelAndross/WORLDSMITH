import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabaseConfig";

type Row = Record<string, unknown>;

const TIMEOUT_MS = 15_000;

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

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });

export async function POST(request: Request) {
  const supabaseUrl = SUPABASE_URL;
  const publishableKey = SUPABASE_PUBLISHABLE_KEY;

  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) {
    return json({ message: "Sign in again to submit this project." }, 401);
  }

  let projectId = "";
  try {
    const body = (await request.json()) as { projectId?: unknown };
    projectId = typeof body.projectId === "string" ? body.projectId : "";
  } catch {
    return json({ message: "Invalid submission request." }, 400);
  }
  if (!projectId) {
    return json({ message: "Invalid submission request." }, 400);
  }

  const authHeaders = {
    apikey: publishableKey,
    Authorization: `Bearer ${token}`,
  };
  const jsonHeaders = { ...authHeaders, "Content-Type": "application/json" };

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: authHeaders });
  if (!userResponse.ok) {
    return json({ message: "Your session has expired. Sign in again to submit." }, 401);
  }
  const user = (await userResponse.json()) as { id?: string; email?: string };
  if (!user.id) {
    return json({ message: "Your session has expired. Sign in again to submit." }, 401);
  }

  const projectResponse = await fetch(
    `${supabaseUrl}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}&select=*`,
    { headers: authHeaders },
  );
  if (!projectResponse.ok) {
    return json({ message: "This project could not be opened." }, 502);
  }
  const projects = (await projectResponse.json()) as Row[];
  const project = projects[0];
  if (!project || project.owner_id !== user.id) {
    return json({ message: "You don't have access to this project." }, 404);
  }
  if (project.status !== "DRAFT") {
    return json({ message: "This project has already been submitted." }, 409);
  }

  const planWidthMeters = numericOrNull(project.plan_width_meters);
  const planLengthMeters = numericOrNull(project.plan_length_meters);
  if (!isMeasured(planWidthMeters) || !isMeasured(planLengthMeters)) {
    return json(
      {
        message:
          "Enter the floor plan's overall width and length in metres (2 to 100) so the world is built at true scale.",
      },
      422,
    );
  }

  const [profileResponse, filesResponse] = await Promise.all([
    fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=*`,
      { headers: authHeaders },
    ),
    fetch(
      `${supabaseUrl}/rest/v1/project_files?project_id=eq.${encodeURIComponent(projectId)}&select=*`,
      { headers: authHeaders },
    ),
  ]);
  const profile = ((await profileResponse.json()) as Row[])[0] ?? {};
  const files = (await filesResponse.json()) as Row[];
  if (!Array.isArray(files) || files.length === 0) {
    return json({ message: "Upload at least one project file before submitting." }, 422);
  }
  if (!files.some((file) => file.kind === "plan")) {
    return json({ message: "Upload at least one architectural plan before submitting." }, 422);
  }
  if (!files.some(isReadablePlan)) {
    return json(
      {
        message:
          "Plans are read from PNG, JPG or PDF files up to 15 MB. CAD and Revit exports are not readable yet, so re-upload the floor plan as an image or PDF.",
      },
      422,
    );
  }

  const companyId = typeof project.company_id === "string" ? project.company_id : null;
  let company: Row | null = null;
  if (companyId) {
    const companyResponse = await fetch(
      `${supabaseUrl}/rest/v1/companies?id=eq.${encodeURIComponent(companyId)}&select=*`,
      { headers: authHeaders },
    );
    company = ((await companyResponse.json()) as Row[])[0] ?? null;
  }

  const packagedFiles: Array<Record<string, unknown>> = [];
  for (const file of files) {
    const path = typeof file.storage_path === "string" ? file.storage_path : "";
    if (!path) continue;
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const signResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/sign/project-files/${encodedPath}`,
      {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ expiresIn: 3600 }),
      },
    );
    if (!signResponse.ok) {
      return json(
        { message: "Project files could not be packaged. Check the storage policy and try again." },
        502,
      );
    }
    const signed = (await signResponse.json()) as { signedURL?: string };
    if (!signed.signedURL) {
      return json({ message: "Project files could not be packaged." }, 502);
    }
    packagedFiles.push({
      name: file.name,
      category: file.category,
      kind: file.kind,
      mimeType: file.mime_type,
      sizeBytes: file.size_bytes,
      signedUrl: `${supabaseUrl}/storage/v1${signed.signedURL}`,
      expiresIn: 3600,
    });
  }

  const backendUrl = process.env.PRODUCTION_BACKEND_URL;
  const backendSecret = process.env.PRODUCTION_BACKEND_SECRET;
  if (!backendUrl || !backendSecret) {
    return json({ message: "Production intake isn't connected yet." }, 503);
  }

  const payload = {
    version: 1,
    requestId: project.id,
    submittedAt: new Date().toISOString(),
    portal: "crestionlabs",
    client: {
      id: user.id,
      email: user.email ?? profile.email ?? "",
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
      id: project.id,
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
  };

  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", backendSecret).update(body).digest("hex");

  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Crestion-Signature": `sha256=${signature}`,
        "Idempotency-Key": projectId,
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return json({ message: "The production backend is unavailable. Try again shortly." }, 502);
  }
  if (!backendResponse.ok) {
    return json({ message: "The production backend rejected this request. Try again." }, 502);
  }

  const updateResponse = await fetch(
    `${supabaseUrl}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}`,
    {
      method: "PATCH",
      headers: { ...jsonHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({ status: "SUBMITTED" }),
    },
  );
  if (!updateResponse.ok) {
    return json({ message: "The request was received but the project could not be updated." }, 502);
  }

  await fetch(`${supabaseUrl}/rest/v1/activity`, {
    method: "POST",
    headers: { ...jsonHeaders, Prefer: "return=minimal" },
    body: JSON.stringify({
      owner_id: user.id,
      project_id: projectId,
      project_name: project.name ?? "",
      message: "Project submitted for production",
      event_type: "project_submitted",
      actor_id: user.id,
    }),
  }).catch(() => undefined);

  return json({ ok: true });
}

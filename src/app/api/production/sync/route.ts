import { NextResponse } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabaseConfig";

type Row = Record<string, unknown>;

const TIMEOUT_MS = 20_000;
const ASSET_TIMEOUT_MS = 60_000;
const BUCKET = "project-files";

const STAGE_TO_STATUS: Record<string, string> = {
  queued: "REVIEWING",
  parsing_floor_plan: "REVIEWING",
  detecting_rooms_openings: "ASSETS_RECEIVED",
  validating_room_layout: "ASSETS_RECEIVED",
  awaiting_room_types: "ASSETS_RECEIVED",
  optimizing_openings: "PROCESSING",
  generating_geometry: "PROCESSING",
  placing_furniture: "PROCESSING",
  generating_lighting_materials: "PROCESSING",
  validating_navigation_collisions: "INTERNAL_REVIEW",
  loading_walkthrough: "INTERNAL_REVIEW",
  completed: "CLIENT_REVIEW",
};

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

const engineBase = (): string | null => {
  const url = process.env.PRODUCTION_BACKEND_URL?.trim();
  if (!url) return null;
  return url.replace(/\/intake\/requests\/?$/, "").replace(/\/$/, "");
};

export async function POST(request: Request) {
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) {
    return json({ message: "Sign in to check this project." }, 401);
  }

  let projectId = "";
  try {
    const body = (await request.json()) as { projectId?: unknown };
    projectId = typeof body.projectId === "string" ? body.projectId : "";
  } catch {
    return json({ message: "Invalid sync request." }, 400);
  }
  if (!projectId) {
    return json({ message: "Invalid sync request." }, 400);
  }

  const base = engineBase();
  if (!base) {
    return json({ message: "Production updates aren't connected yet." }, 503);
  }

  const authHeaders = { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` };
  const jsonHeaders = { ...authHeaders, "Content-Type": "application/json" };

  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: authHeaders });
  if (!userResponse.ok) {
    return json({ message: "Your session has expired. Sign in again." }, 401);
  }
  const user = (await userResponse.json()) as { id?: string };
  if (!user.id) {
    return json({ message: "Your session has expired. Sign in again." }, 401);
  }

  const projectResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}&select=id,name,status,owner_id`,
    { headers: authHeaders },
  );
  const project = ((await projectResponse.json()) as Row[])[0];
  if (!project || project.owner_id !== user.id) {
    return json({ message: "You don't have access to this project." }, 404);
  }

  const intakeResponse = await fetch(
    `${base}/intake/requests?project_id=${encodeURIComponent(projectId)}`,
    { signal: AbortSignal.timeout(TIMEOUT_MS) },
  );
  if (!intakeResponse.ok) {
    return json({ message: "Production status is unreachable right now." }, 502);
  }
  const intake = (await intakeResponse.json()) as { requests?: Row[] };
  const productionRequest = intake.requests?.[0];
  if (!productionRequest) {
    return json({ ok: true, synced: false, status: project.status, detail: "Not received yet" });
  }

  const build = (productionRequest.build ?? null) as Row | null;
  const jobId = typeof build?.job_id === "string" ? build.job_id : null;

  let nextStatus = "REVIEWING";
  let stageLabel = "Crestion has your plan and hasn't started building yet.";
  let job: Row | null = null;

  if (jobId) {
    const jobResponse = await fetch(`${base}/reconstructions/${encodeURIComponent(jobId)}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!jobResponse.ok) {
      return json({ message: "Production status is unreachable right now." }, 502);
    }
    job = (await jobResponse.json()) as Row;
    const engineStatus = String(job.status ?? "");
    nextStatus = STAGE_TO_STATUS[engineStatus] ?? "REVIEWING";
    stageLabel = String(job.stage_label ?? engineStatus);
  }

  let delivered = false;
  let deliveryError: string | null = null;

  if (job && job.status === "completed" && jobId) {
    const glbResponse = await fetch(
      `${base}/reconstructions/${encodeURIComponent(jobId)}/assets/scene.glb`,
      { signal: AbortSignal.timeout(ASSET_TIMEOUT_MS) },
    );
    const collisionResponse = await fetch(
      `${base}/reconstructions/${encodeURIComponent(jobId)}/assets/collision.json`,
      { signal: AbortSignal.timeout(ASSET_TIMEOUT_MS) },
    );

    if (glbResponse.ok) {
      const glb = await glbResponse.arrayBuffer();
      const stored = await storeObject(authHeaders, `${projectId}/world/scene.glb`, glb, "model/gltf-binary");
      let collisionPath: string | null = null;
      if (collisionResponse.ok) {
        const collision = await collisionResponse.arrayBuffer();
        collisionPath = `${projectId}/world/collision.json`;
        await storeObject(authHeaders, collisionPath, collision, "application/json");
      }
      if (stored) {
        const worldResponse = await fetch(`${SUPABASE_URL}/rest/v1/worlds`, {
          method: "POST",
          headers: { ...jsonHeaders, Prefer: "return=minimal,resolution=merge-duplicates" },
          body: JSON.stringify([
            {
              project_id: projectId,
              status: "ready",
              glb_path: `${projectId}/world/scene.glb`,
              preview_path: null,
              source_available: true,
              updated_at: new Date().toISOString(),
            },
          ]),
        });
        delivered = worldResponse.ok;
        if (!worldResponse.ok) {
          deliveryError = await worldResponse.text().catch(() => "world row rejected");
        }
        if (delivered && collisionPath) {
          await fetch(`${SUPABASE_URL}/rest/v1/project_files`, {
            method: "POST",
            headers: { ...jsonHeaders, Prefer: "return=minimal,resolution=ignore-duplicates" },
            body: JSON.stringify([
              {
                project_id: projectId,
                name: "scene.glb",
                storage_path: `${projectId}/world/scene.glb`,
                size_bytes: glb.byteLength,
                kind: "file",
                category: "models",
                mime_type: "model/gltf-binary",
                uploaded_by: user.id,
              },
            ]),
          }).catch(() => undefined);
        }
      } else {
        deliveryError = "The finished world could not be stored.";
      }
    } else {
      deliveryError = "The finished world could not be downloaded from production.";
    }

    if (delivered) nextStatus = "COMPLETED";
  }

  if (job && job.status === "failed") {
    deliveryError = typeof job.error === "string" ? job.error : "Production could not finish.";
    await fetch(`${SUPABASE_URL}/rest/v1/worlds`, {
      method: "POST",
      headers: { ...jsonHeaders, Prefer: "return=minimal,resolution=merge-duplicates" },
      body: JSON.stringify([
        {
          project_id: projectId,
          status: "failed",
          updated_at: new Date().toISOString(),
        },
      ]),
    }).catch(() => undefined);
  }

  const changed = String(project.status) !== nextStatus;
  if (changed) {
    const updateResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}`,
      {
        method: "PATCH",
        headers: { ...jsonHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({ status: nextStatus, updated_at: new Date().toISOString() }),
      },
    );
    if (!updateResponse.ok) {
      return json({ message: "Status could not be recorded.", detail: await updateResponse.text() }, 502);
    }
    await fetch(`${SUPABASE_URL}/rest/v1/activity`, {
      method: "POST",
      headers: { ...jsonHeaders, Prefer: "return=minimal" },
      body: JSON.stringify([
        {
          owner_id: user.id,
          project_id: projectId,
          project_name: project.name ?? "",
          message: delivered
            ? "Your world is ready to enter."
            : `Production update: ${stageLabel}`,
          event_type: delivered ? "world_ready" : "production_update",
          actor_id: user.id,
        },
      ]),
    }).catch(() => undefined);
  }

  return json({
    ok: true,
    synced: true,
    status: nextStatus,
    stage: stageLabel,
    progress: job?.progress ?? null,
    delivered,
    error: deliveryError,
  });
}

async function storeObject(
  authHeaders: Record<string, string>,
  path: string,
  data: ArrayBuffer,
  contentType: string,
): Promise<boolean> {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": contentType, "x-upsert": "true" },
    body: data,
    signal: AbortSignal.timeout(ASSET_TIMEOUT_MS),
  });
  if (!response.ok) {
    console.error("[delivery] storage put failed", path, response.status, await response.text().catch(() => ""));
  }
  return response.ok;
}

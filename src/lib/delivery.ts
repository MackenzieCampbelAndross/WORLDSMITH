import { SUPABASE_URL } from "@/lib/supabaseConfig";

const BUCKET = "project-files";
const ASSET_TIMEOUT_MS = 60_000;

export const STAGE_TO_STATUS: Record<string, string> = {
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

export interface DeliveryResult {
  delivered: boolean;
  error: string | null;
  glbPath: string | null;
}

type Headers = Record<string, string>;

async function storeObject(
  headers: Headers,
  path: string,
  data: ArrayBuffer,
  contentType: string,
): Promise<boolean> {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": contentType, "x-upsert": "true" },
    body: data,
    signal: AbortSignal.timeout(ASSET_TIMEOUT_MS),
  });
  if (!response.ok) {
    console.error("[delivery] storage put failed", path, response.status, await response.text().catch(() => ""));
  }
  return response.ok;
}

// Copies the finished scene into the project's own storage and records it, so the
// client keeps the world even if the engine is later unreachable.
export async function deliverWorld(
  options: {
    projectId: string;
    jobId: string;
    ownerId: string;
    engineBase: string;
    authHeaders: Headers;
  },
): Promise<DeliveryResult> {
  const { projectId, jobId, ownerId, engineBase, authHeaders } = options;
  const jsonHeaders = { ...authHeaders, "Content-Type": "application/json" };

  const glbResponse = await fetch(
    `${engineBase}/reconstructions/${encodeURIComponent(jobId)}/assets/scene.glb`,
    { signal: AbortSignal.timeout(ASSET_TIMEOUT_MS) },
  );
  if (!glbResponse.ok) {
    return { delivered: false, error: "The finished world could not be downloaded from production.", glbPath: null };
  }
  const glb = await glbResponse.arrayBuffer();

  const collisionResponse = await fetch(
    `${engineBase}/reconstructions/${encodeURIComponent(jobId)}/assets/collision.json`,
    { signal: AbortSignal.timeout(ASSET_TIMEOUT_MS) },
  );
  const collision = collisionResponse.ok ? await collisionResponse.arrayBuffer() : null;

  const glbPath = `${projectId}/world/scene.glb`;
  if (!(await storeObject(authHeaders, glbPath, glb, "model/gltf-binary"))) {
    return { delivered: false, error: "The finished world could not be stored.", glbPath: null };
  }
  if (collision) {
    await storeObject(authHeaders, `${projectId}/world/collision.json`, collision, "application/json");
  }

  const worldResponse = await fetch(`${SUPABASE_URL}/rest/v1/worlds`, {
    method: "POST",
    headers: { ...jsonHeaders, Prefer: "return=minimal,resolution=merge-duplicates" },
    body: JSON.stringify([
      {
        project_id: projectId,
        status: "ready",
        glb_path: glbPath,
        preview_path: null,
        source_available: true,
        updated_at: new Date().toISOString(),
      },
    ]),
  });
  if (!worldResponse.ok) {
    return { delivered: false, error: await worldResponse.text().catch(() => "world row rejected"), glbPath };
  }

  if (collision) {
    await fetch(`${SUPABASE_URL}/rest/v1/project_files`, {
      method: "POST",
      headers: { ...jsonHeaders, Prefer: "return=minimal,resolution=ignore-duplicates" },
      body: JSON.stringify([
        {
          project_id: projectId,
          name: "scene.glb",
          storage_path: glbPath,
          size_bytes: glb.byteLength,
          kind: "file",
          category: "models",
          mime_type: "model/gltf-binary",
          uploaded_by: ownerId,
        },
      ]),
    }).catch(() => undefined);
  }

  return { delivered: true, error: null, glbPath };
}

export async function recordActivity(
  authHeaders: Headers,
  input: { ownerId: string; projectId: string; projectName: string; message: string; eventType: string },
): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/activity`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify([
      {
        owner_id: input.ownerId,
        project_id: input.projectId,
        project_name: input.projectName,
        message: input.message,
        event_type: input.eventType,
        actor_id: input.ownerId,
      },
    ]),
  }).catch(() => undefined);
}

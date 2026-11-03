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
  shareUrl: string | null;
  embedUrl: string | null;
}

type Headers = Record<string, string>;

// Absolute base used to build the share and embed links handed to clients.
export function siteBase(request: Request): string {
  const configured = process.env.SITE_URL?.trim();
  const base = configured || new URL(request.url).origin;
  return base.replace(/\/$/, "");
}

// The slug is the only thing guarding a shared walkthrough, so it has to be
// unguessable and stable: re-delivering a project keeps the link the client
// already handed to their buyers.
async function shareSlug(
  projectId: string,
  authHeaders: Headers,
): Promise<string> {
  const existing = await fetch(
    `${SUPABASE_URL}/rest/v1/worlds?project_id=eq.${encodeURIComponent(projectId)}&select=share_slug&limit=1`,
    { headers: { ...authHeaders, "Content-Type": "application/json" } },
  )
    .then((response) => response.json())
    .catch(() => []);
  const held = (Array.isArray(existing) ? existing[0] : undefined)?.share_slug;
  if (typeof held === "string" && held.length >= 8) return held;
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

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
    siteBase: string;
    authHeaders: Headers;
  },
): Promise<DeliveryResult> {
  const { projectId, jobId, ownerId, engineBase, siteBase, authHeaders } = options;
  const jsonHeaders = { ...authHeaders, "Content-Type": "application/json" };
  const none: DeliveryResult = { delivered: false, error: null, glbPath: null, shareUrl: null, embedUrl: null };

  const glbResponse = await fetch(
    `${engineBase}/reconstructions/${encodeURIComponent(jobId)}/assets/scene.glb`,
    { signal: AbortSignal.timeout(ASSET_TIMEOUT_MS) },
  );
  if (!glbResponse.ok) {
    return { ...none, error: "The finished world could not be downloaded from production." };
  }
  const glb = await glbResponse.arrayBuffer();

  const collisionResponse = await fetch(
    `${engineBase}/reconstructions/${encodeURIComponent(jobId)}/assets/collision.json`,
    { signal: AbortSignal.timeout(ASSET_TIMEOUT_MS) },
  );
  const collision = collisionResponse.ok ? await collisionResponse.arrayBuffer() : null;

  const glbPath = `${projectId}/world/scene.glb`;
  if (!(await storeObject(authHeaders, glbPath, glb, "model/gltf-binary"))) {
    return { ...none, error: "The finished world could not be stored." };
  }
  if (collision) {
    await storeObject(authHeaders, `${projectId}/world/collision.json`, collision, "application/json");
  }

  const slug = await shareSlug(projectId, authHeaders);
  const shareUrl = `${siteBase}/share/${slug}`;
  const embedUrl = `${siteBase}/embed/${slug}`;

  const worldResponse = await fetch(`${SUPABASE_URL}/rest/v1/worlds`, {
    method: "POST",
    headers: { ...jsonHeaders, Prefer: "return=minimal,resolution=merge-duplicates" },
    body: JSON.stringify([
      {
        project_id: projectId,
        status: "ready",
        glb_path: glbPath,
        preview_path: null,
        share_slug: slug,
        world_url: shareUrl,
        embed_url: embedUrl,
        source_available: true,
        updated_at: new Date().toISOString(),
      },
    ]),
  });
  if (!worldResponse.ok) {
    return {
      ...none,
      error: await worldResponse.text().catch(() => "world row rejected"),
      glbPath,
      shareUrl,
      embedUrl,
    };
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

  return { delivered: true, error: null, glbPath, shareUrl, embedUrl };
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

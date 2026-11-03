import { NextResponse } from "next/server";
import { SUPABASE_URL } from "@/lib/supabaseConfig";

type Row = Record<string, unknown>;

const TIMEOUT_MS = 15_000;

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

// Public read for a shared or embedded walkthrough. The slug is the capability:
// it is random, only handed out at delivery, and resolves exactly one world.
export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    return json({ message: "Shared walkthroughs aren't available yet." }, 503);
  }
  if (!/^[a-z0-9-]{8,64}$/.test(slug ?? "")) {
    return json({ message: "That link isn't valid." }, 404);
  }

  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

  const worldResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/worlds?share_slug=eq.${encodeURIComponent(slug)}&select=project_id,glb_path,status,updated_at&limit=1`,
    { headers, signal: AbortSignal.timeout(TIMEOUT_MS) },
  );
  const world = ((await worldResponse.json()) as Row[])[0];
  if (!world || world.status !== "ready" || typeof world.glb_path !== "string") {
    return json({ message: "That walkthrough isn't available." }, 404);
  }

  const projectResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/projects?id=eq.${encodeURIComponent(String(world.project_id))}&select=id,name,type,location,developer`,
    { headers, signal: AbortSignal.timeout(TIMEOUT_MS) },
  );
  const project = ((await projectResponse.json()) as Row[])[0];
  if (!project) {
    return json({ message: "That walkthrough isn't available." }, 404);
  }

  const signed = await signPaths(headers, [
    world.glb_path,
    world.glb_path.replace(/scene\.glb$/, "collision.json"),
  ]);
  if (!signed) {
    return json({ message: "That walkthrough could not be opened." }, 502);
  }

  return json({
    project: {
      id: project.id,
      name: project.name ?? "Walkthrough",
      type: project.type ?? "",
      location: project.location ?? "",
      developer: project.developer ?? "",
    },
    glbUrl: signed[0],
    collisionUrl: signed[1],
    expiresIn: 3600,
  });
}

async function signPaths(headers: Record<string, string>, paths: string[]): Promise<string[] | null> {
  const out: string[] = [];
  for (const path of paths) {
    const encoded = path.split("/").map(encodeURIComponent).join("/");
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/project-files/${encoded}`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: 3600 }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      if (path.endsWith("collision.json")) {
        out.push("");
        continue;
      }
      return null;
    }
    const body = (await response.json()) as { signedURL?: string };
    if (!body.signedURL) return null;
    out.push(`${SUPABASE_URL}/storage/v1${body.signedURL}`);
  }
  return out;
}

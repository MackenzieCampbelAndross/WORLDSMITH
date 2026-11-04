import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabaseConfig";
import { buildProductionPayload } from "@/lib/productionPayload";

type Row = Record<string, unknown>;

const TIMEOUT_MS = 15_000;

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

  const backendUrl = process.env.PRODUCTION_BACKEND_URL;
  const backendSecret = process.env.PRODUCTION_BACKEND_SECRET;
  if (!backendUrl || !backendSecret) {
    return json({ message: "Production intake isn't connected yet." }, 503);
  }

  const built = await buildProductionPayload(project, authHeaders);
  if (!built.ok) {
    return json({ message: built.message }, built.status);
  }

  const body = JSON.stringify(built.payload);
  const signature = createHmac("sha256", backendSecret).update(body).digest("hex");

  // A studio machine sitting behind NAT or switched off cannot be reached from
  // a deployed portal. The submission is still accepted and left in the queue
  // for the studio to pull, so the client is never blocked by production being
  // offline.
  let pushed = false;
  try {
    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Crestion-Signature": `sha256=${signature}`,
        "Idempotency-Key": projectId,
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    pushed = backendResponse.ok;
  } catch {
    pushed = false;
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
      message: pushed
        ? "Project submitted for production"
        : "Project submitted. It is queued and will reach production when the studio pulls it.",
      event_type: "project_submitted",
      actor_id: user.id,
    }),
  }).catch(() => undefined);

  return json({ ok: true, pushed });
}

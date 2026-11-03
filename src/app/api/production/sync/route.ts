import { NextResponse } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabaseConfig";
import { STAGE_TO_STATUS, deliverWorld, recordActivity } from "@/lib/delivery";

type Row = Record<string, unknown>;

const TIMEOUT_MS = 20_000;

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export function engineBase(): string | null {
  const url = process.env.PRODUCTION_BACKEND_URL?.trim();
  if (!url) return null;
  return url.replace(/\/intake\/requests\/?$/, "").replace(/\/$/, "");
}

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
    return json({ ok: true, synced: false, status: project.status, stage: null });
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

  if (jobId && job?.status === "completed") {
    const delivery = await deliverWorld({ projectId, jobId, ownerId: user.id, engineBase: base, authHeaders });
    delivered = delivery.delivered;
    deliveryError = delivery.error;
    if (delivered) nextStatus = "COMPLETED";
  }

  if (job?.status === "failed") {
    deliveryError = typeof job.error === "string" ? job.error : "Production could not finish.";
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
      return json(
        { message: "Status could not be recorded.", detail: await updateResponse.text() },
        502,
      );
    }
    await recordActivity(jsonHeaders, {
      ownerId: user.id,
      projectId,
      projectName: String(project.name ?? ""),
      message: delivered ? "Your world is ready to enter." : `Production update: ${stageLabel}`,
      eventType: delivered ? "world_ready" : "production_update",
    });
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

import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { SUPABASE_URL } from "@/lib/supabaseConfig";
import { STAGE_TO_STATUS, deliverWorld, recordActivity, siteBase } from "@/lib/delivery";

type Row = Record<string, unknown>;

const TIMEOUT_MS = 20_000;

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

const signatureMatches = (raw: Buffer, header: string | null, secret: string): boolean => {
  if (!header || !header.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(raw).digest("hex"));
  const provided = Buffer.from(header.slice("sha256=".length).trim().toLowerCase());
  return expected.length === provided.length && timingSafeEqual(expected, provided);
};

// Push delivery: the studio site tells the portal that production finished a
// project, and the portal records it on the owner's behalf. It is authenticated
// by the same shared secret the portal uses outbound, and it writes with the
// service role because no client session is present to authorise the change.
export async function POST(request: Request) {
  const secret = process.env.PRODUCTION_BACKEND_SECRET?.trim();
  if (!secret) {
    return json({ message: "Delivery signing isn't configured on the portal." }, 503);
  }

  const raw = Buffer.from(await request.arrayBuffer());
  if (!signatureMatches(raw, request.headers.get("x-crestion-signature"), secret)) {
    return json({ message: "Delivery signature is not valid." }, 403);
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    return json(
      { message: "Delivery isn't configured on the portal yet: SUPABASE_SERVICE_ROLE_KEY is unset." },
      503,
    );
  }

  let payload: Row;
  try {
    payload = JSON.parse(raw.toString("utf8")) as Row;
  } catch {
    return json({ message: "Delivery payload is not JSON." }, 400);
  }

  const projectId = String(payload.projectId ?? "");
  const jobId = typeof payload.jobId === "string" ? payload.jobId : null;
  const engineStatus = String(payload.engineStatus ?? "");
  if (!projectId || !engineStatus) {
    return json({ message: "Delivery payload is missing the project or status." }, 400);
  }

  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };

  const projectResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}&select=id,name,status,owner_id`,
    { headers },
  );
  const project = ((await projectResponse.json()) as Row[])[0];
  if (!project) {
    return json({ message: "That project does not exist." }, 404);
  }

  let nextStatus = STAGE_TO_STATUS[engineStatus] ?? "REVIEWING";
  let delivered = false;
  let deliveryError: string | null = null;

  if (engineStatus === "completed" && jobId) {
    const base = process.env.PRODUCTION_BACKEND_URL?.replace(/\/intake\/requests\/?$/, "").replace(/\/$/, "");
    if (!base) {
      return json({ message: "The portal has no production backend configured." }, 503);
    }
    const result = await deliverWorld({
      projectId,
      jobId,
      ownerId: String(project.owner_id),
      engineBase: base,
      siteBase: siteBase(request),
      authHeaders: headers,
    });
    delivered = result.delivered;
    deliveryError = result.error;
    if (delivered) nextStatus = "COMPLETED";
  }

  if (String(project.status) !== nextStatus) {
    const update = await fetch(
      `${SUPABASE_URL}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}`,
      {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({ status: nextStatus, updated_at: new Date().toISOString() }),
      },
    );
    if (!update.ok) {
      return json({ message: "Status could not be recorded.", detail: await update.text() }, 502);
    }
    await recordActivity(headers, {
      ownerId: String(project.owner_id),
      projectId,
      projectName: String(project.name ?? ""),
      message: delivered
        ? "Your world is ready to enter."
        : engineStatus === "failed"
          ? `Production stopped: ${String(payload.error ?? "no reason given")}`
          : `Production update: ${String(payload.stage ?? engineStatus)}`,
      eventType: delivered ? "world_ready" : "production_update",
    });
  }

  return json({ ok: true, projectId, status: nextStatus, delivered, error: deliveryError });
}

export async function GET() {
  return json({
    ok: true,
    endpoint: "production delivery",
    configured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    timeoutMs: TIMEOUT_MS,
  });
}

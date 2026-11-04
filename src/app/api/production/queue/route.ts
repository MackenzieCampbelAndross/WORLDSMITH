import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { SUPABASE_URL } from "@/lib/supabaseConfig";
import { buildProductionPayload } from "@/lib/productionPayload";

type Row = Record<string, unknown>;

const SKEW_MS = 5 * 60 * 1000;

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Pull leg of the bridge. A studio machine on a laptop — behind NAT, offline at
 * the moment of submission, or simply not the one the portal was pointed at —
 * cannot be pushed to. It asks for this queue instead, over the same shared
 * secret the portal uses outbound, and the projects still waiting for
 * production come back in the exact body a push would have carried.
 */
const verified = (request: Request, secret: string): boolean => {
  const signature = request.headers.get("x-crestion-signature");
  const timestamp = request.headers.get("x-crestion-timestamp");
  if (!signature || !timestamp || !signature.startsWith("sha256=")) return false;

  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt) || Math.abs(Date.now() - sentAt) > SKEW_MS) return false;

  const url = new URL(request.url);
  const canonical = `GET\n${url.pathname}\n${timestamp}`;
  const expected = Buffer.from(createHmac("sha256", secret).update(canonical).digest("hex"));
  const provided = Buffer.from(signature.slice("sha256=".length).trim().toLowerCase());
  return expected.length === provided.length && timingSafeEqual(expected, provided);
};

export async function GET(request: Request) {
  const secret = process.env.PRODUCTION_BACKEND_SECRET?.trim();
  if (!secret) {
    return json({ message: "Intake signing isn't configured on the portal." }, 503);
  }
  if (!verified(request, secret)) {
    return json({ message: "Queue signature is not valid." }, 403);
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    return json(
      { message: "The queue isn't configured on the portal yet: SUPABASE_SERVICE_ROLE_KEY is unset." },
      503,
    );
  }

  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/projects?status=eq.SUBMITTED&order=created_at.asc&select=*`,
    { headers },
  );
  if (!response.ok) {
    return json({ message: "The queue could not be read.", detail: await response.text() }, 502);
  }
  const projects = (await response.json()) as Row[];

  const requests: Array<Record<string, unknown>> = [];
  const skipped: Array<{ projectId: string; message: string }> = [];
  for (const project of projects) {
    const built = await buildProductionPayload(project, headers);
    if (built.ok) requests.push(built.payload);
    else skipped.push({ projectId: String(project.id), message: built.message });
  }

  return json({ ok: true, count: requests.length, requests, skipped });
}

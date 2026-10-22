import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { validateEnquiry } from "@/lib/contact";
import { sendEnquiryMail } from "@/lib/enquiryEmail";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const MAX_BODY_LENGTH = 16_384;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UNAVAILABLE_MESSAGE =
  "The enquiry service is temporarily unavailable. Please try again shortly.";

const json = (
  body: Record<string, unknown>,
  status = 200,
  headers: Record<string, string> = {},
) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json({ ok: false, message: "Unsupported request format." }, 415);
  }

  const rate = checkRateLimit(`contact:${getClientIp(request)}`);
  if (!rate.allowed) {
    const retryAfter = Math.max(1, Math.ceil(rate.retryAfterMs / 1000));
    return json(
      {
        ok: false,
        message: "Too many enquiries from this connection. Please try again in a few minutes.",
      },
      429,
      { "Retry-After": String(retryAfter) },
    );
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_LENGTH) {
      return json({ ok: false, message: "Your submission is too large." }, 413);
    }
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, message: "We couldn't read this submission." }, 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ ok: false, message: "Please check the form and try again." }, 400);
  }

  const record = body as Record<string, unknown>;
  if (record.hp !== undefined && String(record.hp).trim() !== "") {
    // Never send, and do not disclose the honeypot to automated clients.
    return json({ ok: false, message: "We couldn't process this submission." }, 400);
  }

  const validation = validateEnquiry(record);
  if (!validation.ok) {
    return json(
      {
        ok: false,
        message: "Please check the highlighted fields.",
        fieldErrors: validation.errors,
      },
      400,
    );
  }

  const smtpUser = process.env.GMAIL_USER?.trim() ?? "";
  const smtpPassword = (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s+/g, "");
  const contactTo = process.env.CONTACT_TO_EMAIL?.trim() ?? "";

  if (
    !smtpUser ||
    !smtpPassword ||
    !contactTo ||
    smtpPassword.startsWith("REPLACE_WITH_") ||
    !EMAIL_PATTERN.test(smtpUser) ||
    !EMAIL_PATTERN.test(contactTo)
  ) {
    console.error("Contact API: Gmail SMTP environment is not configured.");
    return json({ ok: false, message: UNAVAILABLE_MESSAGE }, 503);
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    tls: { minVersion: "TLSv1.2" },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  try {
    await sendEnquiryMail(transporter, validation.data, { user: smtpUser, to: contactTo });
    return json({ ok: true });
  } catch {
    console.error("Contact API: Gmail SMTP send failed.");
    return json(
      {
        ok: false,
        message: "We couldn't send your enquiry right now. Please try again.",
      },
      502,
    );
  }
}

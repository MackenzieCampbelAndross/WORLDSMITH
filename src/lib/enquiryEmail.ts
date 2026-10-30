import type { SendMailOptions } from "nodemailer";
import type { EnquirySubmission } from "./contact";

export interface MailConfig {
  user: string;
  to: string;
}

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });

export const sanitizeHeaderValue = (value: string): string =>
  value.replace(/[\u0000-\u001F\u007F]+/g, " ").trim().slice(0, 200);

export function formatSubmissionTimestamp(date: Date): string {
  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);

  return `${datePart}, ${timePart} UTC`;
}

export function buildEnquiryEmail(
  enquiry: EnquirySubmission,
  submittedAt: Date = new Date(),
): { subject: string; html: string; text: string } {
  const safeName = sanitizeHeaderValue(enquiry.fullName) || "Unknown";
  const submitted = formatSubmissionTimestamp(submittedAt);
  const websiteText = enquiry.website ?? "Not provided";
  const websiteHtml = enquiry.website
    ? `<a href="${escapeHtml(enquiry.website)}" style="color:#1f6651;text-decoration:underline;">${escapeHtml(enquiry.website)}</a>`
    : "Not provided";

  const rows: Array<[string, string]> = [
    ["Full name", escapeHtml(enquiry.fullName)],
    ["Email address", escapeHtml(enquiry.email)],
    ["Phone number", escapeHtml(enquiry.phone)],
    ["Company name", escapeHtml(enquiry.company)],
    ["Company website", websiteHtml],
    ["Submitted", escapeHtml(submitted)],
  ];

  const tableRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #d9d6c9;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;letter-spacing:0.08em;text-transform:uppercase;color:#5d7166;vertical-align:top;width:34%;">${label}</td>
          <td style="padding:14px 0 14px 20px;border-bottom:1px solid #d9d6c9;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#173f32;vertical-align:top;">${value}</td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>New Crestion Labs Enquiry</title>
  </head>
  <body style="margin:0;padding:0;background-color:#ecece2;">
    <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
      <div style="background-color:#153f31;padding:28px 32px;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.28em;color:#f0f1e6;">CRESTION LABS</div>
        <div style="margin-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#a8cebc;">New enquiry</div>
      </div>
      <div style="background-color:#f7f4ea;padding:32px;">
        <h1 style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.3;font-weight:600;color:#173f32;">New Crestion Labs Enquiry</h1>
        <p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#5d7166;">A new enquiry was submitted through the Crestion Labs website.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid #d9d6c9;">${tableRows}
        </table>
        <p style="margin:22px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#5d7166;">Reply directly to this email to respond to ${escapeHtml(enquiry.fullName)}.</p>
      </div>
      <div style="padding:16px 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.6;letter-spacing:0.08em;color:#7b8b81;">Crestion Labs · From vision to experience</div>
    </div>
  </body>
</html>`;

  const text = `NEW CRESTION LABS ENQUIRY

Full name: ${enquiry.fullName}
Email address: ${enquiry.email}
Phone number: ${enquiry.phone}
Company name: ${enquiry.company}
Company website: ${websiteText}
Submitted: ${submitted}

Reply directly to this email to respond to ${enquiry.fullName}.`;

  return {
    subject: `New Crestion Labs Enquiry — ${safeName}`,
    html,
    text,
  };
}

export function buildMailOptions(
  enquiry: EnquirySubmission,
  config: MailConfig,
  submittedAt: Date = new Date(),
): SendMailOptions {
  const content = buildEnquiryEmail(enquiry, submittedAt);
  const user = sanitizeHeaderValue(config.user);
  const to = sanitizeHeaderValue(config.to);

  return {
    from: { name: "Crestion Labs", address: user },
    to,
    replyTo: {
      name: sanitizeHeaderValue(enquiry.fullName),
      address: enquiry.email,
    },
    subject: content.subject,
    text: content.text,
    html: content.html,
  };
}

export interface MailSender {
  sendMail(options: SendMailOptions): Promise<unknown>;
}

export async function sendEnquiryMail(
  sender: MailSender,
  enquiry: EnquirySubmission,
  config: MailConfig,
  submittedAt: Date = new Date(),
): Promise<void> {
  await sender.sendMail(buildMailOptions(enquiry, config, submittedAt));
}

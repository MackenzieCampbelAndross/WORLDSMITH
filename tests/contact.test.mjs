import test from "node:test";
import assert from "node:assert/strict";

import { normalizeWebsite, validateEnquiry } from "../src/lib/contact.ts";
import {
  buildEnquiryEmail,
  buildMailOptions,
  formatSubmissionTimestamp,
  sendEnquiryMail,
} from "../src/lib/enquiryEmail.ts";
import { checkRateLimit } from "../src/lib/rateLimit.ts";

const validInput = {
  fullName: "  Ada Lovelace  ",
  email: "ada@example.com",
  phone: "+44 20 7946 0958",
  company: "Analytical Engines Ltd",
  website: "example.com",
};

test("required fields are reported, but the optional website is not", () => {
  const result = validateEnquiry({});
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.deepEqual(Object.keys(result.errors).sort(), ["company", "email", "fullName", "phone"]);
  assert.equal(result.errors.website, undefined);
});

test("invalid email, phone and website are rejected", () => {
  const result = validateEnquiry({
    ...validInput,
    email: "not-an-email",
    phone: "call me",
    website: "javascript:alert(1)",
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.errors.email ?? "", /valid email/i);
  assert.match(result.errors.phone ?? "", /valid phone/i);
  assert.match(result.errors.website ?? "", /website/i);
});

test("legitimate international phone numbers are accepted", () => {
  for (const phone of [
    "+1 (415) 555-0132",
    "+44 (0)20 7946 0958",
    "020 7946 0958",
    "+91 98765 43210",
    "+81 3-1234-5678",
  ]) {
    const result = validateEnquiry({ ...validInput, phone });
    assert.equal(result.ok, true, `${phone} should be accepted`);
  }
});

test("too-short and too-long phone numbers are rejected", () => {
  assert.equal(validateEnquiry({ ...validInput, phone: "12345" }).ok, false);
  assert.equal(validateEnquiry({ ...validInput, phone: "+1234567890123456" }).ok, false);
});

test("valid data is trimmed and the optional website is normalized", () => {
  const result = validateEnquiry(validInput);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.data, {
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: "+44 20 7946 0958",
    company: "Analytical Engines Ltd",
    website: "https://example.com/",
  });
});

test("an empty optional website is allowed", () => {
  const result = validateEnquiry({ ...validInput, website: "   " });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.website, null);
});

test("website normalization handles schemes, paths and rejects unsafe URLs", () => {
  assert.deepEqual(normalizeWebsite("www.example.com/path?q=1"), {
    ok: true,
    value: "https://www.example.com/path?q=1",
  });
  assert.deepEqual(normalizeWebsite("https://example.com"), {
    ok: true,
    value: "https://example.com/",
  });
  assert.equal(normalizeWebsite("ftp://example.com").ok, false);
  assert.equal(normalizeWebsite("example").ok, false);
  assert.equal(normalizeWebsite("http://user:pass@example.com").ok, false);
});

test("header-breaking characters are rejected and extra fields are ignored", () => {
  assert.equal(
    validateEnquiry({ ...validInput, fullName: "Jane\r\nBcc: evil@example.com" }).ok,
    false,
  );

  const result = validateEnquiry({ ...validInput, projectMessage: "should not be stored" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal("projectMessage" in result.data, false);
});

test("timestamp is stable and explicit about UTC", () => {
  assert.equal(
    formatSubmissionTimestamp(new Date("2026-10-23T10:15:00Z")),
    "23 October 2026, 10:15 UTC",
  );
});

test("mail options set the trusted sender, recipient and visitor reply-to", () => {
  const mail = buildMailOptions(
    {
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+44 20 7946 0958",
      company: "Analytical Engines Ltd",
      website: null,
    },
    { user: "crestionlabs@gmail.com", to: "crestionlabs@gmail.com" },
    new Date("2026-10-23T10:15:00Z"),
  );

  assert.deepEqual(mail.from, { name: "Crestion Labs", address: "crestionlabs@gmail.com" });
  assert.equal(mail.to, "crestionlabs@gmail.com");
  assert.deepEqual(mail.replyTo, { name: "Ada Lovelace", address: "ada@example.com" });
  assert.equal(mail.subject, "New Crestion Labs Enquiry — Ada Lovelace");
  assert.match(mail.text ?? "", /23 October 2026, 10:15 UTC/);
  assert.match(mail.text ?? "", /Company website: Not provided/);
  assert.doesNotMatch(mail.html ?? "", /<script>/i);
});

test("a mocked SMTP transport receives the branded message and routing headers", async () => {
  let received;
  await sendEnquiryMail(
    {
      sendMail: async (options) => {
        received = options;
        return { accepted: ["crestionlabs@gmail.com"] };
      },
    },
    {
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+44 20 7946 0958",
      company: "Analytical Engines Ltd",
      website: "https://example.com/",
    },
    { user: "crestionlabs@gmail.com", to: "crestionlabs@gmail.com" },
    new Date("2026-10-23T10:15:00Z"),
  );

  assert.ok(received);
  assert.deepEqual(received.from, {
    name: "Crestion Labs",
    address: "crestionlabs@gmail.com",
  });
  assert.equal(received.to, "crestionlabs@gmail.com");
  assert.deepEqual(received.replyTo, {
    name: "Ada Lovelace",
    address: "ada@example.com",
  });
  assert.match(received.subject, /New Crestion Labs Enquiry — Ada Lovelace/);
  assert.match(received.html, /https:\/\/example\.com\//);
});

test("email HTML escapes visitor input and includes the website", () => {
  const mail = buildMailOptions(
    {
      fullName: "Ada <script>alert('x')</script>",
      email: "ada@example.com",
      phone: "+44 20 7946 0958",
      company: "Acme & Sons <b>Ltd</b>",
      website: "https://example.com/",
    },
    { user: "crestionlabs@gmail.com", to: "crestionlabs@gmail.com" },
    new Date("2026-10-23T10:15:00Z"),
  );

  assert.match(mail.html ?? "", /Acme &amp; Sons &lt;b&gt;Ltd&lt;\/b&gt;/);
  assert.match(mail.html ?? "", /href="https:\/\/example\.com\/"/);
  assert.doesNotMatch(mail.html ?? "", /<script>/i);
  assert.doesNotMatch(mail.html ?? "", /<b>Ltd<\/b>/);
});

test("mail header values are sanitized even if called outside normal validation", () => {
  const mail = buildMailOptions(
    {
      fullName: "Jane\r\nBcc: evil@example.com",
      email: "jane@example.com",
      phone: "+1 415 555 0132",
      company: "Example Co",
      website: null,
    },
    { user: "crestionlabs@gmail.com", to: "crestionlabs@gmail.com" },
  );

  assert.doesNotMatch(mail.subject ?? "", /[\r\n]/);
  const replyTo = mail.replyTo;
  assert.ok(replyTo && typeof replyTo === "object");
  assert.doesNotMatch(replyTo.name ?? "", /[\r\n]/);
});

test("only requested enquiry fields appear in the email body", () => {
  const email = buildEnquiryEmail(
    {
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+44 20 7946 0958",
      company: "Analytical Engines Ltd",
      website: "https://example.com/",
    },
    new Date("2026-10-23T10:15:00Z"),
  );

  assert.doesNotMatch(email.html, /Project name|Project message|Available assets/i);
  assert.match(email.html, /Full name/);
  assert.match(email.html, /Submitted/);
});

test("rate limiting blocks the sixth attempt and recovers after the window", () => {
  const key = `test-${Date.now()}-${Math.random()}`;
  const now = 1_000_000;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.deepEqual(checkRateLimit(key, now), { allowed: true });
  }
  const blocked = checkRateLimit(key, now);
  assert.equal(blocked.allowed, false);
  if (blocked.allowed) return;
  assert.ok(blocked.retryAfterMs > 0);
  assert.deepEqual(checkRateLimit(key, now + 10 * 60 * 1000 + 1), { allowed: true });
});

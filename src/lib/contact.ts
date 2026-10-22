export const FULL_NAME_MAX = 100;
export const EMAIL_MAX = 254;
export const PHONE_MAX = 30;
export const COMPANY_MAX = 150;
export const WEBSITE_MAX = 300;

export const ENQUIRY_FIELDS = ["fullName", "email", "phone", "company", "website"] as const;

export type EnquiryField = (typeof ENQUIRY_FIELDS)[number];
export type FieldErrors = Partial<Record<EnquiryField, string>>;

export interface EnquirySubmission {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  website: string | null;
}

export type EnquiryValidation =
  | { ok: true; data: EnquirySubmission }
  | { ok: false; errors: FieldErrors };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+?[0-9(][0-9 .()-]*$/;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

const readString = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const hasControlChars = (value: string): boolean => CONTROL_CHARS.test(value);

export function normalizeWebsite(
  input: string,
): { ok: true; value: string | null } | { ok: false } {
  const value = input.trim();
  if (!value) return { ok: true, value: null };
  if (value.length > WEBSITE_MAX || /\s/.test(value)) return { ok: false };

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return { ok: false };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false };
  if (!url.hostname.includes(".") || url.hostname === "localhost") return { ok: false };
  if (url.username || url.password) return { ok: false };

  return { ok: true, value: url.toString() };
}

export function validateEnquiry(input: unknown): EnquiryValidation {
  const record =
    input && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};

  const fullName = readString(record.fullName);
  const email = readString(record.email);
  const phone = readString(record.phone);
  const company = readString(record.company);
  const rawWebsite = readString(record.website);

  const errors: FieldErrors = {};

  if (!fullName) {
    errors.fullName = "Please enter your full name.";
  } else if (fullName.length > FULL_NAME_MAX) {
    errors.fullName = `Please keep your name under ${FULL_NAME_MAX} characters.`;
  } else if (hasControlChars(fullName)) {
    errors.fullName = "Please enter a valid name.";
  }

  if (!email) {
    errors.email = "Please enter your email address.";
  } else if (email.length > EMAIL_MAX) {
    errors.email = "Please enter a shorter email address.";
  } else if (!EMAIL_PATTERN.test(email) || hasControlChars(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!phone) {
    errors.phone = "Please enter your phone number.";
  } else if (phone.length > PHONE_MAX) {
    errors.phone = "Please enter a shorter phone number.";
  } else if (!PHONE_PATTERN.test(phone) || hasControlChars(phone)) {
    errors.phone = "Enter a valid phone number, including country code if applicable.";
  } else {
    const digitCount = (phone.match(/\d/g) ?? []).length;
    if (digitCount < 7 || digitCount > 15) {
      errors.phone = "Enter a valid phone number, including country code if applicable.";
    }
  }

  if (!company) {
    errors.company = "Please enter your company name.";
  } else if (company.length > COMPANY_MAX) {
    errors.company = `Please keep your company name under ${COMPANY_MAX} characters.`;
  } else if (hasControlChars(company)) {
    errors.company = "Please enter a valid company name.";
  }

  let website: string | null = null;
  if (rawWebsite) {
    const normalized = normalizeWebsite(rawWebsite);
    if (!normalized.ok) {
      errors.website = "Enter a valid website address (e.g. example.com).";
    } else {
      website = normalized.value;
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      fullName,
      email,
      phone,
      company,
      website,
    },
  };
}

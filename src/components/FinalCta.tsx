"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  COMPANY_MAX,
  EMAIL_MAX,
  ENQUIRY_FIELDS,
  FULL_NAME_MAX,
  PHONE_MAX,
  WEBSITE_MAX,
  validateEnquiry,
  type EnquiryField,
  type FieldErrors,
} from "@/lib/contact";

type SubmissionStatus = "idle" | "sending" | "success" | "error";

interface FormValues {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  hp: string;
}

interface FieldDefinition {
  name: EnquiryField;
  label: string;
  type: "text" | "email" | "tel" | "url";
  autoComplete: string;
  inputMode?: "text" | "email" | "tel" | "url";
  placeholder: string;
  maxLength: number;
  required: boolean;
  fullWidth?: boolean;
}

interface ContactApiResponse {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, unknown>;
}

const INITIAL_VALUES: FormValues = {
  fullName: "",
  email: "",
  phone: "",
  company: "",
  website: "",
  hp: "",
};

const FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    name: "fullName",
    label: "Full name",
    type: "text",
    autoComplete: "name",
    inputMode: "text",
    placeholder: "Your name",
    maxLength: FULL_NAME_MAX,
    required: true,
  },
  {
    name: "email",
    label: "Email address",
    type: "email",
    autoComplete: "email",
    inputMode: "email",
    placeholder: "you@company.com",
    maxLength: EMAIL_MAX,
    required: true,
  },
  {
    name: "phone",
    label: "Phone number",
    type: "tel",
    autoComplete: "tel",
    inputMode: "tel",
    placeholder: "+1 415 555 0132",
    maxLength: PHONE_MAX,
    required: true,
  },
  {
    name: "company",
    label: "Company name",
    type: "text",
    autoComplete: "organization",
    inputMode: "text",
    placeholder: "Company name",
    maxLength: COMPANY_MAX,
    required: true,
  },
  {
    name: "website",
    label: "Company website",
    type: "url",
    autoComplete: "url",
    inputMode: "url",
    placeholder: "example.com",
    maxLength: WEBSITE_MAX,
    required: false,
    fullWidth: true,
  },
];

const fieldId = (name: EnquiryField) => `contact-${name}`;
const errorId = (name: EnquiryField) => `contact-${name}-error`;
const EXTRACTED_FIELD_NAMES = new Set<string>(ENQUIRY_FIELDS);

export const FinalCta: React.FC = () => {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [serverMessage, setServerMessage] = useState("");
  const inFlightRef = useRef(false);
  const focusTargetRef = useRef<EnquiryField | null>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const sending = status === "sending";

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  useEffect(() => {
    if (status !== "error") return;
    const target = focusTargetRef.current;
    if (!target) return;
    const field = document.getElementById(fieldId(target));
    if (!field) return;
    focusTargetRef.current = null;
    field.focus();
  }, [errors, status]);

  const focusFirstInvalid = (nextErrors: FieldErrors) => {
    const firstInvalid = ENQUIRY_FIELDS.find((field) => nextErrors[field]);
    if (firstInvalid) focusTargetRef.current = firstInvalid;
  };

  const updateField = (name: EnquiryField, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      return { ...current, [name]: undefined };
    });
    if (status === "error") {
      setStatus("idle");
      setServerMessage("");
    }
  };

  const handleBlur = (name: EnquiryField) => {
    if (!values[name].trim()) return;
    const result = validateEnquiry(values);
    setErrors((current) => ({
      ...current,
      [name]: result.ok ? undefined : result.errors[name],
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlightRef.current) return;

    const validation = validateEnquiry(values);
    if (!validation.ok) {
      setErrors(validation.errors);
      setServerMessage("Please check the highlighted fields.");
      setStatus("error");
      focusFirstInvalid(validation.errors);
      return;
    }

    inFlightRef.current = true;
    setErrors({});
    setServerMessage("");
    setStatus("sending");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: controller.signal,
      });

      let payload: ContactApiResponse | null = null;
      try {
        payload = (await response.json()) as ContactApiResponse;
      } catch {
        payload = null;
      }

      if (!response.ok || payload?.ok !== true) {
        const nextErrors: FieldErrors = {};
        if (payload?.fieldErrors && typeof payload.fieldErrors === "object") {
          for (const [field, message] of Object.entries(payload.fieldErrors)) {
            if (EXTRACTED_FIELD_NAMES.has(field) && typeof message === "string") {
              nextErrors[field as EnquiryField] = message;
            }
          }
        }

        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          focusFirstInvalid(nextErrors);
        }
        setServerMessage(
          typeof payload?.message === "string" && payload.message.trim()
            ? payload.message
            : "We couldn't send your enquiry right now. Please try again.",
        );
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch (error) {
      setServerMessage(
        error instanceof DOMException && error.name === "AbortError"
          ? "The request timed out. Please try again."
          : "We couldn't send your enquiry. Please check your connection and try again.",
      );
      setStatus("error");
    } finally {
      window.clearTimeout(timeout);
      inFlightRef.current = false;
    }
  };

  return (
    <section
      id="contact"
      aria-labelledby="contact-section-heading"
      className="relative scroll-mt-24 overflow-hidden bg-[#153f31] font-body text-[#f0f1e6]"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/showcase/villa-splash.png"
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-[50%_68%] opacity-[0.42]"
        />
        <div className="absolute inset-0 bg-[#153f31]/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#153f31] via-[#153f31]/70 to-[#153f31]/88" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#153f31] via-transparent to-[#153f31]/50" />
        <div className="absolute inset-0 grid-lines opacity-35" />
        <div className="paper-grain absolute inset-0 opacity-40 mix-blend-soft-light" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1760px] flex-col px-6 pb-8 pt-24 sm:px-10 sm:pt-28 lg:px-14 lg:pb-10 xl:px-[4.5vw] xl:pt-32">
        <div className="grid flex-1 items-start gap-12 py-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,620px)] xl:gap-20 xl:py-14">
          <div className="max-w-[38rem] xl:pt-4">
            <p className="flex items-center gap-3 font-body text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b9d4c5]/85 sm:text-[11px]">
              <span className="font-accent text-[15px] font-normal italic tracking-normal text-[#d0e5d3]">
                08
              </span>
              <span className="text-[#a8cebc]/50" aria-hidden="true">
                —
              </span>
              LET&apos;S BEGIN
            </p>

            <h2
              id="contact-section-heading"
              className="mt-8 font-display text-[clamp(2.9rem,5.2vw,5.4rem)] font-medium leading-[0.98] tracking-[-0.045em] text-[#f0f1e6]"
            >
              Let&apos;s build{" "}
              <br />
              your world.
            </h2>

            <p className="mt-6 max-w-[24rem] font-body text-[15px] leading-[1.75] text-[#d6e5db]/80 sm:text-[16px]">
              Tell us a little about yourself. We&apos;ll take it from there.
            </p>
          </div>

          <div className="w-full bg-[#f4f1e7] p-6 text-[#173f32] sm:p-8 xl:max-w-[620px] xl:justify-self-end xl:p-10">
            {status === "success" ? (
              <div
                id="contact-success"
                ref={successRef}
                role="status"
                aria-live="polite"
                tabIndex={-1}
                className="flex min-h-[380px] flex-col justify-center focus:outline-none"
              >
                <p className="font-body text-[10px] font-semibold uppercase tracking-[0.24em] text-[#1f6651]/60">
                  Enquiry
                </p>
                <h3 className="mt-5 max-w-[27rem] font-display text-[clamp(1.8rem,2.6vw,2.45rem)] font-medium leading-[1.14] tracking-[-0.03em] text-[#153f31]">
                  Thank you. Your enquiry has been received. We&apos;ll be in touch soon.
                </h3>
                <div className="mt-7 h-px w-16 bg-[#1f6651]/20" aria-hidden="true" />
              </div>
            ) : (
              <>
                <h3
                  id="contact-form-heading"
                  className="font-body text-[10px] font-semibold uppercase tracking-[0.24em] text-[#153f31]/60"
                >
                  Enquiry
                </h3>
                <div className="mt-4 h-px w-full bg-[#153f31]/10" aria-hidden="true" />

                <form
                  id="contact-form"
                  aria-labelledby="contact-form-heading"
                  noValidate
                  aria-busy={sending}
                  onSubmit={handleSubmit}
                  className="mt-6"
                >
                  <div
                    aria-hidden="true"
                    className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
                  >
                    <label htmlFor="contact-hp">Leave this field empty</label>
                    <input
                      id="contact-hp"
                      name="hp"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={values.hp}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, hp: event.target.value }))
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                    {FIELD_DEFINITIONS.map((field) => {
                      const error = errors[field.name];
                      return (
                        <div key={field.name} className={field.fullWidth ? "sm:col-span-2" : ""}>
                          <label
                            htmlFor={fieldId(field.name)}
                            className="mb-2 flex items-center gap-1.5 font-body text-[11px] font-semibold text-[#173f32]/80"
                          >
                            {field.label}
                            {field.required ? (
                              <>
                                <span className="text-[#9a4331]" aria-hidden="true">
                                  *
                                </span>
                                <span className="sr-only">(required)</span>
                              </>
                            ) : (
                              <span className="font-normal text-[#173f32]/40">(optional)</span>
                            )}
                          </label>
                          <input
                            id={fieldId(field.name)}
                            name={field.name}
                            type={field.type}
                            autoComplete={field.autoComplete}
                            inputMode={field.inputMode}
                            required={field.required}
                            maxLength={field.maxLength}
                            value={values[field.name]}
                            onChange={(event) => updateField(field.name, event.target.value)}
                            onBlur={() => handleBlur(field.name)}
                            disabled={sending}
                            aria-invalid={Boolean(error)}
                            aria-describedby={error ? errorId(field.name) : undefined}
                            placeholder={field.placeholder}
                            className={`h-12 w-full rounded-[2px] border bg-[#fbf9f2] px-3.5 font-body text-[14px] text-[#173f32] placeholder:text-[#173f32]/30 transition-colors duration-200 focus:outline-none focus:ring-1 disabled:cursor-wait disabled:opacity-60 ${
                              error
                                ? "border-[#9a4331] focus:border-[#9a4331] focus:ring-[#9a4331]/20"
                                : "border-[#173f32]/15 hover:border-[#173f32]/30 focus:border-[#1f6651] focus:ring-[#1f6651]/25"
                            }`}
                          />
                          {error && (
                            <p
                              id={errorId(field.name)}
                              role="alert"
                              className="mt-1.5 font-body text-[11px] leading-relaxed text-[#9a4331]"
                            >
                              {error}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {status === "error" && serverMessage && (
                    <div
                      role="alert"
                      className="mt-5 border-l-2 border-[#9a4331] bg-[#9a4331]/[0.06] px-3.5 py-3"
                    >
                      <p className="font-body text-[12px] leading-relaxed text-[#7e3527]">
                        {serverMessage}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    aria-busy={sending}
                    className="group mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-[2px] bg-[#153f31] px-6 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f0f1e6] transition-colors duration-200 hover:bg-[#1f5e44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6651] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1e7] disabled:cursor-wait disabled:bg-[#153f31]/70"
                  >
                    {sending ? (
                      "SENDING…"
                    ) : (
                      <>
                        GET IN TOUCH{" "}
                        <span
                          aria-hidden="true"
                          className="text-[14px] tracking-normal transition-transform duration-200 group-hover:translate-x-1"
                        >
                          →
                        </span>
                      </>
                    )}
                  </button>

                  <p className="sr-only" role="status" aria-live="polite">
                    {sending ? "Sending your enquiry." : ""}
                  </p>
                </form>
              </>
            )}
          </div>
        </div>

        <footer className="mt-16 flex flex-col gap-3 border-t border-[#cfe2d5]/15 pt-5 sm:flex-row sm:items-center sm:justify-between lg:mt-20">
          <span className="font-display text-base font-bold uppercase tracking-[0.16em] text-[#f0f1e6]/80 sm:text-lg">
            WORLDSMITH
          </span>
          <span className="font-body text-[9px] font-medium uppercase tracking-[0.24em] text-[#a8cebc]/55 sm:text-[10px]">
            FROM VISION TO EXPERIENCE
          </span>
        </footer>
      </div>
    </section>
  );
};

"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
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
    placeholder: "+91 98765 43210",
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
    placeholder: "https://yourcompany.com",
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
      className="relative overflow-hidden bg-black font-body text-[#e9e6db] selection:bg-[#e9e6db] selection:text-black"
    >
      <div
        className="pointer-events-none absolute inset-0 grid-lines"
        style={{ "--grid-line-color": "rgba(233, 230, 219, 0.045)" } as React.CSSProperties}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1560px] flex-col justify-center px-6 pb-4 pt-[clamp(6rem,13svh,8.5rem)] sm:px-10 sm:pb-5 lg:px-14 lg:pb-6">
        <div className="overflow-hidden rounded-[14px] bg-black ring-1 ring-white/[0.07] xl:grid xl:min-h-[min(760px,calc(100svh-14rem))] xl:grid-cols-[52%_48%] xl:rounded-[18px]">
          <div className="relative min-h-[300px] overflow-hidden sm:min-h-[400px] md:min-h-[460px] lg:min-h-[520px] xl:min-h-0">
            <Image
              src="/showcase/contact-cantilever.png"
              alt="Minimal concrete and glass residence cantilevered over a still reflecting pool at dusk"
              fill
              sizes="(min-width: 1280px) 52vw, 100vw"
              className="object-cover object-center brightness-[0.92] saturate-[0.65]"
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(0,0,0,0.24) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.18) 68%, rgba(0,0,0,0.74) 100%)",
              }}
              aria-hidden="true"
            />
            <div className="absolute inset-x-0 bottom-0 p-7 drop-shadow-[0_1px_18px_rgba(0,0,0,0.55)] sm:p-9 lg:p-10 xl:p-12">
              <p className="font-body text-[11px] font-medium tracking-[0.08em] text-[#e9e6db]/80">
                Design environments
              </p>
              <p className="mt-2 font-display text-[clamp(1.2rem,1.5vw,1.55rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[#f4f1e8]">
                that move people.
              </p>
              <div className="mt-4 h-px w-9 bg-[#e9e6db]/45" aria-hidden="true" />
            </div>
          </div>

          <div className="flex flex-col bg-black px-6 py-10 sm:px-9 sm:py-12 lg:px-12 lg:py-14 xl:justify-center xl:px-[clamp(2.25rem,3.4vw,3.5rem)] xl:py-[clamp(2rem,5.2svh,3.5rem)]">
            <p className="font-body text-[10px] font-semibold uppercase tracking-[0.26em] text-[#b7b2a6]">
              Enquiry
            </p>

            <h2
              id="contact-section-heading"
              className="mt-[clamp(1rem,2svh,1.5rem)] font-display text-[clamp(2.6rem,min(3.8vw,5.8svh),4rem)] font-medium leading-[1.02] tracking-[-0.045em] text-[#efebe1]"
            >
              Let&apos;s build
              <br />
              your world.
            </h2>

            <p className="mt-[clamp(0.75rem,1.4svh,1rem)] max-w-[30rem] text-balance font-body text-[14px] leading-[1.7] text-[#a5a096] sm:text-[15px]">
              Tell us a little about yourself. We&apos;ll take it from there.
            </p>

            {status === "success" ? (
              <div
                id="contact-success"
                ref={successRef}
                role="status"
                aria-live="polite"
                tabIndex={-1}
                className="mt-[clamp(1rem,2svh,1.5rem)] flex min-h-[clamp(180px,28svh,290px)] flex-col justify-center border-t border-white/10 focus:outline-none"
              >
                <p className="max-w-[24rem] font-display text-[clamp(1.55rem,2.2vw,2.1rem)] font-medium leading-[1.28] tracking-[-0.03em] text-[#efebe1]">
                  Thank you. Your enquiry has been received. We&apos;ll be in touch soon.
                </p>
              </div>
            ) : (
              <form
                id="contact-form"
                aria-labelledby="contact-section-heading"
                noValidate
                aria-busy={sending}
                onSubmit={handleSubmit}
                className="mt-[clamp(1rem,2svh,1.5rem)]"
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

                <div className="grid grid-cols-1 gap-x-5 gap-y-5 xl:grid-cols-2 xl:gap-y-[clamp(0.7rem,1.5svh,1rem)]">
                  {FIELD_DEFINITIONS.map((field) => {
                    const error = errors[field.name];
                    return (
                      <div key={field.name} className={field.fullWidth ? "xl:col-span-2" : ""}>
                        <label
                          htmlFor={fieldId(field.name)}
                          className="mb-2 flex items-center gap-1.5 font-body text-[11px] font-semibold tracking-[0.02em] text-[#cfcabd]"
                        >
                          {field.label}
                          {field.required ? (
                            <>
                              <span
                                className={error ? "text-[#cf9585]" : "text-[#8a857a]"}
                                aria-hidden="true"
                              >
                                *
                              </span>
                              <span className="sr-only">(required)</span>
                            </>
                          ) : (
                            <span className="font-normal text-[#7d786e]">(optional)</span>
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
                          className={`h-12 w-full rounded-[3px] border bg-[#050505] px-3.5 font-body text-[14px] text-[#eeeae0] placeholder:text-[#706c63] transition-colors duration-200 focus:outline-none focus:ring-1 disabled:cursor-wait disabled:opacity-50 xl:h-[clamp(2.65rem,5.4svh,3rem)] ${
                            error
                              ? "border-[#9a6a5d] focus:border-[#b98273] focus:ring-[#b98273]/25"
                              : "border-[#34332e] hover:border-[#4b4942] focus:border-[#b9b4a7] focus:ring-[#b9b4a7]/20"
                          }`}
                        />
                        {error && (
                          <p
                            id={errorId(field.name)}
                            role="alert"
                            className="mt-1.5 font-body text-[11px] leading-relaxed text-[#cf9585]"
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
                    className="mt-5 border-l border-[#9a6a5d] bg-[#9a6a5d]/[0.08] px-3.5 py-3"
                  >
                    <p className="font-body text-[12px] leading-relaxed text-[#d3a79a]">
                      {serverMessage}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  aria-busy={sending}
                  className="group mt-[clamp(1rem,2.2svh,1.5rem)] flex h-[52px] w-full items-center justify-center gap-2 rounded-[3px] bg-[#ece7db] px-6 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0a0a09] transition-colors duration-200 hover:bg-[#f7f3ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ece7db] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-wait disabled:bg-[#c9c4b8] disabled:text-black/45 xl:h-[clamp(2.8rem,5.6svh,3.25rem)]"
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
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

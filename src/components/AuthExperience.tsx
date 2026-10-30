"use client";

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { ensureProfile } from "@/lib/portal";
import { getSupabaseClient } from "@/lib/supabase";
import { isTimeout, withTimeout } from "@/lib/timeout";

type AuthMode = "login" | "signup" | "otp";
type OtpFlow = "login" | "signup";
type BusyState = "send" | "verify" | null;

const EMPTY_OTP = ["", "", "", "", "", ""];

function otpErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message)
      : "";

  if (/expired|invalid|incorrect/i.test(message) || code === "otp_expired") {
    return "That verification code is incorrect or has expired. Please request a new code.";
  }
  if (/rate limit|once every|too many/i.test(message) || code.includes("rate_limit")) {
    return "Too many attempts. Please wait a moment before requesting another code.";
  }
  if (/invalid email|email address/i.test(message) || code === "email_address_invalid") {
    return "Enter a valid email address.";
  }
  if (/signups not allowed|otp_disabled|signup_disabled/i.test(`${code} ${message}`)) {
    return "We couldn't send a code to that email. Check the address or create an account.";
  }
  if (/fetch|network/i.test(message)) {
    return "Network error. Check your connection and try again.";
  }
  return "Something went wrong. Please try again.";
}

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const inputClass =
  "mt-1.5 w-full rounded-[8px] border border-black bg-black px-3.5 py-2.5 font-body text-[13px] text-[#f0f1e6] caret-[#f0f1e6] outline-none transition-colors duration-200 placeholder:text-[#f0f1e6]/35 focus:border-[#9fc4b2]";

const labelClass = "block font-body text-[11px] font-medium text-black";

const primaryClass =
  "mt-5 flex w-full items-center justify-center rounded-[7px] bg-[#171713] px-5 py-3 font-body text-[13px] font-semibold text-[#f0f1e6] transition-colors duration-200 hover:bg-[#1f5e44] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f5e44] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ecece2]";

const otpBoxClass =
  "h-12 w-full rounded-[7px] border border-black bg-black text-center font-body text-[17px] tracking-[0.05em] text-[#f0f1e6] caret-[#f0f1e6] outline-none transition-colors focus:border-[#9fc4b2]";

const CloseIcon = () => (
  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden="true">
    <path d="M2.5 2.5 13.5 13.5M13.5 2.5 2.5 13.5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

export const AuthExperience: React.FC = () => {
  const { authOpen, closeAuth } = useAuth();
  const isClient = useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot);
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [otpFlow, setOtpFlow] = useState<OtpFlow>("login");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(EMPTY_OTP);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<BusyState>(null);
  const [closing, setClosing] = useState(false);
  const [exiting, setExiting] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const reset = useCallback((nextMode: AuthMode = "login", nextFlow: OtpFlow = "login") => {
    setMode(nextMode);
    setOtpFlow(nextFlow);
    setOtp(EMPTY_OTP);
    setCooldown(0);
    setError(null);
  }, []);

  const requestClose = useCallback(() => {
    setClosing(true);
    const timer = window.setTimeout(() => {
      setClosing(false);
      reset();
      closeAuth();
    }, 840);
    timersRef.current.push(timer);
  }, [closeAuth, reset]);

  useEffect(() => {
    if (!authOpen) return;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Keep the scrollbar in the layout at all times; only its paint and
    // interaction are disabled, so the page cannot reflow when auth opens.
    const lockedScrollY = window.scrollY;
    const lockedPath = window.location.pathname;
    document.documentElement.classList.add("auth-open");

    const isTextInput = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable);

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
    };
    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }
      if (isTextInput(event.target)) return;
      if (
        event.key === " " &&
        event.target instanceof HTMLElement &&
        event.target.closest("button, a")
      ) {
        return;
      }
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) {
        event.preventDefault();
      }
    };
    const handleScroll = () => {
      if (window.location.pathname !== lockedPath) return;
      if (window.scrollY !== lockedScrollY) {
        window.scrollTo(0, lockedScrollY);
      }
    };

    document.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, { passive: true });

    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 500);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll);
      document.documentElement.classList.remove("auth-open");
      if (window.location.pathname === lockedPath) {
        window.scrollTo(0, lockedScrollY);
      }
      previousFocusRef.current?.focus();
    };
  }, [authOpen, requestClose]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (mode !== "otp") return;
    const timer = window.setTimeout(() => otpRefs.current[0]?.focus(), 350);
    return () => window.clearTimeout(timer);
  }, [mode]);

  const beginExitToDashboard = () => {
    setExiting(true);
    const navigateTimer = window.setTimeout(() => router.push("/dashboard"), 80);
    const closeTimer = window.setTimeout(() => {
      setExiting(false);
      reset();
      closeAuth();
    }, 940);
    timersRef.current.push(navigateTimer, closeTimer);
  };

  const validateEmail = () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError("Enter your email address.");
      return null;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError("Enter a valid email address.");
      return null;
    }
    return normalized;
  };

  const sendOtp = async (flow: OtpFlow) => {
    if (busy) return;
    const normalized = validateEmail();
    if (!normalized) return;

    if (flow === "signup") {
      if (!firstName.trim() || !lastName.trim() || !companyName.trim() || !phone.trim()) {
        setError("Complete every field to create your account.");
        return;
      }
      if (!/^[+()\d][\d\s()-]{6,19}$/.test(phone.trim())) {
        setError("Enter a valid phone number.");
        return;
      }
    }

    setError(null);
    setBusy("send");
    setEmail(normalized);
    try {
      const supabase = getSupabaseClient();
      const { error: sendError } = await withTimeout(
        supabase.auth.signInWithOtp({
          email: normalized,
          options: {
            shouldCreateUser: flow === "signup",
            data:
              flow === "signup"
                ? {
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    company_name: companyName.trim(),
                    phone: phone.trim(),
                  }
                : undefined,
          },
        }),
        20000,
        "Sending the code timed out.",
      );

      if (sendError) {
        setError(otpErrorMessage(sendError));
        return;
      }

      setOtpFlow(flow);
      setOtp(EMPTY_OTP);
      setCooldown(60);
      setMode("otp");
    } catch (caught) {
      setError(
        isTimeout(caught)
          ? "Sending the code timed out. Check your connection and try again."
          : otpErrorMessage(caught),
      );
    } finally {
      setBusy(null);
    }
  };

  const setOtpRefFocus = (index: number) => {
    window.setTimeout(() => otpRefs.current[index]?.focus(), 0);
  };

  const verifyOtp = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (busy) return;
    const token = otp.join("");
    if (!/^\d{6}$/.test(token)) {
      setError("Enter the 6-digit code.");
      setOtpRefFocus(0);
      return;
    }

    setError(null);
    setBusy("verify");
    try {
      const supabase = getSupabaseClient();
      const { data, error: verifyError } = await withTimeout(
        supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token,
          type: "email",
        }),
        20000,
        "Verification timed out.",
      );

      if (verifyError || !data.user) {
        setError(otpErrorMessage(verifyError));
        setOtp(EMPTY_OTP);
        setOtpRefFocus(0);
        return;
      }

      const metadata =
        otpFlow === "signup"
          ? {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              company_name: companyName.trim(),
              phone: phone.trim(),
            }
          : ((data.user.user_metadata ?? {}) as Record<string, unknown>);

      await ensureProfile(data.user.id, data.user.email ?? email, metadata).catch(() => {});
      beginExitToDashboard();
    } catch (caught) {
      setError(
        isTimeout(caught)
          ? "Verification timed out. Check your connection and try again."
          : otpErrorMessage(caught),
      );
      setOtp(EMPTY_OTP);
      setOtpRefFocus(0);
    } finally {
      setBusy(null);
    }
  };

  const changeOtpDigit = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      setOtp((current) => current.map((digit, position) => (position === index ? "" : digit)));
      return;
    }
    const chars = digits.slice(0, 6 - index).split("");
    setOtp((current) => {
      const next = [...current];
      chars.forEach((char, offset) => {
        next[index + offset] = char;
      });
      return next;
    });
    setOtpRefFocus(Math.min(5, index + chars.length));
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      setOtp((current) => current.map((digit, position) => (position === index - 1 ? "" : digit)));
      setOtpRefFocus(index - 1);
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    const next = pasted.split("");
    setOtp([...next, ...Array(6 - next.length).fill("")]);
    setOtpRefFocus(Math.min(5, next.length));
  };

  if (!isClient) return null;

  const sheetState = !authOpen ? "closed" : exiting ? "exiting" : closing ? "closing" : "open";
  const isLogin = mode === "login";
  const isSignup = mode === "signup";
  const isOtp = mode === "otp";
  const swapped = mode === "signup" || (mode === "otp" && otpFlow === "signup");

  const heading = isLogin
    ? "Welcome back"
    : isSignup
      ? "Create an account"
      : "Verify your email";

  const subtitle = isLogin
    ? "Enter your email and we'll send you a one-time code."
    : isSignup
      ? "Set up access to your Crestion Labs workspace."
      : `We've sent a verification code to ${email}.`;

  return createPortal(
    <div
      id="crestionlabs-auth"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-heading"
      aria-hidden={!authOpen}
      inert={!authOpen}
      className="auth-sheet fixed inset-y-0 left-0 z-[100] h-[100svh] w-screen overflow-hidden bg-[#ecece2]"
      data-state={sheetState}
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={requestClose}
        className="absolute right-4 top-4 z-40 inline-flex items-center gap-2 rounded-full border border-[#171713]/20 bg-[#ecece2]/90 px-3.5 py-2 font-body text-[11px] font-medium text-black backdrop-blur-sm transition-colors duration-200 hover:border-[#171713]/50 hover:bg-[#ecece2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f5e44] sm:right-7 sm:top-7"
        aria-label="Close authentication"
      >
        <span>Close</span>
        <CloseIcon />
      </button>

      <div className="relative flex h-full w-full overflow-hidden bg-[#ecece2]">
        <section
          className={`relative z-20 flex h-full min-h-0 w-full shrink-0 flex-col items-center justify-center overflow-hidden bg-[#ecece2] px-6 py-8 transition-transform duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)] will-change-transform sm:px-10 lg:w-1/2 lg:px-12 xl:px-16 ${
            swapped ? "lg:translate-x-full" : "lg:translate-x-0"
          }`}
        >
          <div className="relative z-10 h-[540px] w-full max-w-[400px] pt-10">
            <p className="text-center font-cormorant text-[21px] font-medium uppercase leading-none tracking-[0.16em] text-black sm:text-[23px]">
              CRESTION LABS
            </p>

            <div key={mode} className="mt-8">
              <div className="text-center">
                <h1
                  id="auth-heading"
                  className="font-body text-[29px] font-semibold leading-tight tracking-[-0.03em] text-black sm:text-[32px]"
                >
                  {heading}
                </h1>
                <p className="mx-auto mt-2 max-w-[330px] font-body text-[12.5px] leading-5 text-black">
                  {subtitle}
                </p>
              </div>

              {isLogin && (
                <form
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sendOtp("login");
                  }}
                  className="mt-7"
                >
                  <label htmlFor="auth-email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="auth-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@studio.com"
                    className={inputClass}
                  />
                  <button type="submit" disabled={busy !== null} className={primaryClass}>
                    {busy === "send" ? "Sending code…" : "Send code"}
                  </button>
                </form>
              )}

              {isSignup && (
                <form
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sendOtp("signup");
                  }}
                  className="mt-6"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="auth-first-name" className={labelClass}>
                        First name
                      </label>
                      <input
                        id="auth-first-name"
                        name="given-name"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        placeholder="First name"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="auth-last-name" className={labelClass}>
                        Last name
                      </label>
                      <input
                        id="auth-last-name"
                        name="family-name"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        placeholder="Last name"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label htmlFor="auth-signup-email" className={labelClass}>
                      Email
                    </label>
                    <input
                      id="auth-signup-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@studio.com"
                      className={inputClass}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="auth-company" className={labelClass}>
                        Company name
                      </label>
                      <input
                        id="auth-company"
                        name="organization"
                        autoComplete="organization"
                        value={companyName}
                        onChange={(event) => setCompanyName(event.target.value)}
                        placeholder="Studio or firm"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="auth-phone" className={labelClass}>
                        Phone number
                      </label>
                      <input
                        id="auth-phone"
                        name="tel"
                        type="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="+91 98765 43210"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={busy !== null} className={primaryClass}>
                    {busy === "send" ? "Sending code…" : "Send code"}
                  </button>
                </form>
              )}

              {isOtp && (
                <form onSubmit={verifyOtp} className="mt-6">
                  <div className="grid grid-cols-6 gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(element) => {
                          otpRefs.current[index] = element;
                        }}
                        value={digit}
                        onChange={(event) => changeOtpDigit(index, event.target.value)}
                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                        onPaste={handleOtpPaste}
                        inputMode="numeric"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        maxLength={1}
                        aria-label={`Verification code digit ${index + 1}`}
                        className={otpBoxClass}
                      />
                    ))}
                  </div>
                  <button
                    type="submit"
                    disabled={busy !== null || otp.join("").length !== 6}
                    className={primaryClass}
                  >
                    {busy === "verify" ? "Verifying…" : "Verify code"}
                  </button>
                  <div className="mt-5 text-center">
                    <p className="font-body text-[11.5px] text-black">Didn&apos;t receive the code?</p>
                    <button
                      type="button"
                      onClick={() => void sendOtp(otpFlow)}
                      disabled={cooldown > 0 || busy !== null}
                      className="mt-1 font-body text-[11.5px] font-medium text-black underline decoration-black/30 underline-offset-4 transition-colors hover:decoration-black disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => reset(otpFlow, otpFlow)}
                    disabled={busy !== null}
                    className="mt-4 w-full text-center font-body text-[11px] text-black/60 transition-colors hover:text-black disabled:opacity-50"
                  >
                    Use a different email
                  </button>
                </form>
              )}

              {!isOtp && (
                <p className="mt-5 text-center font-body text-[12px] text-black">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => reset(isLogin ? "signup" : "login", isLogin ? "signup" : "login")}
                    disabled={busy !== null}
                    className="font-medium text-black underline decoration-black/30 underline-offset-4 transition-colors duration-200 hover:decoration-black disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f5e44]"
                  >
                    {isLogin ? "Sign up" : "Sign in"}
                  </button>
                </p>
              )}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="absolute bottom-4 left-1/2 z-30 w-[calc(100%-3rem)] max-w-[370px] -translate-x-1/2 rounded-[7px] bg-[#171713] px-4 py-2.5 text-center font-body text-[12px] leading-5 text-[#f0f1e6] shadow-lg"
            >
              {error}
            </div>
          )}
        </section>

        <aside
          className={`relative z-10 hidden h-full w-1/2 shrink-0 items-center justify-center p-8 transition-transform duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)] will-change-transform lg:flex xl:p-10 ${
            swapped ? "lg:-translate-x-full" : "lg:translate-x-0"
          }`}
        >
          <div className="relative h-full max-h-[860px] w-full max-w-[680px] overflow-hidden rounded-[28px] border border-black/10 bg-black">
            <Image
              src="/showcase/auth-crestionlabs-canopy-photo.jpg"
              alt="Black-and-white photograph of an organic vaulted architectural canopy at night"
              fill
              priority
              quality={90}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-center"
            />
            <div
              className="pointer-events-none absolute inset-0 grid-lines opacity-45"
              style={{ "--grid-line-color": "rgba(240, 241, 230, 0.13)" } as React.CSSProperties}
              aria-hidden="true"
            />
          </div>
        </aside>
      </div>
    </div>,
    document.body,
  );
};

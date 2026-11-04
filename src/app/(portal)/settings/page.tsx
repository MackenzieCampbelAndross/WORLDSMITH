"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { LoadingBlock } from "@/components/portal/EmptyState";
import { formatDate } from "@/lib/format";
import {
  saveNotificationPrefs,
  type NotificationPrefs,
} from "@/lib/portal";
import { getSupabaseClient } from "@/lib/supabase";

const LogoutIcon = () => (
  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
    <path d="M12.5 6.2V3.8H4v12.4h8.5v-2.4M8.7 10h8M14.4 7.2 17.2 10l-2.8 2.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function SettingsPage() {
  const { user, profile, refreshProfile, logout } = useAuth();
  const [active, setActive] = useState("security");

  if (!user) {
    return <LoadingBlock className="h-64 w-full" />;
  }

  return (
    <div>
      <p className="font-body text-[9.5px] uppercase tracking-[0.2em] text-[#8a8374]">Settings</p>
      <h1 className="mt-2 font-display text-[32px] font-medium leading-none tracking-[-0.035em] text-[#171713] sm:text-[40px]">
        Your account.
      </h1>
      <p className="mt-3 max-w-[520px] font-body text-[12.5px] leading-5 text-[#716b5d]">
        Security credentials, notification preferences, and account controls.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[170px_1fr]">
        <nav className="hidden lg:block">
          <div className="sticky top-24 space-y-1">
            {[
              { id: "security", label: "Security" },
              { id: "notifications", label: "Notifications" },
              { id: "account", label: "Account" },
            ].map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={() => setActive(section.id)}
                className={`block border-l py-2 pl-3 font-body text-[11.5px] transition-colors ${
                  active === section.id
                    ? "border-[#2f3423] text-[#171713]"
                    : "border-[#dbd4c5] text-[#8a8374] hover:text-[#2f3423]"
                }`}
              >
                {section.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="space-y-8">
          <section id="security" className="border border-[#dbd4c5] bg-[#f3efe4]">
            <div className="border-b border-[#dbd4c5] px-5 py-4">
              <h2 className="font-accent text-[22px] leading-none text-[#171713]">Security</h2>
            </div>
            <SecuritySection email={user.email ?? ""} />
          </section>

          <section id="notifications" className="border border-[#dbd4c5] bg-[#f3efe4]">
            <div className="border-b border-[#dbd4c5] px-5 py-4">
              <h2 className="font-accent text-[22px] leading-none text-[#171713]">Notifications</h2>
            </div>
            <NotificationsSection
              key={profile?.email ?? "pending-profile"}
              uid={user.id}
              prefs={
                profile?.notificationPrefs ?? {
                  production_updates: true,
                  review_requests: true,
                  world_ready: true,
                  newsletter: false,
                }
              }
              onSaved={refreshProfile}
            />
          </section>

          <section id="account" className="border border-[#dbd4c5] bg-[#f3efe4]">
            <div className="border-b border-[#dbd4c5] px-5 py-4">
              <h2 className="font-accent text-[22px] leading-none text-[#171713]">Account</h2>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
              <div>
                <p className="font-body text-[11.5px] text-[#3f3b33]">Request account deletion</p>
                <p className="mt-1 font-body text-[10.5px] text-[#8a8374]">
                  Account contents and project records are removed after review.
                </p>
              </div>
              <a
                href="mailto:crestionlabs@gmail.com?subject=Crestion%20Labs%20account%20deletion%20request"
                className="border border-[#d2cab8] px-4 py-2 font-body text-[9.5px] uppercase tracking-[0.12em] text-[#716b5d] transition-colors hover:border-[#2f3423] hover:text-[#2f3423]"
              >
                Contact Crestion Labs
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#fecdca]/60 bg-[#fffbfa] px-5 py-5">
              <div>
                <p className="font-body text-[12px] font-semibold text-[#b42318]">Sign out</p>
                <p className="mt-1 font-body text-[10.5px] text-[#8c4a45]">
                  Sign out of your session on this device. You will need your email to sign back in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex items-center gap-2 rounded-[7px] border border-[#fecdca] bg-[#fee4e2] px-4 py-2 font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#b42318] transition-colors hover:border-[#fda29b] hover:bg-[#fecdca] hover:text-[#912018]"
              >
                <LogoutIcon />
                Sign out
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SecuritySection({ email }: { email: string }) {
  const router = useRouter();
  const [session, setSession] = useState<{ expires: Date | null; lastSignIn: Date | null }>({
    expires: null,
    lastSignIn: null,
  });

  useEffect(() => {
    let active = true;
    void getSupabaseClient()
      .auth.getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession({
          expires: data.session?.expires_at ? new Date(data.session.expires_at * 1000) : null,
          lastSignIn: data.session?.user.last_sign_in_at
            ? new Date(data.session.user.last_sign_in_at)
            : null,
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const signOutEverywhere = async () => {
    await getSupabaseClient().auth.signOut({ scope: "global" });
    router.replace("/");
  };

  return (
    <div>
      <div className="px-5 py-5">
        <p className="font-body text-[9px] uppercase tracking-[0.16em] text-[#8a8374]">Sign-in method</p>
        <p className="mt-2 max-w-[480px] font-body text-[11.5px] leading-5 text-[#716b5d]">
          Crestion Labs uses email one-time codes. There is no password to create,
          change or reset. A verified code establishes your session.
        </p>
      </div>

      <div className="border-t border-[#e3ddce] px-5 py-5">
        <p className="font-body text-[9px] uppercase tracking-[0.16em] text-[#8a8374]">Current session</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="font-body text-[10px] text-[#8a8374]">Signed in as</p>
            <p className="mt-1 truncate font-body text-[11.5px] text-[#3f3b33]">{email}</p>
          </div>
          <div>
            <p className="font-body text-[10px] text-[#8a8374]">Last sign-in</p>
            <p className="mt-1 font-body text-[11.5px] text-[#3f3b33]">{formatDate(session.lastSignIn)}</p>
          </div>
          <div>
            <p className="font-body text-[10px] text-[#8a8374]">Session expires</p>
            <p className="mt-1 font-body text-[11.5px] text-[#3f3b33]">{formatDate(session.expires)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void signOutEverywhere()}
          className="mt-4 border border-[#d2cab8] px-4 py-2 font-body text-[9.5px] uppercase tracking-[0.12em] text-[#716b5d] transition-colors hover:border-[#8a5a2f] hover:text-[#8a5a2f]"
        >
          Sign out of all devices
        </button>
      </div>
    </div>
  );
}

function NotificationsSection({
  uid,
  prefs: initialPrefs,
  onSaved,
}: {
  uid: string;
  prefs: NotificationPrefs;
  onSaved: () => Promise<void>;
}) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const rows: Array<{ key: keyof NotificationPrefs; label: string; hint: string }> = [
    { key: "production_updates", label: "Production updates", hint: "Status changes and production milestones." },
    { key: "review_requests", label: "Review requests", hint: "When a world is ready for your feedback." },
    { key: "world_ready", label: "World ready", hint: "When the final interactive world is published." },
    { key: "newsletter", label: "Crestion Labs notes", hint: "Occasional studio and platform updates." },
  ];

  const save = async () => {
    if (status === "saving") return;
    setStatus("saving");
    try {
      await saveNotificationPrefs(uid, prefs);
      await onSaved();
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="px-5 py-5">
      <div className="divide-y divide-[#e3ddce]">
        {rows.map((row) => (
          <label key={row.key} className="flex cursor-pointer items-center justify-between gap-6 py-3.5">
            <span>
              <span className="block font-body text-[11.5px] text-[#3f3b33]">{row.label}</span>
              <span className="mt-0.5 block font-body text-[10px] text-[#8a8374]">{row.hint}</span>
            </span>
            <input
              type="checkbox"
              checked={prefs[row.key]}
              onChange={(event) => setPrefs((current) => ({ ...current, [row.key]: event.target.checked }))}
              className="h-4 w-4 accent-[#2f3423]"
            />
          </label>
        ))}
      </div>
      <FormStatus status={status} savedLabel="Notification preferences saved." errorLabel="We couldn't save your preferences." />
      <button type="button" onClick={() => void save()} disabled={status === "saving"} className="mt-5 bg-[#2f3423] px-5 py-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#e8e2d5] disabled:opacity-60">
        {status === "saving" ? "Saving…" : "Save preferences"}
      </button>
    </div>
  );
}

function FormStatus({
  status,
  savedLabel,
  errorLabel,
}: {
  status: "idle" | "saving" | "saved" | "error";
  savedLabel: string;
  errorLabel: string;
}) {
  if (status === "saved") {
    return <p className="mt-4 font-body text-[11px] text-[#2f3423]">{savedLabel}</p>;
  }
  if (status === "error") {
    return <p className="mt-4 font-body text-[11px] text-[#8a5a2f]">{errorLabel}</p>;
  }
  return null;
}

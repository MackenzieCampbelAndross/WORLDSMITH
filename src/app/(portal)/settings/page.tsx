"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { LoadingBlock } from "@/components/portal/EmptyState";
import { formatDate } from "@/lib/format";
import {
  fetchCompany,
  saveCompany,
  saveNotificationPrefs,
  saveProfile,
  type Company,
  type NotificationPrefs,
} from "@/lib/portal";
import { getSupabaseClient } from "@/lib/supabase";

const inputClass =
  "mt-1.5 h-10 w-full border border-[#d8d2c4] bg-transparent px-3 font-body text-[12.5px] text-[#171713] outline-none transition-colors focus:border-[#1f5e44]";
const labelClass = "font-body text-[9px] uppercase tracking-[0.16em] text-[#8a8374]";

const initials = (first: string, last: string, email: string) => {
  const a = first.trim()[0] ?? email[0] ?? "W";
  const b = last.trim()[0] ?? "";
  return `${a}${b}`.toUpperCase();
};

export default function SettingsPage() {
  const { user, profile, refreshProfile, logout } = useAuth();
  const [active, setActive] = useState("profile");

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
        Contact details, company information and account security.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[170px_1fr]">
        <nav className="hidden lg:block">
          <div className="sticky top-24 space-y-1">
            {[
              { id: "profile", label: "Profile" },
              { id: "company", label: "Company" },
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
                    ? "border-[#1f5e44] text-[#171713]"
                    : "border-[#e2ddd1] text-[#8a8374] hover:text-[#1f5e44]"
                }`}
              >
                {section.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="space-y-8">
          <section id="profile" className="border border-[#e2ddd1] bg-[#fdfbf6]">
            <div className="flex items-center gap-4 border-b border-[#e2ddd1] px-5 py-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0e9d8] font-body text-[12px] font-semibold text-[#1b4a36]">
                {initials(profile?.firstName ?? "", profile?.lastName ?? "", user.email ?? "")}
              </span>
              <div>
                <h2 className="font-accent text-[22px] leading-none text-[#171713]">Profile</h2>
                <p className="mt-1 font-body text-[10.5px] text-[#8a8374]">
                  Your initials stand in for a profile image.
                </p>
              </div>
            </div>
            <ProfileForm
              key={profile?.email ?? "pending-profile"}
              uid={user.id}
              email={user.email ?? ""}
              profile={profile}
              onSaved={refreshProfile}
            />
          </section>

          <section id="company" className="border border-[#e2ddd1] bg-[#fdfbf6]">
            <div className="border-b border-[#e2ddd1] px-5 py-4">
              <h2 className="font-accent text-[22px] leading-none text-[#171713]">Company</h2>
            </div>
            <CompanySection uid={user.id} onSaved={refreshProfile} />
          </section>

          <section id="security" className="border border-[#e2ddd1] bg-[#fdfbf6]">
            <div className="border-b border-[#e2ddd1] px-5 py-4">
              <h2 className="font-accent text-[22px] leading-none text-[#171713]">Security</h2>
            </div>
            <SecuritySection email={user.email ?? ""} />
          </section>

          <section id="notifications" className="border border-[#e2ddd1] bg-[#fdfbf6]">
            <div className="border-b border-[#e2ddd1] px-5 py-4">
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

          <section id="account" className="border border-[#e2ddd1] bg-[#fdfbf6]">
            <div className="border-b border-[#e2ddd1] px-5 py-4">
              <h2 className="font-accent text-[22px] leading-none text-[#171713]">Account</h2>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
              <div>
                <p className="font-body text-[11.5px] text-[#3f3b33]">Sign out of Crestion Labs</p>
                <p className="mt-1 font-body text-[10.5px] text-[#8a8374]">
                  You will need your email to request a new one-time code.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="border border-[#d8d2c4] px-4 py-2 font-body text-[9.5px] uppercase tracking-[0.12em] text-[#716b5d] transition-colors hover:border-[#1f5e44] hover:text-[#1f5e44]"
              >
                Sign out
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#eee9df] px-5 py-5">
              <div>
                <p className="font-body text-[11.5px] text-[#3f3b33]">Request account deletion</p>
                <p className="mt-1 font-body text-[10.5px] text-[#8a8374]">
                  Account contents and project records are removed after review.
                </p>
              </div>
              <a
                href="mailto:crestionlabs@gmail.com?subject=Crestion%20Labs%20account%20deletion%20request"
                className="border border-[#d8d2c4] px-4 py-2 font-body text-[9.5px] uppercase tracking-[0.12em] text-[#716b5d] transition-colors hover:border-[#1f5e44] hover:text-[#1f5e44]"
              >
                Contact Crestion Labs
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ProfileForm({
  uid,
  email,
  profile,
  onSaved,
}: {
  uid: string;
  email: string;
  profile: { firstName: string; lastName: string; phone: string } | null;
  onSaved: () => Promise<void>;
}) {
  const [firstName, setFirstName] = useState(profile?.firstName ?? "");
  const [lastName, setLastName] = useState(profile?.lastName ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "saving") return;
    setStatus("saving");
    try {
      await saveProfile(uid, { firstName, lastName, phone });
      await onSaved();
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={save} className="px-5 py-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="settings-first" className={labelClass}>First name</label>
          <input id="settings-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="settings-last" className={labelClass}>Last name</label>
          <input id="settings-last" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="settings-phone" className={labelClass}>Phone number</label>
          <input id="settings-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="settings-email" className={labelClass}>Email</label>
          <input id="settings-email" value={email} readOnly className={`${inputClass} cursor-not-allowed text-[#8a8374]`} />
          <p className="mt-1 font-body text-[9.5px] text-[#a0988a]">Managed by Supabase Auth.</p>
        </div>
      </div>
      <FormStatus status={status} savedLabel="Profile saved." errorLabel="We couldn't save your profile. Please try again." />
      <button type="submit" disabled={status === "saving"} className="mt-5 bg-[#1f5e44] px-5 py-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f7f4ec] disabled:opacity-60">
        {status === "saving" ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

function CompanySection({ uid, onSaved }: { uid: string; onSaved: () => Promise<void> }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    let active = true;
    void fetchCompany(uid)
      .then((next) => {
        if (!active) return;
        setCompany(next);
        setName(next?.name ?? "");
        setWebsite(next?.website ?? "");
        setDetails(next?.details ?? "");
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
        setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [uid]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "saving") return;
    setStatus("saving");
    try {
      const saved = await saveCompany(uid, { name, website, details });
      setCompany(saved);
      await onSaved();
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  if (loading) return <div className="px-5 py-5"><LoadingBlock className="h-24 w-full" /></div>;

  if (loadError) {
    return (
      <div className="px-5 py-5">
        <p className="font-body text-[11.5px] text-[#8a5a2f]">
          Company details are unavailable right now. Refresh the page to try again.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="px-5 py-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="settings-company" className={labelClass}>Company name</label>
          <input id="settings-company" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="settings-website" className={labelClass}>Website</label>
          <input id="settings-website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="settings-details" className={labelClass}>Company details</label>
          <textarea id="settings-details" value={details} onChange={(e) => setDetails(e.target.value)} rows={3} className={`${inputClass} h-auto py-2.5 leading-5`} />
        </div>
      </div>
      <FormStatus status={status} savedLabel="Company updated." errorLabel="We couldn't save the company. Please try again." />
      <button type="submit" disabled={status === "saving"} className="mt-5 bg-[#1f5e44] px-5 py-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f7f4ec] disabled:opacity-60">
        {status === "saving" ? "Saving…" : `Save ${company ? "company" : "company details"}`}
      </button>
    </form>
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

      <div className="border-t border-[#eee9df] px-5 py-5">
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
          className="mt-4 border border-[#d8d2c4] px-4 py-2 font-body text-[9.5px] uppercase tracking-[0.12em] text-[#716b5d] transition-colors hover:border-[#8a5a2f] hover:text-[#8a5a2f]"
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
      <div className="divide-y divide-[#eee9df]">
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
              className="h-4 w-4 accent-[#1f5e44]"
            />
          </label>
        ))}
      </div>
      <FormStatus status={status} savedLabel="Notification preferences saved." errorLabel="We couldn't save your preferences." />
      <button type="button" onClick={() => void save()} disabled={status === "saving"} className="mt-5 bg-[#1f5e44] px-5 py-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f7f4ec] disabled:opacity-60">
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
    return <p className="mt-4 font-body text-[11px] text-[#1f5e44]">{savedLabel}</p>;
  }
  if (status === "error") {
    return <p className="mt-4 font-body text-[11px] text-[#8a5a2f]">{errorLabel}</p>;
  }
  return null;
}

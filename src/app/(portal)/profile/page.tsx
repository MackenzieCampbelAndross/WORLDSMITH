"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { LoadingBlock } from "@/components/portal/EmptyState";
import { fetchFullClientProfile, type FullClientProfile } from "@/lib/portal";
import { ClientProfileView } from "@/components/portal/client-profile/ClientProfileView";

const initialsFor = (first: string, last: string, email: string) => {
  const a = first.trim()[0] ?? email[0] ?? "C";
  const b = last.trim()[0] ?? "";
  return `${a}${b}`.toUpperCase();
};

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullProfile, setFullProfile] = useState<FullClientProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;

    void (async () => {
      try {
        const data = await fetchFullClientProfile(user.id);
        if (active) setFullProfile(data);
      } catch (err) {
        console.error("Failed to fetch full client profile:", err);
      } finally {
        if (active) setLoadingProfile(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user]);

  if (!user || loadingProfile || !fullProfile) {
    return (
      <div className="mx-auto w-full max-w-[960px] space-y-4">
        <LoadingBlock className="h-28 w-full rounded-[14px]" />
        <LoadingBlock className="h-20 w-full rounded-[14px]" />
        <LoadingBlock className="h-64 w-full rounded-[14px]" />
      </div>
    );
  }

  const displayName =
    [fullProfile.personal.firstName, fullProfile.personal.lastName].filter(Boolean).join(" ") ||
    user.email ||
    "Client";

  return (
    <div className="mx-auto w-full max-w-[960px] pb-12">
      {/* Page Header */}
      <div className="mb-6">
        <p className="font-body text-[9.5px] uppercase tracking-[0.2em] text-[#8a8374]">
          Client Profile & Organisation
        </p>
        <h1 className="mt-2 font-accent text-[34px] font-medium leading-none tracking-tight text-[#17201b] sm:text-[40px]">
          Client Profile.
        </h1>
        <p className="mt-2.5 max-w-[620px] font-body text-[12px] leading-5 text-[#6f756d]">
          Maintain your personal credentials, corporate entity, billing contacts, and architectural brand parameters. These details govern presentation watermarks, contract generation, and automated communications.
        </p>
      </div>

      {/* Identity Summary Card */}
      <section className="mb-6 overflow-hidden rounded-[14px] border border-black/[0.08] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border border-black/[0.1] bg-[#eef5f1] shadow-inner">
              {fullProfile.personal.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fullProfile.personal.avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-body text-[15px] font-bold text-[#1f5e44]">
                  {initialsFor(
                    fullProfile.personal.firstName,
                    fullProfile.personal.lastName,
                    user.email ?? ""
                  )}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-body text-[16px] font-semibold text-[#17201b]">
                  {displayName}
                </h2>
                <span className="inline-flex items-center rounded-full bg-[#eef5f1] px-2 py-0.5 font-body text-[9.5px] font-medium text-[#1f5e44]">
                  Verified Account
                </span>
              </div>
              <p className="mt-0.5 truncate font-body text-[11.5px] text-[#6f756d]">
                {fullProfile.personal.title ? `${fullProfile.personal.title} · ` : ""}
                <span className="font-medium text-[#17201b]">
                  {fullProfile.company.name || profile?.companyName || "CreSTION Client"}
                </span>
                {" · "}
                <span>{user.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 rounded-[7px] border border-black/[0.1] bg-white px-3 py-1.5 font-body text-[11px] font-medium text-[#17201b] transition-colors hover:border-[#1f5e44] hover:bg-neutral-50 hover:text-[#1f5e44]"
            >
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                <circle cx="10" cy="10" r="3" strokeWidth="1.2" />
                <path d="M10 2.5v2.5M10 15v2.5M2.5 10H5M15 10h2.5" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span>Security Settings</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive 6-Section Profile View */}
      <ClientProfileView
        uid={user.id}
        initialProfile={fullProfile}
        onProfileUpdated={refreshProfile}
      />

      {/* Footer Navigation */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-black/[0.06] pt-4 font-body text-[11px]">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-[#2f6b4c] transition-colors hover:text-[#143f2d]"
        >
          <span>← Security & notification settings</span>
        </Link>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-[#2f6b4c] transition-colors hover:text-[#143f2d]"
        >
          <span>View project catalog →</span>
        </Link>
      </div>
    </div>
  );
}

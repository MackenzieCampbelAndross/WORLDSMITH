"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { LoadingBlock } from "@/components/portal/EmptyState";
import { ProfileForm } from "@/components/portal/ProfileForm";

const initialsFor = (first: string, last: string, email: string) => {
  const a = first.trim()[0] ?? email[0] ?? "C";
  const b = last.trim()[0] ?? "";
  return `${a}${b}`.toUpperCase();
};

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();

  if (!user) {
    return <LoadingBlock className="h-64 w-full" />;
  }

  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || user.email || "Client";

  return (
    <div className="mx-auto w-full max-w-[760px]">
      <p className="font-body text-[9.5px] uppercase tracking-[0.2em] text-[#8a8374]">Profile</p>
      <h1 className="mt-2 font-body text-[26px] font-semibold leading-none tracking-[-0.03em] text-[#17201b]">
        Your profile.
      </h1>
      <p className="mt-2 max-w-[520px] font-body text-[11.5px] leading-5 text-[#6f756d]">
        Your name and contact number appear on projects and correspondence.
      </p>

      <section className="mt-5 overflow-hidden rounded-[12px] border border-[#dbd4c5] bg-white">
        <div className="flex items-center gap-4 border-b border-[#dbd4c5] px-5 py-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e6e3d7] font-body text-[12px] font-semibold text-[#2b3021]">
            {initialsFor(profile?.firstName ?? "", profile?.lastName ?? "", user.email ?? "")}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-body text-[14px] font-semibold text-[#17201b]">{displayName}</h2>
            <p className="mt-0.5 truncate font-body text-[10.5px] text-[#8a8374]">
              {profile?.companyName || user.email}
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

      <Link
        href="/settings"
        className="mt-4 inline-flex font-body text-[10.5px] text-[#3c4430] transition-colors hover:text-[#202415]"
      >
        Account settings →
      </Link>
    </div>
  );
}

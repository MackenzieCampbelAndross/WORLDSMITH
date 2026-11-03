"use client";

import React, { useState } from "react";
import { saveProfile } from "@/lib/portal";

const inputClass =
  "mt-1.5 h-10 w-full border border-[#d8d2c4] bg-transparent px-3 font-body text-[12.5px] text-[#171713] outline-none transition-colors focus:border-[#1f5e44]";
const labelClass = "font-body text-[9px] uppercase tracking-[0.16em] text-[#8a8374]";

export const ProfileForm = ({
  uid,
  email,
  profile,
  onSaved,
}: {
  uid: string;
  email: string;
  profile: { firstName: string; lastName: string; phone: string } | null;
  onSaved: () => Promise<void>;
}) => {
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
          <label htmlFor="profile-first" className={labelClass}>First name</label>
          <input id="profile-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="profile-last" className={labelClass}>Last name</label>
          <input id="profile-last" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="profile-phone" className={labelClass}>Phone number</label>
          <input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="profile-email" className={labelClass}>Email</label>
          <input id="profile-email" value={email} readOnly className={`${inputClass} cursor-not-allowed text-[#8a8374]`} />
          <p className="mt-1 font-body text-[9.5px] text-[#a0988a]">Managed by Supabase Auth.</p>
        </div>
      </div>
      {status === "saved" && <p className="mt-4 font-body text-[11px] text-[#1f5e44]">Profile saved.</p>}
      {status === "error" && (
        <p className="mt-4 font-body text-[11px] text-[#8a5a2f]">We couldn&apos;t save your profile. Please try again.</p>
      )}
      <button
        type="submit"
        disabled={status === "saving"}
        className="mt-5 bg-[#1f5e44] px-5 py-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f7f4ec] disabled:opacity-60"
      >
        {status === "saving" ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
};

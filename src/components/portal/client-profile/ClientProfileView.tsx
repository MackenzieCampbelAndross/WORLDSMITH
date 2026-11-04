"use client";

import React, { useState } from "react";
import {
  type FullClientProfile,
  saveClientProfileSection,
  BUSINESS_TYPES,
  COMPANY_SIZES,
  BRANDING_OPTIONS,
  DISCOVERY_SOURCES,
} from "@/lib/portal";
import { ProfileCompletionBar } from "./ProfileCompletionBar";
import { ImageUploadField, PdfUploadField, ColorPickerField } from "./UploadFields";
import { SectionCard } from "./SectionCard";

const inputClass =
  "h-10 w-full rounded-[8px] border border-black/[0.1] bg-white px-3 font-body text-[12.5px] text-[#171713] outline-none transition-colors focus:border-[#1f5e44] focus:ring-1 focus:ring-[#1f5e44] disabled:bg-neutral-50 disabled:cursor-not-allowed";
const selectClass =
  "h-10 w-full rounded-[8px] border border-black/[0.1] bg-white px-3 font-body text-[12.5px] text-[#171713] outline-none transition-colors focus:border-[#1f5e44] focus:ring-1 focus:ring-[#1f5e44] disabled:bg-neutral-50";
const textareaClass =
  "w-full rounded-[8px] border border-black/[0.1] bg-white p-3 font-body text-[12.5px] text-[#171713] outline-none transition-colors focus:border-[#1f5e44] focus:ring-1 focus:ring-[#1f5e44] disabled:bg-neutral-50";
const labelClass =
  "mb-1.5 flex items-center justify-between font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#555]";

const ReadItem: React.FC<{
  label: string;
  value?: string | React.ReactNode;
  fallback?: string;
  fullWidth?: boolean;
}> = ({ label, value, fallback = "Not specified", fullWidth = false }) => (
  <div className={fullWidth ? "col-span-full" : ""}>
    <dt className="font-body text-[9.5px] uppercase tracking-[0.14em] text-neutral-400">
      {label}
    </dt>
    <dd className="mt-1 font-body text-[13px] font-medium text-[#17201b]">
      {value ? value : <span className="font-normal italic text-neutral-400">{fallback}</span>}
    </dd>
  </div>
);

export const ClientProfileView: React.FC<{
  uid: string;
  initialProfile: FullClientProfile;
  onProfileUpdated?: () => Promise<void>;
}> = ({ uid, initialProfile, onProfileUpdated }) => {
  const [profile, setProfile] = useState<FullClientProfile>(initialProfile);

  // Active editing section ("personal" | "company" | "address" | "contacts" | "brand" | "additional" | null)
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Draft state per section
  const [personalDraft, setPersonalDraft] = useState(profile.personal);
  const [companyDraft, setCompanyDraft] = useState(profile.company);
  const [addressDraft, setAddressDraft] = useState(profile.address);
  const [contactsDraft, setContactsDraft] = useState(profile.contacts);
  const [brandDraft, setBrandDraft] = useState(profile.brand);
  const [additionalDraft, setAdditionalDraft] = useState(profile.additional);

  // Save statuses per section
  const [saveStatus, setSaveStatus] = useState<Record<string, "idle" | "saving" | "saved" | "error">>({});
  const [saveError, setSaveError] = useState<Record<string, string | null>>({});

  // Section Save Handlers
  const handleSavePersonal = async () => {
    if (!personalDraft.firstName.trim() || !personalDraft.lastName.trim()) {
      setSaveError((prev) => ({ ...prev, personal: "First and last name are required." }));
      setSaveStatus((prev) => ({ ...prev, personal: "error" }));
      return;
    }
    if (!personalDraft.title.trim()) {
      setSaveError((prev) => ({ ...prev, personal: "Professional title is required." }));
      setSaveStatus((prev) => ({ ...prev, personal: "error" }));
      return;
    }
    if (!personalDraft.phone.trim()) {
      setSaveError((prev) => ({ ...prev, personal: "Contact phone number is required." }));
      setSaveStatus((prev) => ({ ...prev, personal: "error" }));
      return;
    }

    setSaveStatus((prev) => ({ ...prev, personal: "saving" }));
    setSaveError((prev) => ({ ...prev, personal: null }));

    try {
      const updated = await saveClientProfileSection(uid, "personal", personalDraft);
      setProfile(updated);
      setPersonalDraft(updated.personal);
      setSaveStatus((prev) => ({ ...prev, personal: "saved" }));
      setEditingSection(null);
      if (onProfileUpdated) await onProfileUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save personal information.";
      setSaveError((prev) => ({ ...prev, personal: msg }));
      setSaveStatus((prev) => ({ ...prev, personal: "error" }));
    }
  };

  const handleSaveCompany = async () => {
    if (!companyDraft.name.trim()) {
      setSaveError((prev) => ({ ...prev, company: "Company name is required." }));
      setSaveStatus((prev) => ({ ...prev, company: "error" }));
      return;
    }
    if (!companyDraft.website.trim()) {
      setSaveError((prev) => ({ ...prev, company: "Company website is required." }));
      setSaveStatus((prev) => ({ ...prev, company: "error" }));
      return;
    }

    setSaveStatus((prev) => ({ ...prev, company: "saving" }));
    setSaveError((prev) => ({ ...prev, company: null }));

    try {
      const updated = await saveClientProfileSection(uid, "company", companyDraft);
      setProfile(updated);
      setCompanyDraft(updated.company);
      setSaveStatus((prev) => ({ ...prev, company: "saved" }));
      setEditingSection(null);
      if (onProfileUpdated) await onProfileUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save company information.";
      setSaveError((prev) => ({ ...prev, company: msg }));
      setSaveStatus((prev) => ({ ...prev, company: "error" }));
    }
  };

  const handleSaveAddress = async () => {
    if (!addressDraft.country.trim() || !addressDraft.city.trim() || !addressDraft.officeAddress.trim() || !addressDraft.postalCode.trim()) {
      setSaveError((prev) => ({ ...prev, address: "Please fill in all required address fields." }));
      setSaveStatus((prev) => ({ ...prev, address: "error" }));
      return;
    }

    setSaveStatus((prev) => ({ ...prev, address: "saving" }));
    setSaveError((prev) => ({ ...prev, address: null }));

    try {
      const updated = await saveClientProfileSection(uid, "address", addressDraft);
      setProfile(updated);
      setAddressDraft(updated.address);
      setSaveStatus((prev) => ({ ...prev, address: "saved" }));
      setEditingSection(null);
      if (onProfileUpdated) await onProfileUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save business address.";
      setSaveError((prev) => ({ ...prev, address: msg }));
      setSaveStatus((prev) => ({ ...prev, address: "error" }));
    }
  };

  const handleSaveContacts = async () => {
    if (!contactsDraft.primaryContactName.trim() || !contactsDraft.primaryContactEmail.trim() || !contactsDraft.primaryContactPhone.trim()) {
      setSaveError((prev) => ({ ...prev, contacts: "Primary contact name, email, and phone are required." }));
      setSaveStatus((prev) => ({ ...prev, contacts: "error" }));
      return;
    }
    if (!contactsDraft.billingEmail.trim()) {
      setSaveError((prev) => ({ ...prev, contacts: "Accounts / billing email is required." }));
      setSaveStatus((prev) => ({ ...prev, contacts: "error" }));
      return;
    }

    setSaveStatus((prev) => ({ ...prev, contacts: "saving" }));
    setSaveError((prev) => ({ ...prev, contacts: null }));

    try {
      const updated = await saveClientProfileSection(uid, "contacts", contactsDraft);
      setProfile(updated);
      setContactsDraft(updated.contacts);
      setSaveStatus((prev) => ({ ...prev, contacts: "saved" }));
      setEditingSection(null);
      if (onProfileUpdated) await onProfileUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save business contacts.";
      setSaveError((prev) => ({ ...prev, contacts: msg }));
      setSaveStatus((prev) => ({ ...prev, contacts: "error" }));
    }
  };

  const handleSaveBrand = async () => {
    if (!brandDraft.primaryColor.trim() || !brandDraft.secondaryColor.trim()) {
      setSaveError((prev) => ({ ...prev, brand: "Primary and secondary brand colours are required." }));
      setSaveStatus((prev) => ({ ...prev, brand: "error" }));
      return;
    }

    setSaveStatus((prev) => ({ ...prev, brand: "saving" }));
    setSaveError((prev) => ({ ...prev, brand: null }));

    try {
      const updated = await saveClientProfileSection(uid, "brand", brandDraft);
      setProfile(updated);
      setBrandDraft(updated.brand);
      setSaveStatus((prev) => ({ ...prev, brand: "saved" }));
      setEditingSection(null);
      if (onProfileUpdated) await onProfileUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save brand identity.";
      setSaveError((prev) => ({ ...prev, brand: msg }));
      setSaveStatus((prev) => ({ ...prev, brand: "error" }));
    }
  };

  const handleSaveAdditional = async () => {
    setSaveStatus((prev) => ({ ...prev, additional: "saving" }));
    setSaveError((prev) => ({ ...prev, additional: null }));

    try {
      const updated = await saveClientProfileSection(uid, "additional", additionalDraft);
      setProfile(updated);
      setAdditionalDraft(updated.additional);
      setSaveStatus((prev) => ({ ...prev, additional: "saved" }));
      setEditingSection(null);
      if (onProfileUpdated) await onProfileUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save additional information.";
      setSaveError((prev) => ({ ...prev, additional: msg }));
      setSaveStatus((prev) => ({ ...prev, additional: "error" }));
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Completeness Status Banner */}
      <ProfileCompletionBar profile={profile} />

      {/* 2. Personal Information Section */}
      <SectionCard
        id="section-personal"
        badgeNumber="01"
        title="Personal Information"
        subtitle="Your individual credentials, administrative access and professional identity."
        isEditing={editingSection === "personal"}
        isDirty={JSON.stringify(personalDraft) !== JSON.stringify(profile.personal)}
        status={saveStatus.personal || "idle"}
        errorMessage={saveError.personal}
        successMessage="Personal information saved successfully."
        onEdit={() => {
          setPersonalDraft(profile.personal);
          setEditingSection("personal");
        }}
        onCancel={() => {
          setPersonalDraft(profile.personal);
          setEditingSection(null);
          setSaveError((p) => ({ ...p, personal: null }));
        }}
        onSave={handleSavePersonal}
      >
        {editingSection === "personal" ? (
          <div className="space-y-5">
            <ImageUploadField
              label="Profile Picture"
              category="avatar"
              value={personalDraft.avatarUrl}
              onChange={(url) => setPersonalDraft((p) => ({ ...p, avatarUrl: url }))}
              isCircular
              hint="Square JPEG, PNG or WebP · Minimum 300×300px recommended"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  <span>First Name</span>
                  <span className="text-[#1f5e44] font-normal">(Required)</span>
                </label>
                <input
                  type="text"
                  value={personalDraft.firstName}
                  onChange={(e) => setPersonalDraft((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder="e.g. Eleanor"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  <span>Last Name</span>
                  <span className="text-[#1f5e44] font-normal">(Required)</span>
                </label>
                <input
                  type="text"
                  value={personalDraft.lastName}
                  onChange={(e) => setPersonalDraft((p) => ({ ...p, lastName: e.target.value }))}
                  placeholder="e.g. Vance"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  <span>Professional Title</span>
                  <span className="text-[#1f5e44] font-normal">(Required)</span>
                </label>
                <input
                  type="text"
                  value={personalDraft.title}
                  onChange={(e) => setPersonalDraft((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Head of Development, Principal Architect"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  <span>Work Email</span>
                  <span className="text-neutral-400 font-normal">(Read Only)</span>
                </label>
                <input
                  type="email"
                  value={personalDraft.email}
                  readOnly
                  disabled
                  className={`${inputClass} bg-neutral-100 text-neutral-500`}
                />
                <p className="mt-1 font-body text-[9.5px] text-[#71776e]">
                  Managed securely via Supabase Auth credentials.
                </p>
              </div>

              <div>
                <label className={labelClass}>
                  <span>Phone Number</span>
                  <span className="text-[#1f5e44] font-normal">(Required)</span>
                </label>
                <input
                  type="tel"
                  value={personalDraft.phone}
                  onChange={(e) => setPersonalDraft((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+44 20 7946 0912 or +1 (555) 019-2834"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  <span>LinkedIn Profile URL</span>
                  <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={personalDraft.linkedinUrl}
                  onChange={(e) => setPersonalDraft((p) => ({ ...p, linkedinUrl: e.target.value }))}
                  placeholder="https://linkedin.com/in/username"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border border-black/[0.1] bg-[#eef5f1] shadow-inner">
              {profile.personal.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.personal.avatarUrl}
                  alt={profile.personal.firstName || "Client"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-body text-[18px] font-bold text-[#1f5e44]">
                  {[profile.personal.firstName[0], profile.personal.lastName[0]]
                    .filter(Boolean)
                    .join("") || "CL"}
                </div>
              )}
            </div>

            <dl className="grid flex-1 grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
              <ReadItem
                label="Full Name"
                value={[profile.personal.firstName, profile.personal.lastName].filter(Boolean).join(" ")}
              />
              <ReadItem label="Professional Title" value={profile.personal.title} />
              <ReadItem
                label="Work Email"
                value={
                  <span className="flex items-center gap-1.5">
                    {profile.personal.email}
                    <span className="rounded-[4px] bg-[#eef5f1] px-1.5 py-0.5 text-[9px] font-semibold text-[#1f5e44]">
                      Verified
                    </span>
                  </span>
                }
              />
              <ReadItem label="Contact Phone" value={profile.personal.phone} />
              <ReadItem
                label="LinkedIn"
                value={
                  profile.personal.linkedinUrl ? (
                    <a
                      href={profile.personal.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#1f5e44] hover:underline"
                    >
                      {profile.personal.linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "in/")}
                    </a>
                  ) : null
                }
              />
            </dl>
          </div>
        )}
      </SectionCard>

      {/* 3. Company Information Section */}
      <SectionCard
        id="section-company"
        badgeNumber="02"
        title="Company Information"
        subtitle="Corporate organisation, operational scale, sector and executive description."
        isEditing={editingSection === "company"}
        isDirty={JSON.stringify(companyDraft) !== JSON.stringify(profile.company)}
        status={saveStatus.company || "idle"}
        errorMessage={saveError.company}
        successMessage="Company information saved successfully."
        onEdit={() => {
          setCompanyDraft(profile.company);
          setEditingSection("company");
        }}
        onCancel={() => {
          setCompanyDraft(profile.company);
          setEditingSection(null);
          setSaveError((p) => ({ ...p, company: null }));
        }}
        onSave={handleSaveCompany}
      >
        {editingSection === "company" ? (
          <div className="space-y-5">
            <ImageUploadField
              label="Company Logo"
              category="company-logo"
              value={companyDraft.logoUrl}
              onChange={(url) => setCompanyDraft((c) => ({ ...c, logoUrl: url }))}
              hint="High-resolution vector SVG or transparent PNG · Displayed on twin portals"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  <span>Company Name</span>
                  <span className="text-[#1f5e44] font-normal">(Required)</span>
                </label>
                <input
                  type="text"
                  value={companyDraft.name}
                  onChange={(e) => setCompanyDraft((c) => ({ ...c, name: e.target.value }))}
                  placeholder="e.g. Apex Living Group"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  <span>Company Website</span>
                  <span className="text-[#1f5e44] font-normal">(Required)</span>
                </label>
                <input
                  type="url"
                  value={companyDraft.website}
                  onChange={(e) => setCompanyDraft((c) => ({ ...c, website: e.target.value }))}
                  placeholder="https://example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  <span>Business Type</span>
                  <span className="text-[#1f5e44] font-normal">(Required)</span>
                </label>
                <select
                  value={companyDraft.businessType}
                  onChange={(e) => setCompanyDraft((c) => ({ ...c, businessType: e.target.value }))}
                  className={selectClass}
                >
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  <span>Company Size</span>
                  <span className="text-[#1f5e44] font-normal">(Required)</span>
                </label>
                <select
                  value={companyDraft.companySize}
                  onChange={(e) => setCompanyDraft((c) => ({ ...c, companySize: e.target.value }))}
                  className={selectClass}
                >
                  {COMPANY_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  <span>Year Established</span>
                  <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={companyDraft.yearEstablished}
                  onChange={(e) => setCompanyDraft((c) => ({ ...c, yearEstablished: e.target.value }))}
                  placeholder="e.g. 2018"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>
                  <span>Company Description</span>
                  <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={companyDraft.description}
                  onChange={(e) => setCompanyDraft((c) => ({ ...c, description: e.target.value }))}
                  placeholder="Brief overview of your architectural practice, development focus, or property portfolio…"
                  className={textareaClass}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {profile.company.logoUrl ? (
              <div className="flex h-16 w-32 flex-shrink-0 items-center justify-center rounded-[8px] border border-black/[0.1] bg-neutral-50 p-2 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.company.logoUrl}
                  alt={profile.company.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : null}

            <dl className="grid flex-1 grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
              <ReadItem label="Company Name" value={profile.company.name} />
              <ReadItem
                label="Website"
                value={
                  profile.company.website ? (
                    <a
                      href={profile.company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#1f5e44] hover:underline"
                    >
                      {profile.company.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : null
                }
              />
              <ReadItem label="Business Type" value={profile.company.businessType} />
              <ReadItem label="Company Size" value={profile.company.companySize} />
              <ReadItem label="Year Established" value={profile.company.yearEstablished} />
              <ReadItem
                label="Overview"
                value={profile.company.description}
                fullWidth
              />
            </dl>
          </div>
        )}
      </SectionCard>

      {/* 4. Business Address Section */}
      <SectionCard
        id="section-address"
        badgeNumber="03"
        title="Business Address"
        subtitle="Physical headquarters or studio address for legal contracts and invoicing."
        isEditing={editingSection === "address"}
        isDirty={JSON.stringify(addressDraft) !== JSON.stringify(profile.address)}
        status={saveStatus.address || "idle"}
        errorMessage={saveError.address}
        successMessage="Business address saved successfully."
        onEdit={() => {
          setAddressDraft(profile.address);
          setEditingSection("address");
        }}
        onCancel={() => {
          setAddressDraft(profile.address);
          setEditingSection(null);
          setSaveError((p) => ({ ...p, address: null }));
        }}
        onSave={handleSaveAddress}
      >
        {editingSection === "address" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>
                <span>Country</span>
                <span className="text-[#1f5e44] font-normal">(Required)</span>
              </label>
              <input
                type="text"
                value={addressDraft.country}
                onChange={(e) => setAddressDraft((a) => ({ ...a, country: e.target.value }))}
                placeholder="e.g. United Kingdom"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                <span>State / Province / Region</span>
                <span className="text-[#1f5e44] font-normal">(Required)</span>
              </label>
              <input
                type="text"
                value={addressDraft.state}
                onChange={(e) => setAddressDraft((a) => ({ ...a, state: e.target.value }))}
                placeholder="e.g. Greater London"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                <span>City</span>
                <span className="text-[#1f5e44] font-normal">(Required)</span>
              </label>
              <input
                type="text"
                value={addressDraft.city}
                onChange={(e) => setAddressDraft((a) => ({ ...a, city: e.target.value }))}
                placeholder="e.g. London"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                <span>Postal / Zip Code</span>
                <span className="text-[#1f5e44] font-normal">(Required)</span>
              </label>
              <input
                type="text"
                value={addressDraft.postalCode}
                onChange={(e) => setAddressDraft((a) => ({ ...a, postalCode: e.target.value }))}
                placeholder="e.g. EC2A 4NE"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>
                <span>Office Address (Street / Building / Suite)</span>
                <span className="text-[#1f5e44] font-normal">(Required)</span>
              </label>
              <input
                type="text"
                value={addressDraft.officeAddress}
                onChange={(e) => setAddressDraft((a) => ({ ...a, officeAddress: e.target.value }))}
                placeholder="e.g. Studio 4B, 18 Finsbury Square"
                className={inputClass}
              />
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            <ReadItem label="Office Address" value={profile.address.officeAddress} />
            <ReadItem label="City" value={profile.address.city} />
            <ReadItem label="State / Province" value={profile.address.state} />
            <ReadItem label="Postal Code" value={profile.address.postalCode} />
            <ReadItem label="Country" value={profile.address.country} />
          </dl>
        )}
      </SectionCard>

      {/* 5. Business Contacts Section */}
      <SectionCard
        id="section-contacts"
        badgeNumber="04"
        title="Business Contacts"
        subtitle="Dedicated points of contact for deliverables, approvals, and accounts billing."
        isEditing={editingSection === "contacts"}
        isDirty={JSON.stringify(contactsDraft) !== JSON.stringify(profile.contacts)}
        status={saveStatus.contacts || "idle"}
        errorMessage={saveError.contacts}
        successMessage="Business contacts saved successfully."
        onEdit={() => {
          setContactsDraft(profile.contacts);
          setEditingSection("contacts");
        }}
        onCancel={() => {
          setContactsDraft(profile.contacts);
          setEditingSection(null);
          setSaveError((p) => ({ ...p, contacts: null }));
        }}
        onSave={handleSaveContacts}
      >
        {editingSection === "contacts" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>
                <span>Primary Contact Name</span>
                <span className="text-[#1f5e44] font-normal">(Required)</span>
              </label>
              <input
                type="text"
                value={contactsDraft.primaryContactName}
                onChange={(e) => setContactsDraft((c) => ({ ...c, primaryContactName: e.target.value }))}
                placeholder="e.g. Marcus Sterling"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                <span>Primary Contact Email</span>
                <span className="text-[#1f5e44] font-normal">(Required)</span>
              </label>
              <input
                type="email"
                value={contactsDraft.primaryContactEmail}
                onChange={(e) => setContactsDraft((c) => ({ ...c, primaryContactEmail: e.target.value }))}
                placeholder="m.sterling@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                <span>Primary Contact Phone</span>
                <span className="text-[#1f5e44] font-normal">(Required)</span>
              </label>
              <input
                type="tel"
                value={contactsDraft.primaryContactPhone}
                onChange={(e) => setContactsDraft((c) => ({ ...c, primaryContactPhone: e.target.value }))}
                placeholder="+44 20 7946 0912"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                <span>Accounts / Billing Email</span>
                <span className="text-[#1f5e44] font-normal">(Required)</span>
              </label>
              <input
                type="email"
                value={contactsDraft.billingEmail}
                onChange={(e) => setContactsDraft((c) => ({ ...c, billingEmail: e.target.value }))}
                placeholder="invoices@example.com"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>
                <span>Alternate Contact Details</span>
                <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={contactsDraft.alternateContact}
                onChange={(e) => setContactsDraft((c) => ({ ...c, alternateContact: e.target.value }))}
                placeholder="e.g. Sarah Jenkins (Project Coordinator) · +44 7700 900123"
                className={inputClass}
              />
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            <ReadItem label="Primary Contact" value={profile.contacts.primaryContactName} />
            <ReadItem label="Primary Email" value={profile.contacts.primaryContactEmail} />
            <ReadItem label="Primary Phone" value={profile.contacts.primaryContactPhone} />
            <ReadItem label="Accounts / Billing Email" value={profile.contacts.billingEmail} />
            <ReadItem
              label="Alternate Contacts"
              value={profile.contacts.alternateContact}
              fullWidth
            />
          </dl>
        )}
      </SectionCard>

      {/* 6. Brand Identity Section */}
      <SectionCard
        id="section-brand"
        badgeNumber="05"
        title="Brand Identity & Design"
        subtitle="Custom colour palette, co-branding preference, and brand guideline documentation."
        isEditing={editingSection === "brand"}
        isDirty={JSON.stringify(brandDraft) !== JSON.stringify(profile.brand)}
        status={saveStatus.brand || "idle"}
        errorMessage={saveError.brand}
        successMessage="Brand identity saved successfully."
        onEdit={() => {
          setBrandDraft(profile.brand);
          setEditingSection("brand");
        }}
        onCancel={() => {
          setBrandDraft(profile.brand);
          setEditingSection(null);
          setSaveError((p) => ({ ...p, brand: null }));
        }}
        onSave={handleSaveBrand}
      >
        {editingSection === "brand" ? (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <ImageUploadField
                label="Brand Logo"
                category="brand-logo"
                value={brandDraft.brandLogoUrl}
                onChange={(url) => setBrandDraft((b) => ({ ...b, brandLogoUrl: url }))}
                hint="Vector SVG or PNG watermark for presentations"
              />

              <div>
                <label className={labelClass}>
                  <span>Preferred Branding Option</span>
                  <span className="text-[#1f5e44] font-normal">(Required)</span>
                </label>
                <select
                  value={brandDraft.preferredBrandingOption}
                  onChange={(e) => setBrandDraft((b) => ({ ...b, preferredBrandingOption: e.target.value }))}
                  className={selectClass}
                >
                  {BRANDING_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <p className="mt-1 font-body text-[10px] text-[#71776e]">
                  Determines how your brand insignia is embedded in the digital twin UI.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ColorPickerField
                label="Primary Brand Colour"
                value={brandDraft.primaryColor}
                onChange={(hex) => setBrandDraft((b) => ({ ...b, primaryColor: hex }))}
                required
              />

              <ColorPickerField
                label="Secondary Brand Colour"
                value={brandDraft.secondaryColor}
                onChange={(hex) => setBrandDraft((b) => ({ ...b, secondaryColor: hex }))}
                required
              />
            </div>

            <PdfUploadField
              label="Brand Guidelines Document"
              category="brand-guidelines"
              url={brandDraft.brandGuidelinesUrl}
              name={brandDraft.brandGuidelinesName}
              onChange={(url, name) => setBrandDraft((b) => ({ ...b, brandGuidelinesUrl: url, brandGuidelinesName: name }))}
            />
          </div>
        ) : (
          <dl className="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            <ReadItem
              label="Preferred Branding"
              value={
                <span className="inline-flex items-center rounded-[6px] bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-[#17201b]">
                  {profile.brand.preferredBrandingOption}
                </span>
              }
            />
            <ReadItem
              label="Primary Colour"
              value={
                <div className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 rounded-full border border-black/15 shadow-inner"
                    style={{ backgroundColor: profile.brand.primaryColor }}
                  />
                  <span className="font-mono text-[12px]">{profile.brand.primaryColor}</span>
                </div>
              }
            />
            <ReadItem
              label="Secondary Colour"
              value={
                <div className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 rounded-full border border-black/15 shadow-inner"
                    style={{ backgroundColor: profile.brand.secondaryColor }}
                  />
                  <span className="font-mono text-[12px]">{profile.brand.secondaryColor}</span>
                </div>
              }
            />
            <ReadItem
              label="Brand Guidelines (PDF)"
              value={
                profile.brand.brandGuidelinesUrl ? (
                  <a
                    href={profile.brand.brandGuidelinesUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#1f5e44] hover:underline"
                  >
                    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                      <path d="M4 3.5h8.5l3.5 3.5v9.5H4V3.5Z" strokeWidth="1.2" />
                    </svg>
                    <span>{profile.brand.brandGuidelinesName || "Download Guidelines"}</span>
                  </a>
                ) : null
              }
            />
          </dl>
        )}
      </SectionCard>

      {/* 7. Additional Information Section */}
      <SectionCard
        id="section-additional"
        badgeNumber="06"
        title="Additional Information"
        subtitle="Discovery source, key project motivations, and specialized rendering notes."
        isEditing={editingSection === "additional"}
        isDirty={JSON.stringify(additionalDraft) !== JSON.stringify(profile.additional)}
        status={saveStatus.additional || "idle"}
        errorMessage={saveError.additional}
        successMessage="Additional information saved successfully."
        onEdit={() => {
          setAdditionalDraft(profile.additional);
          setEditingSection("additional");
        }}
        onCancel={() => {
          setAdditionalDraft(profile.additional);
          setEditingSection(null);
          setSaveError((p) => ({ ...p, additional: null }));
        }}
        onSave={handleSaveAdditional}
      >
        {editingSection === "additional" ? (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>
                <span>How did you discover CreSTION Labs?</span>
                <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <select
                value={additionalDraft.discoverySource}
                onChange={(e) => setAdditionalDraft((a) => ({ ...a, discoverySource: e.target.value }))}
                className={selectClass}
              >
                <option value="">Select discovery source…</option>
                {DISCOVERY_SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                <span>Primary Reason for using CreSTION Labs</span>
                <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={additionalDraft.primaryReason}
                onChange={(e) => setAdditionalDraft((a) => ({ ...a, primaryReason: e.target.value }))}
                placeholder="e.g. Ultra-realistic off-plan digital twins for luxury penthouse sales"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                <span>Additional Notes & Preferences</span>
                <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={additionalDraft.notes}
                onChange={(e) => setAdditionalDraft((a) => ({ ...a, notes: e.target.value }))}
                placeholder="Any special rendering considerations, client team access requirements, or timeline expectations…"
                className={textareaClass}
              />
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2">
            <ReadItem label="Discovery Source" value={profile.additional.discoverySource} />
            <ReadItem label="Primary Objective" value={profile.additional.primaryReason} />
            <ReadItem
              label="Additional Notes"
              value={profile.additional.notes}
              fullWidth
            />
          </dl>
        )}
      </SectionCard>
    </div>
  );
};

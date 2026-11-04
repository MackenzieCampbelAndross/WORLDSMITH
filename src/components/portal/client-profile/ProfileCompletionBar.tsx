"use client";

import React from "react";
import type { FullClientProfile } from "@/lib/portal";

export interface SectionCompletion {
  id: string;
  title: string;
  isComplete: boolean;
  filledCount: number;
  totalRequired: number;
}

export function computeProfileCompletion(profile: FullClientProfile): {
  percentage: number;
  sections: SectionCompletion[];
  completedCount: number;
} {
  const sections: SectionCompletion[] = [
    {
      id: "personal",
      title: "Personal",
      isComplete: Boolean(
        profile.personal.firstName.trim() &&
        profile.personal.lastName.trim() &&
        profile.personal.title.trim() &&
        profile.personal.phone.trim()
      ),
      filledCount: [
        profile.personal.firstName,
        profile.personal.lastName,
        profile.personal.title,
        profile.personal.phone,
        profile.personal.avatarUrl,
        profile.personal.linkedinUrl,
      ].filter((v) => Boolean(v && v.trim())).length,
      totalRequired: 4,
    },
    {
      id: "company",
      title: "Company",
      isComplete: Boolean(
        profile.company.name.trim() &&
        profile.company.website.trim() &&
        profile.company.businessType.trim() &&
        profile.company.companySize.trim()
      ),
      filledCount: [
        profile.company.name,
        profile.company.website,
        profile.company.businessType,
        profile.company.companySize,
        profile.company.logoUrl,
        profile.company.yearEstablished,
        profile.company.description,
      ].filter((v) => Boolean(v && v.trim())).length,
      totalRequired: 4,
    },
    {
      id: "address",
      title: "Address",
      isComplete: Boolean(
        profile.address.country.trim() &&
        profile.address.state.trim() &&
        profile.address.city.trim() &&
        profile.address.officeAddress.trim() &&
        profile.address.postalCode.trim()
      ),
      filledCount: [
        profile.address.country,
        profile.address.state,
        profile.address.city,
        profile.address.officeAddress,
        profile.address.postalCode,
      ].filter((v) => Boolean(v && v.trim())).length,
      totalRequired: 5,
    },
    {
      id: "contacts",
      title: "Contacts",
      isComplete: Boolean(
        profile.contacts.primaryContactName.trim() &&
        profile.contacts.primaryContactEmail.trim() &&
        profile.contacts.primaryContactPhone.trim() &&
        profile.contacts.billingEmail.trim()
      ),
      filledCount: [
        profile.contacts.primaryContactName,
        profile.contacts.primaryContactEmail,
        profile.contacts.primaryContactPhone,
        profile.contacts.billingEmail,
        profile.contacts.alternateContact,
      ].filter((v) => Boolean(v && v.trim())).length,
      totalRequired: 4,
    },
    {
      id: "brand",
      title: "Branding",
      isComplete: Boolean(
        profile.brand.primaryColor.trim() &&
        profile.brand.secondaryColor.trim() &&
        profile.brand.preferredBrandingOption.trim()
      ),
      filledCount: [
        profile.brand.primaryColor,
        profile.brand.secondaryColor,
        profile.brand.preferredBrandingOption,
        profile.brand.brandLogoUrl,
        profile.brand.brandGuidelinesUrl,
      ].filter((v) => Boolean(v && v.trim())).length,
      totalRequired: 3,
    },
    {
      id: "additional",
      title: "Intake",
      isComplete: Boolean(
        profile.additional.discoverySource.trim() ||
        profile.additional.primaryReason.trim()
      ),
      filledCount: [
        profile.additional.discoverySource,
        profile.additional.primaryReason,
        profile.additional.notes,
      ].filter((v) => Boolean(v && v.trim())).length,
      totalRequired: 1,
    },
  ];

  const totalRequired = sections.reduce((acc, s) => acc + s.totalRequired, 0);
  const metRequired = sections.reduce((acc, s) => {
    // Count filled items up to totalRequired
    return acc + Math.min(s.filledCount, s.totalRequired);
  }, 0);

  const completedCount = sections.filter((s) => s.isComplete).length;
  const percentage = Math.min(100, Math.round((metRequired / totalRequired) * 100));

  return { percentage, sections, completedCount };
}

export const ProfileCompletionBar: React.FC<{ profile: FullClientProfile }> = ({ profile }) => {
  const { percentage, sections, completedCount } = computeProfileCompletion(profile);

  return (
    <div className="rounded-[14px] border border-black/[0.08] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-body text-[13px] font-semibold text-[#17201b]">Profile Completeness</h3>
            <span
              className={`rounded-full px-2.5 py-0.5 font-body text-[10px] font-medium ${
                percentage === 100
                  ? "bg-[#eef5f1] text-[#1f5e44]"
                  : "bg-neutral-100 text-[#4a554e]"
              }`}
            >
              {percentage}% Complete
            </span>
          </div>
          <p className="mt-1 font-body text-[11px] text-[#6f756d]">
            {completedCount} of {sections.length} sections fully configured. Complete all sections to ensure rapid delivery and customized branding.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#section-${s.id}`}
              className={`flex items-center gap-1 rounded-[6px] px-2 py-1 font-body text-[10px] transition-colors ${
                s.isComplete
                  ? "bg-[#eef5f1] text-[#1f5e44] hover:bg-[#e2ede6]"
                  : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100 hover:text-[#17201b]"
              }`}
              title={`${s.title}: ${s.isComplete ? "Complete" : "Action needed"}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  s.isComplete ? "bg-[#1f5e44]" : "bg-neutral-300"
                }`}
              />
              {s.title}
            </a>
          ))}
        </div>
      </div>

      {/* Progress Track */}
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-[#1f5e44] transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

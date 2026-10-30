"use client";

import React from "react";
import { FileLibrary } from "@/components/portal/FileLibrary";
import { PLAN_CATEGORIES, type FileCategory } from "@/lib/portal";

const PLAN_LIBRARY_CATEGORIES: FileCategory[] = [...PLAN_CATEGORIES, "references"];

export default function ProjectPlansPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-accent text-[26px] leading-none text-[#171713]">2D Plans</h2>
        <p className="mt-2 max-w-[560px] font-body text-[12px] leading-5 text-[#716b5d]">
          The architectural inputs for your world. Upload plans, elevations, site drawings and
          references; Crestion Labs uses these to reconstruct the project.
        </p>
      </div>
      <FileLibrary
        categories={PLAN_LIBRARY_CATEGORIES}
        showProcessing
        emptyTitle="No plans uploaded yet."
        emptyBody="Upload your floor plans, elevations, site plans or CAD drawings to begin."
      />
    </div>
  );
}

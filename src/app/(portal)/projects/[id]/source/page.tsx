"use client";

import React from "react";
import { FileLibrary } from "@/components/portal/FileLibrary";
import { FILE_CATEGORIES } from "@/lib/portal";

export default function ProjectSourcePage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-accent text-[30px] leading-none text-[#171713]">Source</h2>
        <p className="mt-2 max-w-[560px] font-body text-[12px] leading-5 text-[#716b5d]">
          The architectural inputs for your world. Add plans, elevations, site drawings, CAD,
          references and supporting documents.
        </p>
      </div>
      <FileLibrary
        categories={[...FILE_CATEGORIES]}
        emptyTitle="No source files yet."
        emptyBody="Upload floor plans, elevations, site plans, CAD or references to begin."
      />
    </div>
  );
}

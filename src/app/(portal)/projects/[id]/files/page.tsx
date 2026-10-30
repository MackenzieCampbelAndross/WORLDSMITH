"use client";

import React from "react";
import { FileLibrary } from "@/components/portal/FileLibrary";
import { FILE_CATEGORIES } from "@/lib/portal";

export default function ProjectFilesPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-accent text-[26px] leading-none text-[#171713]">Project files</h2>
        <p className="mt-2 max-w-[560px] font-body text-[12px] leading-5 text-[#716b5d]">
          Every asset connected to this development, stored privately and shared only through
          secure links.
        </p>
      </div>
      <FileLibrary
        categories={[...FILE_CATEGORIES]}
        emptyTitle="No files uploaded yet."
        emptyBody="Upload your plans, drawings, models, textures or references to begin."
      />
    </div>
  );
}

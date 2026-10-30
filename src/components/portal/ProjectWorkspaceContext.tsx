"use client";

import React, { createContext, useContext } from "react";
import type { Project } from "@/lib/portal";

interface ProjectWorkspaceValue {
  project: Project;
  refresh: () => Promise<void>;
}

const ProjectWorkspaceContext = createContext<ProjectWorkspaceValue | null>(null);

export const ProjectWorkspaceProvider = ({
  project,
  refresh,
  children,
}: ProjectWorkspaceValue & { children: React.ReactNode }) => (
  <ProjectWorkspaceContext.Provider value={{ project, refresh }}>
    {children}
  </ProjectWorkspaceContext.Provider>
);

export function useProjectWorkspace(): ProjectWorkspaceValue {
  const value = useContext(ProjectWorkspaceContext);
  if (!value) throw new Error("useProjectWorkspace must be used inside a project workspace");
  return value;
}

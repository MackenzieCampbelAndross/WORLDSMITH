import type { ProjectStatus } from "@/lib/portal";

export const SUBMISSION_STAGES = [
  "Plan Received",
  "Understanding Plan",
  "Reconstructing",
  "Generating World",
  "Quality Review",
  "Ready",
] as const;

const STAGE_BY_STATUS: Record<ProjectStatus, number> = {
  DRAFT: -1,
  SUBMITTED: 0,
  REVIEWING: 1,
  ASSETS_RECEIVED: 2,
  PROCESSING: 3,
  INTERNAL_REVIEW: 4,
  CLIENT_REVIEW: 5,
  COMPLETED: 5,
};

export const submissionStageIndex = (status: ProjectStatus): number => STAGE_BY_STATUS[status] ?? -1;

export const isDeliveredStatus = (status: ProjectStatus): boolean =>
  status === "CLIENT_REVIEW" || status === "COMPLETED";

export const STATUS_DESCRIPTIONS: Record<ProjectStatus, string> = {
  DRAFT: "Submit a floor plan to start your world.",
  SUBMITTED: "Your floor plan has been received.",
  REVIEWING: "Creston is understanding the plan.",
  ASSETS_RECEIVED: "The property is being reconstructed in 3D.",
  PROCESSING: "Creston is generating your interactive world.",
  INTERNAL_REVIEW: "The world is in quality review.",
  CLIENT_REVIEW: "Your world is ready to enter and share.",
  COMPLETED: "Your world is ready to enter and share.",
};

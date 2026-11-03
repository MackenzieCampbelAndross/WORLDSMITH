import type { ProjectStatus } from "@/lib/portal";

export const STATUS_DESCRIPTIONS: Record<ProjectStatus, string> = {
  DRAFT: "Finish the project brief and submit it to the Crestion Labs production team.",
  SUBMITTED: "Your request is with the Crestion Labs team. They will review the brief and files next.",
  REVIEWING: "The team is reviewing your brief, drawings and reference material.",
  ASSETS_RECEIVED: "Your architectural assets have been received and prepared for production.",
  PROCESSING: "The Crestion Labs team is producing your interactive world.",
  INTERNAL_REVIEW: "The world is being checked internally before it is released to you.",
  CLIENT_REVIEW: "Your world is ready for review. The team will share the delivery details here.",
  COMPLETED: "Your interactive world has been delivered.",
};

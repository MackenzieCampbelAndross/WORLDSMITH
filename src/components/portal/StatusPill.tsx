import { STATUS_LABELS, type ProjectStatus } from "@/lib/portal";

const tones: Record<ProjectStatus, { bg: string; text: string; dot: string }> = {
  DRAFT: { bg: "bg-[#eee9dc]", text: "text-[#6f6249]", dot: "bg-[#a08a5c]" },
  SUBMITTED: { bg: "bg-[#e8ece8]", text: "text-[#3e5c4b]", dot: "bg-[#5a7d68]" },
  REVIEWING: { bg: "bg-[#f4ecd9]", text: "text-[#7a6333]", dot: "bg-[#b3914e]" },
  ASSETS_RECEIVED: { bg: "bg-[#e3eeec]", text: "text-[#2e655b]", dot: "bg-[#4c8b7d]" },
  PROCESSING: { bg: "bg-[#e4ebf2]", text: "text-[#34536b]", dot: "bg-[#5d7f99]" },
  INTERNAL_REVIEW: { bg: "bg-[#ece9f3]", text: "text-[#574a75]", dot: "bg-[#7c6b9e]" },
  CLIENT_REVIEW: { bg: "bg-[#f3e8df]", text: "text-[#7a5538]", dot: "bg-[#a97b56]" },
  COMPLETED: { bg: "bg-[#e3efe4]", text: "text-[#2d5c3a]", dot: "bg-[#4e8a5c]" },
};

export const StatusPill = ({ status }: { status: ProjectStatus }) => {
  const tone = tones[status] ?? tones.DRAFT;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 font-body text-[10.5px] font-medium tracking-[0.01em] ${tone.bg} ${tone.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
};

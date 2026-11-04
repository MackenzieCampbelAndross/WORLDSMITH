"use client";

import React from "react";

export interface SectionCardProps {
  id: string;
  badgeNumber: string;
  title: string;
  subtitle: string;
  isEditing: boolean;
  isDirty?: boolean;
  status: "idle" | "saving" | "saved" | "error";
  errorMessage?: string | null;
  successMessage?: string | null;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  children: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  id,
  badgeNumber,
  title,
  subtitle,
  isEditing,
  isDirty = false,
  status,
  errorMessage,
  successMessage,
  onEdit,
  onCancel,
  onSave,
  children,
}) => {
  return (
    <section
      id={id}
      className={`scroll-mt-6 overflow-hidden rounded-[14px] border bg-white shadow-sm transition-all duration-200 ${
        isEditing
          ? "border-black/[0.18] ring-1 ring-black/[0.05]"
          : "border-black/[0.08]"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-black/[0.06] bg-[#fafbfa] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-neutral-200 font-mono text-[9px] font-semibold text-neutral-700">
            {badgeNumber}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-accent text-[20px] font-medium leading-none tracking-tight text-[#17201b]">
                {title}
              </h2>
              {isDirty && (
                <span className="rounded-full bg-[#fdf5eb] px-2 py-0.5 font-body text-[9px] font-semibold text-[#8a5a2f]">
                  Unsaved changes
                </span>
              )}
            </div>
            <p className="mt-1 font-body text-[11px] text-[#6f756d]">{subtitle}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {!isEditing ? (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-[7px] border border-black/[0.1] bg-white px-3 py-1.5 font-body text-[11px] font-medium text-[#17201b] transition-colors hover:border-[#1f5e44] hover:bg-neutral-50 hover:text-[#1f5e44]"
            >
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                <path d="M13.5 3.5 16.5 6.5M4 16l3.5-.5L16 7l-3-3L4.5 12.5 4 16Z" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Edit Section</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={status === "saving"}
                onClick={onCancel}
                className="rounded-[7px] px-3 py-1.5 font-body text-[11px] font-medium text-neutral-600 transition-colors hover:text-[#17201b] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={status === "saving"}
                onClick={onSave}
                className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#1f5e44] px-4 py-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#143f2d] disabled:opacity-50"
              >
                {status === "saving" ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline Feedback Alerts */}
      {status === "saved" && successMessage && (
        <div className="flex items-center gap-2 border-b border-[#d2e4d9] bg-[#eef5f1] px-5 py-2.5 font-body text-[11.5px] text-[#1f5e44]">
          <svg viewBox="0 0 20 20" className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor">
            <circle cx="10" cy="10" r="7" strokeWidth="1.2" />
            <path d="m7 10 2 2 4-4" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {status === "error" && errorMessage && (
        <div className="flex items-center gap-2 border-b border-[#f5d6d4] bg-[#fcf3f2] px-5 py-2.5 font-body text-[11.5px] text-[#a43731]">
          <svg viewBox="0 0 20 20" className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor">
            <circle cx="10" cy="10" r="7" strokeWidth="1.2" />
            <path d="M10 6v5M10 14h.01" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Body */}
      <div className="p-5">{children}</div>
    </section>
  );
};

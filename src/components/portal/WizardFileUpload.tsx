"use client";

import React, { useId, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { formatBytes, formatRelative } from "@/lib/format";
import {
  deleteProjectFile,
  FILE_CATEGORY_LABELS,
  uploadProjectFile,
  type FileCategory,
  type Project,
  type ProjectFile,
} from "@/lib/portal";

interface QueueItem {
  key: string;
  name: string;
  status: "uploading" | "done" | "error";
  message?: string;
}

export const WizardFileUpload = ({
  project,
  files,
  categories,
  fixedCategory,
  onUploaded,
  onDeleted,
  onBusyChange,
}: {
  project: Project;
  files: ProjectFile[];
  categories: FileCategory[];
  fixedCategory?: FileCategory;
  onUploaded: (file: ProjectFile) => void;
  onDeleted: (file: ProjectFile) => void;
  onBusyChange?: (busy: boolean) => void;
}) => {
  const { user } = useAuth();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<FileCategory>(fixedCategory ?? categories[0]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || !user) return;
    setError(null);
    const selected = Array.from(fileList);
    if (selected.length === 0) return;
    onBusyChange?.(true);

    for (const file of selected) {
      const key = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setQueue((current) => [...current, { key, name: file.name, status: "uploading" }]);
      if (file.size > 25 * 1024 * 1024) {
        setQueue((current) =>
          current.map((item) =>
            item.key === key
              ? { ...item, status: "error", message: "File is larger than 25 MB." }
              : item,
          ),
        );
        continue;
      }
      try {
        const uploaded = await uploadProjectFile(user.id, project, file, category);
        setQueue((current) =>
          current.map((item) =>
            item.key === key ? { ...item, status: "done", message: "Uploaded" } : item,
          ),
        );
        onUploaded(uploaded);
      } catch {
        setQueue((current) =>
          current.map((item) =>
            item.key === key
              ? { ...item, status: "error", message: "Upload failed. Please try again." }
              : item,
          ),
        );
      }
    }
    onBusyChange?.(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = async (file: ProjectFile) => {
    if (!user || removing) return;
    setError(null);
    setRemoving(file.id);
    try {
      await deleteProjectFile(user.id, project, file);
      onDeleted(file);
    } catch {
      setError("We couldn't remove this file. Please try again.");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col items-start justify-between gap-3 border border-dashed border-[#cfc8b8] bg-[#fbf9f3] px-5 py-5 sm:flex-row sm:items-center">
        <div>
          <p className="font-body text-[12.5px] text-[#3f3b33]">Add architectural files</p>
          <p className="mt-1 font-body text-[10.5px] text-[#8a8374]">
            PDF, DWG, DXF, RVT or images · up to 25 MB each
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!fixedCategory && (
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as FileCategory)}
              className="h-8 border border-[#d8d2c4] bg-[#f7f4ec] px-2 font-body text-[10.5px] text-[#514c42] outline-none"
            >
              {categories.map((option) => (
                <option key={option} value={option}>
                  {FILE_CATEGORY_LABELS[option]}
                </option>
              ))}
            </select>
          )}
          <label
            htmlFor={inputId}
            className="cursor-pointer border border-[#1f5e44] px-3 py-1.5 font-body text-[9px] uppercase tracking-[0.14em] text-[#1f5e44] transition-colors hover:bg-[#1f5e44] hover:text-[#f7f4ec]"
          >
            Browse
          </label>
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept=".pdf,.dwg,.dxf,.rvt,.png,.jpg,.jpeg,.webp"
          className="sr-only"
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 font-body text-[11.5px] text-[#8a5a2f]">
          {error}
        </p>
      )}

      {queue.length > 0 && (
        <div className="mt-3 space-y-2">
          {queue.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4 border border-[#e2ddd1] px-4 py-2.5">
              <span className="truncate font-body text-[11.5px] text-[#514c42]">{item.name}</span>
              <span
                className={`shrink-0 font-body text-[10px] ${
                  item.status === "error"
                    ? "text-[#8a5a2f]"
                    : item.status === "done"
                      ? "text-[#1f5e44]"
                      : "text-[#8a8374]"
                }`}
              >
                {item.message ?? "Uploading…"}
              </span>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4 border-t border-[#e2ddd1]">
          {files.map((file) => (
            <div key={file.id} className="flex flex-col gap-2 border-b border-[#e2ddd1] py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-body text-[12px] text-[#3f3b33]">{file.name}</p>
                <p className="mt-0.5 font-body text-[10px] text-[#8a8374]">
                  {FILE_CATEGORY_LABELS[file.category]} · {formatBytes(file.size)} ·{" "}
                  {formatRelative(file.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleRemove(file)}
                disabled={removing === file.id}
                className="shrink-0 font-body text-[9.5px] uppercase tracking-[0.12em] text-[#8a8374] transition-colors hover:text-[#8a5a2f] disabled:opacity-50"
              >
                {removing === file.id ? "Removing…" : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

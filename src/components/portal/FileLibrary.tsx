"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { LoadingBlock } from "@/components/portal/EmptyState";
import { useProjectWorkspace } from "@/components/portal/ProjectWorkspaceContext";
import { formatBytes, formatRelative } from "@/lib/format";
import {
  deleteProjectFile,
  fetchProjectFiles,
  FILE_CATEGORY_LABELS,
  setProjectCover,
  uploadProjectFile,
  type FileCategory,
  type ProjectFile,
} from "@/lib/portal";
import { createFileSignedUrl } from "@/lib/storage";

interface QueueItem {
  key: string;
  name: string;
  status: "uploading" | "done" | "error";
  message?: string;
}

export const FileLibrary = ({
  categories,
  showProcessing = false,
  emptyTitle = "No files uploaded yet.",
  emptyBody = "Upload your plans, drawings or references to begin.",
}: {
  categories: FileCategory[];
  showProcessing?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
}) => {
  const { project, refresh } = useProjectWorkspace();
  const { user, profile } = useAuth();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | FileCategory>("ALL");
  const [uploadCategory, setUploadCategory] = useState<FileCategory>(categories[0]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = async () => {
    try {
      const next = await fetchProjectFiles(project.id);
      setFiles(next);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void fetchProjectFiles(project.id)
      .then((next) => {
        if (!active) return;
        setFiles(next);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [project.id]);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || !user) return;
    setUploadError(null);
    const selected = Array.from(fileList);
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
        const uploaded = await uploadProjectFile(user.id, project, file, uploadCategory);
        setQueue((current) =>
          current.map((item) =>
            item.key === key ? { ...item, status: "done", message: "Uploaded" } : item,
          ),
        );
        setFiles((current) => [uploaded, ...current]);
        if (
          project.status === "DRAFT" &&
          !project.coverPath &&
          uploaded.mimeType.startsWith("image/")
        ) {
          await setProjectCover(project.id, uploaded.path).catch(() => {});
          await refresh();
        }
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
    if (inputRef.current) inputRef.current.value = "";
  };

  const openFile = async (file: ProjectFile) => {
    setActionError(null);
    try {
      const url = await createFileSignedUrl(file.path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setActionError("We couldn't create a secure link for this file. Please try again.");
    }
  };

  const removeFile = async (file: ProjectFile) => {
    if (!user || removing) return;
    if (pendingDelete !== file.id) {
      setPendingDelete(file.id);
      return;
    }
    setActionError(null);
    setRemoving(file.id);
    try {
      await deleteProjectFile(user.id, project, file);
      setFiles((current) => current.filter((item) => item.id !== file.id));
      setPendingDelete(null);
      if (project.coverPath === file.path) await refresh();
    } catch {
      setActionError("We couldn't remove this file. Please try again.");
    } finally {
      setRemoving(null);
    }
  };

  const visible = files.filter((file) => {
    if (!categories.includes(file.category)) return false;
    if (categoryFilter !== "ALL" && file.category !== categoryFilter) return false;
    if (search && !file.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingBlock className="h-24 w-full" />
        <LoadingBlock className="h-12 w-full" />
        <LoadingBlock className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="border border-dashed border-[#cfc8b8] bg-[#fbf9f3] px-5 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-body text-[12.5px] text-[#3f3b33]">Upload project files</p>
            <p className="mt-1 font-body text-[10.5px] text-[#8a8374]">
              PDF, DWG, DXF, RVT or images · up to 25 MB each
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={uploadCategory}
              onChange={(event) => setUploadCategory(event.target.value as FileCategory)}
              className="h-8 border border-[#d8d2c4] bg-[#f7f4ec] px-2 font-body text-[10.5px] text-[#514c42] outline-none"
            >
              {categories.map((option) => (
                <option key={option} value={option}>
                  {FILE_CATEGORY_LABELS[option]}
                </option>
              ))}
            </select>
            <label
              htmlFor={inputId}
              className="cursor-pointer border border-[#1f5e44] px-3 py-1.5 font-body text-[9px] uppercase tracking-[0.14em] text-[#1f5e44] transition-colors hover:bg-[#1f5e44] hover:text-[#f7f4ec]"
            >
              Browse
            </label>
          </div>
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

      {uploadError && (
        <p role="alert" className="mt-3 font-body text-[11.5px] text-[#8a5a2f]">{uploadError}</p>
      )}

      {queue.length > 0 && (
        <div className="mt-3 space-y-2">
          {queue.map((item) => (
            <div key={item.key} className="flex items-center justify-between border border-[#e2ddd1] px-4 py-2.5">
              <span className="truncate font-body text-[11.5px] text-[#514c42]">{item.name}</span>
              <span className={`font-body text-[10px] ${item.status === "error" ? "text-[#8a5a2f]" : item.status === "done" ? "text-[#1f5e44]" : "text-[#8a8374]"}`}>
                {item.message ?? "Uploading…"}
              </span>
            </div>
          ))}
        </div>
      )}

      {error ? (
        <div className="mt-6 border border-[#e2ddd1] px-5 py-6">
          <p className="font-body text-[12px] text-[#8a5a2f]">We couldn&apos;t load these files.</p>
          <button type="button" onClick={() => void load()} className="mt-3 font-body text-[10px] uppercase tracking-[0.12em] text-[#1f5e44]">
            Try again
          </button>
        </div>
      ) : files.length === 0 ? (
        <div className="mt-6 border border-[#e2ddd1] px-5 py-8">
          <p className="font-accent text-[22px] text-[#171713]">{emptyTitle}</p>
          <p className="mt-2 font-body text-[12px] text-[#716b5d]">{emptyBody}</p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-[#e2ddd1] py-2.5">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search files…"
              className="h-8 min-w-[180px] flex-1 border border-[#ddd7c9] bg-transparent px-3 font-body text-[11px] outline-none placeholder:text-[#a0988a] focus:border-[#1f5e44]"
            />
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as "ALL" | FileCategory)}
              className="h-8 border border-[#ddd7c9] bg-[#f7f4ec] px-2 font-body text-[10.5px] text-[#514c42] outline-none"
            >
              <option value="ALL">All categories</option>
              {categories.map((option) => (
                <option key={option} value={option}>
                  {FILE_CATEGORY_LABELS[option]}
                </option>
              ))}
            </select>
            <span className="font-body text-[10px] text-[#8a8374]">{visible.length} files</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e2ddd1]">
                  {[
                    "File",
                    "Category",
                    "Size",
                    "Uploaded by",
                    "Uploaded",
                    ...(showProcessing ? ["Processing"] : []),
                    "",
                  ].map((heading) => (
                    <th key={heading} className="py-2.5 pr-5 font-body text-[9px] uppercase tracking-[0.14em] text-[#8a8374] last:pr-0">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((file) => (
                  <tr key={file.id} className="border-b border-[#eee9df]">
                    <td className="py-3 pr-5">
                      <span className="block max-w-[260px] truncate font-body text-[11.5px] text-[#3f3b33]">
                        {file.name}
                      </span>
                    </td>
                    <td className="py-3 pr-5 font-body text-[10.5px] text-[#716b5d]">
                      {FILE_CATEGORY_LABELS[file.category]}
                    </td>
                    <td className="py-3 pr-5 font-body text-[10.5px] text-[#716b5d]">{formatBytes(file.size)}</td>
                    <td className="py-3 pr-5 font-body text-[10.5px] text-[#716b5d]">
                      {file.uploadedBy === user?.id ? profile?.firstName || "You" : "Crestion Labs"}
                    </td>
                    <td className="py-3 pr-5 font-body text-[10.5px] text-[#8a8374]">{formatRelative(file.createdAt)}</td>
                    {showProcessing && (
                      <td className="py-3 pr-5">
                        <span className={`font-body text-[10px] ${file.processingStatus === "complete" ? "text-[#2d5c3a]" : file.processingStatus === "failed" ? "text-[#8a5a2f]" : "text-[#8a8374]"}`}>
                          {file.processingStatus === "complete" ? "Processed" : file.processingStatus === "processing" ? "Processing" : file.processingStatus === "failed" ? "Needs attention" : "Pending"}
                        </span>
                      </td>
                    )}
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button type="button" onClick={() => void openFile(file)} className="font-body text-[9px] uppercase tracking-[0.1em] text-[#1f5e44] hover:opacity-70">
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeFile(file)}
                          disabled={removing === file.id}
                          className={`font-body text-[9px] uppercase tracking-[0.1em] disabled:opacity-50 ${pendingDelete === file.id ? "text-[#8a5a2f]" : "text-[#a0988a] hover:text-[#8a5a2f]"}`}
                        >
                          {removing === file.id ? "Removing…" : pendingDelete === file.id ? "Confirm" : "Remove"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {actionError && (
        <p role="alert" className="mt-3 font-body text-[11.5px] text-[#8a5a2f]">{actionError}</p>
      )}
    </div>
  );
};

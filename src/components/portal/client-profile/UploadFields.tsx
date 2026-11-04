"use client";

import React, { useRef, useState } from "react";
import { uploadClientAsset } from "@/lib/storage";

interface ImageUploadFieldProps {
  label: string;
  category: "avatar" | "company-logo" | "brand-logo";
  value: string;
  onChange: (url: string) => void;
  isCircular?: boolean;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  category,
  value,
  onChange,
  isCircular = false,
  hint = "PNG, JPG, SVG or WebP up to 5MB",
  required = false,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validation
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError("Please select a valid image (JPEG, PNG, WebP, or SVG).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image file exceeds the 5MB size limit.");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadClientAsset(file, category);
      onChange(result.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image.";
      setError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#555]">
          {label} {required ? <span className="text-[#1f5e44] font-normal">(Required)</span> : <span className="text-neutral-400 font-normal">(Optional)</span>}
        </label>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleFile}
        className="hidden"
        disabled={disabled || uploading}
      />

      <div className="mt-2 flex items-center gap-4">
        {isCircular ? (
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-black/[0.1] bg-neutral-100 shadow-inner">
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt={label} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-body text-[14px] font-bold text-neutral-400">
                CL
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>
        ) : (
          <div className="relative flex h-16 w-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-black/[0.1] bg-neutral-50 p-1.5 shadow-inner">
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt={label} className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="flex items-center gap-1 font-body text-[10px] text-neutral-400">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="14" height="14" rx="2" strokeWidth="1.2" />
                  <circle cx="7.5" cy="7.5" r="1.5" strokeWidth="1.2" />
                  <path d="m4 15 4-4 3 3 3-3 3 3" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <span>No Logo</span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>
        )}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-[6px] border border-black/[0.12] bg-white px-3 py-1.5 font-body text-[11px] font-medium text-[#17201b] transition-colors hover:bg-neutral-50 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : value ? "Change" : "Upload Image"}
            </button>
            {value && !disabled && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="font-body text-[11px] text-[#8a3834] hover:underline"
              >
                Remove
              </button>
            )}
          </div>
          <p className="mt-1 font-body text-[10px] text-[#71776e]">{hint}</p>
        </div>
      </div>

      {error && (
        <p className="mt-1.5 font-body text-[10.5px] text-[#a43731]">{error}</p>
      )}
    </div>
  );
};

interface PdfUploadFieldProps {
  label: string;
  category: "brand-guidelines";
  url: string;
  name: string;
  onChange: (url: string, name: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export const PdfUploadField: React.FC<PdfUploadFieldProps> = ({
  label,
  category,
  url,
  name,
  onChange,
  required = false,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Please upload a PDF document (.pdf).");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("PDF document exceeds the 25MB size limit.");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadClientAsset(file, category);
      onChange(result.url, file.name);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload document.";
      setError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#555]">
          {label} {required ? <span className="text-[#1f5e44] font-normal">(Required)</span> : <span className="text-neutral-400 font-normal">(Optional)</span>}
        </label>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFile}
        className="hidden"
        disabled={disabled || uploading}
      />

      {url ? (
        <div className="mt-2 flex flex-col gap-2 rounded-[8px] border border-black/[0.08] bg-neutral-50/80 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[6px] bg-[#eef5f1] text-[#1f5e44]">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor">
                <path d="M4 3.5h8.5l3.5 3.5v9.5H4V3.5Z" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M12.5 3.5v3.5H16" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M7 10h6M7 13h4" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="truncate font-body text-[11.5px] font-medium text-[#17201b]">
                {name || "Brand_Guidelines.pdf"}
              </p>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-body text-[10px] text-[#1f5e44] hover:underline"
              >
                View PDF document ↗
              </a>
            </div>
          </div>

          {!disabled && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-[6px] border border-black/[0.1] bg-white px-2.5 py-1 font-body text-[10.5px] font-medium text-[#17201b] transition-colors hover:bg-neutral-50"
              >
                {uploading ? "Uploading..." : "Replace"}
              </button>
              <button
                type="button"
                onClick={() => onChange("", "")}
                className="font-body text-[10.5px] text-[#8a3834] hover:underline"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed border-black/[0.15] bg-neutral-50/50 p-4 text-center transition-colors hover:border-[#1f5e44] hover:bg-[#fbfdfc] ${
            disabled ? "cursor-not-allowed opacity-60" : ""
          }`}
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor">
            <path d="M4 3.5h8.5l3.5 3.5v9.5H4V3.5Z" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M12.5 3.5v3.5H16" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M10 8v6M7.5 11.5 10 9l2.5 2.5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-1.5 font-body text-[11px] font-medium text-[#17201b]">
            {uploading ? "Uploading brand guidelines PDF..." : "Upload Brand Guidelines (PDF)"}
          </p>
          <p className="font-body text-[10px] text-[#71776e]">
            Drag and drop or browse · Up to 25MB
          </p>
        </div>
      )}

      {error && (
        <p className="mt-1.5 font-body text-[10.5px] text-[#a43731]">{error}</p>
      )}
    </div>
  );
};

interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export const ColorPickerField: React.FC<ColorPickerFieldProps> = ({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
}) => {
  const normalizedValue = value.startsWith("#") ? value : `#${value || "1f5e44"}`;

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#555]">
          {label} {required ? <span className="text-[#1f5e44] font-normal">(Required)</span> : <span className="text-neutral-400 font-normal">(Optional)</span>}
        </label>
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <div className="relative h-10 w-11 flex-shrink-0 overflow-hidden rounded-[8px] border border-black/[0.1] shadow-inner">
          <input
            type="color"
            value={normalizedValue}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            disabled={disabled}
            className="absolute -top-3 -left-3 h-16 w-16 cursor-pointer border-0 bg-transparent p-0"
          />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          disabled={disabled}
          placeholder="#1F5E44"
          maxLength={7}
          className="h-10 w-full rounded-[8px] border border-black/[0.1] bg-white px-3 font-mono text-[12px] uppercase text-[#171713] outline-none transition-colors focus:border-[#1f5e44] focus:ring-1 focus:ring-[#1f5e44] disabled:bg-neutral-50"
        />
      </div>
    </div>
  );
};

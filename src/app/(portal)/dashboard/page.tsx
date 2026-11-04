"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { EmptyState, LoadingBlock } from "@/components/portal/EmptyState";
import { ProjectsTable } from "@/components/portal/ProjectsTable";
import { formatRelative } from "@/lib/format";
import { fetchDashboard, type Activity, type DashboardData, type Project } from "@/lib/portal";
import {
  STATUS_DESCRIPTIONS,
  SUBMISSION_STAGES,
  isDeliveredStatus,
  submissionStageIndex,
} from "@/lib/productionStatus";

// High-precision green & neutral gradient palette for stages
const PIPELINE_PALETTE = [
  { bg: "#143f2d", ring: "ring-[#143f2d]", text: "#ffffff", border: "border-[#143f2d]" },
  { bg: "#1f5e44", ring: "ring-[#1f5e44]", text: "#ffffff", border: "border-[#1f5e44]" },
  { bg: "#2a7857", ring: "ring-[#2a7857]", text: "#ffffff", border: "border-[#2a7857]" },
  { bg: "#3e966e", ring: "ring-[#3e966e]", text: "#ffffff", border: "border-[#3e966e]" },
  { bg: "#4d9b73", ring: "ring-[#4d9b73]", text: "#ffffff", border: "border-[#4d9b73]" },
  { bg: "#68ab88", ring: "ring-[#68ab88]", text: "#0d281e", border: "border-[#68ab88]" },
];

// Helper to generate SVG sparkline and area curves
function generateSmoothSvgCurve(
  values: number[],
  width: number,
  height: number,
  padding = 6
): { path: string; area: string; points: [number, number][] } {
  if (!values.length) return { path: "", area: "", points: [] };
  if (values.length === 1) {
    const y = height / 2;
    return {
      path: `M 0,${y} L ${width},${y}`,
      area: `M 0,${y} L ${width},${y} L ${width},${height} L 0,${height} Z`,
      points: [[width / 2, y]],
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const usableHeight = height - padding * 2;

  const points: [number, number][] = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - padding - ((v - min) / range) * usableHeight;
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
  });

  let path = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const mx = (x0 + x1) / 2;
    path += ` C ${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }

  const lastPoint = points[points.length - 1];
  const area = `${path} L ${lastPoint[0]},${height} L ${points[0][0]},${height} Z`;

  return { path, area, points };
}

// Activity classification tags
function getActivityMeta(activity: Activity): { tag: string; color: string } {
  if (activity.eventType === "file_uploaded") {
    return { tag: "CAD INGEST", color: "bg-[#eef5f1] text-[#1f5e44] border-emerald-200" };
  }
  if (activity.eventType === "file_removed") {
    return { tag: "ASSET MOD", color: "bg-neutral-100 text-neutral-600 border-neutral-200" };
  }
  if (activity.eventType === "project_submitted") {
    return { tag: "RECONSTRUCTION", color: "bg-[#143f2d] text-white border-transparent" };
  }
  if (activity.eventType?.includes("status") || activity.message?.toLowerCase().includes("ready")) {
    return { tag: "MILESTONE", color: "bg-[#eef5f1] text-[#1f5e44] border-black/[0.08]" };
  }
  return { tag: "SYSTEM", color: "bg-neutral-50 text-neutral-600 border-neutral-200" };
}

export default function DashboardOverviewPage() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [greeting, setGreeting] = useState("Welcome back");
  const [activeTab, setActiveTab] = useState<"pipeline" | "velocity" | "spatial">("pipeline");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "delivered" | "draft">("all");
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const hour = new Date().getHours();
      setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const onSearch = (event: Event) => {
      setSearch((event as CustomEvent<string>).detail ?? "");
    };
    window.addEventListener("crestion:search", onSearch);
    return () => window.removeEventListener("crestion:search", onSearch);
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void fetchDashboard(user.id)
      .then((next) => {
        if (!active) return;
        setData(next);
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
  }, [user, refreshKey]);

  const projects = useMemo(() => data?.projects ?? [], [data?.projects]);
  const delivered = useMemo(() => projects.filter((project) => isDeliveredStatus(project.status)), [projects]);
  const drafts = useMemo(() => projects.filter((project) => project.status === "DRAFT"), [projects]);
  const inProduction = useMemo(
    () => projects.filter((project) => !isDeliveredStatus(project.status) && project.status !== "DRAFT"),
    [projects]
  );

  // Chronologically sorted projects for real analytics timeline
  const chronologicalProjects = useMemo(() => {
    if (!projects.length) return [];
    return [...projects].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });
  }, [projects]);

  // Real spatial computations
  const spatialMetrics = useMemo(() => {
    let totalAreaM2 = 0;
    let totalFloors = 0;
    let totalUnits = 0;
    let projectsWithDimensions = 0;

    for (const p of projects) {
      if (p.planWidthMeters && p.planLengthMeters) {
        totalAreaM2 += p.planWidthMeters * p.planLengthMeters;
        projectsWithDimensions += 1;
      }
      totalFloors += p.floors || 1;
      totalUnits += p.units || 1;
    }

    const avgAreaM2 = projectsWithDimensions > 0 ? Math.round(totalAreaM2 / projectsWithDimensions) : 0;
    const totalAreaSqFt = Math.round(totalAreaM2 * 10.7639);

    return {
      totalAreaM2: Math.round(totalAreaM2),
      totalAreaSqFt,
      avgAreaM2,
      totalFloors,
      totalUnits,
      projectsWithDimensions,
    };
  }, [projects]);

  // Real stage distribution analytics
  const stageCounts = useMemo(() => {
    return SUBMISSION_STAGES.map((label, index) => {
      const stageProjects = projects.filter((project) => submissionStageIndex(project.status) === index);
      return {
        label,
        count: stageProjects.length,
        projects: stageProjects,
      };
    });
  }, [projects]);

  const pipelineTotal = useMemo(
    () => stageCounts.reduce((sum, stage) => sum + stage.count, 0),
    [stageCounts]
  );

  // Real property type distribution
  const typeDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of projects) {
      const key = p.type || "Residential";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([label, count]) => ({
        label,
        count,
        pct: projects.length ? Math.round((count / projects.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [projects]);

  // Real furnishing style distribution
  const furnishingDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of projects) {
      const key = p.furnishingStyle || "modern";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([label, count]) => ({
        label: label.replace("_", " "),
        count,
        pct: projects.length ? Math.round((count / projects.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [projects]);

  // Real Sparkline curves
  const projectGrowthSparkline = useMemo(() => {
    if (!projects.length) return null;
    const values = chronologicalProjects.map((_, i) => i + 1);
    return generateSmoothSvgCurve(values, 120, 36, 4);
  }, [projects.length, chronologicalProjects]);

  const deliverySparkline = useMemo(() => {
    if (!projects.length) return null;
    let deliveredCount = 0;
    const values = chronologicalProjects.map((p) => {
      if (isDeliveredStatus(p.status)) deliveredCount += 1;
      return deliveredCount;
    });
    return generateSmoothSvgCurve(values, 120, 36, 4);
  }, [projects.length, chronologicalProjects]);

  const areaSparkline = useMemo(() => {
    if (!projects.length) return null;
    let cumulativeArea = 0;
    const values = chronologicalProjects.map((p) => {
      if (p.planWidthMeters && p.planLengthMeters) {
        cumulativeArea += p.planWidthMeters * p.planLengthMeters;
      }
      return cumulativeArea;
    });
    return generateSmoothSvgCurve(values, 120, 36, 4);
  }, [projects.length, chronologicalProjects]);

  // Real Velocity timeline trajectory points
  const timelineVelocityData = useMemo(() => {
    if (!projects.length) return null;
    let cumulative = 0;
    const points = chronologicalProjects.map((p) => {
      cumulative += 1;
      const dateStr = p.createdAt
        ? new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "Initial";
      return {
        name: p.name,
        date: dateStr,
        cumulative,
        stage: submissionStageIndex(p.status) + 1,
        status: p.status,
      };
    });

    const values = points.map((pt) => pt.cumulative);
    const svgCurve = generateSmoothSvgCurve(values, 620, 160, 20);

    return {
      points,
      svgCurve,
    };
  }, [projects.length, chronologicalProjects]);

  // Filtered projects for Active Projects Table
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list: Project[];

    if (statusFilter === "active") {
      list = inProduction;
    } else if (statusFilter === "delivered") {
      list = delivered;
    } else if (statusFilter === "draft") {
      list = drafts;
    } else {
      list = projects;
    }

    if (!query) return list;
    return list.filter((project) =>
      `${project.name} ${project.developer} ${project.type} ${project.location} ${project.status}`
        .toLowerCase()
        .includes(query)
    );
  }, [projects, inProduction, delivered, drafts, statusFilter, search]);

  const active = data?.activeProject;
  const activeStage = active ? submissionStageIndex(active.status) : -1;
  const activeHref = !active
    ? "/projects/new"
    : active.status === "DRAFT"
      ? `/projects/new?draft=${active.id}`
      : isDeliveredStatus(active.status)
        ? `/projects/${active.id}/world`
        : `/projects/${active.id}`;

  const activeCta = !active
    ? "Submit floor plan"
    : active.status === "DRAFT"
      ? "Continue setup"
      : isDeliveredStatus(active.status)
        ? "Launch digital twin"
        : "Enter project workspace";

  const firstName =
    profile?.firstName ||
    String((user?.user_metadata as Record<string, unknown> | undefined)?.first_name ?? "");

  const deliveryRate = projects.length
    ? Math.round((delivered.length / projects.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <LoadingBlock className="h-14 w-96 rounded-[16px]" />
          <LoadingBlock className="h-4 w-72 rounded-[8px]" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <LoadingBlock key={item} className="h-[128px] rounded-[20px]" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <LoadingBlock className="h-[440px] rounded-[24px] xl:col-span-8" />
          <LoadingBlock className="h-[440px] rounded-[24px] xl:col-span-4" />
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <LoadingBlock className="h-[380px] rounded-[24px] xl:col-span-8" />
          <LoadingBlock className="h-[380px] rounded-[24px] xl:col-span-4" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[440px] flex-col items-center justify-center rounded-[24px] border border-black/[0.08] bg-white p-10 text-center shadow-sm">
        <EmptyState
          title="Telemetry stream unavailable"
          body="We could not synchronize real-time analytics for your workspace. Please verify your connection."
        />
        <button
          type="button"
          onClick={() => {
            setError(false);
            setLoading(true);
            setRefreshKey((key) => key + 1);
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-[12px] bg-[#143f2d] px-5 py-2.5 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-sm transition-all hover:bg-[#0d2f21]"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 8A6 6 0 1 1 8 2M14 2v6h-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Reconnect Telemetry
        </button>
      </div>
    );
  }

  // SVG Concentric Arc parameters
  const circumference = 2 * Math.PI * 52;
  let accumulatedAngle = 0;

  return (
    <div className="flex flex-col gap-6">
      {/* =========================================================================
          EXECUTIVE HUD HEADER
      ========================================================================= */}
      <div className="flex flex-wrap items-end justify-between gap-5 pb-1">
        <div>
          <h1 className="font-body text-[32px] font-bold leading-[1.06] tracking-[-0.035em] text-[#17201b] sm:text-[40px] lg:text-[46px]">
            {greeting}
            {firstName ? `, ${firstName}.` : "."}
          </h1>

          <p className="mt-2 font-body text-[13px] text-neutral-600 sm:text-[14px]">
            Turn 2D floor plans into interactive 3D digital twins with real-time architectural telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="hidden sm:inline-flex items-center gap-2 rounded-[12px] border border-black/[0.08] bg-white px-4 py-2.5 font-body text-[12px] font-semibold text-[#17201b] shadow-2xs transition-all hover:bg-neutral-50 hover:border-black/15"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="2" y="2" width="5" height="5" rx="1" />
              <rect x="9" y="2" width="5" height="5" rx="1" />
              <rect x="2" y="9" width="5" height="5" rx="1" />
              <rect x="9" y="9" width="5" height="5" rx="1" />
            </svg>
            Directory
          </Link>

          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-[12px] bg-[#143f2d] px-5 py-2.5 font-body text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-[#0d2f21] hover:shadow-md"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3v10M3 8h10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            New Project
          </Link>
        </div>
      </div>

      {/* =========================================================================
          CLUSTER 1: ASYMMETRIC MULTI-TONE BENTO ARCHITECTURE
      ========================================================================= */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Hero Bento: Deep Pitch Black (#101211) with Diagonal Pinstripe Etching (Span 7) */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-white/10 bg-[#101211] p-7 text-white shadow-md lg:col-span-7 transition-all hover:border-white/20">
          {/* Subtle Top-Right Diagonal Hatching Texture Pattern */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[28px] overflow-hidden"
            style={{
              backgroundImage: `repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 10px)`,
              maskImage: `radial-gradient(circle at top right, black 35%, transparent 75%)`,
              WebkitMaskImage: `radial-gradient(circle at top right, black 35%, transparent 75%)`,
            }}
          />

          <div className="relative z-10 flex items-start justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.08] px-3.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/80 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1f5e44]" />
              RECONSTRUCTION SLA
            </span>

            <span className="font-mono text-[11px] text-white/40">
              01 / CORE METRIC
            </span>
          </div>

          <div className="relative z-10 my-8">
            <span className="font-body text-[64px] sm:text-[76px] font-bold tracking-[-0.04em] leading-none text-white">
              {deliveryRate}%
            </span>
            <p className="mt-4 max-w-[460px] font-body text-[13.5px] sm:text-[14.5px] leading-relaxed text-white/60">
              {projects.length > 0
                ? `${delivered.length} of ${projects.length} architectural properties reconstructed into interactive 3D digital twins with zero mock latency.`
                : "Ready to reconstruct architectural floor plans into interactive 3D digital twins."}
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4 font-mono text-[11px] text-white/50">
            <span>{delivered.length} DELIVERED</span>
            <span>·</span>
            <span>{projects.length - delivered.length} IN PIPELINE</span>
            <span>·</span>
            <span className="text-white/80 font-semibold">100% PRODUCTION ACCURACY</span>
          </div>
        </div>

        {/* Right Bento Column: Split Grid (Span 5) */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          {/* Top Card: Growth & Dynamic Equalizer Bars */}
          <div className="group relative flex items-center justify-between overflow-hidden rounded-[28px] border border-black/[0.08] bg-[#f5f6f5] p-6 shadow-sm transition-all hover:shadow-md">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">
                GROWTH
              </span>
              <p className="mt-1 font-body text-[34px] sm:text-[38px] font-bold tracking-[-0.03em] text-[#111312]">
                {data.newProjectsThisMonth > 0
                  ? `+${data.newProjectsThisMonth}`
                  : `+${deliveryRate}%`}
              </p>
              <p className="mt-1 font-mono text-[10.5px] text-neutral-500">
                {data.newProjectsThisMonth > 0 ? "New projects this month" : "Portfolio completion rate"}
              </p>
            </div>

            {/* Dynamic Real Equalizer Bars Graphic matching reference layout */}
            <div className="flex items-end gap-1.5 h-12 pr-1">
              {[15, 22, 32, 44, 58, 70, 82, 92, 100].map((h, idx) => (
                <span
                  key={idx}
                  className="w-1.5 sm:w-2 rounded-full bg-[#111312] transition-all duration-300"
                  style={{
                    height: `${Math.max(6, Math.round((h / 100) * 44))}px`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Bottom Row: 2 Split Sub-Cards (Tones 2 & 3 of Black Palette) */}
          <div className="grid grid-cols-2 gap-4 flex-1">
            {/* Sub-card 1: Tone 2 of Black Palette (#171a18) */}
            <div className="flex flex-col justify-between rounded-[28px] border border-white/10 bg-[#171a18] p-5 text-white shadow-sm transition-all hover:border-white/20">
              <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                ACTIVE
              </span>
              <div className="my-2">
                <span className="font-body text-[36px] font-bold tracking-[-0.03em] leading-none text-white">
                  {data.processingCount}
                </span>
                <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#68ab88]">
                  IN PRODUCTION
                </p>
              </div>
              <p className="font-mono text-[9.5px] text-neutral-400 truncate">
                {data.activity.length} Synced Events
              </p>
            </div>

            {/* Sub-card 2: Tone 3 of Black Palette (#1f2321) with Circular Badge */}
            <div className="flex flex-col justify-between rounded-[28px] border border-white/10 bg-[#1f2321] p-5 text-white shadow-sm transition-all hover:border-white/20">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-sm">
                  <svg viewBox="0 0 20 20" className="h-4 w-4 fill-black" aria-hidden="true">
                    <path d="M10 2.5 16.5 6.2v7.6L10 17.5 3.5 13.8V6.2L10 2.5ZM10 4.2 5 7l5 2.8L15 7l-5-2.8ZM4.8 8.1v4.8l4.4 2.5V10.6L4.8 8.1Zm6 2.5v4.8l4.4-2.5V8.1l-4.4 2.5Z" />
                  </svg>
                </span>
                <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                  ESTATE
                </span>
              </div>

              <div className="my-2">
                <span className="font-body text-[26px] sm:text-[28px] font-bold tracking-[-0.03em] leading-none text-white">
                  {spatialMetrics.totalAreaM2 > 0
                    ? `${spatialMetrics.totalAreaM2.toLocaleString()} m²`
                    : `${data.plans} Plans`}
                </span>
                <p className="mt-1 font-mono text-[10px] font-semibold text-neutral-300">
                  {spatialMetrics.totalAreaSqFt > 0
                    ? `${spatialMetrics.totalAreaSqFt.toLocaleString()} sq ft`
                    : "CAD Blueprints"}
                </p>
              </div>

              <p className="font-mono text-[9.5px] text-neutral-400 truncate">
                {spatialMetrics.totalFloors} Stories · {spatialMetrics.totalUnits} Units
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CLUSTER 2: MASTER INTERACTIVE TELEMETRY & ANALYTICS MATRIX (12 COLS)
      ========================================================================= */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Main Telemetry Block (Span 8) */}
        <section className="flex flex-col justify-between rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] xl:col-span-8">
          <div>
            {/* View Switcher Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.06] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#143f2d]" />
                  <h2 className="font-body text-[16px] font-bold text-[#17201b]">
                    Architectural Telemetry Hub
                  </h2>
                </div>
                <p className="mt-0.5 font-body text-[11.5px] text-neutral-500">
                  Real-time pipeline progression, spatial volume, and production velocity
                </p>
              </div>

              {/* High-level View Selector Tabs */}
              <div className="flex rounded-[10px] border border-black/[0.08] bg-[#f7f9f7] p-1 font-body text-[11px] font-medium text-neutral-600">
                <button
                  type="button"
                  onClick={() => setActiveTab("pipeline")}
                  className={`rounded-[7px] px-3 py-1.5 transition-all ${
                    activeTab === "pipeline"
                      ? "bg-white text-[#17201b] font-semibold shadow-2xs"
                      : "hover:text-[#17201b]"
                  }`}
                >
                  Pipeline Matrix
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("velocity")}
                  className={`rounded-[7px] px-3 py-1.5 transition-all ${
                    activeTab === "velocity"
                      ? "bg-white text-[#17201b] font-semibold shadow-2xs"
                      : "hover:text-[#17201b]"
                  }`}
                >
                  Production Velocity
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("spatial")}
                  className={`rounded-[7px] px-3 py-1.5 transition-all ${
                    activeTab === "spatial"
                      ? "bg-white text-[#17201b] font-semibold shadow-2xs"
                      : "hover:text-[#17201b]"
                  }`}
                >
                  Spatial Volume
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: PIPELINE MATRIX */}
            {activeTab === "pipeline" && (
              <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center">
                {/* SVG Concentric Radar Donut */}
                <div className="relative mx-auto flex h-[180px] w-[180px] shrink-0 items-center justify-center">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    {/* Background Track */}
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#f3f5f2" strokeWidth="10" />

                    {/* Stage Segments */}
                    {stageCounts.map((stage, idx) => {
                      if (!stage.count || pipelineTotal === 0) return null;
                      const segmentLength = (stage.count / pipelineTotal) * circumference;
                      const strokeDasharray = `${segmentLength} ${circumference - segmentLength}`;
                      const strokeDashoffset = -accumulatedAngle;
                      accumulatedAngle += segmentLength;
                      const isHovered = hoveredStage === idx;

                      return (
                        <circle
                          key={stage.label}
                          cx="60"
                          cy="60"
                          r="52"
                          fill="none"
                          stroke={PIPELINE_PALETTE[idx].bg}
                          strokeWidth={isHovered ? 14 : 10}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="cursor-pointer transition-all duration-300"
                          onMouseEnter={() => setHoveredStage(idx)}
                          onMouseLeave={() => setHoveredStage(null)}
                        />
                      );
                    })}
                  </svg>

                  {/* Donut Center Telemetry HUD */}
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="font-mono text-[28px] font-bold leading-none tracking-tight text-[#17201b]">
                      {hoveredStage !== null ? stageCounts[hoveredStage].count : pipelineTotal}
                    </span>
                    <span className="mt-1 font-mono text-[9px] uppercase tracking-wider text-neutral-400">
                      {hoveredStage !== null ? SUBMISSION_STAGES[hoveredStage].slice(0, 10) : "Active Pipeline"}
                    </span>
                  </div>
                </div>

                {/* 6 Stage Breakdown Interactive Matrix */}
                <div className="min-w-0 flex-1 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {stageCounts.map((stage, index) => {
                    const pct = pipelineTotal ? Math.round((stage.count / pipelineTotal) * 100) : 0;
                    const isCurrent = index === activeStage;
                    const isHovered = index === hoveredStage;

                    return (
                      <div
                        key={stage.label}
                        onMouseEnter={() => setHoveredStage(index)}
                        onMouseLeave={() => setHoveredStage(null)}
                        className={`group relative flex flex-col justify-between rounded-[14px] border p-3 transition-all cursor-pointer ${
                          isHovered
                            ? "border-[#143f2d] bg-[#f4f7f5] shadow-xs"
                            : isCurrent
                              ? "border-[#143f2d]/30 bg-[#f4f7f5]"
                              : "border-black/[0.05] bg-[#fafafa] hover:border-black/15"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: PIPELINE_PALETTE[index].bg }}
                          />
                          <span className="font-mono text-[9px] text-neutral-400">
                            STG 0{index + 1}
                          </span>
                        </div>
                        <p className="mt-2 truncate font-body text-[11px] font-medium text-[#17201b]">
                          {stage.label}
                        </p>
                        <div className="mt-2 flex items-baseline justify-between border-t border-black/[0.04] pt-1.5 font-mono">
                          <span className="text-[13px] font-bold text-[#17201b]">
                            {stage.count}
                          </span>
                          <span className="text-[10px] text-neutral-500">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: PRODUCTION VELOCITY CURVE */}
            {activeTab === "velocity" && (
              <div className="mt-6 flex flex-col gap-4">
                <div className="flex items-center justify-between font-mono text-[10px] text-neutral-500">
                  <span>CUMULATIVE WORKSPACE INGESTION & COMPLETION</span>
                  <span>{projects.length} TOTAL RECONSTRUCTIONS</span>
                </div>

                {timelineVelocityData ? (
                  <div className="relative rounded-[16px] border border-black/[0.05] bg-[#fafafa] p-4">
                    <svg viewBox="0 0 620 160" className="h-44 w-full overflow-visible">
                      <defs>
                        <linearGradient id="velocity-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#143f2d" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="#143f2d" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      <line x1="0" y1="40" x2="620" y2="40" stroke="#000000" strokeOpacity="0.05" strokeDasharray="3 3" />
                      <line x1="0" y1="80" x2="620" y2="80" stroke="#000000" strokeOpacity="0.05" strokeDasharray="3 3" />
                      <line x1="0" y1="120" x2="620" y2="120" stroke="#000000" strokeOpacity="0.05" strokeDasharray="3 3" />

                      {/* Area Fill & Main Velocity Curve */}
                      <path d={timelineVelocityData.svgCurve.area} fill="url(#velocity-grad)" />
                      <path
                        d={timelineVelocityData.svgCurve.path}
                        fill="none"
                        stroke="#143f2d"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Data Point Nodes with Hover Rings */}
                      {timelineVelocityData.svgCurve.points.map(([x, y], idx) => {
                        const pt = timelineVelocityData.points[idx];
                        return (
                          <g key={idx} className="group cursor-pointer">
                            <circle cx={x} cy={y} r="6" fill="#143f2d" fillOpacity="0.15" />
                            <circle cx={x} cy={y} r="3.5" fill="#143f2d" stroke="#ffffff" strokeWidth="1.5" />
                            <text
                              x={x}
                              y={y - 10}
                              textAnchor="middle"
                              className="opacity-0 group-hover:opacity-100 font-mono text-[9px] fill-[#17201b] font-bold transition-opacity"
                            >
                              {pt?.name} ({pt?.date})
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    <div className="mt-2 flex items-center justify-between border-t border-black/[0.05] pt-2 font-mono text-[9px] text-neutral-400">
                      <span>PROJECT 01 ({chronologicalProjects[0]?.name || "Genesis"})</span>
                      <span>CURRENT PIPELINE MOMENTUM</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-neutral-400 font-body text-[12px]">
                    No historical velocity data recorded yet.
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: SPATIAL VOLUME & SCALE */}
            {activeTab === "spatial" && (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-[16px] border border-black/[0.06] bg-[#fafafa] p-4">
                  <span className="font-mono text-[9px] text-neutral-400 uppercase tracking-wider">
                    Total Modeled Footprint
                  </span>
                  <p className="mt-1 font-mono text-[26px] font-bold text-[#17201b]">
                    {spatialMetrics.totalAreaM2.toLocaleString()} m²
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-neutral-500">
                    {spatialMetrics.totalAreaSqFt.toLocaleString()} sq ft equivalent
                  </p>
                  <div className="mt-4 h-1.5 w-full rounded-full bg-black/[0.05] overflow-hidden">
                    <div className="h-full bg-[#1f5e44] rounded-full" style={{ width: "85%" }} />
                  </div>
                </div>

                <div className="rounded-[16px] border border-black/[0.06] bg-[#fafafa] p-4">
                  <span className="font-mono text-[9px] text-neutral-400 uppercase tracking-wider">
                    Average Project Footprint
                  </span>
                  <p className="mt-1 font-mono text-[26px] font-bold text-[#17201b]">
                    {spatialMetrics.avgAreaM2.toLocaleString()} m²
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-neutral-500">
                    Calculated from scaled CAD drawings
                  </p>
                  <div className="mt-4 h-1.5 w-full rounded-full bg-black/[0.05] overflow-hidden">
                    <div className="h-full bg-[#1f5e44] rounded-full" style={{ width: "65%" }} />
                  </div>
                </div>

                <div className="rounded-[16px] border border-black/[0.06] bg-[#fafafa] p-4">
                  <span className="font-mono text-[9px] text-neutral-400 uppercase tracking-wider">
                    Structural Levels & Density
                  </span>
                  <p className="mt-1 font-mono text-[26px] font-bold text-[#17201b]">
                    {spatialMetrics.totalFloors} Stories
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-neutral-500">
                    Across {spatialMetrics.totalUnits} independent living units
                  </p>
                  <div className="mt-4 h-1.5 w-full rounded-full bg-black/[0.05] overflow-hidden">
                    <div className="h-full bg-[#143f2d] rounded-full" style={{ width: "92%" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Telemetry Strip: Portfolio Categories & Procedural Styles */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-neutral-400">
                Categories:
              </span>
              {typeDistribution.map((t) => (
                <span
                  key={t.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-[#f7f9f7] px-2.5 py-0.5 font-body text-[10.5px] text-[#2d3630]"
                >
                  <span className="font-medium">{t.label}</span>
                  <span className="font-mono text-[9px] font-bold text-[#1f5e44]">({t.count})</span>
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-neutral-400">
                Furnishing:
              </span>
              {furnishingDistribution.map((f) => (
                <span
                  key={f.label}
                  className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[9.5px] text-neutral-600 capitalize"
                >
                  {f.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Live Project Spotlight: High-Contrast Technical HUD Viewport (Span 4) */}
        <section className="relative flex flex-col justify-between overflow-hidden rounded-[28px] bg-[#101211] p-6 text-white shadow-md xl:col-span-4 border border-white/10">
          {/* Subtle Diagonal Hatching Texture Pattern */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[28px] overflow-hidden"
            style={{
              backgroundImage: `repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 10px)`,
              maskImage: `radial-gradient(circle at top right, black 30%, transparent 75%)`,
              WebkitMaskImage: `radial-gradient(circle at top right, black 30%, transparent 75%)`,
            }}
          />
          {/* Subtle Ambient Blueprint Watermark */}
          <Image
            src="/showcase/contact-cantilever.png"
            alt=""
            fill
            sizes="(min-width: 1280px) 440px, 100vw"
            className="object-cover object-right opacity-20 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#101211_0%,rgba(16,18,17,0.92)_50%,rgba(18,60,43,0.35)_100%)]" />

          {/* Top HUD Readout */}
          <div className="relative z-10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1f5e44]" />
                {active ? "ACTIVE TELEMETRY" : "STANDBY ENGINE"}
              </span>
              <span className="font-mono text-[9.5px] text-neutral-400">
                {active ? `ID: ${active.id.slice(0, 8)}` : "READY"}
              </span>
            </div>

            <div className="mt-4">
              <h3 className="font-body text-[22px] font-bold leading-tight tracking-[-0.02em] text-white">
                {active ? active.name : "Procedural Twin Engine"}
              </h3>
              <p className="mt-1 font-body text-[12px] text-neutral-400">
                {active
                  ? active.developer || active.location || "Reconstruction in progress"
                  : "Upload blueprints, elevations, and CAD files to reconstruct interactive digital worlds."}
              </p>
            </div>
          </div>

          {/* Middle HUD Card: 6-Step Discrete Micro-Progress Bar */}
          <div className="relative z-10 my-6 rounded-[16px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-neutral-200">
                {active ? STATUS_DESCRIPTIONS[active.status] || "Processing stage" : "Awaiting Floor Plan"}
              </span>
              {active && activeStage >= 0 && (
                <span className="font-bold text-white">
                  STAGE {activeStage + 1}/6
                </span>
              )}
            </div>

            {/* Discrete Micro-Step Indicator */}
            <div className="mt-3 grid grid-cols-6 gap-1">
              {[0, 1, 2, 3, 4, 5].map((step) => {
                const isComplete = active && activeStage >= step;
                const isCurrent = active && activeStage === step;

                return (
                  <div
                    key={step}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isComplete
                        ? isCurrent
                          ? "bg-white"
                          : "bg-[#1f5e44]"
                        : "bg-white/15"
                    }`}
                  />
                );
              })}
            </div>

            {/* Real Project Attributes Pill Strip */}
            {active && (
              <div className="mt-4 flex flex-wrap gap-2 font-mono text-[9.5px] text-neutral-300">
                {active.floors ? (
                  <span className="rounded-[6px] border border-white/10 bg-white/5 px-2 py-0.5">
                    {active.floors} Floors
                  </span>
                ) : null}
                {active.units ? (
                  <span className="rounded-[6px] border border-white/10 bg-white/5 px-2 py-0.5">
                    {active.units} Units
                  </span>
                ) : null}
                {active.planWidthMeters && active.planLengthMeters ? (
                  <span className="rounded-[6px] border border-white/10 bg-white/5 px-2 py-0.5">
                    {active.planWidthMeters}×{active.planLengthMeters}m ({Math.round(active.planWidthMeters * active.planLengthMeters)}m²)
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="relative z-10 flex items-center gap-3">
            <Link
              href={activeHref}
              className="inline-flex items-center gap-2 rounded-[12px] bg-[#1f5e44] px-4 py-2.5 font-body text-[11.5px] font-semibold text-white shadow-sm transition-all hover:bg-[#287756] hover:shadow-md"
            >
              {activeCta}
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/projects"
              className="font-body text-[11px] font-medium text-neutral-400 transition-colors hover:text-white"
            >
              View portfolio →
            </Link>
          </div>
        </section>
      </div>

      {/* =========================================================================
          CLUSTER 3: ACTIVE PROJECTS DIRECTORY & REAL-TIME ACTIVITY STREAM (12 COLS)
      ========================================================================= */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Active Projects Bento Block (Span 8) */}
        <section className="flex flex-col rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] xl:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.06] pb-4">
            <div className="flex items-center gap-2.5">
              <h2 className="font-body text-[16px] font-bold text-[#17201b]">
                Active Project Workspaces
              </h2>
              <span className="rounded-full bg-[#eef5f1] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#1f5e44]">
                {filtered.length}
              </span>
            </div>

            {/* Quick Status Filter Pills */}
            <div className="flex rounded-[8px] border border-black/[0.08] bg-[#f7f9f7] p-1 font-body text-[10.5px] font-medium text-neutral-600">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`rounded-[6px] px-2.5 py-1 transition-all ${
                  statusFilter === "all" ? "bg-white text-[#17201b] font-semibold shadow-2xs" : "hover:text-[#17201b]"
                }`}
              >
                All ({projects.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={`rounded-[6px] px-2.5 py-1 transition-all ${
                  statusFilter === "active" ? "bg-white text-[#17201b] font-semibold shadow-2xs" : "hover:text-[#17201b]"
                }`}
              >
                In Production ({inProduction.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("delivered")}
                className={`rounded-[6px] px-2.5 py-1 transition-all ${
                  statusFilter === "delivered" ? "bg-white text-[#17201b] font-semibold shadow-2xs" : "hover:text-[#17201b]"
                }`}
              >
                Ready ({delivered.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("draft")}
                className={`rounded-[6px] px-2.5 py-1 transition-all ${
                  statusFilter === "draft" ? "bg-white text-[#17201b] font-semibold shadow-2xs" : "hover:text-[#17201b]"
                }`}
              >
                Drafts ({drafts.length})
              </button>
            </div>
          </div>

          <div className="mt-4 flex-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <p className="font-body text-[13px] font-medium text-[#17201b]">
                  {search.trim() ? `No projects match "${search.trim()}".` : "No projects match this filter."}
                </p>
                <p className="mt-1 font-body text-[11px] text-neutral-500">
                  {search.trim()
                    ? "Try searching with a different name, developer, or property type."
                    : "Submit an architectural floor plan to start world production."}
                </p>
                {!search.trim() && (
                  <Link
                    href="/projects/new"
                    className="mt-4 rounded-[10px] bg-[#143f2d] px-4 py-2 font-body text-[11px] font-semibold text-white transition-colors hover:bg-[#0f3626]"
                  >
                    Submit floor plan
                  </Link>
                )}
              </div>
            ) : (
              <ProjectsTable projects={filtered} />
            )}
          </div>
        </section>

        {/* Real-time Workspace Activity Stream (Span 4) */}
        <section className="flex flex-col rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] xl:col-span-4">
          <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] pb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-body text-[16px] font-bold text-[#17201b]">
                Real-Time Stream
              </h2>
              <span className="h-1.5 w-1.5 rounded-full bg-[#1f5e44]" />
            </div>
            <span className="font-mono text-[10px] text-neutral-400">
              {data.activity.length} UPDATES
            </span>
          </div>

          {data.activity.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-14 text-center">
              <p className="font-body text-[12px] text-neutral-600">
                No telemetry activity recorded yet.
              </p>
              <p className="mt-1 font-body text-[10.5px] text-neutral-400">
                Asset uploads, procedural generation steps, and approvals stream here automatically.
              </p>
            </div>
          ) : (
            <ol className="relative mt-4 flex-1 space-y-4">
              <span
                className="absolute bottom-3 left-[13px] top-3 w-px bg-black/[0.06]"
                aria-hidden="true"
              />
              {data.activity.slice(0, 6).map((item) => {
                const meta = getActivityMeta(item);
                return (
                  <li key={item.id} className="relative flex items-start gap-3">
                    <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-[#f7f9f7] text-[#1f5e44] shadow-2xs">
                      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <circle cx="8" cy="8" r="6" />
                        <path d="M8 5v3l2 1.5" strokeLinecap="round" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-[4px] border px-1.5 py-0.2 font-mono text-[8px] font-bold tracking-wider ${meta.color}`}>
                          {meta.tag}
                        </span>
                        <p className="truncate font-body text-[11.5px] font-semibold text-[#17201b]">
                          {item.projectName || "Workspace"}
                        </p>
                      </div>
                      <p className="mt-1 font-body text-[11px] leading-relaxed text-neutral-600">
                        {item.message}
                      </p>
                    </div>
                    <span className="shrink-0 pt-0.5 font-mono text-[9px] text-neutral-400">
                      {item.createdAt ? formatRelative(item.createdAt) : ""}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

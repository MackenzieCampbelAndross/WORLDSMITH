"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { EmptyState, LoadingBlock } from "@/components/portal/EmptyState";
import { ProjectCard } from "@/components/portal/ProjectCard";
import { fetchProjects, type Project } from "@/lib/portal";
import { isDeliveredStatus } from "@/lib/productionStatus";
import { useSignedUrls } from "@/lib/use-signed-urls";

export default function DeliverablesPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void fetchProjects(user.id)
      .then((next) => {
        if (!active) return;
        setProjects(next);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const delivered = useMemo(
    () => projects.filter((project) => isDeliveredStatus(project.status)),
    [projects],
  );
  const covers = useSignedUrls(delivered.map((project) => project.coverPath));

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-body text-[24px] font-semibold leading-none tracking-[-0.02em] text-[#17201b]">
            Deliverables
          </h1>
          <p className="mt-2 font-body text-[11.5px] text-[#6f756d]">
            {loading
              ? "Loading delivered worlds..."
              : `${delivered.length} delivered ${delivered.length === 1 ? "world" : "worlds"} ready to enter and share.`}
          </p>
        </div>
        <Link href="/projects" className="font-body text-[10.5px] text-[#2f6b4c] hover:text-[#143f2d]">
          View projects →
        </Link>
      </div>

      {loading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <LoadingBlock key={item} className="h-[286px] rounded-[12px]" />
          ))}
        </div>
      ) : delivered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No delivered worlds yet."
            body="Completed worlds will appear here once Creston finishes production."
            actionLabel="View projects"
            actionHref="/projects"
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {delivered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              coverUrl={project.coverPath ? covers[project.coverPath] : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { PortalShell } from "@/components/portal/PortalShell";
import { getSupabaseClient } from "@/lib/supabase";

const PortalFallback = () => (
  <div className="min-h-[100svh] bg-[#f7f4ec]" aria-busy="true">
    <div className="fixed inset-y-0 left-0 hidden w-[272px] bg-[#1b4a36] lg:block" />
    <span className="sr-only">Loading Crestion Labs workspace</span>
  </div>
);

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const supabase = getSupabaseClient();

    if (user && !user.email_confirmed_at) {
      void supabase.auth.signOut().finally(() => router.replace("/"));
      return;
    }

    if (!user) {
      void supabase.auth.getSession().then(({ data }) => {
        if (!data.session) router.replace("/");
      });
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <PortalFallback />;
  }

  return (
    <Suspense fallback={<PortalFallback />}>
      <PortalShell>{children}</PortalShell>
    </Suspense>
  );
}

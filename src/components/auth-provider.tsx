"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase";
import { ensureProfile, fetchProfile, type UserProfile } from "@/lib/portal";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const metadataProfile = (user: User): UserProfile => {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    firstName: String(meta.first_name ?? ""),
    lastName: String(meta.last_name ?? ""),
    companyName: String(meta.company_name ?? ""),
    phone: String(meta.phone ?? ""),
    email: user.email ?? "",
    companyId: null,
    notificationPrefs: {
      production_updates: true,
      review_requests: true,
      world_ready: true,
      newsletter: false,
    },
    createdAt: null,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;

    void (async () => {
      try {
        const next =
          (await fetchProfile(user.id)) ??
          (await ensureProfile(
            user.id,
            user.email ?? "",
            (user.user_metadata ?? {}) as Record<string, unknown>,
          ));
        if (active) setProfile(next);
      } catch {
        if (active) setProfile(metadataProfile(user));
      }
    })();

    return () => {
      active = false;
    };
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      const next = await fetchProfile(user.id);
      if (next) setProfile(next);
    } catch {
      // Keep the current profile if the refresh fails.
    }
  }, [user]);

  const openAuth = useCallback(() => setAuthOpen(true), []);
  const closeAuth = useCallback(() => setAuthOpen(false), []);
  const logout = useCallback(async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/");
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile: user ? profile : null,
      loading,
      authOpen,
      openAuth,
      closeAuth,
      refreshProfile,
      logout,
    }),
    [user, profile, loading, authOpen, openAuth, closeAuth, refreshProfile, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

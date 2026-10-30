"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

const NAV = [
  { href: "/dashboard", label: "Overview", exact: true, icon: "overview" as const },
  { href: "/projects", label: "Projects", exact: false, icon: "projects" as const },
];

const Icon = ({ name, className = "h-4 w-4" }: { name: "overview" | "projects" | "settings"; className?: string }) => {
  if (name === "overview") {
    return (
      <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
        <path d="M3.5 9.2 10 3.6l6.5 5.6M5.2 8.1v8.1h9.6V8.1M8.3 16.2v-4.4h3.4v4.4" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  if (name === "projects") {
    return (
      <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
        <path d="M3.2 6.1h13.6v9.7H3.2zM3.2 6.1l1.6-2.3h5l1.6 2.3M7.2 9.5h5.6M7.2 12.1h3.8" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M16 10a6.4 6.4 0 0 0-.1-1.1l1.6-1.2-1.7-2.9-1.9.7a6.7 6.7 0 0 0-1.9-1.1L11.7 2H8.3l-.3 2.4a6.7 6.7 0 0 0-1.9 1.1l-1.9-.7L2.5 7.7l1.6 1.2a6.4 6.4 0 0 0 0 2.2l-1.6 1.2 1.7 2.9 1.9-.7a6.7 6.7 0 0 0 1.9 1.1l.3 2.4h3.4l.3-2.4a6.7 6.7 0 0 0 1.9-1.1l1.9.7 1.7-2.9-1.6-1.2c.1-.4.1-.7.1-1.1Z" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
};

const initialsFor = (name: string, email: string) => {
  const source = name.trim() || email;
  const parts = source.split(/\s+|@/).filter(Boolean);
  return (parts[0]?.[0] ?? "W").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
};

export const PortalShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { user, profile, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add("portal-shell");
    return () => document.body.classList.remove("portal-shell");
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawerOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  if (!user) {
    return <div className="min-h-[100svh] bg-[#f7f4ec]" />;
  }

  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    String((user.user_metadata as Record<string, unknown> | undefined)?.first_name ?? "") ||
    user.email ||
    "Client";
  const company = profile?.companyName || "Crestion Labs client";
  const initials = initialsFor(displayName, user.email ?? "");

  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const brand = (
    <div>
      <Link href="/dashboard" className="font-cormorant text-[22px] uppercase leading-none tracking-[0.17em] text-[#f4f1e6] transition-opacity hover:opacity-75">
        Crestion Labs
      </Link>
      <p className="mt-3 font-body text-[9px] uppercase tracking-[0.22em] text-[#f4f1e6]/35">Client portal</p>
    </div>
  );

  const navLinks = (
    <nav className="mt-12 flex flex-col gap-1">
      {NAV.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-[5px] px-3 py-2.5 font-body text-[13px] transition-colors ${
              active
                ? "bg-white/10 text-[#f7f2e5]"
                : "text-[#f4f1e6]/62 hover:bg-white/5 hover:text-[#f7f2e5]"
            }`}
          >
            <Icon name={item.icon} />
            {item.label}
          </Link>
        );
      })}
      <div className="my-5 h-px bg-white/12" />
      <Link
        href="/settings"
        className={`flex items-center gap-3 rounded-[5px] px-3 py-2.5 font-body text-[13px] transition-colors ${
          pathname.startsWith("/settings")
            ? "bg-white/10 text-[#f7f2e5]"
            : "text-[#f4f1e6]/62 hover:bg-white/5 hover:text-[#f7f2e5]"
        }`}
      >
        <Icon name="settings" />
        Settings
      </Link>
    </nav>
  );

  const profileMenu = (
    <details className="group relative mt-auto">
      <summary className="flex cursor-pointer list-none items-center gap-3 border-t border-white/12 pt-5 [&::-webkit-details-marker]:hidden">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f0e9d8] font-body text-[11px] font-semibold text-[#1b4a36]">
          {initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-body text-[12.5px] text-[#f7f2e5]">{displayName}</span>
          <span className="mt-0.5 block truncate font-body text-[10.5px] text-[#f4f1e6]/40">{company}</span>
        </span>
        <svg viewBox="0 0 12 12" className="h-3 w-3 text-[#f4f1e6]/40 transition-transform group-open:rotate-180" fill="none" aria-hidden="true">
          <path d="m2.5 4.5 3.5 3 3.5-3" stroke="currentColor" strokeWidth="1" />
        </svg>
      </summary>
      <div className="absolute bottom-full left-0 mb-2 w-full border border-white/15 bg-[#173f2e] py-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
        <Link href="/settings#profile" className="block px-3.5 py-2 font-body text-[11.5px] text-[#f4f1e6]/75 transition-colors hover:bg-white/8 hover:text-white">
          Account
        </Link>
        <Link href="/settings" className="block px-3.5 py-2 font-body text-[11.5px] text-[#f4f1e6]/75 transition-colors hover:bg-white/8 hover:text-white">
          Settings
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          className="block w-full px-3.5 py-2 text-left font-body text-[11.5px] text-[#f4f1e6]/75 transition-colors hover:bg-white/8 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </details>
  );

  return (
    <div className="min-h-[100svh] bg-[#f7f4ec] text-[#171713]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col bg-[#1b4a36] px-6 py-7 lg:flex">
        {brand}
        {navLinks}
        {profileMenu}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#e2ddd1] bg-[#f7f4ec]/95 px-5 py-4 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="font-cormorant text-[19px] uppercase tracking-[0.16em] text-[#1b4a36]">
          Crestion Labs
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open portal navigation"
          className="flex h-9 w-9 items-center justify-center border border-[#d8d2c4] text-[#1b4a36]"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </header>

      <main className="min-h-[100svh] lg:pl-[272px]">
        <div className="mx-auto w-full max-w-[1280px] px-5 pb-16 pt-9 sm:px-8 lg:px-12 lg:pb-20 lg:pt-12">
          {children}
        </div>
      </main>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close portal navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/35"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col bg-[#1b4a36] px-6 py-7">
            <div className="flex items-start justify-between gap-4">
              {brand}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close portal navigation"
                className="text-[#f4f1e6]/60 hover:text-white"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>
            </div>
            {navLinks}
            {profileMenu}
          </aside>
        </div>
      )}
    </div>
  );
};

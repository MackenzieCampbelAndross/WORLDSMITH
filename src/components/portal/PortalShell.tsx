"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CrestionLabsLogo } from "@/components/CrestionLabsLogo";
import { useAuth } from "@/components/auth-provider";

type NavIconName =
  | "home"
  | "projects"
  | "deliverables"
  | "settings"
  | "support";

type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
  exact?: boolean;
};

const NAV_PRIMARY: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "home", exact: true },
  { href: "/projects", label: "Projects", icon: "projects" },
  { href: "/deliverables", label: "Deliverables", icon: "deliverables" },
];

const NAV_BOTTOM: NavItem[] = [
  { href: "/settings", label: "Settings", icon: "settings" },
  { href: "/support", label: "Support", icon: "support" },
];

const Icon = ({ name, className = "h-[18px] w-[18px]" }: { name: NavIconName; className?: string }) => {
  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
          <path d="M3.5 9.2 10 3.6l6.5 5.6M5.2 8.1v8.1h9.6V8.1M8.3 16.2v-4.4h3.4v4.4" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    case "projects":
      return (
        <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
          <path d="m10 2.8 6.4 3.4L10 9.6 3.6 6.2 10 2.8ZM3.6 10l6.4 3.4 6.4-3.4M3.6 13.8 10 17.2l6.4-3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "deliverables":
      return (
        <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
          <rect x="3" y="3.6" width="14" height="12.8" rx="2.2" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="7.3" cy="8" r="1.3" stroke="currentColor" strokeWidth="1.1" />
          <path d="m4 14.2 3.8-3.6 2.9 2.6 2.5-2.3 2.8 2.9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="2.75" stroke="currentColor" strokeWidth="1.2" />
          <path
            d="M8.6 2.5h2.8l.38 1.62c.45.18.87.42 1.25.71l1.58-.6 2 2-.6 1.58c.29.38.53.8.71 1.25l1.62.38v2.8l-1.62.38c-.18.45-.42.87-.71 1.25l.6 1.58-2 2-1.58-.6c-.38.29-.8.53-1.25.71l-.38 1.62H8.6l-.38-1.62a5.6 5.6 0 0 1-1.25-.71l-1.58.6-2-2 .6-1.58a5.6 5.6 0 0 1-.71-1.25L1.66 11.4V8.6l1.62-.38c.18-.45.42-.87.71-1.25l-.6-1.58 2-2 1.58.6c.38-.29.8-.53 1.25-.71L8.6 2.5Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="6.9" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8.1 7.7a2 2 0 1 1 2.7 1.9c-.5.2-.8.6-.8 1.1v.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="10" cy="13.7" r=".85" fill="currentColor" />
        </svg>
      );
  }
};

const SearchIcon = () => (
  <svg viewBox="0 0 18 18" className="h-4 w-4" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="4.6" stroke="currentColor" strokeWidth="1.2" />
    <path d="m11.4 11.4 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 18 18" className="h-4 w-4" fill="none" aria-hidden="true">
    <path d="M4.6 12.6h8.8l-1-1.7V8a3.4 3.4 0 0 0-6.8 0v2.9l-1 1.7ZM7.4 14.5a1.9 1.9 0 0 0 3.2 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const initialsFor = (name: string, email: string) => {
  const source = name.trim() || email;
  const parts = source.split(/\s+|@/).filter(Boolean);
  return (parts[0]?.[0] ?? "C").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
};

const ProfileButton = () => {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    String((user?.user_metadata as Record<string, unknown> | undefined)?.first_name ?? "") ||
    user?.email ||
    "Client";
  const initials = initialsFor(displayName, user?.email ?? "");
  const isProfileActive = pathname.startsWith("/profile");

  return (
    <Link
      href="/profile"
      aria-label="Profile"
      title={`Profile (${displayName})`}
      className={`group flex items-center gap-2 rounded-full p-0.5 transition-all focus:outline-none ${
        isProfileActive ? "ring-2 ring-[#232818] ring-offset-2 ring-offset-[#e8e2d5]" : "hover:opacity-85"
      }`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#232818] font-body text-[10.5px] font-semibold text-[#efe9dd] shadow-sm transition-transform group-hover:scale-105">
        {initials}
      </span>
      <span className="hidden pr-1 font-body text-[11.5px] font-medium text-[#17201b] transition-colors group-hover:text-[#232818] sm:inline-block">
        {displayName.split(" ")[0]}
      </span>
    </Link>
  );
};

const NotificationsMenu = () => (
  <details className="relative">
    <summary
      aria-label="Notifications"
      className="relative flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full text-[#5f6a62] transition-colors hover:bg-[#efebe0] hover:text-[#17201b] [&::-webkit-details-marker]:hidden"
    >
      <BellIcon />
    </summary>
    <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-[10px] border border-[#dbd4c5] bg-white px-4 py-4 shadow-[0_18px_45px_-24px_rgba(0,0,0,0.35)]">
      <p className="font-body text-[12px] text-[#17201b]">No new notifications</p>
      <p className="mt-1 font-body text-[10.5px] leading-4 text-[#8d938b]">
        Project updates appear in each project&apos;s Activity.
      </p>
    </div>
  </details>
);

export const PortalShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.body.classList.add("portal-shell");
    return () => document.body.classList.remove("portal-shell");
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawerOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  if (!user) {
    return <div className="min-h-[100svh] bg-[#e8e2d5]" />;
  }

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const pageTitle = pathname.startsWith("/dashboard")
    ? "Overview"
    : pathname.startsWith("/settings")
      ? "Settings"
      : pathname.startsWith("/support")
        ? "Support"
        : pathname.startsWith("/deliverables")
          ? "Deliverables"
          : pathname.startsWith("/profile")
            ? "Profile"
            : "Projects";

  const renderNav = (items: NavItem[], onNavigate?: () => void) => (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-[9px] px-3 py-2.5 font-body text-[12.5px] transition-colors ${
              active
                ? "bg-[#3a4230] text-[#efe9dd]"
                : "text-[#e4e9e1]/65 hover:bg-white/[0.06] hover:text-[#efe9dd]"
            }`}
          >
            <Icon name={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const searchForm = (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const q = query.trim();
        window.dispatchEvent(new CustomEvent("crestion:search", { detail: q }));
        if (!pathname.startsWith("/dashboard")) {
          window.location.assign(q ? `/projects?q=${encodeURIComponent(q)}` : "/projects");
        }
      }}
      className="hidden h-10 w-[300px] items-center gap-2.5 rounded-[10px] border border-[#e3ded2] bg-white/70 px-3.5 text-[#746f62] transition-colors focus-within:border-[#b9b09c] lg:flex xl:w-[340px]"
    >
      <SearchIcon />
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          window.dispatchEvent(new CustomEvent("crestion:search", { detail: event.target.value }));
        }}
        placeholder="Search projects, files, or deliverables..."
        aria-label="Search projects, files, or deliverables"
        className="min-w-0 flex-1 bg-transparent font-body text-[11.5px] text-[#17201b] outline-none placeholder:text-[#95998f]"
      />
    </form>
  );

  const brand = (
    <Link href="/dashboard" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
      <CrestionLabsLogo size={27} />
      <span className="font-body text-[12px] font-semibold uppercase tracking-[0.15em] text-[#efe9dd]">
        Crestion Labs
      </span>
    </Link>
  );

  return (
    <div className="flex min-h-[100svh] w-full text-[#17201b]">
      <aside className="sticky top-0 hidden h-[100svh] w-[226px] shrink-0 flex-col bg-[#232818] px-3.5 py-5 lg:flex">
        <div className="px-2">{brand}</div>

        <p className="mb-1.5 mt-7 px-3 font-body text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[#e4e9e1]/35">
          Portal
        </p>
        {renderNav(NAV_PRIMARY)}

        <div className="mt-auto border-t border-white/10 pt-3">
          {renderNav(NAV_BOTTOM)}
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[#ded7c9] bg-[#e8e2d5]/95 px-4 backdrop-blur-xl sm:px-6">
          <span className="font-body text-[15px] font-semibold tracking-[-0.01em] text-[#17201b]">
            {pageTitle}
          </span>

          <div className="flex items-center gap-1.5">
            {searchForm}
            <Link
              href="/projects"
              aria-label="Search projects"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#5f6a62] transition-colors hover:bg-[#efebe0] lg:hidden"
            >
              <SearchIcon />
            </Link>
            <NotificationsMenu />
            <ProfileButton />
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open portal navigation"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#17201b] transition-colors hover:bg-[#efebe0] lg:hidden"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col p-4 sm:p-5 lg:p-6">{children}</main>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close portal navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/35"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[272px] flex-col bg-[#232818] px-4 py-6">
            <div className="flex items-start justify-between gap-4">
              {brand}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close portal navigation"
                className="text-[#e4e9e1]/60 hover:text-white"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>
            </div>

            <p className="mb-1.5 mt-7 px-3 font-body text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[#e4e9e1]/35">
              Portal
            </p>
            {renderNav(NAV_PRIMARY, () => setDrawerOpen(false))}

            <div className="mt-auto border-t border-white/10 pt-3">
              {renderNav(NAV_BOTTOM, () => setDrawerOpen(false))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

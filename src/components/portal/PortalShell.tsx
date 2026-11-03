"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CrestionLabsLogo } from "@/components/CrestionLabsLogo";
import { useAuth } from "@/components/auth-provider";

const NAV = [
  { href: "/dashboard", label: "Home", exact: true, icon: "home" as const },
  { href: "/projects", label: "Projects", exact: false, icon: "projects" as const },
];

const Icon = ({ name, className = "h-4 w-4" }: { name: "home" | "projects"; className?: string }) => {
  if (name === "home") {
    return (
      <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
        <path d="M3.5 9.2 10 3.6l6.5 5.6M5.2 8.1v8.1h9.6V8.1M8.3 16.2v-4.4h3.4v4.4" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path d="M3.2 6.1h13.6v9.7H3.2zM3.2 6.1l1.6-2.3h5l1.6 2.3M7.2 9.5h5.6M7.2 12.1h3.8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
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

const Chevron = () => (
  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true">
    <path d="m2.5 4.5 3.5 3 3.5-3" stroke="currentColor" strokeWidth="1" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
    <path d="M12.5 6.2V3.8H4v12.4h8.5v-2.4M8.7 10h8M14.4 7.2 17.2 10l-2.8 2.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const initialsFor = (name: string, email: string) => {
  const source = name.trim() || email;
  const parts = source.split(/\s+|@/).filter(Boolean);
  return (parts[0]?.[0] ?? "C").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
};

const AccountMenu = () => {
  const { user, profile, logout } = useAuth();
  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    String((user?.user_metadata as Record<string, unknown> | undefined)?.first_name ?? "") ||
    user?.email ||
    "Client";
  const initials = initialsFor(displayName, user?.email ?? "");

  return (
    <details className="relative">
      <summary
        aria-label="Open account menu"
        className="flex cursor-pointer list-none items-center gap-2 rounded-full transition-opacity hover:opacity-80 [&::-webkit-details-marker]:hidden"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f5e44] font-body text-[10px] font-semibold text-[#f7f4ec]">
          {initials}
        </span>
        <span className="hidden text-[#716b5d] sm:block">
          <Chevron />
        </span>
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-[10px] border border-[#e2ddd1] bg-[#fdfbf6] shadow-[0_18px_45px_-24px_rgba(0,0,0,0.35)]">
        <div className="border-b border-[#eee9df] px-4 py-3">
          <p className="truncate font-body text-[12px] text-[#171713]">{displayName}</p>
          <p className="mt-0.5 truncate font-body text-[10.5px] text-[#8a8374]">{profile?.companyName || user?.email}</p>
        </div>
        <Link href="/settings#profile" className="block px-4 py-2.5 font-body text-[11.5px] text-[#3f3b33] hover:bg-[#f5f0e5]">
          Profile
        </Link>
        <Link href="/settings#security" className="block px-4 py-2.5 font-body text-[11.5px] text-[#3f3b33] hover:bg-[#f5f0e5]">
          Account settings
        </Link>
        <Link href="/settings#company" className="block px-4 py-2.5 font-body text-[11.5px] text-[#3f3b33] hover:bg-[#f5f0e5]">
          Company settings
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          className="block w-full border-t border-[#eee9df] px-4 py-2.5 text-left font-body text-[11.5px] text-[#3f3b33] hover:bg-[#f5f0e5]"
        >
          Sign out
        </button>
      </div>
    </details>
  );
};

const NotificationsMenu = () => (
  <details className="relative">
    <summary
      aria-label="Notifications"
      className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full text-[#716b5d] transition-colors hover:bg-[#f1ebdf] hover:text-[#171713] [&::-webkit-details-marker]:hidden"
    >
      <BellIcon />
    </summary>
    <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-[10px] border border-[#e2ddd1] bg-[#fdfbf6] px-4 py-4 shadow-[0_18px_45px_-24px_rgba(0,0,0,0.35)]">
      <p className="font-body text-[12px] text-[#171713]">No new notifications</p>
      <p className="mt-1 font-body text-[10.5px] leading-4 text-[#8a8374]">
        Project updates appear in each project&apos;s Activity.
      </p>
    </div>
  </details>
);

export const PortalShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
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
    return <div className="min-h-[100svh] bg-[#f7f4ec]" />;
  }

  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const pageTitle = pathname.startsWith("/dashboard")
    ? "Overview"
    : pathname.startsWith("/settings")
      ? "Settings"
      : "Projects";

  const brand = (
    <Link href="/dashboard" className="inline-flex flex-col font-cormorant text-[22px] uppercase leading-[0.92] tracking-[0.2em] text-[#f4f1e6] transition-opacity hover:opacity-75">
      <span>Crestion</span>
      <span>Labs</span>
    </Link>
  );

  const navLinks = (
    <nav className="mt-10 flex flex-col gap-1.5">
      {NAV.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-[8px] px-3 py-2.5 font-body text-[13px] transition-colors ${
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
    </nav>
  );

  const searchForm = (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const q = query.trim();
        window.location.assign(q ? `/projects?q=${encodeURIComponent(q)}` : "/projects");
      }}
      className="hidden h-9 w-[248px] items-center gap-2 rounded-full border border-[#e3ded2] bg-[#f7f4ec]/80 px-4 text-[#716b5d] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-colors focus-within:border-[#b9b09c] sm:flex"
    >
      <SearchIcon />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search projects..."
        aria-label="Search projects"
        className="min-w-0 flex-1 bg-transparent font-body text-[11.5px] text-[#171713] outline-none placeholder:text-[#8a8374]"
      />
    </form>
  );

  return (
    <div className="min-h-[100svh] bg-[#e9eef6] text-[#171713]">
      <div className="flex min-h-[100svh] flex-col lg:m-3 lg:h-[calc(100svh-1.5rem)] lg:min-h-0 lg:overflow-hidden lg:rounded-[22px] lg:bg-[#fbfaf6] lg:shadow-[0_30px_80px_-55px_rgba(23,23,19,0.6)]">
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-[80px] shrink-0 flex-col items-center bg-[#1a1d1b] px-2 py-5 lg:flex">
            <Link
              href="/dashboard"
              aria-label="Crestion Labs home"
              className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-white/10 transition-colors hover:bg-white/15"
            >
              <CrestionLabsLogo size={25} />
            </Link>

            <nav className="mt-8 flex flex-col items-center gap-2">
              {NAV.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    title={item.label}
                    className={`flex h-11 w-11 items-center justify-center rounded-[10px] transition-colors ${
                      active
                        ? "bg-white/12 text-[#f7f2e5]"
                        : "text-[#f4f1e6]/50 hover:bg-white/6 hover:text-white"
                    }`}
                  >
                    <Icon name={item.icon} className="h-5 w-5" />
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto flex flex-col items-center">
              <div className="mb-4 h-px w-8 bg-white/10" />
              <button
                type="button"
                onClick={() => void logout()}
                aria-label="Sign out"
                title="Sign out"
                className="flex h-11 w-11 items-center justify-center rounded-[10px] text-[#f4f1e6]/45 transition-colors hover:bg-white/6 hover:text-white"
              >
                <LogoutIcon />
              </button>
            </div>
          </aside>

          <main className="relative flex min-w-0 flex-1 flex-col bg-[#fbfaf6] lg:min-h-0 lg:overflow-y-auto">
            <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#eee9df] bg-[#fbfaf6]/80 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
              <Link href="/dashboard" className="font-body text-[15px] font-semibold tracking-[0.08em] text-[#1b4a36] lg:hidden">
                CRESTION LABS
              </Link>
              <span className="hidden font-body text-[15px] font-semibold tracking-[-0.01em] text-[#171713] lg:block">
                {pageTitle}
              </span>

              <div className="flex items-center gap-1.5">
                {searchForm}
                <Link
                  href="/projects"
                  aria-label="Search projects"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#716b5d] transition-colors hover:bg-[#f1ebdf] hover:text-[#171713] sm:hidden"
                >
                  <SearchIcon />
                </Link>
                <NotificationsMenu />
                <AccountMenu />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Open portal navigation"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#1b4a36] transition-colors hover:bg-[#f1ebdf] lg:hidden"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                </button>
              </div>
            </header>

            <div className="mx-auto w-full max-w-[1440px] px-5 pb-16 pt-6 sm:px-8 lg:px-10 lg:pt-8">
              {children}
            </div>
          </main>
        </div>
      </div>

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
            <div className="my-5 h-px bg-white/10" />
          </aside>
        </div>
      )}
    </div>
  );
};
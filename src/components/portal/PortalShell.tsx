"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

const BellIcon = () => (
  <svg viewBox="0 0 18 18" className="h-4 w-4" fill="none" aria-hidden="true">
    <path d="M4.6 12.6h8.8l-1-1.7V8a3.4 3.4 0 0 0-6.8 0v2.9l-1 1.7ZM7.4 14.5a1.9 1.9 0 0 0 3.2 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SidebarToggleIcon = () => (
  <svg viewBox="0 0 20 20" className="h-[17px] w-[17px]" fill="none" aria-hidden="true">
    <rect x="3" y="3.5" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.2" />
    <path d="M7.5 3.5v13" stroke="currentColor" strokeWidth="1.2" />
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
        isProfileActive ? "ring-2 ring-[#123c2b] ring-offset-2 ring-offset-white" : "hover:opacity-85"
      }`}
    >
      {profile?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatarUrl}
          alt={displayName}
          className="h-8 w-8 rounded-full object-cover shadow-sm transition-transform group-hover:scale-105"
        />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#123c2b] font-body text-[10.5px] font-semibold text-white shadow-sm transition-transform group-hover:scale-105">
          {initials}
        </span>
      )}
      <span className="hidden pr-1 font-body text-[11.5px] font-medium text-[#17201b] transition-colors group-hover:text-[#123c2b] sm:inline-block">
        {displayName.split(" ")[0]}
      </span>
    </Link>
  );
};

const NotificationsMenu = () => (
  <details className="relative">
    <summary
      aria-label="Notifications"
      className="relative flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full text-[#5f6a62] transition-colors hover:bg-black/5 hover:text-[#17201b] [&::-webkit-details-marker]:hidden"
    >
      <BellIcon />
    </summary>
    <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-[12px] border border-black/[0.08] bg-white px-4 py-4 shadow-[0_18px_45px_-24px_rgba(0,0,0,0.25)]">
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
  const [collapsed, setCollapsed] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("crestion:sidebar-collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("crestion:sidebar-collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const expandSidebar = () => {
    setCollapsed(false);
    try {
      localStorage.setItem("crestion:sidebar-collapsed", "false");
    } catch {}
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;

    const onMouseMove = (moveEvent: MouseEvent) => {
      // If expanded/dragged even slightly to the right (>= 5px)
      if (moveEvent.clientX - startX >= 5) {
        expandSidebar();
        cleanup();
      }
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      if (upEvent.clientX - startX >= 2 || Math.abs(upEvent.clientX - startX) < 4) {
        expandSidebar();
      }
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setDrawerOpen((prev) => !prev);
    } else {
      toggleCollapsed();
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "b" || (e.shiftKey && (e.key === "S" || e.key === "s")))) {
        e.preventDefault();
        handleToggleSidebar();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    document.body.classList.add("portal-shell");
    return () => document.body.classList.remove("portal-shell");
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawerOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  if (!user) {
    return <div className="min-h-[100svh] bg-[#f7f7f7]" />;
  }

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const renderNav = (items: NavItem[], isCompressed: boolean, onNavigate?: () => void) => (
    <nav className={`flex w-full flex-col ${isCompressed ? "items-center gap-2" : "gap-1"}`}>
      {items.map((item) => {
        const active = isActive(item);
        if (isCompressed) {
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              title={item.label}
              className={`group relative flex h-10 w-10 items-center justify-center rounded-[10px] border transition-all ${
                active
                  ? "border-[#2a7857] bg-[#1f5e44] text-white shadow-sm"
                  : "border-transparent text-neutral-400 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              <span className="shrink-0">
                <Icon name={item.icon} />
              </span>
              <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-[7px] border border-white/10 bg-neutral-900 px-2.5 py-1 font-body text-[11px] font-medium text-white shadow-xl group-hover:block z-50">
                {item.label}
              </span>
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-[10px] border px-3 py-2.5 font-body text-[12.5px] transition-colors ${
              active
                ? "border-[#2a7857] bg-[#1f5e44] text-white shadow-sm"
                : "border-transparent text-neutral-400 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            <span className="shrink-0">
              <Icon name={item.icon} />
            </span>
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link
      href="/dashboard"
      title="CrestionLabs"
      className="block transition-opacity hover:opacity-85"
    >
      <span
        style={{ fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif' }}
        className="text-[24px] font-bold tracking-[-0.03em] leading-none text-white"
      >
        CrestionLabs
      </span>
    </Link>
  );

  return (
    <div className="flex min-h-[100svh] w-full bg-[#f7f7f7] text-[#17201b]">
      <aside
        className={`sticky top-3 hidden h-[calc(100svh-1.5rem)] shrink-0 flex-col rounded-[20px] bg-black shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)] transition-[width,padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:flex overflow-visible m-3 ${
          collapsed
            ? "w-[72px] p-3 items-center"
            : "w-[240px] p-4 items-stretch"
        }`}
      >
        {/* Edge expand handle when sidebar is collapsed */}
        {collapsed && (
          <div
            onMouseDown={handleResizeStart}
            onClick={expandSidebar}
            title="Drag or click to expand sidebar"
            className="group/resizer absolute -right-2 top-0 bottom-0 w-4 cursor-ew-resize z-50 flex items-center justify-center select-none"
          >
            <div className="h-14 w-[3px] rounded-full bg-white/20 opacity-0 group-hover/resizer:opacity-100 group-hover/resizer:bg-white/60 transition-all duration-200" />
          </div>
        )}

        {collapsed ? (
          <div className="flex flex-col items-center">
            <Link
              href="/dashboard"
              title="CrestionLabs"
              className="flex h-9 w-9 items-center justify-center transition-transform hover:scale-105"
            >
              <span
                style={{ fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif' }}
                className="text-[20px] font-bold tracking-[-0.03em] leading-none text-white select-none"
              >
                CL
              </span>
            </Link>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between px-2">
            {brand}
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Compress sidebar"
              title="Compress sidebar (Ctrl+Shift+S)"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-neutral-400 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <SidebarToggleIcon />
            </button>
          </div>
        )}

        {collapsed ? (
          <div className="my-3 h-px w-8 bg-white/10" />
        ) : (
          <p className="mb-1.5 mt-7 px-3 font-body text-[8.5px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Portal
          </p>
        )}

        {renderNav(NAV_PRIMARY, collapsed)}

        <div className={`mt-auto w-full border-t border-white/10 ${collapsed ? "pt-2 flex flex-col items-center" : "pt-3"}`}>
          {renderNav(NAV_BOTTOM, collapsed)}
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <header
          className={`sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-out ${
            scrolled
              ? "border-b border-black/[0.06] bg-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-md"
              : "border-b border-transparent bg-transparent shadow-none"
          }`}
        >
          <div className="flex items-center gap-2.5 lg:hidden">
            <Link
              href="/dashboard"
              aria-label="CrestionLabs Dashboard"
              className="flex items-center transition-transform duration-200 hover:scale-105"
            >
              <Image
                src="/brand-mark-green.png"
                alt="CrestionLabs"
                width={30}
                height={30}
                priority
                className="h-[30px] w-[30px] shrink-0 object-contain"
              />
            </Link>

            <button
              type="button"
              onClick={handleToggleSidebar}
              aria-label="Open sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[#5f6a62] transition-colors hover:bg-black/5 hover:text-[#17201b]"
            >
              <SidebarToggleIcon />
            </button>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <NotificationsMenu />
            <ProfileButton />
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col px-4 pb-8 pt-1 sm:px-6 sm:pt-2 lg:px-8">
          {children}
        </main>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close portal navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-3 left-3 flex w-[272px] flex-col rounded-[20px] bg-black px-4 py-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <Link href="/dashboard" onClick={() => setDrawerOpen(false)} className="block transition-opacity hover:opacity-85">
                <span
                  style={{ fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif' }}
                  className="text-[24px] font-bold tracking-[-0.03em] leading-none text-white"
                >
                  CrestionLabs
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close portal navigation"
                className="text-neutral-400 hover:text-white"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>
            </div>

            <p className="mb-1.5 mt-7 px-3 font-body text-[8.5px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Portal
            </p>
            {renderNav(NAV_PRIMARY, false, () => setDrawerOpen(false))}

            <div className="mt-auto border-t border-white/10 pt-3">
              {renderNav(NAV_BOTTOM, false, () => setDrawerOpen(false))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

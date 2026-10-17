"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav } from "@/lib/navigation";
import { cn } from "@/lib/cn";

type SidebarProps = {
  mobileOpen: boolean;
  onNavigate?: () => void;
};

export function Sidebar({ mobileOpen, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-background-secondary transition-transform lg:static lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="border-b border-border px-5 py-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <Image
            src="/icons/light_logo.png"
            alt="RURANGO"
            width={120}
            height={28}
            className="h-7 w-auto"
            priority
          />
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
            Studio
          </span>
        </Link>
        <p className="mt-2 text-xs text-foreground-muted">Internal operations</p>
      </div>
      <nav aria-label="Primary" className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {primaryNav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                    active
                      ? "bg-surface text-foreground"
                      : "text-foreground-secondary hover:bg-surface/70 hover:text-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

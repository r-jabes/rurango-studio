"use client";

import Image from "next/image";
import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon } from "@/components/layout/nav-icons";
import { Spinner } from "@/components/ui/spinner";
import {
  isNavItemActive,
  navGroups,
  type NavGroup,
  type NavItem,
} from "@/lib/navigation";
import { cn } from "@/lib/cn";

type SidebarProps = {
  mobileOpen: boolean;
  onNavigate?: () => void;
};

function NavLinkLabel({ item, active }: { item: NavItem; active: boolean }) {
  const { pending } = useLinkStatus();

  return (
    <>
      <NavIcon
        name={item.icon}
        className={cn(active ? "text-accent" : "text-foreground-muted")}
      />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {pending ? (
        <Spinner className="text-accent" label={`Loading ${item.label}`} />
      ) : null}
    </>
  );
}

function NavItemLink({
  item,
  active,
  onNavigate,
  secondary,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
  secondary?: boolean;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={item.description}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
        secondary ? "py-1.5 text-[13px]" : "py-2",
        active
          ? "bg-surface text-foreground shadow-[inset_2px_0_0_0_var(--color-accent)]"
          : secondary
            ? "text-foreground-muted hover:bg-surface/50 hover:text-foreground-secondary"
            : "text-foreground-secondary hover:bg-surface/70 hover:text-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <NavLinkLabel item={item} active={active} />
    </Link>
  );
}

function GroupItems({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  onNavigate?: () => void;
}) {
  const primary = group.items.filter((item) => !item.secondary);
  const secondary = group.items.filter((item) => item.secondary);

  return (
    <>
      <ul className="space-y-0.5">
        {primary.map((item) => (
          <li key={item.href}>
            <NavItemLink
              item={item}
              active={isNavItemActive(pathname, item)}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>
      {secondary.length > 0 ? (
        <div className="mt-2 border-t border-border/70 pt-2">
          {group.secondaryLabel ? (
            <p className="mb-1 px-2.5 font-mono text-[9px] uppercase tracking-[0.14em] text-foreground-muted/80">
              {group.secondaryLabel}
            </p>
          ) : null}
          <ul className="space-y-0.5">
            {secondary.map((item) => (
              <li key={item.href}>
                <NavItemLink
                  item={item}
                  active={isNavItemActive(pathname, item)}
                  onNavigate={onNavigate}
                  secondary
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

export function Sidebar({ mobileOpen, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-dvh w-64 flex-col border-r border-border bg-background-secondary transition-transform duration-200 lg:static lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="shrink-0 border-b border-border px-5 py-4">
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
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
            Studio
          </span>
        </Link>
        <p className="mt-2 text-[11px] text-foreground-muted">
          Internal operations
        </p>
      </div>

      <nav
        aria-label="Primary"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4"
      >
        <div className="space-y-5">
          {navGroups.map((group) => (
            <div key={group.id}>
              <p className="mb-1.5 px-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-foreground-muted">
                {group.label}
              </p>
              <GroupItems
                group={group}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}

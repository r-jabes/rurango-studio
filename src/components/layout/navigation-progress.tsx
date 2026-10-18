"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Top progress bar for App Router navigations.
 * Starts on internal link clicks; completes when the URL settles.
 */
function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [completing, setCompleting] = useState(false);
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const activeRef = useRef(false);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      const nextKey = `${url.pathname}?${url.searchParams.toString()}`;
      const currentKey = `${window.location.pathname}?${window.location.search.slice(1)}`;
      if (nextKey === currentKey) return;

      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      activeRef.current = true;
      setCompleting(false);
      setVisible(true);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    setCompleting(true);
    hideTimer.current = window.setTimeout(() => {
      setVisible(false);
      setCompleting(false);
    }, 280);
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [routeKey]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[110] h-0.5 overflow-hidden"
      aria-hidden={!visible}
    >
      <div
        className={cn(
          "h-full origin-left bg-accent shadow-[0_0_12px_rgba(184,245,0,0.55)] transition-transform",
          visible
            ? completing
              ? "w-full duration-200 ease-out"
              : "w-full animate-[nav-progress_1.4s_ease-in-out_infinite]"
            : "w-0 duration-150",
        )}
      />
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}

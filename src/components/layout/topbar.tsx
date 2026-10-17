"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type TopbarProps = {
  userName: string;
  userEmail: string;
  onMenuClick: () => void;
};

export function Topbar({ userName, userEmail, onMenuClick }: TopbarProps) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        Menu
      </Button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{userName}</p>
        <p className="truncate text-xs text-foreground-muted">{userEmail}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={handleSignOut}>
        Sign out
      </Button>
    </header>
  );
}

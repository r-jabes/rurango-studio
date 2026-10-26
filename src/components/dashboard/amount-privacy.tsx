"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "rurango.studio.hideAmounts";

function subscribe(onStoreChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY || event.key === null) onStoreChange();
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener("rurango-privacy-amounts", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("rurango-privacy-amounts", onStoreChange);
  };
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function getServerSnapshot() {
  return false;
}

function setHidden(hidden: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, hidden ? "1" : "0");
  } catch {
    // ignore quota / private mode
  }
  window.dispatchEvent(new Event("rurango-privacy-amounts"));
}

type AmountPrivacyContextValue = {
  hidden: boolean;
  toggle: () => void;
};

const AmountPrivacyContext = createContext<AmountPrivacyContextValue | null>(
  null,
);

export function AmountPrivacyProvider({ children }: { children: ReactNode }) {
  const hidden = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggle = useCallback(() => setHidden(!getSnapshot()), []);

  return (
    <AmountPrivacyContext.Provider value={{ hidden, toggle }}>
      {children}
    </AmountPrivacyContext.Provider>
  );
}

export function useAmountPrivacy() {
  const ctx = useContext(AmountPrivacyContext);
  if (!ctx) {
    throw new Error("useAmountPrivacy must be used within AmountPrivacyProvider");
  }
  return ctx;
}

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.2 3.3" />
      <path d="M6.1 6.1A18.2 18.2 0 0 0 2 12s3.5 7 10 7a9.8 9.8 0 0 0 4.3-1" />
    </svg>
  );
}

export function AmountPrivacyToggle() {
  const { hidden, toggle } = useAmountPrivacy();

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground-secondary transition-colors hover:border-border-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      aria-pressed={hidden}
      aria-label={hidden ? "Show monetary amounts" : "Hide monetary amounts"}
    >
      {hidden ? <EyeOffIcon /> : <EyeIcon />}
      <span>{hidden ? "Show amounts" : "Hide amounts"}</span>
    </button>
  );
}

export function PrivateAmount({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const { hidden } = useAmountPrivacy();
  return (
    <span className={className} aria-label={hidden ? "Amount hidden" : undefined}>
      {hidden ? "••••••" : value}
    </span>
  );
}

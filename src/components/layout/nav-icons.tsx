import type { NavIcon } from "@/lib/navigation";
import { cn } from "@/lib/cn";

type IconProps = {
  name: NavIcon | "menu" | "close";
  className?: string;
};

function Svg({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4 shrink-0", className)}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function NavIcon({ name, className }: IconProps) {
  switch (name) {
    case "menu":
      return (
        <Svg className={className}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </Svg>
      );
    case "close":
      return (
        <Svg className={className}>
          <path d="M6 6l12 12M18 6L6 18" />
        </Svg>
      );
    case "dashboard":
      return (
        <Svg className={className}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </Svg>
      );
    case "clients":
      return (
        <Svg className={className}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </Svg>
      );
    case "projects":
      return (
        <Svg className={className}>
          <path d="M4 20h16M6 20V8l6-4 6 4v12" />
          <path d="M10 20v-5h4v5" />
        </Svg>
      );
    case "documents":
      return (
        <Svg className={className}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5M9 13h6M9 17h6" />
        </Svg>
      );
    case "proposals":
      return (
        <Svg className={className}>
          <path d="M8 4h9a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 0 1 2-2z" />
          <path d="M9 10h6M9 14h4" />
        </Svg>
      );
    case "quotations":
      return (
        <Svg className={className}>
          <path d="M7 8h10M7 12h7M7 16h5" />
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </Svg>
      );
    case "agreements":
      return (
        <Svg className={className}>
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </Svg>
      );
    case "invoices":
      return (
        <Svg className={className}>
          <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path d="M14 3v6h6M9 13h6M9 17h4" />
        </Svg>
      );
    case "payments":
      return (
        <Svg className={className}>
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M2 10h20M6 15h3" />
        </Svg>
      );
    case "content":
      return (
        <Svg className={className}>
          <path d="M4 6h16M4 12h16M4 18h10" />
        </Svg>
      );
    case "posts":
      return (
        <Svg className={className}>
          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </Svg>
      );
    case "services":
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </Svg>
      );
    case "testimonials":
      return (
        <Svg className={className}>
          <path d="M8 10h.01M16 10h.01" />
          <path d="M12 18c-4 0-7-2.5-7-6V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5c0 3.5-3 6-7 6z" />
          <path d="M9 14s1.2 1 3 1 3-1 3-1" />
        </Svg>
      );
    case "backups":
      return (
        <Svg className={className}>
          <path d="M12 3v10M8 9l4 4 4-4" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </Svg>
      );
    case "settings":
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </Svg>
      );
    default:
      return null;
  }
}

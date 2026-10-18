import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { ToastProvider } from "@/components/ui/toast";
import { getStudioUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const studioUrl = getStudioUrl();

export const metadata: Metadata = {
  metadataBase: new URL(studioUrl),
  title: {
    default: "Rurango Studio",
    template: "%s · Rurango Studio",
  },
  description: "Internal business management for RURANGO.",
  applicationName: "Rurango Studio",
  icons: {
    icon: [{ url: "/icons/app_icon.png", type: "image/png" }],
    apple: [{ url: "/icons/app_icon.png", type: "image/png" }],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#191C1B",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-dvh overflow-hidden antialiased`}
    >
      <body className="h-dvh overflow-hidden bg-background font-sans text-foreground">
        <ToastProvider>
          <NavigationProgress />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

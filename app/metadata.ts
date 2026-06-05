// app/metadata.ts
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "vibeAiLink - AI Financial Analysis",
  description: "AI-powered stock analysis with real-time market data",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#000000",
};
// app/metadata.ts
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "vibeAiLink - AI Financial Analysis",
  description: "AI-powered stock analysis with real-time market data. Get RSI, MACD insights and probability simulations.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "vibeAiLink - AI Financial Analysis",
    description: "AI-powered stock analysis with RSI, MACD, and market insights.",
    url: "https://vibeailink.com",
    siteName: "vibeAiLink",
    images: [
      {
        url: "/avatars/twgirl.jpg",
        width: 1200,
        height: 630,
        alt: "vibeAiLink - AI Stock Analysis",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "vibeAiLink - AI Financial Analysis",
    description: "AI-powered stock analysis with RSI, MACD, and market insights.",
    images: ["/avatars/twgirl.jpg"],
    site: "@vibeAiLink",
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
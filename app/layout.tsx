import type { Metadata, Viewport } from "next";
import { LanguageProvider } from "./context/LanguageContext";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes, viewport-fit=cover" />
        <link rel="preconnect" href="https://query1.finance.yahoo.com" />
        <link rel="dns-prefetch" href="https://query1.finance.yahoo.com" />
      </head>
      <body style={{ margin: 0, padding: 0 }} suppressHydrationWarning>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
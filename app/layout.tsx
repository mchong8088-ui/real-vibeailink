import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* We add "suppressHydrationWarning" to stop extensions from breaking the page */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
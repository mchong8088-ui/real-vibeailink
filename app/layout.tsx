import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Pre-connect to AI and Voice servers to speed up initial response */}
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" />
        <link rel="preconnect" href="https://api.elevenlabs.io" />
        
        {/* Meta tag to ensure mobile browsers scale the "One Page" layout correctly */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
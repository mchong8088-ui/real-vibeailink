import { LanguageProvider } from './context/LanguageContext';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'vibeAiLink',
  description: 'AI-powered stock analysis platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes, viewport-fit=cover" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
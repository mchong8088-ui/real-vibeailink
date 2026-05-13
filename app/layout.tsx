import { LanguageProvider } from './context/LanguageContext';
import type { Metadata } from 'next';

// Use require for CSS instead of import
require('./globals.css');

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
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}

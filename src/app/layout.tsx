import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'A7med Arcade | Modern Game Publishing & Storefront',
  description: 'Original indie games, playable web experiences, and game development showcase by Ahmed Mohamed Salah.',
  keywords: ['game publishing', 'indie games', 'game storefront', 'web games', 'Ahmed Mohamed Salah', 'A7med Arcade'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-grid-pattern overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

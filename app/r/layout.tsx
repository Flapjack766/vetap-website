import type { Metadata } from 'next';
import '@/styles/globals.css';
import '@/styles/themes.css';

export const metadata: Metadata = {
  title: 'VETAP - Tracking Link',
  description: 'VETAP tracking link page',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TrackingLinkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="overflow-x-hidden antialiased min-h-screen bg-background text-foreground">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}


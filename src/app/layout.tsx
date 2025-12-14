import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SOP Execution Engine',
  description: 'AI-powered workflow automation for YouTube video production',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}


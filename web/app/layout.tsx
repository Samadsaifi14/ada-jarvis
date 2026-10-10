import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'ADA Jarvis Command Center',
  description: 'Conversational control surface for the local ADA operating agent.',
};

const bodyStyle: CSSProperties = {
  margin: 0,
  minHeight: '100vh',
  background: '#0a0e12',
  color: '#d7e0e8',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={bodyStyle}>{children}</body>
    </html>
  );
}

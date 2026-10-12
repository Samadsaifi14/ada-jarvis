import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'ADA — Local-First Personal Operating Agent',
  description: 'Scroll-driven 3D interface for ADA, your local PC assistant: voice, memory, tasks and approved actions.',
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

import type { Metadata } from 'next';
import MswBoot from '@/components/MswBoot';
import './globals.css';

export const metadata: Metadata = {
  title: 'Forensic AI',
  description: '디지털 포렌식 AI 에이전트',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        <MswBoot>{children}</MswBoot>
      </body>
    </html>
  );
}

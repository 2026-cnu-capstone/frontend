import type { Metadata } from 'next';
import MswBoot from '@/components/MswBoot';
import './globals.css';

export const metadata: Metadata = {
  title: 'Forensic AI',
  description: '디지털 포렌식 AI 에이전트',
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased">
        <MswBoot>{children}</MswBoot>
      </body>
    </html>
  );
}

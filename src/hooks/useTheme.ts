'use client';

import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'theme';

function readInitial(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readInitial);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const next: Theme = root.classList.contains('dark') ? 'dark' : 'light';
      setThemeState(prev => (prev === next ? prev : next));
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const setTheme = useCallback((t: Theme) => {
    document.documentElement.classList.toggle('dark', t === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore quota / privacy errors */
    }
    setThemeState(t);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    setTheme(next);
  }, [setTheme]);

  return { theme, setTheme, toggleTheme };
}

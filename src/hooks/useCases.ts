import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ActiveCase, Case } from '@/types';

function coerceCase(raw: Record<string, unknown>): Case {
  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? raw.name ?? ''),
    status: (raw.status as Case['status']) ?? 'idle',
    analyst: String(raw.analyst ?? '-'),
    size: String(raw.size ?? '-'),
    date: String(raw.date ?? new Date().toISOString().slice(0, 10)),
    progress: typeof raw.progress === 'number' ? raw.progress : 0,
  };
}

export function useCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCase, setActiveCase] = useState<ActiveCase>({ id: '', title: '케이스 없음' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.getCases()
      .then(rows => {
        if (cancelled) return;
        setCases(rows.map(coerceCase));
      })
      .catch(e => {
        console.error('getCases failed:', e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const createCase = useCallback(async (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return null;
    try {
      const created = await api.createCase({ name: trimmed });
      const normalized = coerceCase(created);
      setCases(prev => [normalized, ...prev]);
      return normalized;
    } catch (e) {
      console.error('createCase failed:', e);
      return null;
    }
  }, []);

  const deleteCase = useCallback(async (id: string) => {
    try {
      await api.deleteCase(id);
    } catch (e) {
      console.error('deleteCase failed:', e);
    }
    setCases(prev => {
      const remaining = prev.filter(c => c.id !== id);
      setActiveCase(ac =>
        ac.id !== id
          ? ac
          : remaining[0]
            ? { id: remaining[0].id, title: remaining[0].title }
            : { id: '', title: '케이스 없음' }
      );
      return remaining;
    });
  }, []);

  return { cases, setCases, activeCase, setActiveCase, createCase, deleteCase, loading };
}

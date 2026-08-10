import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { isWorkflowState } from '@/lib/workflow-state';
import type { ActiveCase, Case, WorkflowState } from '@/types';

function normalizeWorkflowState(raw: unknown): WorkflowState | undefined {
  return isWorkflowState(raw) ? raw : undefined;
}

function coerceCase(raw: Record<string, unknown>): Case {
  const createdAt = String(raw.created_at ?? new Date().toISOString().slice(0, 10));
  const updatedAtRaw = raw.updated_at;
  return {
    id: String(raw.id ?? ''),
    // The case list/create API calls this field `name`, while the detail API
    // and the frontend model call it `title`. Support both response shapes.
    title: String(raw.name ?? raw.title ?? ''),
    analyst: String(raw.analyst ?? '-'),
    date: createdAt,
    workflowState: normalizeWorkflowState(raw.status),
    lastActivityAt: updatedAtRaw ? String(updatedAtRaw) : undefined,
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

  const createCase = useCallback(async (payload: {
    title: string;
    analyst: string;
  }) => {
    const title = payload.title.trim();
    const analyst = payload.analyst.trim();
    if (!title || !analyst) return null;
    try {
      const created = await api.createCase({ title, analyst });
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

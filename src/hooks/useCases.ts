import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ActiveCase, Case, WorkflowState } from '@/types';

const WORKFLOW_STATE_SET = new Set<WorkflowState>([
  'idle',
  'plan_thinking',
  'strategy_review',
  'strategy_edit_request',
  'strategy_editing',
  'mcp_plan_thinking',
  'plan_requested',
  'rejected',
  'editing',
  'approved',
  'running',
  'done',
]);

function normalizeWorkflowState(raw: unknown): WorkflowState | undefined {
  if (typeof raw !== 'string') return undefined;
  return WORKFLOW_STATE_SET.has(raw as WorkflowState) ? (raw as WorkflowState) : undefined;
}

function coerceCase(raw: Record<string, unknown>): Case {
  const createdAt = String(raw.date ?? raw.created_at ?? new Date().toISOString().slice(0, 10));
  const updatedAtRaw = raw.lastActivityAt ?? raw.updated_at;
  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? raw.name ?? ''),
    analyst: String(raw.analyst ?? '-'),
    size: String(raw.size ?? '-'),
    date: createdAt,
    workflowState: normalizeWorkflowState(raw.workflowState ?? raw.status),
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
      const created = await api.createCase({ name: title, analyst });
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

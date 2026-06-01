/**
 * 분석 실시간 이벤트 WebSocket 훅 (지수 백오프 재연결)
 */

import { useEffect, useRef, useCallback } from 'react';

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
const MAX_BACKOFF = 30000;

export interface WsStepEvent {
  type: 'step_started' | 'step_completed';
  step_index: number;
  total: number;
  step_name: string;
  agent_name: string;
  status?: string;
  output?: string;
  elapsed?: string;
  dfxml_fragment?: string;
}

export interface WsStrategyEvent {
  type: 'strategy_ready';
  strategy: string;
  system_profile?: string;
}

export interface WsPlanEvent {
  type: 'plan_ready';
  plan_text: string;
  steps: Array<{
    step_index: number;
    name?: string;
    mcp_server: string | null;
    purpose: string | null;
    artifacts: unknown[] | null;
    hints: string | null;
    is_followup?: boolean;
  }>;
}

export interface WsExecutionDoneEvent {
  type: 'execution_done';
  task_results: Array<Record<string, unknown>>;
}

// reports.summary / reports.report_text / reports.dfxml 와 동일 필드명
export interface WsReportEvent {
  type: 'report_ready';
  summary: string;
  report_text: string;
  dfxml: string;
}

export type WsEvent =
  | WsStepEvent
  | WsStrategyEvent
  | WsPlanEvent
  | WsExecutionDoneEvent
  | WsReportEvent
  | { type: 'error'; message: string };

interface UseAnalysisWebSocketOptions {
  caseId: string | null;
  onEvent: (event: WsEvent) => void;
}

export function useAnalysisWebSocket({ caseId, onEvent }: UseAnalysisWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const onEventRef = useRef(onEvent);
  const retryCountRef = useRef(0);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (!caseId) return;
    const ws = new WebSocket(`${WS_BASE}/api/analysis/ws/${caseId}`);

    ws.onopen = () => {
      retryCountRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsEvent;
        onEventRef.current(data);
      } catch {
        console.warn('WS parse error:', event.data);
      }
    };

    ws.onerror = (err) => {
      console.error('WS connection error:', err);
    };

    ws.onclose = () => {
      const delay = Math.min(1000 * 2 ** retryCountRef.current, MAX_BACKOFF);
      retryCountRef.current += 1;
      setTimeout(() => {
        if (wsRef.current === ws) {
          connect();
        }
      }, delay);
    };

    wsRef.current = ws;
  }, [caseId]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  return { disconnect };
}

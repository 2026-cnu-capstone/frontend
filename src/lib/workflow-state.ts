/**
 * 워크플로 상태 메타데이터 — 한 곳에서 관리한다.
 *
 *  - WORKFLOW_STATES / WORKFLOW_STATE_SET: 유효한 WorkflowState 값
 *  - CANVAS_VISIBLE_STATES / isCanvasVisible: 노드뷰가 보여야 하는 상태
 *  - statusToWorkflowState: DB cases.status → 화면 WorkflowState
 *  - WORKFLOW_STATE_BADGE: 헤더 배지 라벨/색
 */

import type { WorkflowState } from '@/types';

export const WORKFLOW_STATES = [
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
] as const satisfies readonly WorkflowState[];

export const WORKFLOW_STATE_SET: ReadonlySet<WorkflowState> = new Set(WORKFLOW_STATES);

export function isWorkflowState(raw: unknown): raw is WorkflowState {
  return typeof raw === 'string' && WORKFLOW_STATE_SET.has(raw as WorkflowState);
}

// 노드뷰(WorkflowCanvas) 가 표시되는 상태
const CANVAS_VISIBLE_STATES: ReadonlySet<WorkflowState> = new Set<WorkflowState>([
  'approved',
  'running',
  'done',
]);

export function isCanvasVisible(state: WorkflowState): boolean {
  return CANVAS_VISIBLE_STATES.has(state);
}

// DB cases.status → 화면용 WorkflowState 매핑
const STATUS_TO_WORKFLOW_STATE: Record<string, WorkflowState> = {
  open: 'idle',
  idle: 'idle',
  strategy: 'strategy_review',
  plan: 'plan_requested',
  approved: 'approved',
  running: 'running',
  executed: 'done',
  done: 'done',
  failed: 'idle',
  rejected: 'rejected',
};

export function statusToWorkflowState(status: string | null | undefined): WorkflowState {
  if (!status) return 'idle';
  return STATUS_TO_WORKFLOW_STATE[status] ?? 'idle';
}

// 헤더 상태 배지 메타 (Linear 스타일 dot + label)
export interface WorkflowStateBadgeMeta {
  label: string;
  dot: string;
  text: string;
  pulse?: boolean;
}

export const WORKFLOW_STATE_BADGE: Record<WorkflowState, WorkflowStateBadgeMeta> = {
  idle:                  { label: '대기',           dot: 'bg-f-border2', text: 'text-f-t3' },
  plan_thinking:         { label: '계획 생성',       dot: 'bg-f-warn',    text: 'text-f-t2', pulse: true },
  strategy_review:       { label: '전략 검토',       dot: 'bg-f-accent',  text: 'text-f-t2' },
  strategy_edit_request: { label: '전략 수정 요청',  dot: 'bg-f-warn',    text: 'text-f-t2' },
  strategy_editing:      { label: '전략 편집',       dot: 'bg-f-warn',    text: 'text-f-t2' },
  mcp_plan_thinking:     { label: 'MCP 계획',       dot: 'bg-f-accent',  text: 'text-f-t2', pulse: true },
  plan_requested:        { label: '계획 검토',       dot: 'bg-f-accent',  text: 'text-f-t2' },
  rejected:              { label: '반려',           dot: 'bg-f-danger',  text: 'text-f-t2' },
  editing:               { label: '편집 중',         dot: 'bg-f-warn',    text: 'text-f-t2' },
  approved:              { label: '승인됨',          dot: 'bg-f-success', text: 'text-f-t2' },
  running:               { label: '실행 중',         dot: 'bg-f-success', text: 'text-f-t2', pulse: true },
  done:                  { label: '완료',            dot: 'bg-f-t3',      text: 'text-f-t2' },
};

'use client';

import { Trash2, AlertTriangle } from 'lucide-react';
import type { WorkflowState } from '@/types';

interface Props {
  caseId: string;
  caseTitle?: string;
  workflowState?: WorkflowState;
  onConfirm: () => void;
  onCancel: () => void;
}

const RUNNING_STATES: WorkflowState[] = [
  'plan_thinking',
  'mcp_plan_thinking',
  'strategy_review',
  'strategy_edit_request',
  'strategy_editing',
  'plan_requested',
  'editing',
  'approved',
  'running',
];

export default function DeleteCaseModal({
  caseId,
  caseTitle,
  workflowState,
  onConfirm,
  onCancel,
}: Props) {
  const isRunning = workflowState
    ? RUNNING_STATES.includes(workflowState)
    : false;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[300] flex items-center justify-center"
      onClick={onCancel}
    >
      <div
        className="w-[420px] bg-f-surface rounded-xl shadow-2xl p-6 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0 dark:bg-red-950/40">
            <Trash2 size={18} className="text-f-danger" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-f-t1 mb-1">케이스 삭제</div>
            <div className="text-xs text-f-t3 leading-relaxed">
              {caseTitle && (
                <div className="text-[13px] text-f-t1 font-medium truncate mb-1">
                  {caseTitle}
                </div>
              )}
              <span className="font-mono text-f-t2">{caseId}</span>
              {caseTitle ? ' 케이스를 삭제하시겠습니까?' : ' 케이스를 삭제하시겠습니까?'}
              <br />
              이 작업은 되돌릴 수 없으며, 연관된 분석 결과·계획·DFXML이 모두 함께 삭제됩니다.
            </div>
          </div>
        </div>

        {isRunning && (
          <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md dark:bg-amber-950/40 dark:border-amber-900/50">
            <AlertTriangle size={14} className="text-f-warn shrink-0 mt-0.5" />
            <div className="text-[11px] text-f-warn leading-snug">
              현재 케이스가 <span className="font-semibold">실행/편집 중</span>입니다.
              안전을 위해 워크플로를 종료하거나 완료한 뒤 삭제하세요.
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="h-8 px-4 bg-f-surface2 border border-f-border2 rounded-[5px] text-f-t2 text-xs cursor-pointer hover:bg-f-border transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isRunning}
            className="h-8 px-4 border-none rounded-[5px] text-white text-xs font-medium flex items-center gap-1 transition-colors bg-f-danger hover:bg-red-700 dark:hover:bg-red-400 disabled:bg-f-t4 disabled:cursor-not-allowed disabled:hover:bg-f-t4"
          >
            <Trash2 size={12} /> 삭제
          </button>
        </div>
      </div>
    </div>
  );
}

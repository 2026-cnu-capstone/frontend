'use client';

import { AlertTriangle, Check, Edit2, RotateCcw, Save, X } from 'lucide-react';
import { useWorkflowContext } from '@/contexts/WorkflowContext';
import MessageLabel from '../common/MessageLabel';
import type { WorkflowState } from '@/types';

const HIDDEN_STATES: WorkflowState[] = [
  'idle', 'plan_thinking', 'strategy_review', 'strategy_edit_request',
  'strategy_editing', 'mcp_plan_thinking',
];

export default function McpPlanThread() {
  const {
    workflowState, editablePlan, setEditablePlan, planRound, rejectionHistory,
    rejectionReasonRef,
    onApprovePlan, onRejectPlan, onStartEdit, onCancelEdit, onSubmitEdit,
    onCancelReject, onRerequest, onOpenMcpModal,
  } = useWorkflowContext();

  if (HIDDEN_STATES.includes(workflowState)) return null;

  return (
    <div className="px-3.5 pt-2">
      {rejectionHistory.map((item, i) => (
        <div key={i}>
          <div className="mb-3">
            <MessageLabel kind="agent" />
            <div className="bg-f-surface border border-f-border rounded-[8px] p-3 flex flex-col gap-2 shadow-flat opacity-80">
              <span className="text-[12px] text-f-t2 font-medium">분석 계획{item.round > 1 ? ` (수정안 #${item.round})` : ''}</span>
              {item.plan && (
                <div className="bg-f-bg border border-f-border rounded-[6px] overflow-hidden">
                  {item.plan.map((step, si, arr) => (
                    <div key={step.step} className={`flex items-center gap-2 px-2.5 py-1.5 text-[11px] ${si < arr.length - 1 ? 'border-b border-f-border' : ''}`}>
                      <span className="text-f-t4 min-w-[18px] font-mono tabular-nums">{String(step.step).padStart(2, '0')}</span>
                      <span className="flex-1 text-f-t3">{step.name}</span>
                      <span className="font-mono text-[10px] text-f-t3 bg-f-surface2 px-1.5 py-[2px] rounded-[4px]">{step.mcp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end mb-3">
            <div className="max-w-[86%] bg-f-invert-bg text-f-invert-fg rounded-[10px] rounded-br-[4px] px-3 py-2 text-[12.5px] leading-snug shadow-flat tracking-[-0.005em]">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1 h-1 rounded-full bg-f-danger" />
                <span className="text-[9.5px] font-semibold tracking-wider uppercase opacity-80">수정 요청</span>
              </div>
              {item.reason || '(반려 사유 없음)'}
            </div>
          </div>
        </div>
      ))}

      <div className="mb-3">
        <MessageLabel kind="agent" />
        <div className="bg-f-surface border border-f-border rounded-[8px] p-3 flex flex-col gap-2.5 shadow-flat">
          <span className="text-[12px] text-f-t1 font-semibold tracking-[-0.005em]">
            MCP 분석 계획{planRound > 1 ? ` (수정안 #${planRound})` : ''}
          </span>

          {workflowState !== 'editing' && (
            <div className="bg-f-bg border border-f-border rounded-[6px] overflow-hidden">
              <div className="flex items-center px-2.5 py-1 border-b border-f-border bg-f-surface">
                <span className="flex-1 text-[9px] font-semibold text-f-t4 tracking-[0.12em] uppercase">단계</span>
                <span className="text-[9px] font-semibold text-f-t4 tracking-[0.12em] uppercase">MCP</span>
              </div>
              {editablePlan.map((item, idx, arr) => (
                <div key={item.step} className={`flex items-center gap-2 px-2.5 py-1.5 text-[11px] ${idx < arr.length - 1 ? 'border-b border-f-border' : ''}`}>
                  <span className="text-f-t4 min-w-[18px] font-mono tabular-nums">{String(item.step).padStart(2, '0')}</span>
                  <span className="flex-1 text-f-t2">{item.name}</span>
                  <button
                    onClick={() => onOpenMcpModal(idx)}
                    className="h-6 px-1.5 bg-f-surface border border-f-border rounded-[4px] text-[10px] font-mono text-f-t2 cursor-pointer whitespace-nowrap max-w-[140px] overflow-hidden text-ellipsis hover:bg-f-surface2 hover:border-f-border2 transition-colors"
                    title={item.mcp}
                  >
                    {item.mcp}
                  </button>
                </div>
              ))}
            </div>
          )}

          {workflowState === 'editing' && (
            <div className="flex flex-col gap-1.5">
              <p className="text-[11px] text-f-t2 leading-relaxed">
                단계명과 MCP를 고친 뒤 <strong className="text-f-t1 font-semibold">수정 완료</strong>로 반영한 다음, 아래 <strong className="text-f-t1 font-semibold">승인</strong>을 눌러 주세요.
              </p>
              {editablePlan.map((item, idx) => (
                <div key={item.step} className="flex gap-1.5 items-center px-2 py-1.5 bg-f-bg border border-f-border rounded-[6px]">
                  <span className="text-[11px] text-f-t4 min-w-[18px] font-mono tabular-nums">{String(item.step).padStart(2, '0')}</span>
                  <input
                    value={item.name}
                    onChange={e => { setEditablePlan(prev => { const next = [...prev]; next[idx] = { ...item, name: e.target.value }; return next; }); }}
                    className="flex-1 h-7 bg-f-surface border border-f-border rounded-[4px] px-2 text-[11px] text-f-t1 outline-none focus:border-f-t2 transition-colors"
                  />
                  <button
                    onClick={() => onOpenMcpModal(idx)}
                    className="h-7 px-1.5 bg-f-surface border border-f-border rounded-[4px] text-[10px] font-mono text-f-t2 cursor-pointer whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis hover:bg-f-surface2 hover:border-f-border2 transition-colors"
                    title={item.mcp}
                  >
                    {item.mcp}
                  </button>
                </div>
              ))}
              <div className="flex gap-1.5 mt-0.5">
                <button
                  onClick={onSubmitEdit}
                  className="flex-[2] h-[30px] bg-f-invert-bg border-0 rounded-[6px] text-f-invert-fg text-[11px] font-medium cursor-pointer flex items-center justify-center gap-1 hover:bg-f-invert-bg-hover transition-colors shadow-flat"
                >
                  <Save size={12} /> 수정 완료
                </button>
                <button
                  onClick={onCancelEdit}
                  className="flex-1 h-[30px] bg-f-surface border border-f-border rounded-[6px] text-f-t3 text-[11px] cursor-pointer flex items-center justify-center gap-1 hover:bg-f-surface2 hover:border-f-border2 transition-colors"
                >
                  <RotateCcw size={12} /> 취소
                </button>
              </div>
            </div>
          )}

          {workflowState === 'plan_requested' && (
            <div className="flex gap-1.5 pt-2 border-t border-f-border">
              <button
                onClick={onApprovePlan}
                className="flex-1 h-[30px] bg-f-invert-bg border-0 rounded-[6px] text-f-invert-fg text-[11px] font-medium cursor-pointer flex items-center justify-center gap-1 hover:bg-f-invert-bg-hover transition-colors shadow-flat"
              >
                <Check size={12} strokeWidth={2.2} /> 승인
              </button>
              <button
                onClick={onRejectPlan}
                className="flex-1 h-[30px] bg-f-surface border border-f-border rounded-[6px] text-f-t2 text-[11px] cursor-pointer flex items-center justify-center gap-1 hover:bg-f-surface2 hover:border-f-border2 transition-colors"
              >
                <X size={12} /> 수정 요청
              </button>
              <button
                onClick={onStartEdit}
                className="flex-1 h-[30px] bg-f-surface border border-f-border rounded-[6px] text-f-t2 text-[11px] cursor-pointer flex items-center justify-center gap-1 hover:bg-f-surface2 hover:border-f-border2 transition-colors"
              >
                <Edit2 size={12} /> 직접 수정
              </button>
            </div>
          )}

          {['approved', 'running', 'done'].includes(workflowState) && (
            <div className="pt-2 border-t border-f-border flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-f-success" aria-hidden />
              <span className="text-[11px] text-f-t2 font-medium">분석관 승인 완료</span>
            </div>
          )}
        </div>
      </div>

      {workflowState === 'rejected' && (
        <div className="mb-3">
          <MessageLabel kind="system" />
          <div className="bg-f-surface border border-f-border rounded-[8px] p-3 flex flex-col gap-2.5 shadow-flat">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-f-danger shrink-0" />
              <span className="text-[12px] font-semibold text-f-t1">MCP 계획 수정을 요청했습니다</span>
            </div>
            <p className="text-[11px] text-f-t3 leading-relaxed">사유를 입력한 뒤 재요청하세요.</p>
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] text-f-t4 font-medium tracking-wider uppercase">반려 사유 (선택)</p>
              <textarea
                defaultValue=""
                onChange={e => { rejectionReasonRef.current = e.target.value; }}
                placeholder="예) 타임라인 분석 단계를 추가해주세요."
                className="w-full h-[68px] bg-f-bg border border-f-border rounded-[6px] px-2.5 py-2 text-xs text-f-t1 resize-none outline-none focus:border-f-t2 focus:bg-f-surface transition-colors leading-relaxed"
              />
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={onRerequest}
                className="flex-[2] h-[30px] bg-f-invert-bg border-0 rounded-[6px] text-f-invert-fg text-[11px] font-medium cursor-pointer flex items-center justify-center gap-1 hover:bg-f-invert-bg-hover transition-colors shadow-flat"
              >
                <RotateCcw size={12} /> 새 분석 계획 재요청
              </button>
              <button
                onClick={onCancelReject}
                className="flex-1 h-[30px] bg-f-surface border border-f-border rounded-[6px] text-f-t3 text-[11px] cursor-pointer flex items-center justify-center gap-1 hover:bg-f-surface2 hover:border-f-border2 transition-colors"
              >
                <X size={12} /> 취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

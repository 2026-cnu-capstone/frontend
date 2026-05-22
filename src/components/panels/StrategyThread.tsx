'use client';

import {
  BookOpen, Check, ChevronDown, ChevronLeft, Cpu, Edit2, HardDrive, RotateCcw, Save, X,
} from 'lucide-react';
import { useWorkflowContext } from '@/contexts/WorkflowContext';
import { getBasename } from '@/lib/utils';
import PulseLoader from '../common/PulseLoader';
import MessageLabel from '../common/MessageLabel';
import type { WorkflowState } from '@/types';

const PROMPT_VISIBLE_STATES: WorkflowState[] = [
  'strategy_review', 'strategy_edit_request', 'strategy_editing',
  'mcp_plan_thinking', 'plan_requested', 'rejected', 'editing', 'approved', 'running', 'done',
];

const STRATEGY_CARD_STATES: WorkflowState[] = [
  'strategy_review', 'plan_requested', 'rejected', 'editing', 'approved', 'running', 'done',
];

export default function StrategyThread() {
  const {
    workflowState, diskImagePath, diskImageCheck, attachedFile,
    submittedPrompt, strategySteps, setStrategySteps,
    showReasoning, setShowReasoning,
    strategyBackupRef, strategyEditReasonRef,
    onApproveStrategy, onStrategyEditRequest, onStrategyEditCancel, onStrategyEditSubmit,
    onSyncPlanWithStrategy, onStrategyDirectEdit,
  } = useWorkflowContext();

  const evidenceName = getBasename(diskImagePath) || attachedFile?.name || '증거물';

  if (workflowState === 'plan_thinking') {
    return (
      <div className="px-3.5 pt-4">
        <Divider label="전송됨" />
        <MessageLabel kind="agent" />
        <div className="bg-f-surface border border-f-border rounded-[8px] p-3 flex flex-col gap-2 shadow-flat">
          {[
            { icon: <BookOpen size={11} />, text: '유사 사례 검색 중' },
            { icon: <Cpu size={11} />, text: 'AI 분석 전략 도출 중' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] text-f-t3">
              <span className="text-f-t4">{item.icon}</span>
              <span className="flex-1">{item.text}</span>
              <span className="flex gap-0.5 items-center">
                {[0, 1, 2].map(j => (
                  <span
                    key={j}
                    className="w-1 h-1 rounded-full bg-f-accent animate-pulse"
                    style={{ animationDelay: `${j * 0.15}s` }}
                  />
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!PROMPT_VISIBLE_STATES.includes(workflowState) || !submittedPrompt) return null;

  return (
    <div className="px-3.5 pt-4">
      <Divider label="전송됨" />

      <div className="flex justify-end mb-2.5">
        <div className="bg-f-surface border border-f-border rounded-[6px] px-2 py-1 flex items-center gap-1.5 text-[11px] shadow-flat">
          <HardDrive size={11} className="text-f-t4" />
          <span className="font-mono text-f-t2">{evidenceName}</span>
          <span className="text-f-border2">·</span>
          <span className="font-mono text-f-t4">{diskImageCheck.format}</span>
        </div>
      </div>

      <div className="flex justify-end mb-3">
        <div className="max-w-[86%] bg-f-invert-bg text-f-invert-fg rounded-[10px] rounded-br-[4px] px-3 py-2 text-[12.5px] leading-snug shadow-flat tracking-[-0.005em]">
          {submittedPrompt}
        </div>
      </div>

      {STRATEGY_CARD_STATES.includes(workflowState) && (
        <div className="mb-3">
          <MessageLabel kind="agent" />
          <div className="bg-f-surface border border-f-border rounded-[8px] p-3 flex flex-col gap-2.5 shadow-flat">
            <div className="bg-f-bg border border-f-border rounded-[6px] px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-2">
                <Cpu size={11} className="text-f-t3" />
                <span className="text-[10px] font-semibold text-f-t2 tracking-wider uppercase">분석 전략</span>
                {workflowState !== 'strategy_review' && (
                  <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-[2px] rounded-[4px] bg-f-surface2">
                    <span className="w-1 h-1 rounded-full bg-f-success" />
                    <span className="text-[9px] font-semibold text-f-t2 tracking-wider uppercase">확정</span>
                  </span>
                )}
              </div>
              <div className="bg-f-surface border border-f-border rounded-[6px] overflow-hidden">
                {strategySteps.map((step, idx) => (
                  <div key={step.id} className={`flex items-center gap-2 px-2.5 py-1.5 text-[11px] ${idx < strategySteps.length - 1 ? 'border-b border-f-border' : ''}`}>
                    <span className="text-f-t4 min-w-[18px] font-mono tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="flex-1 text-f-t2 leading-snug">{step.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div
                onClick={() => setShowReasoning(v => !v)}
                className="flex items-center gap-1 text-[11px] text-f-t3 hover:text-f-t1 cursor-pointer select-none transition-colors"
              >
                <ChevronDown size={12} style={{ transform: showReasoning ? 'none' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                AI 판단 근거
              </div>
              {showReasoning && (
                <div className="mt-2 bg-f-surface2 border border-f-border rounded-md px-3 py-2.5 animate-fadeIn">
                  <div className="flex flex-col gap-1.5">
                    {[
                      { id: 'DF-2023-1124', title: 'USB 삭제파일 복구', sim: 94 },
                      { id: 'DF-2023-0867', title: 'NTFS 타임스탬프 분석', sim: 87 },
                    ].map(c => (
                      <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 bg-f-surface border border-f-border rounded">
                        <div className="w-7 h-7 rounded bg-f-accent-light flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-f-accent">{c.sim}%</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono text-f-accent">{c.id}</div>
                          <div className="text-[11px] text-f-t2 overflow-hidden text-ellipsis whitespace-nowrap">{c.title}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {workflowState === 'strategy_review' && (
              <div className="flex gap-1.5 pt-2 border-t border-f-border">
                <button
                  type="button"
                  onClick={onApproveStrategy}
                  className="flex-1 h-[30px] bg-f-invert-bg border-0 rounded-[6px] text-f-invert-fg text-[11px] font-medium cursor-pointer flex items-center justify-center gap-1 hover:bg-f-invert-bg-hover transition-colors shadow-flat"
                >
                  <Check size={12} strokeWidth={2.2} /> 승인
                </button>
                <button
                  type="button"
                  onClick={onStrategyEditRequest}
                  className="flex-1 h-[30px] bg-f-surface border border-f-border rounded-[6px] text-f-t2 text-[11px] cursor-pointer flex items-center justify-center gap-1 hover:bg-f-surface2 hover:border-f-border2 transition-colors"
                >
                  <X size={12} /> 수정 요청
                </button>
                <button
                  type="button"
                  onClick={() => { strategyBackupRef.current = strategySteps.map(s => ({ ...s })); onStrategyDirectEdit(); }}
                  className="flex-1 h-[30px] bg-f-surface border border-f-border rounded-[6px] text-f-t2 text-[11px] cursor-pointer flex items-center justify-center gap-1 hover:bg-f-surface2 hover:border-f-border2 transition-colors"
                >
                  <Edit2 size={12} /> 직접 수정
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {workflowState === 'strategy_edit_request' && (
        <div className="mb-3">
          <MessageLabel kind="system" />
          <div className="bg-f-surface border border-f-border rounded-[8px] p-3 flex flex-col gap-2.5 shadow-flat">
            <p className="text-[11px] text-f-t3 leading-relaxed">전략에 반영할 수정 사항을 입력하세요.</p>
            <textarea
              defaultValue=""
              onChange={e => { strategyEditReasonRef.current = e.target.value; }}
              placeholder="예) 메모리 덤프 분석을 전략에 포함해 주세요."
              className="w-full h-[72px] bg-f-bg border border-f-border rounded-[6px] px-2.5 py-2 text-xs text-f-t1 resize-none outline-none focus:border-f-t2 focus:bg-f-surface transition-colors leading-relaxed"
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={onStrategyEditSubmit}
                className="flex-[2] h-[30px] bg-f-invert-bg border-0 rounded-[6px] text-f-invert-fg text-[11px] font-medium cursor-pointer flex items-center justify-center gap-1 hover:bg-f-invert-bg-hover transition-colors shadow-flat"
              >
                <RotateCcw size={12} /> 재요청
              </button>
              <button
                type="button"
                onClick={onStrategyEditCancel}
                className="flex-1 h-[30px] bg-f-surface border border-f-border rounded-[6px] text-f-t3 text-[11px] cursor-pointer flex items-center justify-center gap-1 hover:bg-f-surface2 hover:border-f-border2 transition-colors"
              >
                <ChevronLeft size={12} /> 이전
              </button>
            </div>
          </div>
        </div>
      )}

      {workflowState === 'strategy_editing' && (
        <div className="mb-3">
          <MessageLabel kind="agent" />
          <div className="bg-f-surface border border-f-border rounded-[8px] p-3 flex flex-col gap-2.5 shadow-flat">
            <p className="text-[11px] text-f-t3 leading-relaxed">
              내용을 고친 뒤 <strong className="text-f-t1 font-semibold">수정 완료</strong>로 반영하고,
              아래 전략 카드에서 <strong className="text-f-t1 font-semibold">승인</strong>을 누르면 MCP 계획 단계로 진행합니다.
            </p>
            <div className="flex flex-col gap-1.5">
              {strategySteps.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-1.5 px-2 py-1.5 bg-f-bg border border-f-border rounded-[6px]">
                  <span className="text-[11px] text-f-t4 min-w-[18px] font-mono tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
                  <input
                    value={step.text}
                    onChange={e => setStrategySteps(prev => prev.map((it, pi) => pi === idx ? { ...it, text: e.target.value } : it))}
                    className="flex-1 h-[28px] bg-f-surface border border-f-border rounded-[4px] px-2 text-[11px] text-f-t1 outline-none focus:border-f-t2 transition-colors"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => { onSyncPlanWithStrategy(); onStrategyEditCancel(); }}
                className="flex-[2] h-[30px] bg-f-invert-bg border-0 rounded-[6px] text-f-invert-fg text-[11px] font-medium cursor-pointer flex items-center justify-center gap-1 hover:bg-f-invert-bg-hover transition-colors shadow-flat"
              >
                <Save size={12} /> 수정 완료
              </button>
              <button
                type="button"
                onClick={() => { setStrategySteps(() => strategyBackupRef.current.map(s => ({ ...s }))); onStrategyEditCancel(); }}
                className="flex-1 h-[30px] bg-f-surface border border-f-border rounded-[6px] text-f-t3 text-[11px] cursor-pointer flex items-center justify-center gap-1 hover:bg-f-surface2 hover:border-f-border2 transition-colors"
              >
                <ChevronLeft size={12} /> 취소
              </button>
            </div>
          </div>
        </div>
      )}

      {workflowState === 'mcp_plan_thinking' && (
        <div className="mb-3">
          <MessageLabel kind="agent" />
          <PulseLoader label="MCP 계획 구성 중" />
        </div>
      )}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3.5">
      <div className="flex-1 h-px bg-f-border" />
      <span className="text-[9.5px] text-f-t4 whitespace-nowrap tracking-[0.14em] uppercase font-medium">{label}</span>
      <div className="flex-1 h-px bg-f-border" />
    </div>
  );
}

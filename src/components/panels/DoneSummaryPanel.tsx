'use client';

import { Check, Clock, Download, FileSearch, FileText } from 'lucide-react';
import { useWorkflowContext } from '@/contexts/WorkflowContext';
import { getBasename } from '@/lib/utils';
import PulseLoader from '../common/PulseLoader';
import MessageLabel from '../common/MessageLabel';

export default function DoneSummaryPanel() {
  const {
    workflowState, editablePlan, submittedPrompt,
    diskImagePath, diskImageCheck,
    taskResults, elapsedTime,
    reportState, setShowReportViewer,
    onApproveReport, onDownloadReport, onDownloadDfxml,
  } = useWorkflowContext();

  if (workflowState !== 'done') return null;

  const successCount = taskResults?.filter(r => r.status === 'success').length ?? 0;
  const errorCount = taskResults?.filter(r => r.status === 'error').length ?? 0;

  const summaryItems = taskResults && taskResults.length > 0
    ? [
      {
        flag: successCount > 0 ? '완료' : '정상',
        label: successCount > 0 ? `${successCount}개 단계 성공` : '분석 완료',
        sub: `총 ${taskResults.length}개 단계 실행`,
        color: 'border-l-f-success',
        dot: 'bg-f-success',
      },
      ...(errorCount > 0 ? [{
        flag: '오류',
        label: `${errorCount}개 단계 오류`,
        sub: '보고서에서 상세 내용을 확인하세요',
        color: 'border-l-f-danger',
        dot: 'bg-f-danger',
      }] : []),
    ]
    : null;

  return (
    <div className="px-3.5 pt-2">
      <div className="mb-3">
        <MessageLabel kind="agent" />
        <div className="bg-f-surface border border-f-border rounded-[8px] overflow-hidden shadow-flat">
          <div className="px-3 py-2.5 bg-f-bg border-b border-f-border flex items-center justify-between">
            <span className="text-[12px] font-semibold text-f-t1 flex items-center gap-1.5 tracking-[-0.005em]">
              <span className="w-1.5 h-1.5 rounded-full bg-f-success" aria-hidden />
              <FileText size={12} className="text-f-t3" /> 분석 완료 — 결과 요약
            </span>
            <div className="flex items-center gap-1 text-[10px] text-f-t4 font-mono tabular-nums">
              <Clock size={10} /> {elapsedTime || '-'}
            </div>
          </div>

          <div className="p-3 flex flex-col gap-3">
            <div>
              <div className="text-[9.5px] font-semibold tracking-[0.12em] uppercase text-f-t4 mb-1.5">사건 개요</div>
              <div className="text-[11px] text-f-t2 leading-relaxed bg-f-bg border border-f-border rounded-[6px] px-2.5 py-2">
                {submittedPrompt || 'USB 저장매체에서 삭제된 한글(hwp) 문서를 복구하고, 타임스탬프 변조 여부를 확인해 주세요.'}
              </div>
            </div>

            <div>
              <div className="text-[9.5px] font-semibold tracking-[0.12em] uppercase text-f-t4 mb-1.5">분석 결과 요약</div>
              {summaryItems ? (
                <div className="flex flex-col gap-1.5">
                  {summaryItems.map(item => (
                    <div key={item.flag} className={`bg-f-surface border border-f-border rounded-[6px] px-2.5 py-1.5 border-l-[3px] ${item.color}`}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="inline-flex items-center gap-1 px-1 py-[1px] rounded-[4px] bg-f-surface2">
                          <span className={`w-1 h-1 rounded-full ${item.dot}`} />
                          <span className="text-[9px] font-semibold text-f-t2 tracking-wider uppercase">{item.flag}</span>
                        </span>
                        <span className="text-[11px] font-medium text-f-t1">{item.label}</span>
                      </div>
                      <div className="text-[10px] text-f-t3">{item.sub}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-f-t3 bg-f-bg border border-f-border rounded-[6px] px-2.5 py-2">
                  분석이 완료되었습니다. 아래에서 보고서를 생성하세요.
                </div>
              )}
            </div>

            <div>
              <div className="text-[9.5px] font-semibold tracking-[0.12em] uppercase text-f-t4 mb-1.5">단계별 결과</div>
              <div className="flex flex-col gap-1.5">
                {editablePlan.map((item, i) => {
                  const out = taskResults?.[i]?.output;
                  const display = out ? (out.length > 80 ? out.slice(0, 80) + '…' : out) : '실행 완료';
                  return (
                    <div key={item.step} className="flex gap-2 items-start">
                      <div className="w-5 h-5 rounded-[5px] bg-f-surface border border-f-border flex items-center justify-center text-[9.5px] font-semibold text-f-t2 shrink-0 mt-px font-mono tabular-nums">
                        {String(item.step).padStart(2, '0')}
                      </div>
                      <div className="flex-1 bg-f-bg border border-f-border rounded-[6px] px-2 py-1.5">
                        <div className="flex justify-between items-center mb-0.5 gap-2">
                          <span className="text-[11px] font-medium text-f-t1 truncate">{item.name}</span>
                          <span className="text-[9.5px] font-mono text-f-t3 bg-f-surface2 px-1.5 py-[1px] rounded-[4px] shrink-0">{item.mcp}</span>
                        </div>
                        <span className="text-[10px] text-f-t3 leading-snug">{display}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-[9.5px] font-semibold tracking-[0.12em] uppercase text-f-t4 mb-1.5">분석 환경</div>
              <div className="grid grid-cols-2 gap-1">
                {[
                  ['증거물', getBasename(diskImagePath) || '(미지정)'],
                  ['컨테이너 포맷', (diskImageCheck.format || '-').toUpperCase()],
                  ['분석 단계', `${editablePlan.length}개 단계`],
                  ['MCP 서버', `${editablePlan.length}개 도구`],
                ].map(([k, v]) => (
                  <div key={k} className="bg-f-bg border border-f-border rounded-[6px] px-2 py-1.5">
                    <div className="text-[9px] text-f-t4 mb-0.5 tracking-wider uppercase font-medium">{k}</div>
                    <div className="text-[10.5px] font-mono text-f-t2 truncate">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {reportState === 'idle' && (
        <div className="mb-3">
          <MessageLabel kind="agent" />
          <div className="bg-f-surface border border-f-border rounded-[8px] p-3 flex flex-col gap-2.5 shadow-flat">
            <span className="text-[12px] text-f-t1 font-medium tracking-[-0.005em]">이 결과를 토대로 보고서를 생성하시겠습니까?</span>
            <div className="flex gap-1.5">
              <button
                onClick={onApproveReport}
                className="flex-1 h-[30px] bg-f-invert-bg border-0 rounded-[6px] text-f-invert-fg text-[11px] font-medium cursor-pointer flex items-center justify-center gap-1 hover:bg-f-invert-bg-hover transition-colors shadow-flat"
              >
                <Check size={12} strokeWidth={2.2} /> 보고서 생성
              </button>
              <button
                onClick={() => setShowReportViewer(true)}
                className="flex-1 h-[30px] bg-f-surface border border-f-border rounded-[6px] text-f-t2 text-[11px] font-medium cursor-pointer flex items-center justify-center gap-1 hover:bg-f-surface2 hover:border-f-border2 transition-colors"
              >
                <FileSearch size={12} /> 결과 요약보기
              </button>
            </div>
          </div>
        </div>
      )}

      {reportState === 'generating' && (
        <div className="mb-3">
          <MessageLabel kind="agent" />
          <PulseLoader label="보고서 생성 중" />
        </div>
      )}

      {reportState === 'done' && (
        <div className="mb-3">
          <MessageLabel kind="agent" />
          <div className="bg-f-surface border border-f-border rounded-[8px] p-3 flex flex-col gap-2 shadow-flat">
            <span className="text-[12px] text-f-t1 font-medium flex items-center gap-1.5 tracking-[-0.005em]">
              <span className="w-1.5 h-1.5 rounded-full bg-f-success" aria-hidden />
              보고서가 생성되었습니다
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setShowReportViewer(true)}
                className="flex-1 h-[30px] bg-f-surface border border-f-border rounded-[6px] text-f-t2 text-[11px] font-medium cursor-pointer flex items-center justify-center gap-1 hover:bg-f-surface2 hover:border-f-border2 transition-colors"
              >
                <FileSearch size={12} /> 결과 요약보기
              </button>
              <button
                onClick={onDownloadReport}
                disabled={!onDownloadReport}
                className="flex-1 h-[30px] bg-f-invert-bg border-0 rounded-[6px] text-f-invert-fg text-[11px] font-medium cursor-pointer flex items-center justify-center gap-1 hover:bg-f-invert-bg-hover transition-colors shadow-flat disabled:opacity-50 disabled:cursor-default"
              >
                <Download size={12} /> 보고서 다운로드
              </button>
            </div>
            <button
              type="button"
              onClick={onDownloadDfxml}
              disabled={!onDownloadDfxml}
              aria-label="DFXML 다운로드"
              className="h-[30px] bg-f-surface border border-f-border rounded-[6px] text-f-t2 text-[11px] font-medium cursor-pointer flex items-center justify-center gap-1 hover:bg-f-surface2 hover:border-f-border2 transition-colors disabled:opacity-50 disabled:cursor-default"
            >
              <Download size={12} /> DFXML 다운로드
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

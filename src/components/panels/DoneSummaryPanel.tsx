'use client';

import { Check, Clock, Download, FileSearch, FileText } from 'lucide-react';
import { useWorkflowContext } from '@/contexts/WorkflowContext';
import { getBasename } from '@/lib/utils';
import PulseLoader from '../common/PulseLoader';

export default function DoneSummaryPanel() {
  const {
    workflowState, editablePlan, submittedPrompt,
    diskImagePath, diskImageCheck,
    taskResults, elapsedTime,
    reportState, setShowReportViewer,
    onApproveReport, onDownloadReport,
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
        color: 'border-f-success',
        badge: 'text-f-success bg-green-50',
      },
      ...(errorCount > 0 ? [{
        flag: '오류',
        label: `${errorCount}개 단계 오류`,
        sub: '보고서에서 상세 내용을 확인하세요',
        color: 'border-f-danger',
        badge: 'text-f-danger bg-red-50',
      }] : []),
    ]
    : null;

  return (
    <div className="px-3.5 pt-2">
      <div className="mb-3">
        <span className="text-[10px] font-semibold text-f-t3 tracking-wider uppercase block mb-1">Agent</span>
        <div className="bg-f-surface border border-f-border rounded-md overflow-hidden">
          <div className="px-3 py-2.5 bg-slate-800 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-slate-100 flex items-center gap-1.5">
              <FileText size={13} className="text-sky-300" /> 분석 완료 — 결과 요약
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Clock size={10} /> {elapsedTime || '-'}
            </div>
          </div>

          <div className="p-3 flex flex-col gap-3">
            <div>
              <div className="text-[9px] font-bold tracking-widest uppercase text-f-t4 mb-1.5">사건 개요</div>
              <div className="text-[11px] text-f-t2 leading-relaxed bg-f-surface2 border border-f-border rounded px-2.5 py-2">
                {submittedPrompt || 'USB 저장매체에서 삭제된 한글(hwp) 문서를 복구하고, 타임스탬프 변조 여부를 확인해 주세요.'}
              </div>
            </div>

            <div>
              <div className="text-[9px] font-bold tracking-widest uppercase text-f-t4 mb-1.5">분석 결과 요약</div>
              {summaryItems ? (
                <div className="flex flex-col gap-1.5">
                  {summaryItems.map(item => (
                    <div key={item.flag} className={`bg-f-surface border border-f-border rounded px-2.5 py-1.5 border-l-[3px] ${item.color}`}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[9px] font-bold px-1 py-[1px] rounded ${item.badge}`}>{item.flag}</span>
                        <span className="text-[11px] font-medium text-f-t1">{item.label}</span>
                      </div>
                      <div className="text-[10px] text-f-t3">{item.sub}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-f-t3 bg-f-surface2 border border-f-border rounded px-2.5 py-2">
                  분석이 완료되었습니다. 아래에서 보고서를 생성하세요.
                </div>
              )}
            </div>

            <div>
              <div className="text-[9px] font-bold tracking-widest uppercase text-f-t4 mb-1.5">단계별 결과</div>
              <div className="flex flex-col gap-1.5">
                {editablePlan.map((item, i) => {
                  const out = taskResults?.[i]?.output;
                  const display = out ? (out.length > 80 ? out.slice(0, 80) + '…' : out) : '실행 완료';
                  return (
                    <div key={item.step} className="flex gap-2 items-start">
                      <div className="w-5 h-5 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-[9px] font-bold text-f-success shrink-0 mt-px">
                        {item.step}
                      </div>
                      <div className="flex-1 bg-f-surface2 border border-f-border rounded px-2 py-1.5">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[11px] font-medium text-f-t1">{item.name}</span>
                          <span className="text-[9px] font-mono text-f-accent bg-f-accent-light px-1 py-[1px] rounded">{item.mcp}</span>
                        </div>
                        <span className="text-[10px] text-f-t3">{display}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-[9px] font-bold tracking-widest uppercase text-f-t4 mb-1.5">분석 환경</div>
              <div className="grid grid-cols-2 gap-1">
                {[
                  ['증거물', getBasename(diskImagePath) || '(미지정)'],
                  ['컨테이너 포맷', (diskImageCheck.format || '-').toUpperCase()],
                  ['분석 단계', `${editablePlan.length}개 단계`],
                  ['MCP 서버', `${editablePlan.length}개 도구`],
                ].map(([k, v]) => (
                  <div key={k} className="bg-f-surface2 border border-f-border rounded px-2 py-1.5">
                    <div className="text-[9px] text-f-t4 mb-0.5">{k}</div>
                    <div className="text-[10px] font-mono text-f-t2 truncate">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {reportState === 'idle' && (
        <div className="mb-3">
          <span className="text-[10px] font-semibold text-f-t3 tracking-wider uppercase block mb-1">Agent</span>
          <div className="bg-f-surface border border-f-border rounded-md p-3 flex flex-col gap-2.5">
            <span className="text-xs text-f-t1">이 결과를 토대로 보고서를 생성하시겠습니까?</span>
            <div className="flex gap-1.5">
              <button
                onClick={onApproveReport}
                className="flex-1 h-[30px] bg-f-accent border-none rounded text-white text-[11px] font-medium cursor-pointer flex items-center justify-center gap-1 hover:bg-blue-700 transition-colors"
              >
                <Check size={12} /> 보고서 생성
              </button>
              <button
                onClick={() => setShowReportViewer(true)}
                className="flex-1 h-[30px] bg-f-surface2 border border-f-border2 rounded text-f-t2 text-[11px] font-medium cursor-pointer flex items-center justify-center gap-1 hover:bg-f-border transition-colors"
              >
                <FileSearch size={12} /> 결과 요약보기
              </button>
            </div>
          </div>
        </div>
      )}

      {reportState === 'generating' && (
        <div className="mb-3">
          <span className="text-[10px] font-semibold text-f-t3 tracking-wider uppercase block mb-1">Agent</span>
          <PulseLoader label="보고서 생성 중..." />
        </div>
      )}

      {reportState === 'done' && (
        <div className="mb-3">
          <span className="text-[10px] font-semibold text-f-t3 tracking-wider uppercase block mb-1">Agent</span>
          <div className="bg-f-surface border border-f-border rounded-md p-3 flex flex-col gap-2">
            <span className="text-xs text-f-t1 flex items-center gap-1.5">
              <Check size={13} className="text-f-success" /> 보고서가 생성되었습니다.
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setShowReportViewer(true)}
                className="flex-1 h-[30px] bg-f-surface2 border border-f-border2 rounded text-f-t2 text-[11px] font-medium cursor-pointer flex items-center justify-center gap-1 hover:bg-f-border transition-colors"
              >
                <FileSearch size={12} /> 결과 요약보기
              </button>
              <button
                onClick={onDownloadReport}
                disabled={!onDownloadReport}
                className="flex-1 h-[30px] bg-f-accent border-none rounded text-white text-[11px] font-medium cursor-pointer flex items-center justify-center gap-1 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-default"
              >
                <Download size={12} /> 보고서 다운로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { X, FileText, Download } from 'lucide-react';
import type { PlanStep } from '@/types';

interface TaskResult {
  task_id?: string;
  agent_name?: string;
  status?: string;
  output?: string;
}

interface Props {
  editablePlan: PlanStep[];
  submittedPrompt: string;
  onClose: () => void;
  reportData?: {
    summary: string;
    report: string;
    dfxml: string;
  } | null;
  taskResults?: TaskResult[];
  diskImagePath?: string;
}

export default function ReportViewerModal({
  editablePlan,
  submittedPrompt,
  onClose,
  reportData,
  taskResults,
  diskImagePath,
}: Props) {
  const summary = reportData?.summary || '';
  const report = reportData?.report || '';
  const results = taskResults || [];

  const handleDownload = () => {
    const lines = [
      '디지털 포렌식 분석 보고서',
      '='.repeat(50),
      `생성일: ${new Date().toISOString().slice(0, 10)}`,
      '',
      '1. 사건 개요',
      '-'.repeat(30),
      submittedPrompt || '(없음)',
      '',
      '2. 분석 환경',
      '-'.repeat(30),
      `디스크 이미지: ${diskImagePath || '(미지정)'}`,
      `분석 도구: ${editablePlan.map(p => p.mcp).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`,
      `분석 단계: ${editablePlan.length}단계`,
      '',
    ];
    if (summary) lines.push('3. 분석 요약', '-'.repeat(30), summary, '');
    if (report) lines.push(`${summary ? '4' : '3'}. 상세 보고서`, '-'.repeat(30), report);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forensic_report_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-[640px] max-h-[85vh] bg-f-surface rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-f-border flex justify-between items-center shrink-0 bg-slate-800">
          <span className="text-[13px] font-semibold text-slate-100 flex items-center gap-1.5">
            <FileText size={14} className="text-sky-300" /> 디지털 포렌식 분석 보고서
          </span>
          <button
            onClick={onClose}
            className="w-6 h-6 border-none bg-white/10 rounded cursor-pointer flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto cp-scroll px-7 py-6 flex flex-col gap-5 bg-slate-50">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-lg font-bold text-f-t1 mb-1">디지털 포렌식 분석 보고서</div>
              <div className="text-xs text-f-t3">
                생성일: {new Date().toISOString().slice(0, 10)}
              </div>
            </div>
            <span className="px-2.5 py-1 bg-green-50 border border-green-200 rounded text-[11px] text-f-success font-semibold">
              {report ? '최종본' : '생성 중'}
            </span>
          </div>

          <div className="h-px bg-f-border" />

          {/* 1. 사건 개요 */}
          <div>
            <div className="text-[13px] font-semibold text-f-t1 mb-2.5">1. 사건 개요</div>
            <div className="text-xs text-f-t2 leading-7 bg-f-surface border border-f-border rounded-md px-3.5 py-3">
              {submittedPrompt || '(사건 개요 없음)'}
            </div>
          </div>

          {/* 2. 분석 환경 */}
          <div>
            <div className="text-[13px] font-semibold text-f-t1 mb-2.5">2. 분석 환경</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['디스크 이미지', diskImagePath || '(미지정)'],
                ['분석 도구', editablePlan.map(p => p.mcp).filter((v, i, a) => a.indexOf(v) === i).join(', ')],
                ['분석 단계', `${editablePlan.length}단계`],
              ].map(([k, v]) => (
                <div key={k} className="bg-f-surface border border-f-border rounded-[5px] px-3 py-2">
                  <div className="text-[10px] text-f-t4 mb-0.5">{k}</div>
                  <div className="text-[11px] font-mono text-f-t2">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. 요약 */}
          {summary && (
            <div>
              <div className="text-[13px] font-semibold text-f-t1 mb-2.5">3. 분석 요약</div>
              <div className="text-xs text-f-t2 leading-7 bg-f-surface border border-f-border rounded-md px-3.5 py-3 whitespace-pre-wrap">
                {summary}
              </div>
            </div>
          )}

          {/* 4. 단계별 결과 */}
          <div>
            <div className="text-[13px] font-semibold text-f-t1 mb-2.5">
              {summary ? '4' : '3'}. 분석 단계별 결과
            </div>
            {editablePlan.map((item, i) => {
              const r = results[i];
              const isSuccess = r?.status === 'success';
              return (
                <div key={item.step} className="flex gap-3 mb-2.5">
                  <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                    isSuccess
                      ? 'bg-green-50 border border-green-200 text-f-success'
                      : r?.status === 'error'
                        ? 'bg-red-50 border border-red-200 text-f-danger'
                        : 'bg-gray-50 border border-gray-200 text-f-t3'
                  }`}>
                    {item.step}
                  </div>
                  <div className="flex-1 bg-f-surface border border-f-border rounded-[5px] px-3 py-2.5">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-semibold text-f-t1">{item.name}</span>
                      <span className="text-[10px] font-mono text-f-accent bg-blue-50 px-1.5 py-[2px] rounded">{item.mcp}</span>
                    </div>
                    <span className="text-[11px] text-f-t3">
                      {r?.output
                        ? (r.output.length > 150 ? r.output.slice(0, 150) + '...' : r.output)
                        : '(결과 없음)'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 5. 전체 보고서 */}
          {report && (
            <div>
              <div className="text-[13px] font-semibold text-f-t1 mb-2.5">
                {summary ? '5' : '4'}. 상세 보고서
              </div>
              <div className="text-xs text-f-t2 leading-7 bg-f-surface border border-f-border rounded-md px-3.5 py-3 whitespace-pre-wrap">
                {report}
              </div>
            </div>
          )}

          <div className="text-[11px] text-f-t4 text-center pt-2 border-t border-f-border">
            본 보고서는 Forensic AI Agent에 의해 자동 생성되었습니다.
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-f-border flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="h-[30px] px-3.5 bg-f-surface2 border border-f-border2 rounded text-f-t2 text-[11px] cursor-pointer hover:bg-f-border transition-colors"
          >
            닫기
          </button>
          <button
            onClick={handleDownload}
            className="h-[30px] px-3.5 bg-f-accent border-none rounded text-white text-[11px] font-medium cursor-pointer flex items-center gap-1 hover:bg-blue-700 transition-colors"
          >
            <Download size={12} /> 보고서 다운로드
          </button>
        </div>
      </div>
    </div>
  );
}

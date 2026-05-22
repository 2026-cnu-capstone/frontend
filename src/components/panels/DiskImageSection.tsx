'use client';

import { AlertTriangle, Check, ChevronRight, HardDrive, RefreshCcw } from 'lucide-react';
import MetaBlock from '../common/MetaBlock';
import { useWorkflowContext } from '@/contexts/WorkflowContext';

/** 입력값이 절대 경로 형태인지(POSIX 또는 Windows) 간단 검증. */
function isAbsolutePath(p: string): boolean {
  const v = p.trim();
  if (!v) return false;
  // POSIX 절대 경로
  if (v.startsWith('/')) return true;
  // Windows 절대 경로 (C:\, D:/ 등)
  if (/^[A-Za-z]:[\\/]/.test(v)) return true;
  return false;
}

export default function DiskImageSection() {
  const {
    workflowState,
    diskImagePath,
    setDiskImagePath,
    diskImageCheck,
    diskImageReady,
    pathStepDone,
    setPathStepDone,
  } = useWorkflowContext();

  const isEditable = workflowState === 'idle';
  const trimmed = diskImagePath.trim();
  const isAbs = isAbsolutePath(diskImagePath);
  const canProceed = isAbs && diskImageReady;

  return (
    <div className="px-3.5 pt-3.5">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-1 h-1 rounded-full bg-f-border2" aria-hidden />
        <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-f-t4">
          디스크 이미지
        </p>
      </div>

      {/* ① 입력 단계 — 절대 경로 직접 등록 */}
      {isEditable && !pathStepDone && (
        <div className="bg-f-surface border border-f-border rounded-[8px] px-3 py-2.5 mb-3 shadow-flat">
          {/* 안내 헤더 */}
          <div className="flex items-center gap-1.5 mb-2">
            <HardDrive size={12} className="text-f-t3" />
            <p className="text-[11px] font-medium text-f-t2">
              디스크 이미지의 <span className="text-f-accent">절대 경로</span>를 등록해주세요
            </p>
          </div>

          <input
            type="text"
            value={diskImagePath}
            onChange={e => setDiskImagePath(e.target.value)}
            placeholder="/evidence/case01/disk.E01"
            className={`w-full h-8 bg-f-bg border rounded-[6px] px-2 text-[11px] text-f-t1 outline-none font-mono focus:bg-f-surface transition-colors
              ${
                trimmed && !canProceed
                  ? 'border-f-danger focus:border-f-danger'
                  : 'border-f-border focus:border-f-t2'
              }`}
          />

          {/* 검증 메시지 */}
          {trimmed && (
            <div
              className={`mt-1.5 text-[10px] flex items-center gap-1 ${
                canProceed ? 'text-f-success' : 'text-f-danger'
              }`}
            >
              {canProceed ? <Check size={11} /> : <AlertTriangle size={11} />}
              {!isAbs
                ? '절대 경로로 입력해주세요 (예: /evidence/... 또는 C:\\evidence\\...)'
                : diskImageReady
                  ? diskImageCheck.format
                  : diskImageCheck.error}
            </div>
          )}

          <MetaBlock path={diskImagePath} check={diskImageCheck} />

          <button
            type="button"
            disabled={!canProceed}
            onClick={() => setPathStepDone(true)}
            className={`mt-2.5 w-full h-[30px] border-0 rounded-[6px] text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors
              ${
                canProceed
                  ? 'bg-f-invert-bg text-f-invert-fg cursor-pointer hover:bg-f-invert-bg-hover shadow-flat'
                  : 'bg-f-surface2 text-f-t4 cursor-default'
              }`}
          >
            <ChevronRight size={13} /> 다음
          </button>
        </div>
      )}

      {/* ② 확정 상태 — 컴팩트 카드 + 변경 */}
      {isEditable && pathStepDone && (
        <div className="mb-3">
          <div className="bg-f-surface border border-f-border rounded-[8px] px-2.5 py-2 flex items-center gap-2 shadow-flat">
            <HardDrive size={12} className="text-f-t3 shrink-0" />
            <span
              className="flex-1 text-[11px] font-mono text-f-t2 overflow-hidden text-ellipsis whitespace-nowrap"
              title={diskImagePath}
            >
              {diskImagePath}
            </span>
            <span className="text-[10px] text-f-t4 font-mono">{diskImageCheck.format}</span>
            <button
              type="button"
              onClick={() => setPathStepDone(false)}
              className="shrink-0 h-[24px] px-2 bg-f-bg border border-f-border rounded-[4px] text-[10px] text-f-t3 cursor-pointer hover:bg-f-surface2 hover:border-f-border2 inline-flex items-center gap-1 transition-colors"
            >
              <RefreshCcw size={10} />
              변경
            </button>
          </div>
          <MetaBlock path={diskImagePath} check={diskImageCheck} />
        </div>
      )}

      {/* ③ 워크플로 진행 중 — 읽기 전용 */}
      {!isEditable && (
        <div className="mb-3">
          <div
            className="bg-f-surface border border-f-border rounded-[8px] px-2.5 py-2 text-[11px] font-mono text-f-t2 overflow-hidden text-ellipsis whitespace-nowrap shadow-flat"
            title={diskImagePath}
          >
            {diskImagePath}
          </div>
          {diskImageReady && <MetaBlock path={diskImagePath} check={diskImageCheck} />}
        </div>
      )}
    </div>
  );
}

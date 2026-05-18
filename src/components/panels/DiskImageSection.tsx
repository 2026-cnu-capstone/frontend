'use client';

import { AlertTriangle, Check, ChevronRight } from 'lucide-react';
import MetaBlock from '../common/MetaBlock';
import { useWorkflowContext } from '@/contexts/WorkflowContext';

export default function DiskImageSection() {
  const {
    workflowState, diskImagePath, setDiskImagePath, diskImageCheck, diskImageReady,
    pathStepDone, setPathStepDone,
  } = useWorkflowContext();

  return (
    <div className="px-3.5 pt-3.5">
      <p className="text-[10px] font-bold tracking-widest uppercase text-f-t4 mb-2">디스크 이미지</p>

      {workflowState === 'idle' && !pathStepDone && (
        <div className="bg-f-surface2 border border-f-border rounded-md px-3 py-2.5 mb-3">
          <input
            type="text"
            value={diskImagePath}
            onChange={e => setDiskImagePath(e.target.value)}
            placeholder="/evidence/case01/disk.E01"
            className={`w-full h-8 bg-f-surface border rounded-[5px] px-2 text-[11px] text-f-t1 outline-none font-mono focus:border-f-accent
              ${diskImagePath && !diskImageReady ? 'border-f-danger' : 'border-f-border'}`}
          />
          {diskImagePath.trim() && (
            <div className={`mt-1.5 text-[10px] flex items-center gap-1 ${diskImageReady ? 'text-f-success' : 'text-f-danger'}`}>
              {diskImageReady ? <Check size={11} /> : <AlertTriangle size={11} />}
              {diskImageReady ? diskImageCheck.format : diskImageCheck.error}
            </div>
          )}
          <MetaBlock path={diskImagePath} check={diskImageCheck} />
          <button
            type="button"
            disabled={!diskImageReady}
            onClick={() => setPathStepDone(true)}
            className={`mt-2.5 w-full h-[30px] border-none rounded-[5px] text-white text-[11px] font-medium flex items-center justify-center gap-1.5
              ${diskImageReady ? 'bg-f-accent cursor-pointer hover:bg-blue-700' : 'bg-f-border2 cursor-default'}`}
          >
            <ChevronRight size={14} /> 다음
          </button>
        </div>
      )}

      {workflowState === 'idle' && pathStepDone && (
        <div className="mb-3">
          <div className="bg-f-surface2 border border-f-border rounded-md px-2.5 py-2 flex items-center gap-2">
            <span className="flex-1 text-[11px] font-mono text-f-t2 overflow-hidden text-ellipsis whitespace-nowrap" title={diskImagePath}>
              {diskImagePath}
            </span>
            <span className="text-[10px] text-f-t4 font-mono">{diskImageCheck.format}</span>
            <button
              type="button"
              onClick={() => setPathStepDone(false)}
              className="shrink-0 h-[26px] px-2 bg-f-surface border border-f-border2 rounded text-[10px] text-f-t3 cursor-pointer hover:bg-f-surface2 transition-colors"
            >
              변경
            </button>
          </div>
          <MetaBlock path={diskImagePath} check={diskImageCheck} />
        </div>
      )}

      {workflowState !== 'idle' && (
        <div className="mb-3">
          <div className="bg-f-surface2 border border-f-border rounded-md px-2.5 py-2 text-[11px] font-mono text-f-t2 overflow-hidden text-ellipsis whitespace-nowrap" title={diskImagePath}>
            {diskImagePath}
          </div>
          {diskImageReady && <MetaBlock path={diskImagePath} check={diskImageCheck} />}
        </div>
      )}
    </div>
  );
}

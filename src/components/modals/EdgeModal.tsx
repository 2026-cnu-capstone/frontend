'use client';

import { X, ChevronRight } from 'lucide-react';
import type { SelectedEdge, PlanStep } from '@/types';

interface Props {
  selectedEdge: SelectedEdge;
  editablePlan: PlanStep[];
  onClose: () => void;
}

export default function EdgeModal({ selectedEdge, editablePlan, onClose }: Props) {
  const { idx, clientX, clientY } = selectedEdge;
  const src = editablePlan[idx];
  const dst = editablePlan[idx + 1];
  const edgeLabel = src?.edgeLabel ?? '';

  const mw = 480, mh = 200;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const top = Math.min(clientY + 14, vh - mh - 10);
  const left = Math.min(clientX - mw / 2, vw - mw - 10);

  return (
    <div className="fixed inset-0 z-[200]" onClick={onClose}>
      <div
        className="absolute bg-f-surface border border-f-border rounded-lg shadow-2xl overflow-hidden"
        style={{ top, left, width: mw }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-3 py-2 border-b border-f-border flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="font-semibold text-f-t1">{src?.name ?? '-'}</span>
            <ChevronRight size={12} className="text-f-t4" />
            <span className="font-semibold text-f-t1">{dst?.name ?? '-'}</span>
            <span className="text-[9px] text-f-t4 ml-1">데이터 흐름</span>
          </div>
          <button
            onClick={onClose}
            className="w-5 h-5 border-none bg-f-surface2 rounded cursor-pointer flex items-center justify-center text-f-t4 hover:text-f-t2 p-0 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
        <div className="px-3 py-3">
          <div className="text-[9px] font-bold text-f-t4 tracking-wider mb-1.5">전달 인자</div>
          {edgeLabel ? (
            <div className="bg-f-surface2 border border-f-border rounded px-2.5 py-2 font-mono text-[11px] text-f-t2 break-words">
              {edgeLabel}
            </div>
          ) : (
            <div className="text-[11px] text-f-t4 italic">에이전트 응답에 엣지 라벨 정보가 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}

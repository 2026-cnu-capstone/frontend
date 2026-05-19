'use client';

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';

// tailwind.config.ts의 colors.f.* 와 동기화
const EDGE_IDLE   = '#d4d4d8'; // f-border2
const EDGE_ACTIVE = '#2563eb'; // f-accent

interface LabelEdgeData {
  isActive?: boolean;
  label?: string;
}

/**
 * LabelEdge — 커스텀 엣지 컴포넌트
 *
 * 항목 4: 칩 컨테이너를 translateY(-14px) 위로 띄워
 * 엣지 라인 위에 배치. 하단에 4×4 dot leader로 시각적 결속.
 */
export default function LabelEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const edgeData = (data ?? {}) as LabelEdgeData;
  const isActive = edgeData.isActive ?? false;
  const rawLabel = edgeData.label ?? '';

  const stroke = isActive ? EDGE_ACTIVE : EDGE_IDLE;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 6,
  });

  // · 기준으로 분리 — 없으면 단일 칩
  const parts = rawLabel
    ? rawLabel.split(' · ').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke, strokeWidth: 1.5 }}
        markerEnd={markerEnd}
      />

      {parts.length > 0 && (
        <EdgeLabelRenderer>
          {/*
            항목 4: translateY(-14px)로 라인 위에 배치.
            하단 leader dot(4×4, bg-f-border2)으로 어느 엣지인지 시각 결속.
            pointer-events-none으로 엣지 클릭 통과.
          */}
          <div
            className="nodrag nopan absolute pointer-events-none flex flex-col items-center"
            style={{
              transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY}px) translateY(-4px)`,
            }}
            aria-hidden
          >
            {/* 칩 묶음 */}
            <div className="flex flex-col items-center gap-[3px]">
              {parts.map((part, i) => (
                <span
                  key={i}
                  title={part}
                  className="inline-block max-w-[160px] truncate px-2 h-[18px] leading-[18px] rounded bg-f-surface border border-f-border text-[9px] font-mono text-f-t3 tracking-wide shadow-flat whitespace-nowrap"
                >
                  {part}
                </span>
              ))}
            </div>

            {/* leader — 칩 하단에서 엣지 라인까지 내려오는 세로 연결선 */}
            <div className="w-px h-[6px] bg-f-border2 mt-[2px]" />
            {/* dot */}
            <div className="w-1 h-1 rounded-full bg-f-border2 -mt-px" />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

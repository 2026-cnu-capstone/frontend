'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { X, GripVertical, Download } from 'lucide-react';
import type { WorkflowNodeData } from '@/types';
import { downloadTextFile, sanitizeFilename } from '@/lib/utils';

export type WorkflowNodeType = Node<WorkflowNodeData, 'workflowNode'>;

/* ─────────────────────────────────────────────
   DFXML 코드 뷰어
   라이트 톤: bg-f-bg, 태그 → text-f-accent, 텍스트 → text-f-t1
   속성명 (attr="...)은 text-f-t3으로 추가 구분
───────────────────────────────────────────── */
function DFXMLView({ xml }: { xml: string }) {
  const lines = (xml || '').split('\n');

  /** 한 줄을 토큰 배열로 분해: 태그 전체, 그 안의 속성명, 일반 텍스트 */
  const renderLine = (line: string) => {
    // 태그(<...>) 단위로 먼저 분리
    const segments: { text: string; isTag: boolean }[] = [];
    const tagRe = /(<[^>]+>)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = tagRe.exec(line)) !== null) {
      if (m.index > last) segments.push({ text: line.slice(last, m.index), isTag: false });
      segments.push({ text: m[0], isTag: true });
      last = m.index + m[0].length;
    }
    if (last < line.length) segments.push({ text: line.slice(last), isTag: false });

    return segments.map((seg, j) => {
      if (!seg.isTag) {
        return <span key={j} className="text-f-t1">{seg.text}</span>;
      }
      // 태그 내부: 속성명(word=)을 text-f-t3, 나머지를 text-f-accent
      const attrRe = /(\b[\w:-]+=)/g;
      const inner = seg.text;
      const parts: React.ReactNode[] = [];
      let ip = 0;
      let am: RegExpExecArray | null;
      while ((am = attrRe.exec(inner)) !== null) {
        if (am.index > ip) parts.push(<span key={`a${ip}`} className="text-f-accent">{inner.slice(ip, am.index)}</span>);
        parts.push(<span key={`b${am.index}`} className="text-f-t3">{am[0]}</span>);
        ip = am.index + am[0].length;
      }
      if (ip < inner.length) parts.push(<span key={`c${ip}`} className="text-f-accent">{inner.slice(ip)}</span>);
      return <span key={j}>{parts}</span>;
    });
  };

  return (
    <div className="bg-f-bg border border-f-border rounded px-3 py-2 font-mono text-[11px] leading-relaxed overflow-y-auto cp-scroll flex-1 min-h-0">
      {lines.map((line, i) => (
        <div key={i} className="whitespace-pre">
          {renderLine(line)}
        </div>
      ))}
    </div>
  );
}

const MIN_W = 380;
const MIN_H = 300;
const DEFAULT_W = 480;
const DEFAULT_H = 440;

/* ─────────────────────────────────────────────
   DFXML 패널 — 라이트 모노톤 리스킨
   항목 5: ESC 닫기 + 첫 포커스 + role="dialog"
───────────────────────────────────────────── */
function DFXMLPanel({
  dfxml, nodeIdx, tool, caseTitle, onClose,
}: {
  dfxml: WorkflowNodeData['dfxml'];
  nodeIdx: number;
  tool: string;
  caseTitle: string;
  onClose: () => void;
}) {
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const dragRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  const downloadBtnRef = useRef<HTMLButtonElement>(null);

  /* 항목 5: 마운트 시 다운로드 버튼으로 포커스 이동 */
  useEffect(() => {
    downloadBtnRef.current?.focus();
  }, []);

  /* 항목 5: ESC 키로 닫기 */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const canDownload = Boolean(dfxml.xml);

  const handleDownload = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canDownload) return;
    const slug = sanitizeFilename(caseTitle || 'case');
    const toolSlug = sanitizeFilename(tool || 'step');
    downloadTextFile(
      `${slug}_step${nodeIdx + 1}_${toolSlug}_dfxml.xml`,
      dfxml.xml,
      'application/xml;charset=utf-8',
    );
  }, [canDownload, caseTitle, dfxml.xml, nodeIdx, tool]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h };
    const handleMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      setSize({
        w: Math.max(MIN_W, dragRef.current.startW + ev.clientX - dragRef.current.startX),
        h: Math.max(MIN_H, dragRef.current.startH + ev.clientY - dragRef.current.startY),
      });
    };
    const handleUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [size]);

  return (
    /* 항목 1: 라이트 톤 컨테이너 + 항목 5: role="dialog" */
    <div
      role="dialog"
      aria-label="DFXML 데이터"
      aria-modal="false"
      className="bg-f-surface border border-f-border rounded-lg shadow-modal overflow-hidden flex flex-col relative"
      style={{ width: size.w, height: size.h }}
    >
      {/* 헤더 바 — 항목 1 */}
      <div className="px-3 py-2 bg-f-surface2 border-b border-f-border flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-f-t4">
            DFXML
          </span>
          <span className="text-[11px] text-f-t3 truncate max-w-[220px]" title={dfxml.name}>
            {dfxml.name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* 추출 버튼 */}
          <button
            ref={downloadBtnRef}
            type="button"
            onMouseDown={e => e.stopPropagation()}
            onClick={handleDownload}
            disabled={!canDownload}
            aria-label="DFXML 추출"
            title={canDownload ? 'DFXML 추출' : 'DFXML 데이터 없음'}
            className="h-6 px-2 flex items-center gap-1 text-[10px] font-medium text-f-t3 hover:text-f-accent hover:bg-f-surface rounded border-none bg-transparent cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:text-f-t4 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f-accent"
          >
            <Download size={11} />
            <span>추출</span>
          </button>
          {/* 닫기 버튼 */}
          <button
            type="button"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onClose(); }}
            aria-label="DFXML 패널 닫기"
            className="w-6 h-6 flex items-center justify-center text-f-t3 hover:text-f-accent hover:bg-f-surface rounded border-none bg-transparent cursor-pointer p-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f-accent"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* 코드 뷰 — 항목 1 */}
      <div className="flex-1 p-3 flex flex-col min-h-0">
        <DFXMLView xml={dfxml.xml} />
      </div>

      {/* 리사이즈 그립 — 항목 1 라이트 톤 */}
      <div
        className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-center justify-center text-f-t4 hover:text-f-t3 transition-colors"
        onMouseDown={handleResizeStart}
        aria-hidden
      >
        <GripVertical size={10} className="rotate-[-45deg]" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   상태별 스타일 맵
───────────────────────────────────────────── */
const STATUS_MAP = {
  approved: {
    accentStrip: 'bg-f-success',
    badgeCls: 'bg-green-50 border-green-200 text-f-success',
    label: '승인됨',
  },
  running: {
    accentStrip: 'bg-f-accent',
    badgeCls: 'bg-f-accent-light border-blue-200 text-f-accent',
    label: '실행중',
  },
  done: {
    accentStrip: 'bg-f-border2',
    badgeCls: 'bg-f-surface2 border-f-border2 text-f-t3',
    label: '완료',
  },
  idle: {
    accentStrip: 'bg-f-border',
    badgeCls: 'bg-f-surface2 border-f-border text-f-t4',
    label: '대기',
  },
} as const;

/* ─────────────────────────────────────────────
   WorkflowNode — 메인 컴포넌트
   항목 6: dragging prop → scale + shadow 피드백
───────────────────────────────────────────── */
export default function WorkflowNode({ data, dragging }: NodeProps<WorkflowNodeType>) {
  const { title, tool, nodeStatus, nodeIdx, isSelected, dfxml, caseTitle, onSelect } = data;
  const s = STATUS_MAP[nodeStatus as keyof typeof STATUS_MAP] ?? STATUS_MAP.idle;

  return (
    <div
      className={[
        'relative bg-f-surface rounded-lg border overflow-visible cursor-pointer',
        'w-[200px]',
        /* 항목 6: 드래그 중 scale + 강한 그림자, 비드래그 호버와 명확 구분 */
        dragging
          ? 'border-f-border2 shadow-modal scale-[1.03] rotate-[0.5deg]'
          : isSelected
            ? 'border-f-accent shadow-modal ring-2 ring-f-accent ring-offset-2 ring-offset-f-bg'
            : 'border-f-border shadow-flat hover:border-f-border2 hover:shadow-modal',
        'transition-all duration-150',
      ].join(' ')}
    >
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      {/* 좌측 상태 accent strip */}
      <div
        className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-sm ${s.accentStrip}`}
        aria-hidden
      />

      {/* 헤더: 스텝 번호 + 타이틀 + 상태 칩 */}
      <div className="pl-4 pr-2.5 pt-2.5 pb-2 border-b border-f-border flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[9px] font-mono text-f-t4 tabular-nums shrink-0 leading-none mt-[1px]">
            {String(nodeIdx + 1).padStart(2, '0')}
          </span>
          <span className="text-[13px] font-semibold text-f-t1 leading-snug truncate" title={title}>
            {title}
          </span>
        </div>
        <span
          className={[
            'shrink-0 inline-flex items-center h-[18px] px-1.5 rounded border',
            'text-[9px] font-medium tracking-wide leading-none',
            s.badgeCls,
          ].join(' ')}
        >
          {s.label}
        </span>
      </div>

      {/* 본문: MCP 도구명 */}
      <div className="pl-4 pr-2.5 py-2">
        <span className="text-[10px] font-mono text-f-t4 tracking-wide">{tool}</span>
      </div>

      {/* 실행 중 진행 바 */}
      {nodeStatus === 'running' && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-f-surface2 rounded-b-lg overflow-hidden">
          <div className="h-full w-3/5 bg-f-accent rounded-b-lg" />
        </div>
      )}

      {dfxml && (
        <NodeToolbar isVisible={isSelected} position={Position.Bottom} offset={8}>
          <DFXMLPanel
            dfxml={dfxml}
            nodeIdx={nodeIdx}
            tool={tool}
            caseTitle={caseTitle}
            onClose={() => onSelect(nodeIdx)}
          />
        </NodeToolbar>
      )}
    </div>
  );
}

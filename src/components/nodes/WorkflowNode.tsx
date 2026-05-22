'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { X, GripVertical, Download, FileCode2, Info } from 'lucide-react';
import type { StepRun, WorkflowNodeData } from '@/types';
import { downloadTextFile, sanitizeFilename } from '@/lib/utils';

export type WorkflowNodeType = Node<WorkflowNodeData, 'workflowNode'>;

/** 실행 결과 status 문자열 → 시각 표현 */
function statusDisplay(status?: string): { dot: string; text: string; label: string } {
  const s = (status ?? '').toLowerCase();
  if (s === 'success' || s === 'done' || s === 'completed') return { dot: 'bg-f-success', text: 'text-f-t2', label: '성공' };
  if (s === 'error' || s === 'failed')                       return { dot: 'bg-f-danger',  text: 'text-f-t2', label: '오류' };
  if (s === 'running')                                       return { dot: 'bg-f-accent',  text: 'text-f-t2', label: '실행 중' };
  if (!status)                                               return { dot: 'bg-f-border2', text: 'text-f-t4', label: '대기' };
  return { dot: 'bg-f-border2', text: 'text-f-t3', label: status };
}

function formatElapsed(run?: StepRun): string | null {
  if (!run) return null;
  if (run.elapsed) return run.elapsed;
  if (run.elapsedMs != null) {
    const s = Math.round(run.elapsedMs / 100) / 10;
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
  }
  return null;
}

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
   노드 상세 패널 — 개요 + DFXML 탭
   ESC 닫기 + 첫 포커스 + role="dialog"
───────────────────────────────────────────── */
type TabKey = 'overview' | 'dfxml';

function NodeDetailPanel({
  dfxml, nodeIdx, tool, caseTitle, title, purpose, hints, run, onClose,
}: {
  dfxml: WorkflowNodeData['dfxml'];
  nodeIdx: number;
  tool: string;
  caseTitle: string;
  title: string;
  purpose?: string;
  hints?: string;
  run?: StepRun;
  onClose: () => void;
}) {
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const [tab, setTab] = useState<TabKey>('overview');
  const dragRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

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

  const TabButton = ({ value, label, icon }: { value: TabKey; label: string; icon: React.ReactNode }) => {
    const active = tab === value;
    return (
      <button
        type="button"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); setTab(value); }}
        className={[
          'h-7 px-2.5 flex items-center gap-1.5 text-[11px] font-medium border-0 bg-transparent cursor-pointer transition-colors',
          'border-b-[2px] -mb-px',
          active
            ? 'text-f-t1 border-f-t2'
            : 'text-f-t4 border-transparent hover:text-f-t2',
        ].join(' ')}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <div
      role="dialog"
      aria-label="노드 상세"
      aria-modal="false"
      className="bg-f-surface border border-f-border rounded-[8px] shadow-modal overflow-hidden flex flex-col relative"
      style={{ width: size.w, height: size.h }}
    >
      {/* 헤더 바 */}
      <div className="px-3 py-2 bg-f-surface border-b border-f-border flex justify-between items-center shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[9.5px] font-mono font-semibold text-f-t3 tabular-nums shrink-0 bg-f-surface2 px-1.5 h-5 rounded-[4px] inline-flex items-center">
            {String(nodeIdx + 1).padStart(2, '0')}
          </span>
          <span className="text-[12px] font-semibold text-f-t1 truncate tracking-[-0.005em]" title={title}>
            {title}
          </span>
        </div>
        <button
          ref={closeBtnRef}
          type="button"
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onClose(); }}
          aria-label="패널 닫기"
          className="w-6 h-6 flex items-center justify-center text-f-t3 hover:text-f-t1 hover:bg-f-surface2 rounded-[4px] border-none bg-transparent cursor-pointer p-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f-accent shrink-0"
        >
          <X size={13} />
        </button>
      </div>

      {/* 탭 바 */}
      <div className="px-3 flex items-center justify-between gap-2 bg-f-surface border-b border-f-border shrink-0">
        <div className="flex items-center gap-1">
          <TabButton value="overview" label="개요"  icon={<Info size={11} />} />
          <TabButton value="dfxml"    label="DFXML" icon={<FileCode2 size={11} />} />
        </div>
        {tab === 'dfxml' && (
          <button
            type="button"
            onMouseDown={e => e.stopPropagation()}
            onClick={handleDownload}
            disabled={!canDownload}
            aria-label="DFXML 추출"
            title={canDownload ? 'DFXML 추출' : 'DFXML 데이터 없음'}
            className="h-6 px-2 flex items-center gap-1 text-[10px] font-medium text-f-t3 hover:text-f-t1 hover:bg-f-surface2 rounded-[4px] border-none bg-transparent cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-f-t4 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f-accent"
          >
            <Download size={10} />
            <span>추출</span>
          </button>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 p-3 flex flex-col min-h-0">
        {tab === 'overview' ? (
          <OverviewTab tool={tool} purpose={purpose} hints={hints} run={run} hasDfxml={canDownload} />
        ) : (
          <DFXMLView xml={dfxml.xml} />
        )}
      </div>

      {/* 리사이즈 그립 */}
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
   개요 탭 — 단계 메타·실행 결과 요약
───────────────────────────────────────────── */
function OverviewTab({
  tool, purpose, hints, run, hasDfxml,
}: {
  tool: string;
  purpose?: string;
  hints?: string;
  run?: StepRun;
  hasDfxml: boolean;
}) {
  const status = statusDisplay(run?.status);
  const elapsed = formatElapsed(run);
  const hasRun = Boolean(run && (run.status || run.output || run.agentName || elapsed));

  return (
    <div className="flex flex-col gap-3 overflow-y-auto cp-scroll min-h-0 -mr-1 pr-1">
      {/* 메타 그리드 */}
      <section>
        <div className="text-[9.5px] font-semibold tracking-[0.12em] uppercase text-f-t4 mb-1.5">
          단계 메타
        </div>
        <dl className="bg-f-bg border border-f-border rounded-[6px] divide-y divide-f-border overflow-hidden">
          <MetaRow label="MCP" value={tool} mono />
          {run?.agentName && <MetaRow label="에이전트" value={run.agentName} mono />}
          <MetaRow
            label="DFXML"
            valueNode={
              <span className="flex items-center gap-1.5">
                <span className={`w-1 h-1 rounded-full ${hasDfxml ? 'bg-f-success' : 'bg-f-border2'}`} />
                <span className={hasDfxml ? 'text-f-t2' : 'text-f-t4'}>
                  {hasDfxml ? '사용 가능' : '없음'}
                </span>
              </span>
            }
          />
        </dl>
      </section>

      {/* 분석 목적 */}
      {purpose && (
        <section>
          <div className="text-[9.5px] font-semibold tracking-[0.12em] uppercase text-f-t4 mb-1.5">
            분석 목적
          </div>
          <div className="text-[11.5px] text-f-t2 leading-relaxed bg-f-bg border border-f-border rounded-[6px] px-2.5 py-2 whitespace-pre-wrap">
            {purpose}
          </div>
        </section>
      )}

      {/* 힌트 */}
      {hints && (
        <section>
          <div className="text-[9.5px] font-semibold tracking-[0.12em] uppercase text-f-t4 mb-1.5">
            힌트
          </div>
          <div className="text-[11.5px] text-f-t2 leading-relaxed bg-f-bg border border-f-border rounded-[6px] px-2.5 py-2 whitespace-pre-wrap">
            {hints}
          </div>
        </section>
      )}

      {/* 실행 결과 */}
      {hasRun && (
        <section>
          <div className="text-[9.5px] font-semibold tracking-[0.12em] uppercase text-f-t4 mb-1.5">
            실행 결과
          </div>
          <div className="bg-f-bg border border-f-border rounded-[6px] overflow-hidden">
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-f-border bg-f-surface">
              <span className="inline-flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                <span className={`text-[10.5px] font-medium ${status.text}`}>{status.label}</span>
              </span>
              {elapsed && (
                <span className="text-[10px] font-mono text-f-t4 tabular-nums">{elapsed}</span>
              )}
            </div>
            {run?.output ? (
              <pre className="m-0 px-2.5 py-2 text-[11px] font-mono text-f-t2 leading-relaxed whitespace-pre-wrap break-words max-h-[160px] overflow-y-auto cp-scroll">
                {run.output}
              </pre>
            ) : (
              <div className="px-2.5 py-2 text-[11px] text-f-t4 italic">출력 없음</div>
            )}
          </div>
        </section>
      )}

      {!purpose && !hints && !hasRun && (
        <div className="text-[11px] text-f-t4 bg-f-bg border border-f-border rounded-[6px] px-2.5 py-3 text-center">
          이 단계에 대한 추가 정보가 아직 없습니다
        </div>
      )}
    </div>
  );
}

function MetaRow({
  label, value, valueNode, mono,
}: {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[80px_1fr] gap-2 px-2.5 py-1.5 text-[11px]">
      <dt className="text-f-t4 font-medium tracking-wider uppercase text-[9.5px] self-center">{label}</dt>
      <dd className={`text-f-t2 truncate ${mono ? 'font-mono' : ''}`} title={value}>
        {valueNode ?? value}
      </dd>
    </div>
  );
}

/* ─────────────────────────────────────────────
   상태별 스타일 맵 — Linear 톤 (dot + label)
───────────────────────────────────────────── */
const STATUS_MAP = {
  approved: {
    accentStrip: 'bg-f-success',
    dot:         'bg-f-success',
    badgeText:   'text-f-t2',
    label: '승인됨',
    pulse: false,
  },
  running: {
    accentStrip: 'bg-f-accent',
    dot:         'bg-f-accent',
    badgeText:   'text-f-t2',
    label: '실행중',
    pulse: true,
  },
  done: {
    accentStrip: 'bg-f-border2',
    dot:         'bg-f-t3',
    badgeText:   'text-f-t3',
    label: '완료',
    pulse: false,
  },
  idle: {
    accentStrip: 'bg-f-border',
    dot:         'bg-f-border2',
    badgeText:   'text-f-t4',
    label: '대기',
    pulse: false,
  },
} as const;

/* ─────────────────────────────────────────────
   WorkflowNode — 메인 컴포넌트
   항목 6: dragging prop → scale + shadow 피드백
───────────────────────────────────────────── */
export default function WorkflowNode({ data, dragging }: NodeProps<WorkflowNodeType>) {
  const { title, tool, nodeStatus, nodeIdx, isSelected, dfxml, caseTitle, onSelect, purpose, hints, run } = data;
  const s = STATUS_MAP[nodeStatus as keyof typeof STATUS_MAP] ?? STATUS_MAP.idle;
  const isRunning = nodeStatus === 'running';

  return (
    <div
      className={[
        'group relative bg-f-surface rounded-[10px] border overflow-hidden cursor-pointer',
        'w-[256px]',
        /* 드래그/선택/실행/기본 상태별 시각 피드백 */
        dragging
          ? 'border-f-border2 shadow-modal scale-[1.02] rotate-[0.4deg]'
          : isSelected
            ? 'border-f-t2 shadow-modal ring-2 ring-f-t2/15 dark:ring-f-t1/25'
            : isRunning
              ? 'border-f-accent/50 shadow-popover ring-2 ring-f-accent/15 dark:ring-f-accent/25'
              : 'border-f-border shadow-flat hover:border-f-border2 hover:shadow-popover',
        'transition-[box-shadow,border-color,transform] duration-150',
      ].join(' ')}
    >
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      {/* 좌측 상태 accent strip */}
      <div
        className={`absolute left-0 top-2 bottom-2 w-[3.5px] rounded-r-[3px] ${s.accentStrip}`}
        aria-hidden
      />

      <div className="pl-3.5 pr-2.5 pt-2.5 pb-2.5">
        {/* 1행: 제목 + 상태 pill */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div
            className="text-[13px] font-semibold text-f-t1 leading-tight truncate tracking-[-0.005em] min-w-0"
            title={title}
          >
            {title}
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 h-[20px] pl-1.5 pr-2 rounded-full bg-f-surface2 border border-f-border">
            <span className="relative flex items-center justify-center">
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.pulse && (
                <span className={`absolute inset-0 w-1.5 h-1.5 rounded-full ${s.dot} animate-ping opacity-60`} />
              )}
            </span>
            <span className={`text-[9.5px] font-medium tracking-wide leading-none ${s.badgeText}`}>
              {s.label}
            </span>
          </span>
        </div>

        {/* 2행: Step 번호 · MCP 도구명 (모노 보조정보) */}
        <div className="flex items-center gap-1.5 text-[10.5px] font-mono min-w-0">
          <span className="text-f-t4 font-semibold tabular-nums shrink-0">
            {String(nodeIdx + 1).padStart(2, '0')}
          </span>
          <span className="text-f-border2 shrink-0" aria-hidden>·</span>
          <span className="text-f-t3 font-medium truncate" title={tool}>{tool}</span>
        </div>
      </div>

      {/* 실행 중 진행 바 — 인디터미네이트 그라디언트 */}
      {isRunning && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-f-surface2 overflow-hidden">
          <div className="h-full w-2/5 bg-gradient-to-r from-transparent via-f-accent to-transparent animate-[pulse_1.4s_ease-in-out_infinite]" style={{ marginLeft: '20%' }} />
        </div>
      )}

      <NodeToolbar isVisible={isSelected} position={Position.Bottom} offset={8}>
        <NodeDetailPanel
          dfxml={dfxml ?? { name: title, xml: '' }}
          nodeIdx={nodeIdx}
          tool={tool}
          caseTitle={caseTitle}
          title={title}
          purpose={purpose}
          hints={hints}
          run={run}
          onClose={() => onSelect(nodeIdx)}
        />
      </NodeToolbar>
    </div>
  );
}

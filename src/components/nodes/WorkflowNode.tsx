'use client';

import { useState, useCallback, useRef } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { X, GripVertical } from 'lucide-react';
import type { WorkflowNodeData } from '@/types';

export type WorkflowNodeType = Node<WorkflowNodeData, 'workflowNode'>;

function DFXMLView({ xml }: { xml: string }) {
  const lines = (xml || '').split('\n');
  const renderLine = (line: string) => {
    const tokens: { text: string; isTag: boolean }[] = [];
    const re = /(<[^>]+>)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) tokens.push({ text: line.slice(last, m.index), isTag: false });
      tokens.push({ text: m[0], isTag: true });
      last = m.index + m[0].length;
    }
    if (last < line.length) tokens.push({ text: line.slice(last), isTag: false });
    return tokens;
  };
  return (
    <div className="bg-slate-950 rounded px-3 py-2 font-mono text-[11px] leading-relaxed overflow-y-auto cp-scroll flex-1 min-h-0">
      {lines.map((line, i) => (
        <div key={i} className="whitespace-pre">
          {renderLine(line).map((tok, j) => (
            <span key={j} className={tok.isTag ? 'text-sky-300' : 'text-slate-200'}>{tok.text}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

const MIN_W = 380;
const MIN_H = 300;
const DEFAULT_W = 480;
const DEFAULT_H = 440;

function DFXMLPanel({ dfxml, onClose }: { dfxml: WorkflowNodeData['dfxml']; onClose: () => void }) {
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const dragRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h };

    const handleMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dw = ev.clientX - dragRef.current.startX;
      const dh = ev.clientY - dragRef.current.startY;
      setSize({
        w: Math.max(MIN_W, dragRef.current.startW + dw),
        h: Math.max(MIN_H, dragRef.current.startH + dh),
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
    <div
      className="bg-slate-900 border border-slate-600 rounded-lg shadow-2xl overflow-hidden flex flex-col"
      style={{ width: size.w, height: size.h }}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-slate-800 flex justify-between items-center shrink-0 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-sky-400 tracking-wider">DFXML</span>
          <span className="text-[10px] text-slate-500">{dfxml.name}</span>
        </div>
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onClose(); }}
          className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-slate-700 rounded border-none bg-transparent cursor-pointer p-0 transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 flex flex-col min-h-0">
        <DFXMLView xml={dfxml.xml} />
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-center justify-center text-slate-600 hover:text-slate-400 transition-colors"
        onMouseDown={handleResizeStart}
      >
        <GripVertical size={10} className="rotate-[-45deg]" />
      </div>
    </div>
  );
}

export default function WorkflowNode({ data }: NodeProps<WorkflowNodeType>) {
  const { title, tool, nodeStatus, nodeIdx, isSelected, dfxml, onSelect } = data;

  const statusStyles = {
    approved: { dot: 'bg-amber-500', border: 'border-amber-500 border-dashed', badgeBg: 'bg-amber-50 text-amber-600', label: '승인됨' },
    running: { dot: 'bg-blue-600 animate-pulse', border: 'border-blue-600', badgeBg: 'bg-blue-50 text-blue-700', label: '실행중' },
    done: { dot: 'bg-green-600', border: 'border-green-600', badgeBg: 'bg-green-50 text-green-700', label: '완료' },
    idle: { dot: 'bg-gray-400', border: 'border-gray-200', badgeBg: 'bg-gray-100 text-gray-500', label: '대기' },
  } as const;
  const s = statusStyles[nodeStatus as keyof typeof statusStyles] ?? statusStyles.idle;

  return (
    <div
      className={`bg-white rounded-md overflow-visible shadow-sm cursor-pointer transition-shadow w-[180px]
        ${isSelected ? 'ring-2 ring-blue-600 shadow-[0_0_0_3px_rgba(37,99,235,0.13)] border-2 border-blue-600' : `border ${s.border}`}`}
    >
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="px-2.5 py-2 border-b border-f-border flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${s.dot} shrink-0`} />
          <span className="text-[12px] font-medium text-f-t1">{title}</span>
        </div>
        <span className={`px-1.5 py-[2px] rounded text-[9px] font-semibold ${s.badgeBg}`}>{s.label}</span>
      </div>
      <div className="px-2.5 py-[7px]">
        <span className="text-[10px] font-mono text-f-t4">{tool}</span>
      </div>
      {nodeStatus === 'running' && (
        <div className="h-0.5 bg-f-surface2">
          <div className="h-full w-3/5 bg-f-accent" />
        </div>
      )}

      {/* NodeToolbar: 노드 외부에 렌더링되어 노드 크기·핸들에 영향 없음 */}
      {dfxml && (
        <NodeToolbar isVisible={isSelected} position={Position.Bottom} offset={8}>
          <DFXMLPanel dfxml={dfxml} onClose={() => onSelect(nodeIdx)} />
        </NodeToolbar>
      )}
    </div>
  );
}

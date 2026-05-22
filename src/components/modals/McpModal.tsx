'use client';

import { X, Check, Search } from 'lucide-react';
import { MCP_TOOLS } from '@/lib/constants';
import type { PlanStep } from '@/types';

interface Props {
  stepIdx: number;
  editablePlan: PlanStep[];
  mcpSearch: string;
  setMcpSearch: (v: string) => void;
  onSelect: (toolName: string) => void;
  onClose: () => void;
}

export default function McpModal({ stepIdx, editablePlan, mcpSearch, setMcpSearch, onSelect, onClose }: Props) {
  const filteredTools = MCP_TOOLS.map(cat => ({
    ...cat,
    tools: cat.tools.filter(t =>
      t.name.toLowerCase().includes(mcpSearch.toLowerCase()) ||
      t.desc.toLowerCase().includes(mcpSearch.toLowerCase())
    ),
  })).filter(cat => cat.tools.length > 0);

  return (
    <div
      className="fixed inset-0 bg-black/35 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-[520px] max-h-[74vh] bg-f-surface rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-4 pt-4 pb-3 border-b border-f-border shrink-0">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-sm font-semibold text-f-t1">MCP 도구 선택</span>
            <button
              onClick={onClose}
              className="w-6 h-6 border-none bg-f-surface2 rounded cursor-pointer flex items-center justify-center text-f-t3 hover:text-f-t1 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-f-t4" />
            <input
              type="text"
              placeholder="도구 이름 또는 기능으로 검색..."
              value={mcpSearch}
              onChange={e => setMcpSearch(e.target.value)}
              autoFocus
              className="w-full h-8 bg-f-surface2 border border-f-border rounded-md pl-7 pr-2.5 text-xs text-f-t1 outline-none focus:border-f-accent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto cp-scroll py-2">
          {filteredTools.length === 0 && (
            <div className="py-6 text-center text-f-t4 text-xs">검색 결과가 없습니다.</div>
          )}
          {filteredTools.map(cat => (
            <div key={cat.category}>
              <div className="px-4 py-1.5 text-[10px] font-bold tracking-wider uppercase text-f-t4">
                {cat.category}
              </div>
              {cat.tools.map(tool => {
                const isSelected = editablePlan[stepIdx]?.mcp === tool.name;
                return (
                  <div
                    key={tool.id}
                    onClick={() => onSelect(tool.name)}
                    className={`flex items-start gap-2.5 px-4 py-2 cursor-pointer transition-colors
                      border-l-[3px] ${isSelected ? 'bg-f-accent-light border-f-accent' : 'bg-transparent border-transparent hover:bg-f-surface2'}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-xs font-medium font-mono ${isSelected ? 'text-f-accent' : 'text-f-t1'}`}>
                          {tool.name}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-semibold text-f-accent bg-blue-50 px-1.5 py-[1px] rounded dark:bg-f-accent-light">현재 선택</span>
                        )}
                      </div>
                      <span className="text-[11px] text-f-t3 leading-snug">{tool.desc}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-f-accent shrink-0 mt-0.5" />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

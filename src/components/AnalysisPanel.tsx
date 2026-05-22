'use client';

import DiskImageSection from './panels/DiskImageSection';
import StrategyThread from './panels/StrategyThread';
import McpPlanThread from './panels/McpPlanThread';
import DoneSummaryPanel from './panels/DoneSummaryPanel';
import ChatInputBar from './panels/ChatInputBar';

export default function AnalysisPanel() {
  return (
    <div className="bg-f-surface flex flex-col min-h-0 shrink-0" style={{ width: '100%', height: '100%' }}>
      {/* 패널 헤더 — 좌측 dot 인디케이터 + 라벨 */}
      <div className="h-12 border-b border-f-border shrink-0 flex items-center px-4 gap-2 bg-f-surface">
        <span className="w-1.5 h-1.5 rounded-full bg-f-accent" aria-hidden />
        <span className="text-[11px] font-semibold tracking-[-0.005em] text-f-t1">
          분석 패널
        </span>
        <span className="ml-auto text-[10px] text-f-t4 font-medium tracking-[0.08em] uppercase">
          Workspace
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 cp-scroll bg-f-bg/30">
        <DiskImageSection />
        <StrategyThread />
        <McpPlanThread />
        <DoneSummaryPanel />
      </div>

      <ChatInputBar />
    </div>
  );
}

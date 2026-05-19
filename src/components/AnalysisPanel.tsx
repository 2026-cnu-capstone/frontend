'use client';

import DiskImageSection from './panels/DiskImageSection';
import StrategyThread from './panels/StrategyThread';
import McpPlanThread from './panels/McpPlanThread';
import DoneSummaryPanel from './panels/DoneSummaryPanel';
import ChatInputBar from './panels/ChatInputBar';

export default function AnalysisPanel() {
  return (
    <div className="bg-f-surface flex flex-col min-h-0 shrink-0" style={{ width: '100%', height: '100%' }}>
      {/* 패널 헤더 — CaseListView 필터 툴바 레이블과 동일한 타이포 */}
      <div className="h-10 border-b border-f-border shrink-0 flex items-center px-4">
        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-f-t4">
          분석 패널
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pb-16 cp-scroll">
        <DiskImageSection />
        <StrategyThread />
        <McpPlanThread />
        <DoneSummaryPanel />
      </div>

      <ChatInputBar />
    </div>
  );
}

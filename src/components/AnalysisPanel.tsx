'use client';

import DiskImageSection from './panels/DiskImageSection';
import StrategyThread from './panels/StrategyThread';
import McpPlanThread from './panels/McpPlanThread';
import DoneSummaryPanel from './panels/DoneSummaryPanel';
import ChatInputBar from './panels/ChatInputBar';

export default function AnalysisPanel() {
  return (
    <div className="bg-f-surface flex flex-col min-h-0 shrink-0" style={{ width: '100%', height: '100%' }}>
      <div className="h-10 border-b border-f-border shrink-0 flex items-center px-3.5">
        <span className="text-xs font-semibold text-f-t2">분석 패널</span>
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

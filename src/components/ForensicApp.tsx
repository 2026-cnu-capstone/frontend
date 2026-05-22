'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronRight, Play, Pause, Plus } from 'lucide-react';

import NavRail from './NavRail';
import CaseListView from './CaseListView';
import AnalysisPanel from './AnalysisPanel';
import DeleteCaseModal from './modals/DeleteCaseModal';
import NewCaseModal from './modals/NewCaseModal';
import McpModal from './modals/McpModal';
import ReportViewerModal from './modals/ReportViewerModal';
import SettingsModal from './modals/SettingsModal';

import { detectDiskImageFormat } from '@/lib/utils';
import { useAnalysisWebSocket } from '@/hooks/useAnalysisWebSocket';
import { useSplitter } from '@/hooks/useSplitter';
import { useCases } from '@/hooks/useCases';
import { useReportRun } from '@/hooks/useReportRun';
import { useWorkflow } from '@/hooks/useWorkflow';
import { WorkflowProvider, type WorkflowContextValue } from '@/contexts/WorkflowContext';
import type {
  ActiveCase, McpModalState, CaseSort,
} from '@/types';

const WorkflowCanvas = dynamic(() => import('./WorkflowCanvas'), { ssr: false });

export default function ForensicApp() {
  const [currentView, setCurrentView] = useState<'list' | 'builder'>('list');
  const [diskImagePath, setDiskImagePath] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string } | null>(null);
  const [pathStepDone, setPathStepDone] = useState(false);
  const { width: panelWidth, startDragging: startSplitterDrag } = useSplitter();

  const [chatInputText, setChatInputText] = useState('');
  const [submittedPrompt, setSubmittedPrompt] = useState('');
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);
  const [mcpModal, setMcpModal] = useState<McpModalState>({ open: false, stepIdx: null });
  const [mcpSearch, setMcpSearch] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { cases, activeCase, setActiveCase, createCase, deleteCase } = useCases();
  const [newCaseModalOpen, setNewCaseModalOpen] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseAnalyst, setNewCaseAnalyst] = useState('');

  const resetNewCaseForm = useCallback(() => {
    setNewCaseTitle('');
    setNewCaseAnalyst('');
  }, []);
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [caseAnalystFilter, setCaseAnalystFilter] = useState('all');
  const [caseSort, setCaseSort] = useState<CaseSort>('dateDesc');
  const [caseFilterMenu, setCaseFilterMenu] = useState<string | null>(null);

  const reportRun = useReportRun();
  const workflow = useWorkflow({
    caseId: activeCase.id,
    markRunStart: reportRun.markRunStart,
    markRunCompleted: reportRun.markRunCompleted,
    handleReportReady: reportRun.handleReportReady,
  });

  useAnalysisWebSocket({
    caseId: activeCase.id || null,
    onEvent: workflow.handleWsEvent,
  });

  const diskImageCheck = detectDiskImageFormat(diskImagePath);
  const diskImageReady = diskImageCheck.ok;

  const navigateToBuilder = useCallback((caseInfo: ActiveCase) => {
    if (caseInfo?.id) setActiveCase({ id: caseInfo.id, title: caseInfo.title || '새 케이스' });
    setCurrentView('builder');
    setDiskImagePath('');
    setAttachedFile(null);
    setPathStepDone(false);
    setChatInputText('');
    setSubmittedPrompt('');
    setSelectedNode(null);
    workflow.reset();
    reportRun.reset();
    if (caseInfo?.id) {
      void workflow.restoreFromCase(caseInfo.id, (detail) => {
        if (detail.user_prompt) {
          setSubmittedPrompt(detail.user_prompt);
        }
        if (detail.disk_image_path) {
          setDiskImagePath(detail.disk_image_path);
          setPathStepDone(true);
        }
        reportRun.hydrateFromDetail(detail);
      });
    }
  }, [setActiveCase, workflow, reportRun]);

  const handleCreateNewCase = useCallback(async () => {
    const created = await createCase({
      title: newCaseTitle,
      analyst: newCaseAnalyst,
    });
    if (!created) return;
    setNewCaseModalOpen(false);
    resetNewCaseForm();
    navigateToBuilder({ id: created.id, title: created.title });
  }, [createCase, newCaseTitle, newCaseAnalyst, resetNewCaseForm, navigateToBuilder]);

  const handleIntakeSubmit = useCallback(async () => {
    if (!pathStepDone || !diskImageReady || !chatInputText.trim()) return;
    const prompt = chatInputText.trim();
    setSubmittedPrompt(prompt);
    setChatInputText('');
    setShowReasoning(false);
    await workflow.submitIntake(diskImagePath, prompt);
  }, [pathStepDone, diskImageReady, chatInputText, diskImagePath, workflow]);

  const handleStrategyEditSubmit = useCallback(async () => {
    setShowReasoning(false);
    await workflow.submitStrategyEdit();
  }, [workflow]);

  const handleApproveReport = useCallback(
    () => reportRun.approveReport(activeCase.id),
    [reportRun, activeCase.id]
  );
  const handleDownloadReport = useCallback(
    () => reportRun.downloadReport(activeCase, submittedPrompt),
    [reportRun, activeCase, submittedPrompt]
  );
  const handleDownloadDfxml = useCallback(
    () => reportRun.downloadDfxml(activeCase),
    [reportRun, activeCase]
  );

  const handleSelectNode = useCallback((idx: number) => {
    setSelectedNode(prev => prev === idx ? null : idx);
  }, []);

  const openMcpModal = useCallback((stepIdx: number) => {
    setMcpModal({ open: true, stepIdx });
    setMcpSearch('');
  }, []);
  const selectMcp = useCallback((toolName: string) => {
    workflow.setEditablePlan(prev => {
      const next = [...prev];
      if (mcpModal.stepIdx !== null) next[mcpModal.stepIdx] = { ...next[mcpModal.stepIdx], mcp: toolName };
      return next;
    });
    setMcpModal({ open: false, stepIdx: null });
  }, [mcpModal.stepIdx, workflow]);

  const handleDeleteCase = useCallback(async () => {
    if (!confirmDeleteId) return;
    await deleteCase(confirmDeleteId);
    setConfirmDeleteId(null);
  }, [confirmDeleteId, deleteCase]);

  const handleRunWorkflow = useCallback(() => {
    if (workflow.workflowState !== 'approved') return;
    return workflow.runWorkflow();
  }, [workflow]);

  const isCanvasVisible = ['approved', 'running', 'done'].includes(workflow.workflowState);

  const workflowContextValue: WorkflowContextValue = {
    workflowState: workflow.workflowState,
    diskImagePath,
    setDiskImagePath,
    diskImageCheck,
    diskImageReady,
    pathStepDone,
    setPathStepDone,
    attachedFile,
    chatInputText,
    setChatInputText,
    submittedPrompt,
    strategySteps: workflow.strategySteps,
    setStrategySteps: workflow.setStrategySteps,
    showReasoning,
    setShowReasoning,
    strategyBackupRef: workflow.strategyBackupRef,
    strategyEditReasonRef: workflow.strategyEditReasonRef,
    editablePlan: workflow.editablePlan,
    setEditablePlan: workflow.setEditablePlan,
    planRound: workflow.planRound,
    rejectionHistory: workflow.rejectionHistory,
    rejectionReasonRef: workflow.rejectionReasonRef,
    reportState: reportRun.reportState,
    taskResults: reportRun.taskResults,
    elapsedTime: reportRun.elapsedTime,
    setShowReportViewer: reportRun.setShowReportViewer,
    onIntakeSubmit: handleIntakeSubmit,
    onApproveStrategy: workflow.approveStrategy,
    onStrategyEditRequest: workflow.requestStrategyEdit,
    onStrategyEditCancel: workflow.cancelStrategyEdit,
    onStrategyEditSubmit: handleStrategyEditSubmit,
    onSyncPlanWithStrategy: workflow.syncPlanWithStrategy,
    onStrategyDirectEdit: workflow.startStrategyDirectEdit,
    onApprovePlan: workflow.approvePlan,
    onRejectPlan: workflow.rejectPlan,
    onStartEdit: workflow.startPlanEdit,
    onCancelEdit: workflow.cancelPlanEdit,
    onSubmitEdit: workflow.submitPlanEdit,
    onCancelReject: workflow.cancelReject,
    onRerequest: workflow.rerequest,
    onApproveReport: handleApproveReport,
    onOpenMcpModal: openMcpModal,
    onDownloadReport: handleDownloadReport,
    onDownloadDfxml: handleDownloadDfxml,
    onEvidenceFilePick: e => {
      const file = e.target.files?.[0];
      if (file) setAttachedFile({ name: file.name });
      e.target.value = '';
    },
  };

  return (
    <div className="flex h-screen w-screen bg-f-bg text-f-t1 overflow-hidden font-sans text-[13px]">
      {confirmDeleteId && (() => {
        const target = cases.find(c => c.id === confirmDeleteId);
        return (
          <DeleteCaseModal
            caseId={confirmDeleteId}
            caseTitle={target?.title}
            workflowState={target?.workflowState}
            onConfirm={handleDeleteCase}
            onCancel={() => setConfirmDeleteId(null)}
          />
        );
      })()}
      {newCaseModalOpen && (
        <NewCaseModal
          newCaseTitle={newCaseTitle}
          setNewCaseTitle={setNewCaseTitle}
          newCaseAnalyst={newCaseAnalyst}
          setNewCaseAnalyst={setNewCaseAnalyst}
          onCreate={handleCreateNewCase}
          onCancel={() => { setNewCaseModalOpen(false); resetNewCaseForm(); }}
        />
      )}
      {mcpModal.open && mcpModal.stepIdx !== null && (
        <McpModal
          stepIdx={mcpModal.stepIdx}
          editablePlan={workflow.editablePlan}
          mcpSearch={mcpSearch}
          setMcpSearch={setMcpSearch}
          onSelect={selectMcp}
          onClose={() => setMcpModal({ open: false, stepIdx: null })}
        />
      )}
      {reportRun.showReportViewer && (
        <ReportViewerModal
          editablePlan={workflow.editablePlan}
          submittedPrompt={submittedPrompt}
          onClose={() => reportRun.setShowReportViewer(false)}
          reportData={reportRun.reportData}
          taskResults={reportRun.taskResults}
          diskImagePath={diskImagePath}
        />
      )}

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}

      <NavRail
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            GLOBAL TOPBAR
            케이스 목록 뷰: 인벤토리 레이블 + 새 케이스 버튼
            워크플로 뷰: 브레드크럼 + 케이스 메타 스트립 + 액션 버튼
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <header className="bg-f-surface border-b border-f-border shrink-0 select-none shadow-[0_1px_0_rgba(17,24,39,0.02)]">
          {currentView === 'list' ? (
            /* ── 목록 뷰 헤더: 얇은 h-10 구분 바 ── */
            <div className="h-10 flex items-center justify-between px-6">
              <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-f-t4">
                케이스 인벤토리
              </span>
              <button
                type="button"
                onClick={() => { resetNewCaseForm(); setNewCaseModalOpen(true); }}
                aria-label="새 케이스 만들기"
                className="h-7 px-2.5 bg-f-invert-bg border-none rounded-[6px] text-f-invert-fg text-[11px] font-medium cursor-pointer flex items-center gap-1.5 hover:bg-f-invert-bg-hover transition-colors focus-visible:ring-2 focus-visible:ring-f-accent focus-visible:ring-offset-1 focus-visible:outline-none shadow-flat"
              >
                <Plus size={12} strokeWidth={2.2} />
                새 케이스
              </button>
            </div>
          ) : (
            /* ── 워크플로 뷰 헤더: 케이스 메타 + 액션 ── */
            <div className="flex items-center justify-between px-4 lg:px-6 h-12 gap-2 lg:gap-4">

              {/* 좌: 브레드크럼 + 케이스 메타 */}
              <div className="flex items-center gap-2 lg:gap-3 min-w-0 overflow-hidden">

                {/* 브레드크럼 — 1024px 이하에서 "목록"으로 축약 */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrentView('list')}
                    aria-label="케이스 목록으로 돌아가기"
                    className="text-[11px] text-f-t4 hover:text-f-t1 transition-colors bg-transparent border-0 p-0 cursor-pointer font-medium whitespace-nowrap"
                  >
                    <span className="hidden lg:inline">케이스 목록</span>
                    <span className="lg:hidden">목록</span>
                  </button>
                  <ChevronRight size={11} className="text-f-border2 shrink-0" aria-hidden />
                  {/* 제목 — 1024px 이하에서 max-w 좁힘 */}
                  <span
                    className="text-[12px] font-semibold text-f-t1 truncate max-w-[120px] sm:max-w-[180px] lg:max-w-[260px] tracking-[-0.005em]"
                    title={activeCase.title}
                  >
                    {activeCase.title}
                  </span>
                </div>

                {/* 메타 스트립 — 1024px 이상에서만 노출, 인라인 chip 배열 */}
                <div className="hidden lg:flex items-center gap-2 min-w-0 ml-1">
                  <span className="inline-flex items-center h-[20px] px-1.5 rounded-[4px] bg-f-surface2 text-[10px] font-mono text-f-t3 tracking-wide">
                    {activeCase.id || '—'}
                  </span>
                  <WorkflowStateBadge state={workflow.workflowState} />
                </div>

                {/* 1024px 미만에서만 상태 배지 인라인 표시 (ID chip 생략) */}
                <div className="flex lg:hidden items-center shrink-0">
                  <WorkflowStateBadge state={workflow.workflowState} />
                </div>
              </div>

              {/* 우: 액션 버튼 — 1024px 미만에서 아이콘만 */}
              <div className="flex items-center gap-2 shrink-0">
                {workflow.workflowState === 'approved' && (
                  <button
                    type="button"
                    onClick={handleRunWorkflow}
                    aria-label="워크플로 실행"
                    className="h-7 px-2 lg:px-2.5 bg-f-invert-bg border-none rounded-[6px] text-f-invert-fg text-[11px] font-medium cursor-pointer flex items-center gap-1.5 hover:bg-f-invert-bg-hover transition-colors focus-visible:ring-2 focus-visible:ring-f-accent focus-visible:ring-offset-1 focus-visible:outline-none shadow-flat"
                  >
                    <Play size={10} fill="currentColor" />
                    <span className="hidden lg:inline">워크플로 실행</span>
                  </button>
                )}
                {workflow.workflowState === 'running' && (
                  <button
                    type="button"
                    onClick={workflow.pauseWorkflow}
                    aria-label="워크플로 일시정지"
                    className="h-7 px-2 lg:px-2.5 bg-f-surface border border-f-border2 rounded-[6px] text-f-t2 text-[11px] font-medium cursor-pointer flex items-center gap-1.5 hover:bg-f-surface2 transition-colors focus-visible:ring-2 focus-visible:ring-f-accent focus-visible:ring-offset-1 focus-visible:outline-none"
                  >
                    <Pause size={10} fill="currentColor" className="text-f-warn" />
                    <span className="hidden lg:inline">일시정지</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {currentView === 'list' ? (
          <CaseListView
            cases={cases}
            caseSearchQuery={caseSearchQuery}
            setCaseSearchQuery={setCaseSearchQuery}
            caseAnalystFilter={caseAnalystFilter}
            setCaseAnalystFilter={setCaseAnalystFilter}
            caseSort={caseSort}
            setCaseSort={setCaseSort}
            caseFilterMenu={caseFilterMenu}
            setCaseFilterMenu={setCaseFilterMenu}
            onRowClick={navigateToBuilder}
            onDelete={setConfirmDeleteId}
            onCreate={() => { resetNewCaseForm(); setNewCaseModalOpen(true); }}
          />
        ) : (
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* 캔버스 영역 — 빈 상태·로딩 오버레이는 WorkflowCanvas 내부에서 처리 */}
            <div className="flex-1 relative overflow-hidden bg-f-canvas-bg">
              <WorkflowCanvas
                editablePlan={isCanvasVisible ? workflow.editablePlan : []}
                workflowState={workflow.workflowState}
                activeStep={workflow.activeStep}
                selectedNode={selectedNode}
                onSelectNode={handleSelectNode}
                dfxmlFragments={workflow.nodeDfxmlFragments}
                stepRuns={workflow.nodeStepRuns}
                caseTitle={activeCase.title}
              />
            </div>

            {/* 드래그 스플리터 */}
            <div
              role="separator"
              aria-label="패널 너비 조절"
              aria-orientation="vertical"
              className="w-[3px] bg-f-border hover:bg-f-accent cursor-col-resize shrink-0 z-10 transition-colors focus-visible:outline-none focus-visible:bg-f-accent"
              onMouseDown={startSplitterDrag}
            />

            {/* 분석 패널 */}
            <div
              className="border-l border-f-border flex flex-col min-h-0 shrink-0 bg-f-surface"
              style={{ width: panelWidth }}
            >
              <WorkflowProvider value={workflowContextValue}>
                <AnalysisPanel />
              </WorkflowProvider>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 워크플로 상태 배지 — Linear 스타일 dot + label ── */
function WorkflowStateBadge({ state }: { state: string }) {
  const MAP: Record<string, { label: string; dot: string; text: string; pulse?: boolean }> = {
    idle:                   { label: '대기',         dot: 'bg-f-border2',        text: 'text-f-t3' },
    plan_thinking:          { label: '계획 생성',     dot: 'bg-f-warn',          text: 'text-f-t2', pulse: true },
    strategy_review:        { label: '전략 검토',     dot: 'bg-f-accent',        text: 'text-f-t2' },
    strategy_edit_request:  { label: '전략 수정 요청', dot: 'bg-f-warn',          text: 'text-f-t2' },
    strategy_editing:       { label: '전략 편집',     dot: 'bg-f-warn',          text: 'text-f-t2' },
    mcp_plan_thinking:      { label: 'MCP 계획',     dot: 'bg-f-accent',        text: 'text-f-t2', pulse: true },
    plan_requested:         { label: '계획 검토',     dot: 'bg-f-accent',        text: 'text-f-t2' },
    rejected:               { label: '반려',         dot: 'bg-f-danger',        text: 'text-f-t2' },
    editing:                { label: '편집 중',       dot: 'bg-f-warn',          text: 'text-f-t2' },
    approved:               { label: '승인됨',        dot: 'bg-f-success',       text: 'text-f-t2' },
    running:                { label: '실행 중',       dot: 'bg-f-success',       text: 'text-f-t2', pulse: true },
    done:                   { label: '완료',          dot: 'bg-f-t3',            text: 'text-f-t2' },
  };
  const entry = MAP[state] ?? { label: state, dot: 'bg-f-border2', text: 'text-f-t3' };
  return (
    <span className="inline-flex items-center h-[20px] px-1.5 rounded-[4px] bg-f-surface2 gap-1.5">
      <span className="relative flex items-center justify-center">
        <span className={`w-1.5 h-1.5 rounded-full ${entry.dot}`} />
        {entry.pulse && (
          <span className={`absolute inset-0 w-1.5 h-1.5 rounded-full ${entry.dot} animate-ping opacity-60`} />
        )}
      </span>
      <span className={`text-[10px] font-medium leading-none ${entry.text}`}>
        {entry.label}
      </span>
    </span>
  );
}

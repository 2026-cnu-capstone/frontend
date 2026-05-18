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
import EdgeModal from './modals/EdgeModal';
import ReportViewerModal from './modals/ReportViewerModal';

import { detectDiskImageFormat } from '@/lib/utils';
import { useAnalysisWebSocket } from '@/hooks/useAnalysisWebSocket';
import { useSplitter } from '@/hooks/useSplitter';
import { useCases } from '@/hooks/useCases';
import { useReportRun } from '@/hooks/useReportRun';
import { useWorkflow } from '@/hooks/useWorkflow';
import { WorkflowProvider, type WorkflowContextValue } from '@/contexts/WorkflowContext';
import type {
  ActiveCase, SelectedEdge, McpModalState, CaseSort,
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
  const [selectedEdge, setSelectedEdge] = useState<SelectedEdge | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);
  const [mcpModal, setMcpModal] = useState<McpModalState>({ open: false, stepIdx: null });
  const [mcpSearch, setMcpSearch] = useState('');

  const { cases, activeCase, setActiveCase, createCase, deleteCase } = useCases();
  const [newCaseModalOpen, setNewCaseModalOpen] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
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
  }, [setActiveCase, workflow, reportRun]);

  const handleCreateNewCase = useCallback(async () => {
    const created = await createCase(newCaseTitle);
    if (!created) return;
    setNewCaseModalOpen(false);
    setNewCaseTitle('');
  }, [createCase, newCaseTitle]);

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
    onEvidenceFilePick: e => {
      const file = e.target.files?.[0];
      if (file) setAttachedFile({ name: file.name });
      e.target.value = '';
    },
  };

  return (
    <div className="flex h-screen w-screen bg-f-bg text-f-t1 overflow-hidden font-sans text-[13px]">
      {confirmDeleteId && (
        <DeleteCaseModal
          caseId={confirmDeleteId}
          onConfirm={handleDeleteCase}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
      {newCaseModalOpen && (
        <NewCaseModal
          newCaseTitle={newCaseTitle}
          setNewCaseTitle={setNewCaseTitle}
          onCreate={handleCreateNewCase}
          onCancel={() => { setNewCaseModalOpen(false); setNewCaseTitle(''); }}
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
      {selectedEdge !== null && (
        <EdgeModal
          selectedEdge={selectedEdge}
          editablePlan={workflow.editablePlan}
          onClose={() => setSelectedEdge(null)}
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

      <NavRail currentView={currentView} onViewChange={setCurrentView} />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-10 bg-f-surface border-b border-f-border flex items-center justify-between px-4 shrink-0 select-none">
          <div className="flex items-center text-xs">
            <button
              type="button"
              className="text-f-t3 cursor-pointer hover:text-f-t1 transition-colors bg-transparent border-0 p-0 font-inherit text-xs"
              onClick={() => setCurrentView('list')}
            >
              케이스 목록
            </button>
            {currentView === 'builder' && (
              <>
                <ChevronRight size={13} className="text-f-border2 mx-1" />
                <span className="text-f-t3 font-mono text-[11px]">{activeCase.id}</span>
                <ChevronRight size={13} className="text-f-border2 mx-1" />
                <span className="text-f-t1 font-medium">{activeCase.title}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {currentView === 'list' && (
              <button
                type="button"
                onClick={() => { setNewCaseTitle(''); setNewCaseModalOpen(true); }}
                className="h-7 px-3 bg-f-accent border-none rounded-[5px] text-white text-xs font-medium cursor-pointer flex items-center gap-1 hover:bg-blue-700 transition-colors"
              >
                <Plus size={13} /> 새 케이스
              </button>
            )}
            {currentView === 'builder' && workflow.workflowState === 'approved' && (
              <button
                onClick={handleRunWorkflow}
                className="h-7 px-3 bg-f-accent border-none rounded-[5px] text-white text-xs font-medium cursor-pointer flex items-center gap-1 hover:bg-blue-700 transition-colors"
              >
                <Play size={12} fill="currentColor" /> 워크플로 실행
              </button>
            )}
            {currentView === 'builder' && workflow.workflowState === 'running' && (
              <button onClick={workflow.pauseWorkflow} className="h-7 px-3 bg-f-warn border-none rounded-[5px] text-white text-xs font-medium cursor-pointer flex items-center gap-1">
                <Pause size={12} fill="currentColor" /> 일시정지
              </button>
            )}
          </div>
        </div>

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
          />
        ) : (
          <div className="flex-1 flex min-h-0 overflow-hidden">
            <div className="flex-1 relative overflow-hidden bg-f-canvas-bg">
              {isCanvasVisible ? (
                <WorkflowCanvas
                  editablePlan={workflow.editablePlan}
                  workflowState={workflow.workflowState}
                  activeStep={workflow.activeStep}
                  selectedNode={selectedNode}
                  onSelectNode={handleSelectNode}
                  onEdgeClick={setSelectedEdge}
                  dfxmlFragments={workflow.nodeDfxmlFragments}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-f-t4 text-xs mb-1">워크플로 캔버스</div>
                    <div className="text-f-t4 text-[11px]">분석 계획을 승인하면 노드 그래프가 표시됩니다.</div>
                  </div>
                </div>
              )}
            </div>

            <div
              className="w-[3px] bg-f-border hover:bg-f-accent cursor-col-resize shrink-0 z-10 transition-colors"
              onMouseDown={startSplitterDrag}
            />

            <div
              className="border-l border-f-border flex flex-col min-h-0 shrink-0"
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

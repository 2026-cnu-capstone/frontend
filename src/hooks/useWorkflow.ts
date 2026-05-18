import { useCallback, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { recommendMcpForStrategyStep } from '@/lib/utils';
import type { WsEvent } from '@/hooks/useAnalysisWebSocket';
import type { TaskResult, ReportData } from '@/hooks/useReportRun';
import type { PlanStep, RejectionRecord, StrategyStep, WorkflowState } from '@/types';

interface UseWorkflowOptions {
  caseId: string;
  markRunStart: () => void;
  markRunCompleted: (results?: TaskResult[]) => void;
  handleReportReady: (data: ReportData) => void;
}

function parseStrategyLines(strategy: string): StrategyStep[] {
  return strategy
    .split('\n')
    .filter(l => l.trim().startsWith('-'))
    .map((l, i) => ({ id: i + 1, text: l.replace(/^-\s*/, '').trim() }));
}

function parsePlanSteps(steps: any[]): PlanStep[] {
  return steps.map((s, i) => ({
    step: i + 1,
    name: s.name || s.purpose || '',
    mcp: s.mcp_server && s.mcp_server.toLowerCase() !== 'none' ? s.mcp_server : 'Dissect MCP',
    edgeLabel: s.edge_label ?? null,
  }));
}

export function useWorkflow({ caseId, markRunStart, markRunCompleted, handleReportReady }: UseWorkflowOptions) {
  const [workflowState, setWorkflowState] = useState<WorkflowState>('idle');
  const [strategySteps, setStrategySteps] = useState<StrategyStep[]>([]);
  const [editablePlan, setEditablePlan] = useState<PlanStep[]>([]);
  const [planRound, setPlanRound] = useState(1);
  const [rejectionHistory, setRejectionHistory] = useState<RejectionRecord[]>([]);
  const [rejectedPlanSnapshot, setRejectedPlanSnapshot] = useState<PlanStep[] | null>(null);
  const [activeStep, setActiveStep] = useState(-1);
  const [nodeDfxmlFragments, setNodeDfxmlFragments] = useState<Record<number, string>>({});

  const rejectionReasonRef = useRef('');
  const strategyEditReasonRef = useRef('');
  const strategyBackupRef = useRef<StrategyStep[]>([]);
  const planBackupRef = useRef<PlanStep[]>([]);
  const runningRef = useRef(false);

  const reset = useCallback(() => {
    setWorkflowState('idle');
    setStrategySteps([]);
    setEditablePlan([]);
    setPlanRound(1);
    setRejectionHistory([]);
    setRejectedPlanSnapshot(null);
    setActiveStep(-1);
    setNodeDfxmlFragments({});
    rejectionReasonRef.current = '';
    strategyEditReasonRef.current = '';
    strategyBackupRef.current = [];
    planBackupRef.current = [];
    runningRef.current = false;
  }, []);

  const buildPlanFromStrategySteps = useCallback(
    (steps: StrategyStep[], prevPlan: PlanStep[] = []): PlanStep[] =>
      steps.map((step, idx) => ({
        step: idx + 1,
        name: step.text,
        mcp: prevPlan[idx]?.mcp || recommendMcpForStrategyStep(step.text),
        edgeLabel: prevPlan[idx]?.edgeLabel ?? null,
      })),
    []
  );

  const syncPlanWithStrategy = useCallback(() => {
    setEditablePlan(prev => buildPlanFromStrategySteps(strategySteps, prev));
  }, [buildPlanFromStrategySteps, strategySteps]);

  const submitIntake = useCallback(
    async (diskImagePath: string, prompt: string) => {
      setWorkflowState('plan_thinking');
      try {
        const result = await api.startAnalysis({ case_id: caseId, disk_image_path: diskImagePath, prompt });
        setStrategySteps(parseStrategyLines(result.strategy));
        setWorkflowState('strategy_review');
      } catch (e) {
        console.error('startAnalysis failed:', e);
        setWorkflowState('idle');
      }
    },
    [caseId]
  );

  const approveStrategy = useCallback(async () => {
    setWorkflowState('mcp_plan_thinking');
    try {
      const result = await api.approveStrategy(caseId, { approved: true });
      if (result.plan_ready && result.steps) {
        setEditablePlan(parsePlanSteps(result.steps));
        setWorkflowState('plan_requested');
      }
    } catch (e) {
      console.error('approveStrategy failed:', e);
      setWorkflowState('strategy_review');
    }
  }, [caseId]);

  const requestStrategyEdit = useCallback(() => setWorkflowState('strategy_edit_request'), []);
  const startStrategyDirectEdit = useCallback(() => setWorkflowState('strategy_editing'), []);
  const cancelStrategyEdit = useCallback(() => {
    strategyEditReasonRef.current = '';
    setWorkflowState('strategy_review');
  }, []);

  const submitStrategyEdit = useCallback(async () => {
    const feedback = strategyEditReasonRef.current.trim();
    setWorkflowState('plan_thinking');
    try {
      const result = await api.approveStrategy(caseId, { approved: false, feedback });
      if (result.strategy) {
        setStrategySteps(parseStrategyLines(result.strategy));
      }
      strategyEditReasonRef.current = '';
      setWorkflowState('strategy_review');
    } catch (e) {
      console.error('strategyEditSubmit failed:', e);
      strategyEditReasonRef.current = '';
      setWorkflowState('strategy_review');
    }
  }, [caseId]);

  const approvePlan = useCallback(async () => {
    try {
      await api.approvePlan(caseId, { approved: true });
      setWorkflowState('approved');
    } catch (e) {
      console.error('approvePlan failed:', e);
      setWorkflowState('plan_requested');
    }
  }, [caseId]);

  const rejectPlan = useCallback(() => {
    setRejectedPlanSnapshot([...editablePlan]);
    setWorkflowState('rejected');
  }, [editablePlan]);

  const startPlanEdit = useCallback(() => {
    planBackupRef.current = editablePlan.map(p => ({ ...p }));
    setWorkflowState('editing');
  }, [editablePlan]);

  const cancelPlanEdit = useCallback(() => {
    setEditablePlan(planBackupRef.current.map(p => ({ ...p })));
    setWorkflowState('plan_requested');
  }, []);

  const submitPlanEdit = useCallback(() => setWorkflowState('plan_requested'), []);
  const cancelReject = useCallback(() => {
    setRejectedPlanSnapshot(null);
    setWorkflowState('plan_requested');
  }, []);

  const rerequest = useCallback(async () => {
    const reason = rejectionReasonRef.current.trim();
    if (!reason) return;
    setRejectionHistory(prev => [...prev, { round: planRound, reason, plan: rejectedPlanSnapshot! }]);
    setPlanRound(p => p + 1);
    rejectionReasonRef.current = '';
    setRejectedPlanSnapshot(null);
    setWorkflowState('mcp_plan_thinking');

    try {
      const result = await api.approvePlan(caseId, { approved: false, feedback: reason });
      if ('steps' in result && result.steps) {
        setEditablePlan(parsePlanSteps(result.steps));
      }
      setWorkflowState('plan_requested');
    } catch (e) {
      console.error('rerequest failed:', e);
      setWorkflowState('plan_requested');
    }
  }, [planRound, rejectedPlanSnapshot, caseId]);

  const runWorkflow = useCallback(async () => {
    runningRef.current = true;
    markRunStart();
    setWorkflowState('running');
    try {
      await api.executeAnalysis(caseId);
    } catch (e) {
      console.error('executeAnalysis failed:', e);
      runningRef.current = false;
      setWorkflowState('approved');
      setActiveStep(-1);
    }
  }, [caseId, markRunStart]);

  const pauseWorkflow = useCallback(async () => {
    runningRef.current = false;
    setWorkflowState('approved');
    setActiveStep(-1);
    try {
      await api.pauseAnalysis(caseId);
    } catch (e) {
      console.error('pauseAnalysis failed:', e);
    }
  }, [caseId]);

  const handleWsEvent = useCallback(
    (event: WsEvent) => {
      switch (event.type) {
        case 'step_started':
          setActiveStep(event.step_index);
          break;
        case 'step_completed':
          if ('dfxml_fragment' in event && event.dfxml_fragment) {
            setNodeDfxmlFragments(prev => ({
              ...prev,
              [event.step_index]: event.dfxml_fragment as string,
            }));
          }
          break;
        case 'execution_done':
          setActiveStep(-1);
          setWorkflowState('done');
          runningRef.current = false;
          markRunCompleted('task_results' in event ? (event.task_results as TaskResult[]) : undefined);
          break;
        case 'report_ready':
          if ('summary' in event) {
            handleReportReady({ summary: event.summary, report: event.report, dfxml: event.dfxml });
          }
          break;
        case 'error':
          console.error('WS error:', (event as any).message);
          break;
      }
    },
    [markRunCompleted, handleReportReady]
  );

  return {
    // state
    workflowState,
    strategySteps,
    editablePlan,
    planRound,
    rejectionHistory,
    rejectedPlanSnapshot,
    activeStep,
    nodeDfxmlFragments,
    // setters (panel inline edit)
    setStrategySteps,
    setEditablePlan,
    // refs (uncontrolled textarea reasons)
    rejectionReasonRef,
    strategyEditReasonRef,
    strategyBackupRef,
    // transitions
    submitIntake,
    approveStrategy,
    requestStrategyEdit,
    startStrategyDirectEdit,
    cancelStrategyEdit,
    submitStrategyEdit,
    syncPlanWithStrategy,
    approvePlan,
    rejectPlan,
    startPlanEdit,
    cancelPlanEdit,
    submitPlanEdit,
    cancelReject,
    rerequest,
    runWorkflow,
    pauseWorkflow,
    handleWsEvent,
    reset,
  };
}

'use client';

import { createContext, useContext, type Dispatch, type MutableRefObject, type ReactNode, type SetStateAction } from 'react';
import type {
  WorkflowState, ReportState, PlanStep, StrategyStep, RejectionRecord,
} from '@/types';
import type { TaskResult } from '@/hooks/useReportRun';

export interface DiskImageCheck {
  ok: boolean;
  format: string;
  error: string;
}

export interface WorkflowContextValue {
  // disk image / intake
  workflowState: WorkflowState;
  diskImagePath: string;
  setDiskImagePath: (v: string) => void;
  diskImageCheck: DiskImageCheck;
  diskImageReady: boolean;
  pathStepDone: boolean;
  setPathStepDone: (v: boolean) => void;
  attachedFile: { name: string } | null;
  chatInputText: string;
  setChatInputText: (v: string) => void;
  submittedPrompt: string;

  // strategy
  strategySteps: StrategyStep[];
  setStrategySteps: Dispatch<SetStateAction<StrategyStep[]>>;
  showReasoning: boolean;
  setShowReasoning: Dispatch<SetStateAction<boolean>>;
  strategyBackupRef: MutableRefObject<StrategyStep[]>;
  strategyEditReasonRef: MutableRefObject<string>;

  // plan
  editablePlan: PlanStep[];
  setEditablePlan: Dispatch<SetStateAction<PlanStep[]>>;
  planRound: number;
  rejectionHistory: RejectionRecord[];
  rejectionReasonRef: MutableRefObject<string>;

  // report
  reportState: ReportState;
  taskResults: TaskResult[];
  elapsedTime: string;
  setShowReportViewer: (v: boolean) => void;

  // transitions
  onIntakeSubmit: () => void;
  onApproveStrategy: () => void;
  onStrategyEditRequest: () => void;
  onStrategyEditCancel: () => void;
  onStrategyEditSubmit: () => void;
  onSyncPlanWithStrategy: () => void;
  onStrategyDirectEdit: () => void;
  onApprovePlan: () => void;
  onRejectPlan: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSubmitEdit: () => void;
  onCancelReject: () => void;
  onRerequest: () => void;
  onApproveReport: () => void;
  onOpenMcpModal: (idx: number) => void;
  onDownloadReport?: () => void;
  onEvidenceFilePick: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

export function WorkflowProvider({ value, children }: { value: WorkflowContextValue; children: ReactNode }) {
  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
}

export function useWorkflowContext(): WorkflowContextValue {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error('useWorkflowContext must be used within WorkflowProvider');
  return ctx;
}

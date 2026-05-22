export type WorkflowState =
  | 'idle'
  | 'plan_thinking'
  | 'strategy_review'
  | 'strategy_edit_request'
  | 'strategy_editing'
  | 'mcp_plan_thinking'
  | 'plan_requested'
  | 'rejected'
  | 'editing'
  | 'approved'
  | 'running'
  | 'done';

export type ReportState = 'idle' | 'generating' | 'done';
export type CaseSort = 'dateDesc' | 'dateAsc' | 'titleAsc' | 'activityDesc';

export interface Case {
  id: string;
  title: string;
  analyst: string;
  size: string;
  date: string;
  workflowState?: WorkflowState;
  lastActivityAt?: string;
}

export interface ActiveCase {
  id: string;
  title: string;
}

export interface PlanStep {
  step: number;
  name: string;
  mcp: string;
  purpose?: string;
  hints?: string;
  artifactsHint?: unknown[] | null;
  isFollowup?: boolean;
}

export interface StepRun {
  status?: string;
  output?: string;
  elapsedMs?: number | null;
  elapsed?: string; // WS에서 받는 raw 표시 (예: "1.5s")
  agentName?: string;
  startedAt?: string;
  completedAt?: string | null;
}

export interface StrategyStep {
  id: number;
  text: string;
}

export interface McpTool {
  id: string;
  name: string;
  desc: string;
}

export interface McpCategory {
  category: string;
  tools: McpTool[];
}

export interface DfxmlNode {
  name: string;
  xml: string;
}

export interface RejectionRecord {
  round: number;
  reason: string;
  plan: PlanStep[];
}

export interface McpModalState {
  open: boolean;
  stepIdx: number | null;
}

export interface WorkflowNodeData {
  title: string;
  tool: string;
  nodeStatus: 'approved' | 'running' | 'done' | 'idle';
  nodeIdx: number;
  isSelected: boolean;
  dfxml: DfxmlNode;
  caseTitle: string;
  onSelect: (idx: number) => void;
  purpose?: string;
  hints?: string;
  run?: StepRun;
  [key: string]: unknown; // required by @xyflow/react Node<Data> constraint
}

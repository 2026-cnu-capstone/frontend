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
export type CaseStatus = 'running' | 'done' | 'idle' | 'failed';
export type CaseSort = 'dateDesc' | 'dateAsc' | 'titleAsc';

export interface Case {
  id: string;
  title: string;
  status: CaseStatus;
  analyst: string;
  size: string;
  date: string;
  progress: number;
}

export interface ActiveCase {
  id: string;
  title: string;
}

export interface PlanStep {
  step: number;
  name: string;
  mcp: string;
  edgeLabel?: string | null;
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

export interface SelectedEdge {
  idx: number;
  clientX: number;
  clientY: number;
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
  onSelect: (idx: number) => void;
  [key: string]: unknown; // required by @xyflow/react Node<Data> constraint
}

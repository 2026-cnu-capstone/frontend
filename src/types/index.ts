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

/* ──────────────────────────────────────────────────────────────
 * DB-aligned row types (Forensic DB 스키마)
 * docs/schema.html 의 PostgreSQL DDL 과 1:1 매핑.
 * 백엔드가 그대로 직렬화해서 내려준다고 가정한 raw row 타입.
 * ────────────────────────────────────────────────────────────── */

export type IsoDateTime = string; // timestamptz (ISO 8601)

// cases — varchar(20) 상태값은 백엔드 어휘를 따른다
export type CaseStatus = string;

export interface CaseRow {
  id: string;                       // varchar(36)
  title: string;                    // varchar(255) NOT NULL
  description: string | null;       // text
  user_prompt: string | null;       // text
  disk_image_path: string | null;   // varchar(1024)
  analyst: string | null;           // varchar(64)
  status: CaseStatus;               // varchar(20) NOT NULL
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

// analysis_sessions — phase 는 varchar(20) (예: 'strategy' | 'plan' | 'running' | 'done')
export type AnalysisPhase = string;

export interface AnalysisSessionRow {
  id: number;
  case_id: string;
  phase: AnalysisPhase;
  system_profile: string | null;
  strategy: string | null;
  plan_text: string | null;
  result_summary: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

// plan_steps — artifacts 는 jsonb (자유 형식)
export interface PlanStepRow {
  id: number;
  session_id: number;
  case_id: string;
  step_index: number;
  mcp_server: string | null;
  purpose: string | null;
  hints: string | null;
  artifacts: unknown | null;
  is_followup: boolean;
  created_at: IsoDateTime;
}

// agent_run
export interface AgentRunRow {
  id: number;
  session_id: number;
  plan_step_id: number;
  agent_name: string;
  tool: string | null;
  status: string;
  plan_round: number;
  started_at: IsoDateTime;
  finished_at: IsoDateTime | null;
}

// task_results — artifacts 는 jsonb
export interface TaskResultRow {
  id: number;
  agent_run_id: number;
  case_id: string;
  task_id: string;
  status: string;
  content: string | null;
  output: string | null;
  raw_output_ref: string | null;
  elapsed_ms: number | null;
  artifacts: unknown | null;
  started_at: IsoDateTime;
  completed_at: IsoDateTime | null;
  created_at: IsoDateTime;
}

// dfxml_fragments
export interface DfxmlFragmentRow {
  id: number;
  task_result_id: number;
  agent_name: string | null;
  dfxml_fragment: string;
  created_at: IsoDateTime;
}

// reports
export interface ReportRow {
  id: number;
  case_id: string;
  summary: string | null;
  report_text: string | null;
  dfxml: string | null;
  status: string;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

// workflow_nodes — DOUBLE PRECISION x/y
export interface WorkflowNodeRow {
  id: number;
  case_id: string;
  x: number;
  y: number;
  updated_at: IsoDateTime;
}

// workflow_edges
export interface WorkflowEdgeRow {
  id: number;
  case_id: string;
  edge_id: string;
  source_node: string;
  target_node: string;
  updated_at: IsoDateTime;
}

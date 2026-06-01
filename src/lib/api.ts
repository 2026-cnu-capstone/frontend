/**
 * Backend API 클라이언트
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API Error ${res.status}: ${err}`);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return res.json();
}

export interface AnalysisStartRequest {
  case_id: string;
  disk_image_path: string;
  prompt: string;
}

export interface StrategyApprovalRequest {
  approved: boolean;
  feedback?: string;
}

export interface PlanApprovalRequest {
  approved: boolean;
  feedback?: string;
}

export interface StrategyResponse {
  strategy: string;
  system_profile: string | null;
}

// /api/analysis/start, /strategy/approve 등 워크플로우 응답.
// 백엔드는 plan_steps row 일부 + 표시용 step_index/name 을 합쳐 내려준다.
// steps 는 GET /api/cases/:caseId/plan 응답과 동일한 CasePlanStepDTO 형식.
export interface PlanResponse {
  plan_text: string;
  steps: CasePlanStepDTO[];
  plan_ready?: boolean;
}

// /api/analysis/:caseId/report 응답 (reports 행을 평탄화)
export interface ReportResponse {
  summary: string;
  report_text: string;          // reports.report_text
  dfxml: string;
}

// cases 행 + 최신 analysis_sessions / reports 를 평탄화한 detail 응답
export interface CaseDetailDTO {
  id: string;
  title: string;
  description: string | null;
  analyst: string | null;
  status: string;
  disk_image_path: string | null;
  user_prompt: string | null;
  system_profile: string | null;        // analysis_sessions.system_profile
  analysis_strategy: string | null;     // analysis_sessions.strategy
  analysis_plan: string | null;         // analysis_sessions.plan_text
  report_summary: string | null;        // reports.summary
  report_text: string | null;           // reports.report_text
  report_dfxml: string | null;          // reports.dfxml
  created_at: string;
  updated_at: string;
}

// plan_steps 행 + 표시용 name(derived).
export interface CasePlanStepDTO {
  step_index: number;
  name?: string;                // 백엔드 derive (DB 컬럼 없음)
  mcp_server: string | null;
  purpose: string | null;
  hints: string | null;
  artifacts: unknown[] | null;  // plan_steps.artifacts (jsonb)
  is_followup: boolean;
}

export interface CasePlanDTO {
  plan_round: number;
  plan_text: string;
  steps: CasePlanStepDTO[];
}

export interface McpServerDTO {
  name: string;
  transport: 'stdio' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  connected: boolean;
  tool_count: number;
}

export interface McpServerCreatePayload {
  name: string;
  transport: 'stdio' | 'sse';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  url?: string;
  headers?: Record<string, string>;
}

export interface McpToolDTO {
  server: string;
  name: string;
  qualified_name: string;
  description: string;
  input_schema: Record<string, unknown> | null;
}

// task_results 행 + agent_run/plan_steps/dfxml_fragments 조인 결과.
export interface CaseStepResultDTO {
  step_index: number;             // plan_steps.step_index (조인)
  task_id: string;                // task_results.task_id
  agent_name: string;             // agent_run.agent_name (조인)
  status: string;                 // task_results.status
  content: string | null;         // task_results.content
  output: string | null;          // task_results.output
  raw_output_ref: string | null;  // task_results.raw_output_ref
  elapsed_ms: number | null;      // task_results.elapsed_ms
  artifacts: unknown | null;      // task_results.artifacts (jsonb)
  dfxml_fragment: string | null;  // dfxml_fragments.dfxml_fragment (조인)
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export const api = {
  startAnalysis: (data: AnalysisStartRequest) =>
    request<StrategyResponse>('/api/analysis/start', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  approveStrategy: (caseId: string, data: StrategyApprovalRequest) =>
    request<PlanResponse & { strategy?: string }>(`/api/analysis/${caseId}/strategy/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  approvePlan: (caseId: string, data: PlanApprovalRequest) =>
    request<PlanResponse | { approved: boolean }>(`/api/analysis/${caseId}/plan/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  executeAnalysis: (caseId: string) =>
    request<{ status: string; total_steps: number }>(`/api/analysis/${caseId}/execute`, {
      method: 'POST',
    }),

  generateReport: (caseId: string) =>
    request<ReportResponse>(`/api/analysis/${caseId}/report`, {
      method: 'POST',
    }),

  pauseAnalysis: (caseId: string) =>
    request<{ status: string }>(`/api/analysis/${caseId}/pause`, {
      method: 'POST',
    }),

  getStatus: (caseId: string) =>
    request<{ exists: boolean; phase?: string; plan_steps_count?: number; task_results_count?: number }>(
      `/api/analysis/${caseId}/status`
    ),

  getCases: () =>
    request<Array<Record<string, unknown>>>('/api/cases'),

  createCase: (data: {
    title: string;
    description?: string;
    analyst?: string;
    disk_image_path?: string;
    user_prompt?: string;
  }) =>
    request<Record<string, unknown>>('/api/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteCase: (caseId: string) =>
    request<void>(`/api/cases/${caseId}`, {
      method: 'DELETE',
    }),

  getCaseDetail: (caseId: string) =>
    request<CaseDetailDTO>(`/api/cases/${caseId}/detail`),

  getCasePlan: (caseId: string) =>
    request<CasePlanDTO>(`/api/cases/${caseId}/plan`),

  getCaseResults: (caseId: string) =>
    request<CaseStepResultDTO[]>(`/api/cases/${caseId}/results`),

  // ── MCP 서버 관리 ──
  getMcpServers: () => request<McpServerDTO[]>('/api/mcp-servers'),
  createMcpServer: (data: McpServerCreatePayload) =>
    request<McpServerDTO>('/api/mcp-servers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteMcpServer: (name: string) =>
    request<void>(`/api/mcp-servers/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }),
  reconnectMcpServers: () =>
    request<McpServerDTO[]>('/api/mcp-servers/reconnect', { method: 'POST' }),
  getMcpTools: () => request<McpToolDTO[]>('/api/mcp-servers/tools'),
};

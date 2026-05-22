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

export interface PlanResponse {
  plan_text: string;
  steps: Array<{
    index: number;
    name: string;
    mcp_server: string;
    purpose: string;
    artifacts: string[];
    hints: string;
  }>;
  plan_ready?: boolean;
}

export interface ReportResponse {
  summary: string;
  report: string;
  dfxml: string;
}

export interface CaseDetailDTO {
  id: string;
  title: string;
  analyst: string;
  status: string;
  disk_image_path: string;
  disk_image_format: string;
  user_prompt: string;
  system_profile: string | null;
  analysis_strategy: string | null;
  analysis_plan: string | null;
  report_summary: string | null;
  report_markdown: string | null;
  report_dfxml: string | null;
  created_at: string;
  updated_at: string;
}

export interface CasePlanStepDTO {
  step_index: number;
  name: string;
  mcp_server: string;
  purpose: string;
  hints: string;
  artifacts_hint: unknown[] | null;
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

export interface CaseStepResultDTO {
  step_index: number;
  task_id: string;
  agent_name: string;
  status: string;
  output: string;
  elapsed_ms: number | null;
  artifacts: unknown[] | null;
  dfxml_fragment: string | null;
  started_at: string;
  completed_at: string | null;
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
    name: string;
    description?: string;
    analyst?: string;
    disk_image_path?: string;
    disk_image_format?: string;
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

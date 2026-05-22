import { http, HttpResponse, delay } from 'msw';
import { MOCK_CASES } from '../data/cases';
import { MOCK_STRATEGY_TEXT, MOCK_REVISED_STRATEGY_TEXT } from '../data/strategy';
import { MOCK_PLAN_STEPS, MOCK_PLAN_TEXT, toPlanStepOut } from '../data/plan';
import { MOCK_DFXML_FRAGMENTS } from '../data/dfxml';
import {
  MOCK_REPORT_SUMMARY,
  MOCK_REPORT_MARKDOWN,
  MOCK_REPORT_DFXML,
} from '../data/report';
import { simulateExecution, emitReportReady } from './ws';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 분석 세션의 단계 시퀀스 — WS handler가 참조한다
export const sessionState = new Map<string, { stepCount: number }>();

// 케이스별 분석 산출물 캐시 (재진입 시 detail/plan/results 복원용)
interface CaseArtifacts {
  user_prompt: string;
  system_profile: string | null;
  analysis_strategy: string | null;
  analysis_plan: string | null;
  report_summary: string | null;
  report_markdown: string | null;
  report_dfxml: string | null;
  plan_round: number;
  step_results: Array<{
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
  }>;
}

const caseArtifacts = new Map<string, CaseArtifacts>();

function ensureArtifacts(caseId: string): CaseArtifacts {
  let entry = caseArtifacts.get(caseId);
  if (!entry) {
    entry = {
      user_prompt: '',
      system_profile: null,
      analysis_strategy: null,
      analysis_plan: null,
      report_summary: null,
      report_markdown: null,
      report_dfxml: null,
      plan_round: 0,
      step_results: [],
    };
    caseArtifacts.set(caseId, entry);
  }
  return entry;
}

export const restHandlers = [
  // ─────────────────── 케이스 ───────────────────
  http.get(`${API_BASE}/api/cases`, async () => {
    await delay(150);
    return HttpResponse.json(MOCK_CASES);
  }),

  http.get(`${API_BASE}/api/cases/:caseId`, async ({ params }) => {
    const found = MOCK_CASES.find(c => c.id === params.caseId);
    if (!found) {
      return HttpResponse.json({ detail: 'Case not found' }, { status: 404 });
    }
    await delay(80);
    return HttpResponse.json(found);
  }),

  http.post(`${API_BASE}/api/cases`, async ({ request }) => {
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      disk_image_path?: string;
      disk_image_format?: string;
      analyst?: string;
    };
    await delay(120);
    const id = `DF-2026-${String(MOCK_CASES.length + 1).padStart(4, '0')}`;
    const now = new Date().toISOString();
    const created = {
      id,
      title: body.name ?? '새 케이스',
      analyst: body.analyst ?? '-',
      status: 'idle',
      disk_image_path: body.disk_image_path ?? '',
      disk_image_format: body.disk_image_format ?? '',
      created_at: now,
      updated_at: now,
    };
    MOCK_CASES.unshift(created);
    const artifacts = ensureArtifacts(id);
    artifacts.user_prompt = body.description ?? '';
    return HttpResponse.json(created, { status: 201 });
  }),

  http.delete(`${API_BASE}/api/cases/:caseId`, async ({ params }) => {
    const idx = MOCK_CASES.findIndex(c => c.id === params.caseId);
    if (idx < 0) {
      return HttpResponse.json({ detail: 'Case not found' }, { status: 404 });
    }
    MOCK_CASES.splice(idx, 1);
    caseArtifacts.delete(params.caseId as string);
    sessionState.delete(params.caseId as string);
    await delay(80);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_BASE}/api/cases/:caseId/detail`, async ({ params }) => {
    const caseId = params.caseId as string;
    const found = MOCK_CASES.find(c => c.id === caseId);
    if (!found) {
      return HttpResponse.json({ detail: 'Case not found' }, { status: 404 });
    }
    const a = ensureArtifacts(caseId);
    await delay(100);
    return HttpResponse.json({
      ...found,
      user_prompt: a.user_prompt,
      system_profile: a.system_profile,
      analysis_strategy: a.analysis_strategy,
      analysis_plan: a.analysis_plan,
      report_summary: a.report_summary,
      report_markdown: a.report_markdown,
      report_dfxml: a.report_dfxml,
    });
  }),

  http.get(`${API_BASE}/api/cases/:caseId/plan`, async ({ params }) => {
    const caseId = params.caseId as string;
    const found = MOCK_CASES.find(c => c.id === caseId);
    if (!found) {
      return HttpResponse.json({ detail: 'Case not found' }, { status: 404 });
    }
    const a = ensureArtifacts(caseId);
    await delay(100);
    return HttpResponse.json({
      plan_round: a.plan_round,
      plan_text: a.analysis_plan ?? '',
      steps: a.plan_round > 0 ? MOCK_PLAN_STEPS.map(s => toPlanStepOut(s)) : [],
    });
  }),

  http.get(`${API_BASE}/api/cases/:caseId/results`, async ({ params }) => {
    const caseId = params.caseId as string;
    const found = MOCK_CASES.find(c => c.id === caseId);
    if (!found) {
      return HttpResponse.json({ detail: 'Case not found' }, { status: 404 });
    }
    const a = ensureArtifacts(caseId);
    await delay(80);
    return HttpResponse.json(a.step_results);
  }),

  // ─────────────────── 분석 워크플로우 ───────────────────
  http.post(`${API_BASE}/api/analysis/start`, async ({ request }) => {
    const body = (await request.json()) as { case_id: string; disk_image_path: string; prompt: string };
    if (!body.disk_image_path) {
      return HttpResponse.json(
        { detail: '디스크 이미지 경로가 비어 있습니다. 디스크 이미지를 먼저 등록해주세요.' },
        { status: 400 },
      );
    }
    sessionState.set(body.case_id, { stepCount: MOCK_PLAN_STEPS.length });
    const a = ensureArtifacts(body.case_id);
    a.user_prompt = body.prompt;
    a.system_profile = 'Windows 10 (NTFS) — RAM 8GB';
    a.analysis_strategy = MOCK_STRATEGY_TEXT;
    await delay(900);
    return HttpResponse.json({
      strategy: MOCK_STRATEGY_TEXT,
      system_profile: a.system_profile,
    });
  }),

  http.post(`${API_BASE}/api/analysis/:caseId/strategy/approve`, async ({ params, request }) => {
    const caseId = params.caseId as string;
    const body = (await request.json()) as { approved: boolean; feedback?: string };
    const a = ensureArtifacts(caseId);
    await delay(700);
    if (!body.approved) {
      a.analysis_strategy = MOCK_REVISED_STRATEGY_TEXT;
      return HttpResponse.json({
        strategy: MOCK_REVISED_STRATEGY_TEXT,
        plan_text: '',
        steps: [],
        plan_ready: false,
      });
    }
    a.analysis_plan = MOCK_PLAN_TEXT;
    a.plan_round = 1;
    return HttpResponse.json({
      plan_text: MOCK_PLAN_TEXT,
      steps: MOCK_PLAN_STEPS,
      plan_ready: true,
    });
  }),

  http.post(`${API_BASE}/api/analysis/:caseId/plan/approve`, async ({ params, request }) => {
    const caseId = params.caseId as string;
    const body = (await request.json()) as { approved: boolean; feedback?: string };
    const a = ensureArtifacts(caseId);
    await delay(600);
    if (body.approved) {
      return HttpResponse.json({ approved: true });
    }
    // 반려 시 약간 변형된 plan을 다시 줌
    const revised = MOCK_PLAN_STEPS.map((s, i) => ({
      ...s,
      mcp_server: i === 5 ? 'NetworkMiner MCP' : s.mcp_server,
    }));
    const revisedText = revised.map(s => `${s.index}. ${s.name} (${s.mcp_server})`).join('\n');
    a.analysis_plan = revisedText;
    a.plan_round += 1;
    return HttpResponse.json({
      plan_text: revisedText,
      steps: revised,
      plan_ready: true,
    });
  }),

  // 실행 — 백엔드는 동기 완료 후 응답하지만, mock에서는 WS 시뮬레이션을 비동기로 emit
  // 응답 형식은 백엔드와 동일하게 {status: 'done', total_steps}.
  http.post(`${API_BASE}/api/analysis/:caseId/execute`, async ({ params }) => {
    const caseId = params.caseId as string;
    const session = sessionState.get(caseId) ?? { stepCount: MOCK_PLAN_STEPS.length };
    sessionState.set(caseId, session);
    const a = ensureArtifacts(caseId);
    a.step_results = MOCK_PLAN_STEPS.map((s, i) => ({
      step_index: i,
      task_id: `${caseId}-${i + 1}`,
      agent_name: s.mcp_server,
      status: 'success',
      output: `[mock] ${s.name} 단계 완료`,
      elapsed_ms: 700,
      artifacts: null,
      dfxml_fragment: MOCK_DFXML_FRAGMENTS[i] ?? null,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }));
    await delay(150);
    setTimeout(() => simulateExecution(caseId), 200);
    return HttpResponse.json({ status: 'done', total_steps: session.stepCount });
  }),

  http.post(`${API_BASE}/api/analysis/:caseId/pause`, async () => {
    await delay(80);
    return HttpResponse.json({ status: 'paused' });
  }),

  http.post(`${API_BASE}/api/analysis/:caseId/report`, async ({ params }) => {
    const caseId = params.caseId as string;
    const payload = {
      summary: MOCK_REPORT_SUMMARY,
      report: MOCK_REPORT_MARKDOWN,
      dfxml: MOCK_REPORT_DFXML,
    };
    const a = ensureArtifacts(caseId);
    a.report_summary = payload.summary;
    a.report_markdown = payload.report;
    a.report_dfxml = payload.dfxml;
    await delay(1100);
    setTimeout(() => emitReportReady(caseId, payload), 50);
    return HttpResponse.json(payload);
  }),

  http.get(`${API_BASE}/api/analysis/:caseId/status`, ({ params }) => {
    const caseId = params.caseId as string;
    const a = caseArtifacts.get(caseId);
    return HttpResponse.json({
      exists: MOCK_CASES.some(c => c.id === caseId),
      phase: a?.report_summary ? 'done' : a?.plan_round ? 'running' : 'idle',
      plan_steps_count: a?.plan_round ? MOCK_PLAN_STEPS.length : 0,
      task_results_count: a?.step_results.length ?? 0,
    });
  }),

  // ─────────────────── settings / MCP mock ───────────────────
  ...mockSettingsHandlers(),
];

/* ────────────────────── settings / MCP 가짜 상태 ────────────────────── */

interface MockMcpServer {
  name: string;
  transport: 'stdio' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
}

const mockState = {
  servers: [
    { name: 'dissect', transport: 'stdio', command: '/usr/bin/python', args: ['-m', 'dissect_mcp'] },
  ] as MockMcpServer[],
  tools: [
    { server: 'dissect', name: 'extract_system_profile', description: '디스크 이미지의 OS · 파티션 정보 추출' },
    { server: 'dissect', name: 'list_partitions', description: '파티션 테이블 파싱 및 메타정보 반환' },
    { server: 'dissect', name: 'walk_filesystem', description: '파일시스템 트리 워킹 및 메타데이터 수집' },
  ],
};

function serializeServers() {
  return mockState.servers.map(s => ({
    name: s.name,
    transport: s.transport,
    command: s.command ?? '',
    args: s.args ?? [],
    url: s.url ?? '',
    connected: true,
    tool_count: mockState.tools.filter(t => t.server === s.name).length,
  }));
}

function mockSettingsHandlers() {
  return [
    http.get(`${API_BASE}/api/mcp-servers`, async () => {
      await delay(80);
      return HttpResponse.json(serializeServers());
    }),

    http.post(`${API_BASE}/api/mcp-servers`, async ({ request }) => {
      const body = (await request.json()) as MockMcpServer;
      if (mockState.servers.some(s => s.name === body.name)) {
        return HttpResponse.json({ detail: `이미 존재: ${body.name}` }, { status: 409 });
      }
      mockState.servers.push(body);
      // 가짜 도구 1개 자동 등록
      mockState.tools.push({
        server: body.name,
        name: 'placeholder',
        description: '(mock) 연결되면 실제 도구가 보입니다',
      });
      await delay(150);
      return HttpResponse.json(
        serializeServers().find(s => s.name === body.name),
        { status: 201 },
      );
    }),

    http.delete(`${API_BASE}/api/mcp-servers/:name`, async ({ params }) => {
      const name = params.name as string;
      if (!mockState.servers.some(s => s.name === name)) {
        return HttpResponse.json({ detail: `존재하지 않는 서버: ${name}` }, { status: 404 });
      }
      mockState.servers = mockState.servers.filter(s => s.name !== name);
      mockState.tools = mockState.tools.filter(t => t.server !== name);
      await delay(80);
      return new HttpResponse(null, { status: 204 });
    }),

    http.post(`${API_BASE}/api/mcp-servers/reconnect`, async () => {
      await delay(220);
      return HttpResponse.json(serializeServers());
    }),

    http.get(`${API_BASE}/api/mcp-servers/tools`, async () => {
      await delay(120);
      return HttpResponse.json(
        mockState.tools.map(t => ({
          server: t.server,
          name: t.name,
          qualified_name: `${t.server}__${t.name}`,
          description: t.description,
          input_schema: null,
        })),
      );
    }),
  ];
}

import { http, HttpResponse, delay } from 'msw';
import { MOCK_CASES } from '../data/cases';
import { MOCK_STRATEGY_TEXT, MOCK_REVISED_STRATEGY_TEXT } from '../data/strategy';
import { MOCK_PLAN_STEPS, MOCK_PLAN_TEXT } from '../data/plan';
import { simulateExecution, emitReportReady } from './ws';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 분석 세션의 단계 시퀀스 — WS handler가 참조한다
export const sessionState = new Map<string, { stepCount: number }>();

export const restHandlers = [
  // 케이스 목록
  http.get(`${API_BASE}/api/cases`, async () => {
    await delay(150);
    return HttpResponse.json(MOCK_CASES);
  }),

  http.post(`${API_BASE}/api/cases`, async ({ request }) => {
    const body = (await request.json()) as { name?: string; description?: string };
    await delay(120);
    const id = `DF-2026-${String(MOCK_CASES.length + 1).padStart(4, '0')}`;
    const created = {
      id,
      title: body.name ?? '새 케이스',
      status: 'idle',
      analyst: '-',
      size: '-',
      date: new Date().toISOString().slice(0, 10),
      progress: 0,
    };
    MOCK_CASES.unshift(created as any);
    return HttpResponse.json(created);
  }),

  http.delete(`${API_BASE}/api/cases/:caseId`, async ({ params }) => {
    const idx = MOCK_CASES.findIndex(c => c.id === params.caseId);
    if (idx >= 0) MOCK_CASES.splice(idx, 1);
    await delay(80);
    return new HttpResponse(null, { status: 204 });
  }),

  // 분석 시작 → 전략 응답
  http.post(`${API_BASE}/api/analysis/start`, async ({ request }) => {
    const body = (await request.json()) as { case_id: string; disk_image_path: string; prompt: string };
    sessionState.set(body.case_id, { stepCount: MOCK_PLAN_STEPS.length });
    await delay(900);
    return HttpResponse.json({
      strategy: MOCK_STRATEGY_TEXT,
      system_profile: 'Windows 10 (NTFS) — RAM 8GB',
    });
  }),

  // 전략 승인/수정
  http.post(`${API_BASE}/api/analysis/:caseId/strategy/approve`, async ({ request }) => {
    const body = (await request.json()) as { approved: boolean; feedback?: string };
    await delay(700);
    if (!body.approved) {
      return HttpResponse.json({
        strategy: MOCK_REVISED_STRATEGY_TEXT,
        plan_text: '',
        steps: [],
        plan_ready: false,
      });
    }
    return HttpResponse.json({
      plan_text: MOCK_PLAN_TEXT,
      steps: MOCK_PLAN_STEPS,
      plan_ready: true,
    });
  }),

  // 계획 승인/반려
  http.post(`${API_BASE}/api/analysis/:caseId/plan/approve`, async ({ request }) => {
    const body = (await request.json()) as { approved: boolean; feedback?: string };
    await delay(600);
    if (body.approved) {
      return HttpResponse.json({ approved: true });
    }
    // 반려 시 약간 변형된 plan을 다시 줌
    const revised = MOCK_PLAN_STEPS.map((s, i) => ({
      ...s,
      mcp_server: i === 5 ? 'NetworkMiner MCP' : s.mcp_server,
    }));
    return HttpResponse.json({
      plan_text: revised.map(s => `${s.index}. ${s.name} (${s.mcp_server})`).join('\n'),
      steps: revised,
      plan_ready: true,
    });
  }),

  // 실행 트리거 — REST는 즉시 응답하고 WS가 단계별 이벤트를 비동기로 emit
  http.post(`${API_BASE}/api/analysis/:caseId/execute`, async ({ params }) => {
    const caseId = params.caseId as string;
    const session = sessionState.get(caseId) ?? { stepCount: MOCK_PLAN_STEPS.length };
    sessionState.set(caseId, session);
    await delay(150);
    setTimeout(() => simulateExecution(caseId), 200);
    return HttpResponse.json({ status: 'running', total_steps: session.stepCount });
  }),

  http.post(`${API_BASE}/api/analysis/:caseId/pause`, async () => {
    await delay(80);
    return HttpResponse.json({ status: 'paused' });
  }),

  http.post(`${API_BASE}/api/analysis/:caseId/report`, async ({ params }) => {
    const caseId = params.caseId as string;
    const payload = {
      summary: '랜섬웨어가 2023-09-15 02:30~02:36에 svchost32.exe 형태로 실행되었으며, 142건의 파일이 암호화되고 VSS 3건이 삭제되었습니다.',
      report: '1. 침입 경로: 피싱 메일 첨부(security_patch.zip) → PCOptimizer 설치\n2. 실행: svchost32.exe — userassist 14회, prefetch 1회 기록\n3. 영향: report_2023.xlsx 외 142개 파일 .locked 확장자 변경\n4. 안티포렌식: vssadmin delete shadows /all로 VSS-003~005 삭제\n5. C2: 45.33.32.156:443 / 185.220.101.34:8443 로 524KB 외부 전송 의심',
      dfxml: '<dfxml version="1.2"><summary total_steps="10" success="10" anomalies="3"/></dfxml>',
    };
    await delay(1100);
    setTimeout(() => emitReportReady(caseId, payload), 50);
    return HttpResponse.json(payload);
  }),

  http.get(`${API_BASE}/api/analysis/:caseId/status`, () => {
    return HttpResponse.json({ exists: true, phase: 'running', plan_steps_count: MOCK_PLAN_STEPS.length, task_results_count: 0 });
  }),
];

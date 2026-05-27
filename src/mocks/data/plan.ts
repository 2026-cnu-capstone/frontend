// docs/schema.html 의 plan_steps 테이블과 동일한 형태로 보관한다.
// (artifacts 는 jsonb 이므로 자유 형식 배열을 그대로 담는다.)
//
// API 응답인 CasePlanStepDTO 는 step_index/mcp_server/purpose/hints/artifacts/is_followup
// 에 더해 표시용 name 을 갖는다 (DB 에는 name 컬럼이 없으므로 백엔드가 derive 한다).

import type { CasePlanStepDTO } from '@/lib/api';

interface MockPlanStep {
  step_index: number;
  name: string;          // UI 표기용 derive (DB plan_steps 에는 없음)
  mcp_server: string;
  purpose: string;
  artifacts: string[];   // jsonb
  hints: string;
  is_followup: boolean;
}

export const MOCK_PLAN_STEPS: MockPlanStep[] = [
  { step_index: 1, name: 'Registry 분석',           mcp_server: 'Dissect MCP',         purpose: 'NTUSER.DAT에서 최근 실행 흔적 추출', artifacts: ['NTUSER.DAT'],      hints: 'userassist, runmru',     is_followup: false },
  { step_index: 2, name: 'Event Log 분석',          mcp_server: 'Dissect MCP',         purpose: 'Security.evtx 비정상 로그인 식별',  artifacts: ['Security.evtx'],   hints: 'EventID 4624/4625',      is_followup: false },
  { step_index: 3, name: 'Prefetch 분석',           mcp_server: 'Dissect MCP',         purpose: '의심 실행파일 시각 확인',            artifacts: ['Prefetch/*.pf'],   hints: '',                       is_followup: false },
  { step_index: 4, name: 'MFT 타임라인',            mcp_server: 'Dissect MCP',         purpose: '파일 암호화 타임라인 재구성',         artifacts: ['$MFT'],            hints: '$SI $FN 비교',           is_followup: false },
  { step_index: 5, name: 'Shadow Copies 분석',      mcp_server: 'Dissect MCP',         purpose: 'VSS 삭제 흔적 확인',                  artifacts: ['VSS Catalog'],     hints: 'vssadmin delete',        is_followup: false },
  { step_index: 6, name: 'Network Traffic 분석',    mcp_server: 'Wireshark MCP',       purpose: 'C2 통신·외부 전송 식별',              artifacts: ['network_logs/'],   hints: '',                       is_followup: false },
  { step_index: 7, name: 'Scheduled Tasks 분석',    mcp_server: 'Dissect MCP',         purpose: '악성 자동실행 식별',                   artifacts: ['Tasks/*.xml'],     hints: '',                       is_followup: false },
  { step_index: 8, name: 'Browser History 분석',    mcp_server: 'BrowserHistory MCP',  purpose: '의심 다운로드 URL 추적',               artifacts: ['browser_data/'],   hints: '',                       is_followup: false },
  { step_index: 9, name: 'Email Artifacts 분석',    mcp_server: 'Apache Tika MCP',     purpose: '피싱 메일·악성 첨부 식별',             artifacts: ['email_store/'],    hints: 'OST/PST',                is_followup: false },
  { step_index: 10, name: 'Installed Programs 분석', mcp_server: 'RegRipper MCP',      purpose: '의심 설치 프로그램 식별',              artifacts: ['SOFTWARE Hive'],   hints: 'Uninstall key',          is_followup: false },
];

export const MOCK_PLAN_TEXT = MOCK_PLAN_STEPS
  .map(s => `${s.step_index}. ${s.name} (${s.mcp_server})`)
  .join('\n');

// 백엔드 PlanStepOut 스키마 어댑터 (GET /api/cases/:caseId/plan 응답용).
// 백엔드가 plan_steps row 를 그대로 직렬화한다고 가정.
export function toPlanStepOut(s: MockPlanStep, isFollowup = false): CasePlanStepDTO {
  return {
    step_index: s.step_index,
    name: s.name,
    mcp_server: s.mcp_server,
    purpose: s.purpose,
    hints: s.hints,
    artifacts: s.artifacts,
    is_followup: isFollowup || s.is_followup,
  };
}

// frontend api.ts::PlanResponse.steps 형식 (legacy: index/artifacts)
interface MockPlanStep {
  index: number;
  name: string;
  mcp_server: string;
  purpose: string;
  artifacts: string[];
  hints: string;
}

export const MOCK_PLAN_STEPS: MockPlanStep[] = [
  { index: 1, name: 'Registry 분석', mcp_server: 'Dissect MCP', purpose: 'NTUSER.DAT에서 최근 실행 흔적 추출', artifacts: ['NTUSER.DAT'], hints: 'userassist, runmru' },
  { index: 2, name: 'Event Log 분석', mcp_server: 'Dissect MCP', purpose: 'Security.evtx 비정상 로그인 식별', artifacts: ['Security.evtx'], hints: 'EventID 4624/4625' },
  { index: 3, name: 'Prefetch 분석', mcp_server: 'Dissect MCP', purpose: '의심 실행파일 시각 확인', artifacts: ['Prefetch/*.pf'], hints: '' },
  { index: 4, name: 'MFT 타임라인', mcp_server: 'Dissect MCP', purpose: '파일 암호화 타임라인 재구성', artifacts: ['$MFT'], hints: '$SI $FN 비교' },
  { index: 5, name: 'Shadow Copies 분석', mcp_server: 'Dissect MCP', purpose: 'VSS 삭제 흔적 확인', artifacts: ['VSS Catalog'], hints: 'vssadmin delete' },
  { index: 6, name: 'Network Traffic 분석', mcp_server: 'Wireshark MCP', purpose: 'C2 통신·외부 전송 식별', artifacts: ['network_logs/'], hints: '' },
  { index: 7, name: 'Scheduled Tasks 분석', mcp_server: 'Dissect MCP', purpose: '악성 자동실행 식별', artifacts: ['Tasks/*.xml'], hints: '' },
  { index: 8, name: 'Browser History 분석', mcp_server: 'BrowserHistory MCP', purpose: '의심 다운로드 URL 추적', artifacts: ['browser_data/'], hints: '' },
  { index: 9, name: 'Email Artifacts 분석', mcp_server: 'Apache Tika MCP', purpose: '피싱 메일·악성 첨부 식별', artifacts: ['email_store/'], hints: 'OST/PST' },
  { index: 10, name: 'Installed Programs 분석', mcp_server: 'RegRipper MCP', purpose: '의심 설치 프로그램 식별', artifacts: ['SOFTWARE Hive'], hints: 'Uninstall key' },
];

export const MOCK_PLAN_TEXT = MOCK_PLAN_STEPS
  .map(s => `${s.index}. ${s.name} (${s.mcp_server})`)
  .join('\n');

// 백엔드 PlanStepOut 스키마 어댑터 (GET /api/cases/:caseId/plan 응답용)
export function toPlanStepOut(s: MockPlanStep, isFollowup = false) {
  return {
    step_index: s.index,
    name: s.name,
    mcp_server: s.mcp_server,
    purpose: s.purpose,
    hints: s.hints,
    artifacts_hint: s.artifacts,
    is_followup: isFollowup,
  };
}

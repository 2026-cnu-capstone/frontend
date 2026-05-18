interface MockPlanStep {
  index: number;
  name: string;
  mcp_server: string;
  purpose: string;
  artifacts: string[];
  hints: string;
  edge_label?: string | null;
}

export const MOCK_PLAN_STEPS: MockPlanStep[] = [
  { index: 1, name: 'Registry 분석', mcp_server: 'Dissect MCP', purpose: 'NTUSER.DAT에서 최근 실행 흔적 추출', artifacts: ['NTUSER.DAT'], hints: 'userassist, runmru', edge_label: '--users Admin · --ts-range 02:30~02:35' },
  { index: 2, name: 'Event Log 분석', mcp_server: 'Dissect MCP', purpose: 'Security.evtx 비정상 로그인 식별', artifacts: ['Security.evtx'], hints: 'EventID 4624/4625', edge_label: '--session-range 23:12~02:28 · --target-user Admin' },
  { index: 3, name: 'Prefetch 분석', mcp_server: 'Dissect MCP', purpose: '의심 실행파일 시각 확인', artifacts: ['Prefetch/*.pf'], hints: '', edge_label: '--executables svchost32.exe,encrypt_tool.exe · --since 02:31' },
  { index: 4, name: 'MFT 타임라인', mcp_server: 'Dissect MCP', purpose: '파일 암호화 타임라인 재구성', artifacts: ['$MFT'], hints: '$SI $FN 비교', edge_label: '--encryption-window 02:33~02:36 · --volume C:' },
  { index: 5, name: 'Shadow Copies 분석', mcp_server: 'Dissect MCP', purpose: 'VSS 삭제 흔적 확인', artifacts: ['VSS Catalog'], hints: 'vssadmin delete', edge_label: '--attack-window 02:28~02:40 · --vss-delete-ts 02:36' },
  { index: 6, name: 'Network Traffic 분석', mcp_server: 'Wireshark MCP', purpose: 'C2 통신·외부 전송 식별', artifacts: ['network_logs/'], hints: '', edge_label: '--c2-ips 45.33.32.156 · --binary svchost32.exe' },
  { index: 7, name: 'Scheduled Tasks 분석', mcp_server: 'Dissect MCP', purpose: '악성 자동실행 식별', artifacts: ['Tasks/*.xml'], hints: '', edge_label: '--action-path svchost32.exe · --created-after 09-14' },
  { index: 8, name: 'Browser History 분석', mcp_server: 'BrowserHistory MCP', purpose: '의심 다운로드 URL 추적', artifacts: ['browser_data/'], hints: '', edge_label: '--url free-tools-download.xyz · --ts 09-14T18:22' },
  { index: 9, name: 'Email Artifacts 분석', mcp_server: 'Apache Tika MCP', purpose: '피싱 메일·악성 첨부 식별', artifacts: ['email_store/'], hints: 'OST/PST', edge_label: '--attachment security_patch.zip · --since 09-14' },
  { index: 10, name: 'Installed Programs 분석', mcp_server: 'RegRipper MCP', purpose: '의심 설치 프로그램 식별', artifacts: ['SOFTWARE Hive'], hints: 'Uninstall key', edge_label: null },
];

export const MOCK_PLAN_TEXT = MOCK_PLAN_STEPS
  .map(s => `${s.index}. ${s.name} (${s.mcp_server})`)
  .join('\n');

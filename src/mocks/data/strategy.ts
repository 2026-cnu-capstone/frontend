// 분석 전략 — AI 에이전트가 시스템 프로필을 본 뒤 제시하는 우선순위 분석 계획.
// 분석가 톤으로 가설·우선순위·예상 산출물을 함께 표기해 best-case 데모에 활용한다.

export const MOCK_STRATEGY_TEXT = [
  '## 침해 가설',
  '피싱 메일을 통한 초기 침투 → 사용자 권한에서 PC 최적화 위장 실행파일(PCOptimizer) 설치 → 권한 상승 및 svchost32.exe(랜섬웨어) 실행 → 사용자 문서/사진 .locked 확장자로 암호화 → VSS 삭제로 anti-forensics → 외부 C2(45.33.32.156, 185.220.101.34)로 키 송신 의심.',
  '',
  '## 우선순위 분석 (P0 → P2)',
  '- **P0** Registry (NTUSER.DAT) — UserAssist · RunMRU로 svchost32.exe 실행 횟수/타임스탬프 확정',
  '- **P0** Event Log (Security.evtx) — Type 10 RDP 4624/4625 시퀀스로 무차별 대입 → 성공 로그인 식별',
  '- **P0** Prefetch — SVCHOST32.EXE-A1B2C3D4.pf로 최초 실행 시각 교차검증',
  '- **P1** MFT($SI vs $FN) — 142개 .locked 변환 타임라인 + 백데이팅 탐지',
  '- **P1** Shadow Copies — vssadmin delete shadows /all 명령 및 삭제된 VSS 카탈로그 복원',
  '- **P1** Network Traffic — Tor exit node 185.220.101.34로의 524KB 외부 전송 식별',
  '- **P2** Scheduled Tasks — 지속성 확보용 daily 02:00 트리거 작업 추적',
  '- **P2** Browser History — free-tools-download.xyz 다운로드 경로 확정',
  '- **P2** Email Artifacts — security_patch.zip 첨부의 SHA-256 및 발신자 도메인 분석',
  '- **P2** Installed Programs — PC Optimizer Pro · svchost32 Uninstall 키 검출',
  '',
  '## 기대 산출물',
  '암호화 시작 시각(±1초), C2 IP·포트·전송량, IOC 해시 5종, ATT&CK 맵핑(Initial Access · Execution · Defense Evasion · Exfiltration), 권고 사항 — 1차 보고서로 종합.',
].join('\n');

export const MOCK_REVISED_STRATEGY_TEXT = [
  '## 침해 가설 (수정)',
  '사용자 피드백 반영: 메모리 덤프 분석을 P0로 격상. 침투 직후 메모리에 남은 LSASS 자격증명 탈취/언패킹된 페이로드를 함께 검증한다.',
  '',
  '## 우선순위 분석 (P0 → P2)',
  '- **P0** Memory Dump — Volatility plugins(pslist · malfind · cmdline)로 svchost32.exe 부모 프로세스 식별',
  '- **P0** Registry (NTUSER.DAT) — UserAssist · RunMRU 교차검증',
  '- **P0** Event Log (Security.evtx) — Type 10 RDP 시퀀스',
  '- **P0** Prefetch — SVCHOST32 최초 실행 시각',
  '- **P1** MFT — .locked 변환 타임라인',
  '- **P1** Shadow Copies — VSS 삭제 흔적',
  '- **P1** Network Traffic — C2/exfiltration 패턴',
  '- **P2** Scheduled Tasks · Browser History · Email Artifacts · Installed Programs',
  '',
  '## 기대 산출물',
  '메모리 기반 IOC + 디스크 기반 IOC를 통합한 침해 보고서. ATT&CK T1003.001(LSASS), T1486(Data Encrypted for Impact), T1490(VSS 삭제) 맵핑 포함.',
].join('\n');

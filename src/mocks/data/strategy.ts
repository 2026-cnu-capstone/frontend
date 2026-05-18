export const MOCK_STRATEGY_TEXT = [
  '- Registry (NTUSER.DAT): 최근 실행된 프로그램 및 랜섬웨어 실행 흔적 확인',
  '- Event Log (Security.evtx): 비정상적인 로그인 시도 및 계정 사용 이력 확인',
  '- Prefetch: 랜섬웨어 실행 파일 및 실행 시각 확인',
  '- MFT: 파일 암호화 시점 및 파일 생성·삭제·수정 타임라인 재구성',
  '- Shadow Copies: 삭제된 볼륨 섀도 복사본 확인',
  '- Network Traffic Logs: 외부 서버와의 비정상적인 통신 이력 확인',
  '- Scheduled Tasks: 자동 실행 설정된 랜섬웨어 확인',
  '- Browser History: 랜섬웨어 다운로드 URL 및 관련 웹사이트 방문 기록 확인',
  '- Email Artifacts: 피싱 이메일 및 첨부 파일 확인',
  '- Installed Programs: 최근 설치된 의심스러운 프로그램 확인',
].join('\n');

export const MOCK_REVISED_STRATEGY_TEXT = [
  '- Memory Dump: 메모리 덤프에서 실행 중인 의심 프로세스 확인',
  '- Registry (NTUSER.DAT): 최근 실행된 프로그램 및 랜섬웨어 실행 흔적 확인',
  '- Event Log (Security.evtx): 비정상적인 로그인 시도 및 계정 사용 이력 확인',
  '- Prefetch: 랜섬웨어 실행 파일 및 실행 시각 확인',
  '- MFT: 파일 암호화 시점 및 파일 생성·삭제·수정 타임라인 재구성',
  '- Shadow Copies: 삭제된 볼륨 섀도 복사본 확인',
  '- Network Traffic Logs: 외부 서버와의 비정상적인 통신 이력 확인',
  '- Scheduled Tasks: 자동 실행 설정된 랜섬웨어 확인',
  '- Browser History: 랜섬웨어 다운로드 URL 및 관련 웹사이트 방문 기록 확인',
  '- Email Artifacts: 피싱 이메일 및 첨부 파일 확인',
  '- Installed Programs: 최근 설치된 의심스러운 프로그램 확인',
].join('\n');

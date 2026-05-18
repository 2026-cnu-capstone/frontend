import type { McpCategory } from '@/types';

export const MCP_TOOLS: McpCategory[] = [
  {
    category: '파일시스템 분석',
    tools: [
      { id: 'dissect', name: 'Dissect MCP', desc: '디스크 이미지 파티션 파싱 및 파일시스템 매핑' },
      { id: 'autopsy', name: 'Autopsy MCP', desc: '종합 디스크 포렌식 분석 자동화' },
    ],
  },
  {
    category: '삭제 파일 복구',
    tools: [
      { id: 'scalpel', name: 'Scalpel MCP', desc: '파일 시그니처 기반 비할당 영역 카빙' },
      { id: 'foremost', name: 'Foremost MCP', desc: '헤더/푸터 기반 파일 복구' },
    ],
  },
  {
    category: '메타데이터 추출',
    tools: [
      { id: 'exiftool', name: 'ExifTool MCP', desc: 'EXIF, IPTC, XMP 메타데이터 및 타임스탬프 추출' },
      { id: 'tika', name: 'Apache Tika MCP', desc: '다양한 포맷의 파일 메타데이터 파싱' },
    ],
  },
  {
    category: '메모리 분석',
    tools: [
      { id: 'volatility', name: 'Volatility MCP', desc: '메모리 덤프에서 프로세스·네트워크·아티팩트 추출' },
    ],
  },
  {
    category: '네트워크 분석',
    tools: [
      { id: 'wireshark', name: 'Wireshark MCP', desc: 'PCAP 파일 파싱 및 패킷 분석' },
      { id: 'networkminer', name: 'NetworkMiner MCP', desc: '네트워크 캡처에서 파일·세션 복원' },
    ],
  },
  {
    category: '레지스트리 / 브라우저',
    tools: [
      { id: 'regripper', name: 'RegRipper MCP', desc: 'Windows 레지스트리 아티팩트 추출' },
      { id: 'browserhistory', name: 'BrowserHistory MCP', desc: '브라우저 방문기록·다운로드·쿠키 분석' },
    ],
  },
  {
    category: '무결성 검증',
    tools: [
      { id: 'hashcheck', name: 'HashCheck MCP', desc: 'MD5/SHA-1/SHA-256 해시 일괄 검증' },
    ],
  },
  {
    category: '타임라인 분석',
    tools: [
      { id: 'plaso', name: 'Plaso MCP', desc: '다중 소스 타임라인 통합 및 이벤트 상관 분석' },
    ],
  },
];

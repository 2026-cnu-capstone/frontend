// docs/schema.html 의 cases 테이블과 동일한 컬럼만 노출한다.
// CaseRow 의 mock 구현체이며, frontend 는 useCases.coerceCase() 로 UI Case 로 변환한다.

import type { CaseRow } from '@/types';

export const MOCK_CASES: CaseRow[] = [
  {
    id: 'DF-2026-0425',
    title: '20260425_김영끌_랜섬웨어',
    description: '사용자 PC 랜섬웨어 감염 의심 분석',
    user_prompt: '디스크 이미지에서 랜섬웨어 침투 경로와 암호화 범위를 식별해주세요.',
    disk_image_path: '/data/cases/DF-2026-0425/disk.E01',
    analyst: '김영끌',
    status: 'running',
    created_at: '2026-04-25T09:00:00Z',
    updated_at: '2026-05-20T11:32:00Z',
  },
  {
    id: 'DF-2023-0820',
    title: 'USB 저장매체 삭제파일 복구',
    description: 'USB 메모리 삭제 영역 카빙',
    user_prompt: 'USB 이미지에서 삭제된 문서/사진을 복구해 타임라인을 만들어주세요.',
    disk_image_path: '/data/cases/DF-2023-0820/usb.dd',
    analyst: '이포렌',
    status: 'done',
    created_at: '2023-08-20T13:10:00Z',
    updated_at: '2023-08-22T18:04:00Z',
  },
  {
    id: 'DF-2023-0901',
    title: '이메일 피싱 계정 추적',
    description: '사내 계정 피싱 대응',
    user_prompt: '피싱 메일과 자격증명 탈취 흔적을 추적해주세요.',
    disk_image_path: '/data/cases/DF-2023-0901/disk.E01',
    analyst: '박디지',
    status: 'rejected',
    created_at: '2023-09-01T08:25:00Z',
    updated_at: '2023-09-03T09:11:00Z',
  },
  {
    id: 'DF-2023-0910',
    title: '사내 기밀 유출 타임라인 분석',
    description: '내부자 의심 데이터 유출',
    user_prompt: '문서 접근/외부 전송 기록을 시간순으로 정리해주세요.',
    disk_image_path: '/data/cases/DF-2023-0910/disk.vmdk',
    analyst: '김수사',
    status: 'idle',
    created_at: '2023-09-10T07:00:00Z',
    updated_at: '2023-09-10T07:00:00Z',
  },
];

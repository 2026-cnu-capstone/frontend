import type { Case } from '@/types';

export const MOCK_CASES: Case[] = [
  { id: 'DF-2026-0425', title: '20260425_김영끌_랜섬웨어', status: 'running', analyst: '김영끌', size: '50GB', date: '2026-04-25', progress: 45 },
  { id: 'DF-2023-0820', title: 'USB 저장매체 삭제파일 복구', status: 'done', analyst: '이포렌', size: '2.3GB', date: '2023-08-20', progress: 100 },
  { id: 'DF-2023-0901', title: '이메일 피싱 계정 추적', status: 'idle', analyst: '박디지', size: '1.2GB', date: '2023-09-01', progress: 0 },
  { id: 'DF-2023-0910', title: '사내 기밀 유출 타임라인 분석', status: 'failed', analyst: '김수사', size: '256GB', date: '2023-09-10', progress: 12 },
];

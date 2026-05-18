import type { Case } from '@/types';

export const MOCK_CASES: Case[] = [
  { id: 'DF-2026-0425', title: '20260425_김영끌_랜섬웨어', analyst: '김영끌', size: '50GB', date: '2026-04-25' },
  { id: 'DF-2023-0820', title: 'USB 저장매체 삭제파일 복구', analyst: '이포렌', size: '2.3GB', date: '2023-08-20' },
  { id: 'DF-2023-0901', title: '이메일 피싱 계정 추적', analyst: '박디지', size: '1.2GB', date: '2023-09-01' },
  { id: 'DF-2023-0910', title: '사내 기밀 유출 타임라인 분석', analyst: '김수사', size: '256GB', date: '2023-09-10' },
];

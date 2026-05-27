/**
 * 케이스별 분석 산출물 시드.
 *
 * - DB 의 analysis_sessions + reports + task_results 를 평탄화해 caseArtifacts 한 곳에 모은 mock 캐시.
 * - 모듈 로드 시 MOCK_CASES 의 status 에 맞춰 사전 상태를 채워 두어,
 *   기존 케이스를 클릭하면 곧바로 노드뷰/보고서가 보이도록 한다.
 *     - 'done'     → plan + 전체 step_results + report 모두 채움
 *     - 'running'  → plan + 일부 step_results (앞쪽 5단계 완료)
 *     - 'approved' → plan 만 채움 (실행 직전 상태)
 *     - 'rejected' → strategy 만 채움
 *     - 'idle'     → 시드 없음
 */

import type { CaseStepResultDTO } from '@/lib/api';
import { MOCK_CASES } from './cases';
import { MOCK_PLAN_STEPS, MOCK_PLAN_TEXT } from './plan';
import { MOCK_DFXML_FRAGMENTS } from './dfxml';
import { MOCK_STRATEGY_TEXT } from './strategy';
import {
  MOCK_REPORT_SUMMARY,
  MOCK_REPORT_MARKDOWN,
  MOCK_REPORT_DFXML,
} from './report';

export interface CaseArtifacts {
  user_prompt: string;
  system_profile: string | null;
  analysis_strategy: string | null;
  analysis_plan: string | null;
  report_summary: string | null;
  report_text: string | null;
  report_dfxml: string | null;
  plan_round: number;
  step_results: CaseStepResultDTO[];
}

export const caseArtifacts = new Map<string, CaseArtifacts>();

export function ensureArtifacts(caseId: string): CaseArtifacts {
  let entry = caseArtifacts.get(caseId);
  if (!entry) {
    entry = {
      user_prompt: '',
      system_profile: null,
      analysis_strategy: null,
      analysis_plan: null,
      report_summary: null,
      report_text: null,
      report_dfxml: null,
      plan_round: 0,
      step_results: [],
    };
    caseArtifacts.set(caseId, entry);
  }
  return entry;
}

export function buildFullStepResults(caseId: string): CaseStepResultDTO[] {
  const now = new Date().toISOString();
  return MOCK_PLAN_STEPS.map((s, i) => ({
    step_index: s.step_index,
    task_id: `${caseId}-${i + 1}`,
    agent_name: s.mcp_server,
    status: 'success',
    content: s.purpose,
    output: `[mock] ${s.name} 단계 완료`,
    raw_output_ref: null,
    elapsed_ms: 700,
    artifacts: s.artifacts,
    dfxml_fragment: MOCK_DFXML_FRAGMENTS[i] ?? null,
    started_at: now,
    completed_at: now,
    created_at: now,
  }));
}

const DEFAULT_SYSTEM_PROFILE = 'Windows 10 (NTFS) — RAM 8GB';

function seedCaseArtifacts() {
  for (const c of MOCK_CASES) {
    const a = ensureArtifacts(c.id);
    a.user_prompt = c.user_prompt ?? '';

    if (c.status === 'done') {
      a.system_profile = DEFAULT_SYSTEM_PROFILE;
      a.analysis_strategy = MOCK_STRATEGY_TEXT;
      a.analysis_plan = MOCK_PLAN_TEXT;
      a.plan_round = 1;
      a.step_results = buildFullStepResults(c.id);
      a.report_summary = MOCK_REPORT_SUMMARY;
      a.report_text = MOCK_REPORT_MARKDOWN;
      a.report_dfxml = MOCK_REPORT_DFXML;
    } else if (c.status === 'running') {
      a.system_profile = DEFAULT_SYSTEM_PROFILE;
      a.analysis_strategy = MOCK_STRATEGY_TEXT;
      a.analysis_plan = MOCK_PLAN_TEXT;
      a.plan_round = 1;
      a.step_results = buildFullStepResults(c.id).slice(0, 5);
    } else if (c.status === 'approved') {
      a.system_profile = DEFAULT_SYSTEM_PROFILE;
      a.analysis_strategy = MOCK_STRATEGY_TEXT;
      a.analysis_plan = MOCK_PLAN_TEXT;
      a.plan_round = 1;
    } else if (c.status === 'rejected') {
      a.system_profile = DEFAULT_SYSTEM_PROFILE;
      a.analysis_strategy = MOCK_STRATEGY_TEXT;
    }
  }
}

seedCaseArtifacts();

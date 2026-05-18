import { ws } from 'msw';
import { MOCK_PLAN_STEPS } from '../data/plan';
import { MOCK_DFXML_FRAGMENTS } from '../data/dfxml';

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

const analysisChannel = ws.link(`${WS_BASE}/api/analysis/ws/:caseId`);

type WsClient = Parameters<Parameters<typeof analysisChannel.addEventListener<'connection'>>[1]>[0]['client'];

const clientsByCase = new Map<string, Set<WsClient>>();

const connectionHandler = analysisChannel.addEventListener('connection', ({ client, params }) => {
  const caseId = params.caseId as string;
  let bucket = clientsByCase.get(caseId);
  if (!bucket) {
    bucket = new Set();
    clientsByCase.set(caseId, bucket);
  }
  bucket.add(client);

  client.addEventListener('close', () => {
    clientsByCase.get(caseId)?.delete(client);
  });
});

function broadcast(caseId: string, payload: unknown) {
  const bucket = clientsByCase.get(caseId);
  if (!bucket || bucket.size === 0) return;
  const msg = JSON.stringify(payload);
  for (const c of bucket) c.send(msg);
}

const STEP_TICK_MS = 700;
const STEP_GAP_MS = 250;

const runningCases = new Set<string>();

export async function simulateExecution(caseId: string) {
  if (runningCases.has(caseId)) return;
  runningCases.add(caseId);
  try {
    const total = MOCK_PLAN_STEPS.length;
    for (let i = 0; i < total; i++) {
      const step = MOCK_PLAN_STEPS[i];
      broadcast(caseId, {
        type: 'step_started',
        step_index: i,
        total,
        step_name: step.name,
        agent_name: step.mcp_server,
      });
      await new Promise(r => setTimeout(r, STEP_TICK_MS));
      broadcast(caseId, {
        type: 'step_completed',
        step_index: i,
        total,
        step_name: step.name,
        agent_name: step.mcp_server,
        status: 'success',
        output: `[mock] ${step.name} 완료 — ${step.purpose}`,
        elapsed: `${(STEP_TICK_MS / 1000).toFixed(1)}초`,
        dfxml_fragment: MOCK_DFXML_FRAGMENTS[i] ?? '',
      });
      await new Promise(r => setTimeout(r, STEP_GAP_MS));
    }
    broadcast(caseId, {
      type: 'execution_done',
      task_results: MOCK_PLAN_STEPS.map((s, i) => ({
        task_id: `${caseId}-${i + 1}`,
        agent_name: s.mcp_server,
        status: 'success',
        output: `[mock] ${s.name} 단계 완료`,
      })),
    });
  } finally {
    runningCases.delete(caseId);
  }
}

export function emitReportReady(caseId: string, payload: { summary: string; report: string; dfxml: string }) {
  broadcast(caseId, { type: 'report_ready', ...payload });
}

export const wsHandlers = [connectionHandler];

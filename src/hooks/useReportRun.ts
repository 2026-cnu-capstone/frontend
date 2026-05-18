import { useCallback, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { ActiveCase, ReportState } from '@/types';

export interface TaskResult {
  task_id?: string;
  agent_name?: string;
  status?: string;
  output?: string;
}

export interface ReportData {
  summary: string;
  report: string;
  dfxml: string;
}

function formatElapsed(ms: number): string {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}초` : `${Math.floor(s / 60)}분 ${s % 60}초`;
}

export function useReportRun() {
  const [reportState, setReportState] = useState<ReportState>('idle');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [taskResults, setTaskResults] = useState<TaskResult[]>([]);
  const [elapsedTime, setElapsedTime] = useState('');
  const [showReportViewer, setShowReportViewer] = useState(false);
  const runStartTimeRef = useRef<number | null>(null);

  const markRunStart = useCallback(() => {
    runStartTimeRef.current = Date.now();
  }, []);

  const markRunCompleted = useCallback((results?: TaskResult[]) => {
    if (runStartTimeRef.current) {
      setElapsedTime(formatElapsed(Date.now() - runStartTimeRef.current));
      runStartTimeRef.current = null;
    }
    if (results) setTaskResults(results);
  }, []);

  const handleReportReady = useCallback((data: ReportData) => {
    setReportState('done');
    setReportData(data);
  }, []);

  const approveReport = useCallback(async (caseId: string) => {
    setReportState('generating');
    try {
      await api.generateReport(caseId);
      setReportState('done');
    } catch (e) {
      console.error('generateReport failed:', e);
      setReportState('idle');
    }
  }, []);

  const downloadReport = useCallback(
    (activeCase: ActiveCase, submittedPrompt: string) => {
      const lines = [
        '디지털 포렌식 분석 보고서',
        '='.repeat(50),
        `생성일: ${new Date().toISOString().slice(0, 10)}`,
        `케이스: ${activeCase.id} — ${activeCase.title}`,
        '',
        '1. 사건 개요',
        '-'.repeat(30),
        submittedPrompt || '(없음)',
        '',
      ];
      if (reportData?.summary) {
        lines.push('2. 분석 요약', '-'.repeat(30), reportData.summary, '');
      }
      if (reportData?.report) {
        lines.push(`${reportData.summary ? '3' : '2'}. 상세 보고서`, '-'.repeat(30), reportData.report);
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeCase.id}_forensic_report.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [reportData]
  );

  const reset = useCallback(() => {
    setReportState('idle');
    setElapsedTime('');
    setShowReportViewer(false);
    setReportData(null);
    setTaskResults([]);
    runStartTimeRef.current = null;
  }, []);

  return {
    reportState,
    reportData,
    taskResults,
    elapsedTime,
    showReportViewer,
    setShowReportViewer,
    markRunStart,
    markRunCompleted,
    handleReportReady,
    approveReport,
    downloadReport,
    reset,
  };
}

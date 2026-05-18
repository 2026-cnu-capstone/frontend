export function detectDiskImageFormat(path: string): { ok: boolean; format: string; error: string } {
  const cleaned = (path || '').trim();
  if (!cleaned) return { ok: false, format: '', error: '' };
  const m = cleaned.match(/\.[^./\\]+$/i);
  const ext = m ? m[0].toLowerCase() : '';
  if (ext === '.e01') return { ok: true, format: 'e01', error: '' };
  if (ext === '.dd') return { ok: true, format: 'dd', error: '' };
  if (ext === '.raw' || ext === '.img' || ext === '.001') return { ok: true, format: 'raw', error: '' };
  return { ok: false, format: '', error: '지원 형식: .e01 .dd .raw .img .001' };
}

export function getBasename(path: string): string {
  const normalized = String(path || '').trim().replace(/[\\/]+$/, '');
  if (!normalized) return '';
  const tokens = normalized.split(/[\\/]/);
  return tokens[tokens.length - 1] || '';
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function formatGiB(bytes: number): string {
  const gib = bytes / 1024 ** 3;
  if (gib >= 0.01) return `${gib.toFixed(2)} GiB`;
  const mib = bytes / 1024 ** 2;
  return `${mib.toFixed(1)} MiB`;
}

export function getDiskImageMetaRows(path: string, check: { ok: boolean; format: string }): { label: string; value: string }[] {
  if (!check?.ok) return [];
  const p = String(path || '').trim();
  const base = getBasename(p) || '(이름 없음)';
  const fmt = (check.format || '').toLowerCase();
  const seed = hashString(`${p.toLowerCase()}|${fmt}`);
  const logicalBytes = 300_000_000 + (seed % 7_900_000_000);
  const sectorSize = 512;
  const sectorCount = Math.floor(logicalBytes / sectorSize);

  const formatLabel =
    fmt === 'e01' ? 'Expert Witness Compression Format (EWF / E01)' :
    fmt === 'dd' ? 'Raw bitstream (dd 복제)' :
    fmt === 'raw' ? 'Raw bitstream (.raw · .img · .001)' : check.format;

  const rows: { label: string; value: string }[] = [
    { label: '증거 파일명', value: base },
    { label: '저장 경로', value: p },
    { label: '컨테이너 포맷', value: formatLabel },
  ];

  if (fmt === 'e01') {
    const segFiles = 1 + ((seed >>> 3) % 3 === 0 ? 1 : 0);
    rows.push(
      { label: 'EWF 세그먼트', value: segFiles === 1 ? '1 파일 (.E01)' : `${segFiles} 파일 (.E01–.E${String(segFiles).padStart(2, '0')})` },
      { label: '세그먼트 크기', value: `${(2 + (seed % 6))} GiB (스팬 단위, 데모)` },
      { label: '압축', value: (seed & 1) ? 'fast (EWF 기본)' : 'none' },
    );
  } else {
    rows.push(
      { label: '오프셋', value: '0 byte — 전체 바이트 스트림' },
      { label: '스팬', value: '단일 파일 (RAW 컨테이너 없음)' },
    );
  }

  rows.push(
    { label: '논리 크기', value: `${formatGiB(logicalBytes)} · ${logicalBytes.toLocaleString('ko-KR')} bytes` },
    { label: '바이트/섹터', value: `${sectorSize}` },
    { label: '논리 섹터 수', value: sectorCount.toLocaleString('ko-KR') },
  );

  return rows;
}

export function recommendMcpForStrategyStep(stepText: string): string {
  const t = String(stepText || '').toLowerCase();
  if (t.includes('mft') && (t.includes('타임라인') || t.includes('timeline'))) return 'Dissect MCP';
  if (t.includes('카빙') || t.includes('복구')) return 'Scalpel MCP';
  if (t.includes('메타데이터') || t.includes('exif')) return 'ExifTool MCP';
  if (t.includes('타임라인') || t.includes('timeline')) return 'Plaso MCP';
  return 'Dissect MCP';
}

export function sanitizeFilename(input: string): string {
  const cleaned = String(input || '')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .trim();
  return cleaned || 'untitled';
}

export function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function nextCaseId(cases: { id: string }[]): string {
  const nums = cases.map(c => {
    const m = String(c.id).match(/DF-\d{4}-(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  });
  const n = Math.max(0, ...nums) + 1;
  return `DF-2026-${String(n).padStart(4, '0')}`;
}

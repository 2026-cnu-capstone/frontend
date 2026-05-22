'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import {
  X, Server, Wrench, Plus, Trash2, RefreshCw,
  Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react';
import {
  api,
  type McpServerDTO,
  type McpServerCreatePayload,
  type McpToolDTO,
} from '@/lib/api';

type TabKey = 'mcp' | 'tools';

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const [tab, setTab] = useState<TabKey>('mcp');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[300] flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="설정"
    >
      <div
        className="w-[720px] max-w-[92vw] h-[78vh] max-h-[640px] bg-f-surface rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-f-border flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-f-t1">설정</span>
            <span className="text-[10px] text-f-t4">MCP 서버 · 도구</span>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-7 h-7 border-none bg-f-surface2 rounded-md cursor-pointer flex items-center justify-center text-f-t3 hover:text-f-t1 hover:bg-f-border transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 border-b border-f-border flex items-center gap-1 shrink-0">
          <TabButton active={tab === 'mcp'} onClick={() => setTab('mcp')} icon={<Server size={12} />} label="MCP 서버" />
          <TabButton active={tab === 'tools'} onClick={() => setTab('tools')} icon={<Wrench size={12} />} label="연결된 도구" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto cp-scroll p-5">
          {tab === 'mcp' && <McpServersTab />}
          {tab === 'tools' && <McpToolsTab />}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────── 공통 UI ────────────────────── */

function TabButton({
  active, onClick, icon, label,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'h-9 px-3 inline-flex items-center gap-1.5 text-[12px] font-medium border-0 bg-transparent cursor-pointer transition-colors',
        '-mb-px border-b-2',
        active ? 'text-f-t1 border-f-t2' : 'text-f-t4 border-transparent hover:text-f-t2',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-1">
      <label className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-f-t3">
        {children}
      </label>
      {hint && <span className="text-[10px] text-f-t4">{hint}</span>}
    </div>
  );
}

const inputBase =
  'w-full h-9 px-2.5 bg-f-surface border border-f-border rounded-md text-[12px] text-f-t1 outline-none ' +
  'focus:border-f-accent focus:ring-2 focus:ring-f-accent/15 transition-colors placeholder:text-f-t4';

function Banner({
  kind, children,
}: { kind: 'info' | 'success' | 'error' | 'warn'; children: React.ReactNode }) {
  const color = {
    info:    'bg-f-accent-light text-f-accent border-f-accent/30',
    success: 'bg-green-50 text-f-success border-green-200 dark:bg-green-950/40 dark:border-green-900/50',
    error:   'bg-red-50 text-f-danger border-red-200 dark:bg-red-950/40 dark:border-red-900/50',
    warn:    'bg-amber-50 text-f-warn border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50',
  }[kind];
  return (
    <div className={`text-[11.5px] px-2.5 py-2 rounded-md border flex items-start gap-2 ${color}`}>
      {kind === 'success' && <CheckCircle2 size={13} className="shrink-0 mt-0.5" />}
      {(kind === 'error' || kind === 'warn') && <AlertCircle size={13} className="shrink-0 mt-0.5" />}
      <span className="leading-snug">{children}</span>
    </div>
  );
}

/* ────────────────────── MCP 서버 탭 ────────────────────── */

function McpServersTab() {
  const [servers, setServers] = useState<McpServerDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setServers(await api.getMcpServers());
    } catch (e) {
      setError(e instanceof Error ? e.message : '서버 목록을 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const reconnect = async () => {
    setBusyAction('reconnect');
    setError(null);
    try {
      setServers(await api.reconnectMcpServers());
    } catch (e) {
      setError(e instanceof Error ? e.message : '재연결 실패');
    } finally {
      setBusyAction(null);
    }
  };

  const remove = async (name: string) => {
    if (!confirm(`'${name}' MCP 서버를 삭제할까요?`)) return;
    setBusyAction(`del:${name}`);
    setError(null);
    try {
      await api.deleteMcpServer(name);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제 실패');
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) return <LoadingRow label="서버 목록 불러오는 중…" />;

  return (
    <div className="flex flex-col gap-3">
      {error && <Banner kind="error">{error}</Banner>}

      <div className="flex items-center justify-between">
        <div className="text-[11px] text-f-t3">
          {servers?.length ?? 0}개 서버 등록됨 · {servers?.filter(s => s.connected).length ?? 0}개 연결됨
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={reconnect}
            disabled={busyAction !== null}
            className="h-7 px-2.5 inline-flex items-center gap-1 text-[11px] text-f-t2 bg-f-surface2 border border-f-border2 rounded-md hover:bg-f-border transition-colors disabled:opacity-50 cursor-pointer"
          >
            {busyAction === 'reconnect'
              ? <Loader2 size={11} className="animate-spin" />
              : <RefreshCw size={11} />}
            재연결
          </button>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="h-7 px-2.5 inline-flex items-center gap-1 text-[11px] font-medium bg-f-invert-bg text-f-invert-fg rounded-md hover:bg-f-invert-bg-hover transition-colors shadow-flat cursor-pointer"
          >
            <Plus size={11} />
            서버 추가
          </button>
        </div>
      </div>

      <div className="border border-f-border rounded-md divide-y divide-f-border bg-f-surface overflow-hidden">
        {(servers ?? []).length === 0 && (
          <div className="px-3 py-6 text-center text-[11.5px] text-f-t4">
            등록된 MCP 서버가 없습니다. 우측 상단에서 추가하세요.
          </div>
        )}
        {(servers ?? []).map(s => (
          <div key={s.name} className="px-3 py-2.5 flex items-center gap-3">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.connected ? 'bg-f-success' : 'bg-f-border2'}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-f-t1 truncate">{s.name}</span>
                <span className="text-[9.5px] font-mono uppercase tracking-wider text-f-t4">{s.transport}</span>
                {s.connected && (
                  <span className="text-[9.5px] text-f-success">· 도구 {s.tool_count}개</span>
                )}
                {!s.connected && (
                  <span className="text-[9.5px] text-f-warn">· 연결 안 됨</span>
                )}
              </div>
              <div className="text-[10.5px] font-mono text-f-t3 truncate mt-0.5">
                {s.transport === 'stdio'
                  ? `${s.command ?? ''} ${(s.args ?? []).join(' ')}`.trim() || '—'
                  : s.url || '—'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void remove(s.name)}
              disabled={busyAction === `del:${s.name}`}
              aria-label="서버 삭제"
              className="w-7 h-7 inline-flex items-center justify-center text-f-t3 hover:text-f-danger hover:bg-f-surface2 rounded-md border-none bg-transparent cursor-pointer transition-colors disabled:opacity-50"
            >
              {busyAction === `del:${s.name}`
                ? <Loader2 size={12} className="animate-spin" />
                : <Trash2 size={12} />}
            </button>
          </div>
        ))}
      </div>

      {adding && (
        <AddServerForm
          onCancel={() => setAdding(false)}
          onSaved={async () => {
            setAdding(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

function AddServerForm({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void | Promise<void> }) {
  const [name, setName] = useState('');
  const [transport, setTransport] = useState<'stdio' | 'sse'>('stdio');
  const [command, setCommand] = useState('');
  const [argsText, setArgsText] = useState('');
  const [envText, setEnvText] = useState('');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const args = argsText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
      let env: Record<string, string> | undefined;
      if (envText.trim()) {
        env = {};
        for (const line of envText.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const [k, ...rest] = trimmed.split('=');
          if (!k) continue;
          env[k.trim()] = rest.join('=').trim();
        }
      }
      const payload: McpServerCreatePayload = transport === 'stdio'
        ? { name, transport, command, args, env }
        : { name, transport, url };
      await api.createMcpServer(payload);
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : '추가 실패');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="border border-f-border rounded-md bg-f-bg p-3 flex flex-col gap-2.5"
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold text-f-t2">새 MCP 서버 추가</div>
        <button
          type="button"
          onClick={onCancel}
          className="text-[10.5px] text-f-t4 hover:text-f-t2 bg-transparent border-0 cursor-pointer"
        >
          취소
        </button>
      </div>

      {error && <Banner kind="error">{error}</Banner>}

      <div className="grid grid-cols-[1fr_120px] gap-2">
        <div>
          <FieldLabel>서버 이름</FieldLabel>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="my_mcp"
            pattern="[A-Za-z0-9_\-]+"
            required
            className={inputBase + ' font-mono'}
          />
        </div>
        <div>
          <FieldLabel>Transport</FieldLabel>
          <select
            value={transport}
            onChange={e => setTransport(e.target.value as 'stdio' | 'sse')}
            className={inputBase + ' appearance-none cursor-pointer'}
          >
            <option value="stdio">stdio</option>
            <option value="sse">sse</option>
          </select>
        </div>
      </div>

      {transport === 'stdio' ? (
        <>
          <div>
            <FieldLabel>Command (실행 파일 경로)</FieldLabel>
            <input
              type="text"
              value={command}
              onChange={e => setCommand(e.target.value)}
              placeholder="/usr/bin/python"
              required
              className={inputBase + ' font-mono'}
            />
          </div>
          <div>
            <FieldLabel hint="줄바꿈으로 구분">Args</FieldLabel>
            <textarea
              value={argsText}
              onChange={e => setArgsText(e.target.value)}
              rows={3}
              placeholder={'-m\nmy_mcp_module'}
              className={inputBase.replace('h-9', 'min-h-[72px] py-2') + ' font-mono resize-y'}
            />
          </div>
          <div>
            <FieldLabel hint="KEY=VALUE, 줄바꿈으로 구분 (선택)">환경 변수</FieldLabel>
            <textarea
              value={envText}
              onChange={e => setEnvText(e.target.value)}
              rows={2}
              placeholder="PYTHONPATH=/path/to/src"
              className={inputBase.replace('h-9', 'min-h-[56px] py-2') + ' font-mono resize-y'}
            />
          </div>
        </>
      ) : (
        <div>
          <FieldLabel>SSE URL</FieldLabel>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://mcp.example.com/sse"
            required
            className={inputBase + ' font-mono'}
          />
        </div>
      )}

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="h-8 px-3 bg-f-invert-bg border-none rounded-md text-f-invert-fg text-[11px] font-medium cursor-pointer flex items-center gap-1.5 hover:bg-f-invert-bg-hover transition-colors disabled:opacity-50 shadow-flat"
        >
          {submitting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          {submitting ? '추가 중…' : '추가하기'}
        </button>
      </div>
    </form>
  );
}

/* ────────────────────── 도구 탭 ────────────────────── */

function McpToolsTab() {
  const [tools, setTools] = useState<McpToolDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTools(await api.getMcpTools());
    } catch (e) {
      setError(e instanceof Error ? e.message : '도구 목록을 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = (tools ?? []).filter(t =>
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.server.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
    const map = new Map<string, McpToolDTO[]>();
    for (const t of filtered) {
      if (!map.has(t.server)) map.set(t.server, []);
      map.get(t.server)!.push(t);
    }
    return Array.from(map.entries());
  }, [tools, query]);

  if (loading) return <LoadingRow label="도구 목록 불러오는 중…" />;

  return (
    <div className="flex flex-col gap-3">
      {error && <Banner kind="error">{error}</Banner>}
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="도구·서버·설명 검색…"
        className={inputBase}
      />

      {grouped.length === 0 && (
        <div className="px-3 py-6 text-center text-[11.5px] text-f-t4 bg-f-bg border border-f-border rounded-md">
          {query ? '검색 결과 없음' : '연결된 MCP 서버가 없거나 도구가 없습니다'}
        </div>
      )}

      {grouped.map(([server, items]) => (
        <section key={server}>
          <div className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-f-t3 mb-1.5 px-0.5">
            {server} <span className="text-f-t4 font-normal normal-case tracking-normal">· {items.length}개</span>
          </div>
          <div className="border border-f-border rounded-md divide-y divide-f-border bg-f-surface overflow-hidden">
            {items.map(t => (
              <div key={t.qualified_name} className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11.5px] font-mono font-semibold text-f-t1">{t.name}</span>
                </div>
                {t.description && (
                  <div className="text-[11px] text-f-t3 leading-snug mt-0.5">{t.description}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function LoadingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-f-t4 text-[11.5px]">
      <Loader2 size={14} className="animate-spin" />
      {label}
    </div>
  );
}

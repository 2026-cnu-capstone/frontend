'use client';

import { useMemo, useEffect } from 'react';
import { Check, ChevronDown, Trash2, FolderOpen, Search, Plus } from 'lucide-react';
import type { Case, CaseSort, ActiveCase, WorkflowState } from '@/types';

interface Props {
  cases: Case[];
  caseSearchQuery: string;
  setCaseSearchQuery: (v: string) => void;
  caseAnalystFilter: string;
  setCaseAnalystFilter: (v: string) => void;
  caseSort: CaseSort;
  setCaseSort: (v: CaseSort) => void;
  caseFilterMenu: string | null;
  setCaseFilterMenu: (v: string | null) => void;
  onRowClick: (c: ActiveCase) => void;
  onDelete: (id: string) => void;
  onCreate?: () => void;
}

const SORT_LABEL: Record<CaseSort, string> = {
  dateDesc: '최신순',
  dateAsc: '오래된순',
  titleAsc: '제목순',
  activityDesc: '활동순',
};

/** 워크플로 상태 → 뱃지 라벨/색상 토큰 매핑 */
const STATE_BADGE: Record<
  WorkflowState,
  { label: string; tone: 'idle' | 'progress' | 'success' | 'danger' | 'thinking' }
> = {
  idle: { label: '대기', tone: 'idle' },
  plan_thinking: { label: '플랜 생성', tone: 'thinking' },
  strategy_review: { label: '전략 검토', tone: 'thinking' },
  strategy_edit_request: { label: '전략 수정', tone: 'thinking' },
  strategy_editing: { label: '전략 편집', tone: 'thinking' },
  mcp_plan_thinking: { label: 'MCP 계획', tone: 'thinking' },
  plan_requested: { label: '계획 요청', tone: 'thinking' },
  rejected: { label: '거부', tone: 'danger' },
  editing: { label: '편집 중', tone: 'thinking' },
  approved: { label: '승인', tone: 'progress' },
  running: { label: '실행 중', tone: 'progress' },
  done: { label: '완료', tone: 'success' },
};

const TONE_CLASS: Record<string, string> = {
  idle:
    'bg-f-surface2 border-f-border text-f-t3',
  progress:
    'bg-f-accent-light border-f-accent/30 text-f-accent',
  success:
    'bg-green-50 border-green-200 text-f-success dark:bg-green-950/40 dark:border-green-900/50',
  danger:
    'bg-red-50 border-red-200 text-f-danger dark:bg-red-950/40 dark:border-red-900/50',
  thinking:
    'bg-amber-50 border-amber-200 text-f-warn dark:bg-amber-950/40 dark:border-amber-900/50',
};

/** 케이스 ID에서 숫자 시퀀스만 추출 */
function shortSeq(id: string): string {
  const parts = id.split('-');
  return parts[parts.length - 1] ?? id;
}

/** ISO 날짜를 'YY.MM.DD' 형식으로 압축 */
function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}.${mm}.${dd}`;
}

/** 상대 시간 표시: "방금", "12분 전", "3시간 전", "2일 전", 그 외 YY.MM.DD */
function fmtRelative(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return fmtDate(iso);
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return '방금';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return fmtDate(iso);
}

/** 분석관 이름에서 아바타용 이니셜 추출 (한글은 첫 글자, 영문은 첫 두 글자) */
function initials(name: string): string {
  const n = name.trim();
  if (!n) return '?';
  // 한글 등 비-라틴 문자가 포함된 경우: 첫 글자
  if (/[^\x00-\x7F]/.test(n)) return n[0];
  // 영문: 단어별 첫 글자 최대 2개
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function CaseListView({
  cases,
  caseSearchQuery,
  setCaseSearchQuery,
  caseAnalystFilter,
  setCaseAnalystFilter,
  caseSort,
  setCaseSort,
  caseFilterMenu,
  setCaseFilterMenu,
  onRowClick,
  onDelete,
  onCreate,
}: Props) {
  /* ── 파생 데이터 ── */
  const uniqueAnalysts = useMemo(
    () =>
      [...new Set(cases.map((c) => c.analyst))].sort((a, b) =>
        a.localeCompare(b, 'ko')
      ),
    [cases]
  );

  const recentDate = useMemo(() => {
    const ts = cases
      .map((c) => new Date(c.lastActivityAt ?? c.date).getTime())
      .filter((n) => Number.isFinite(n) && n > 0);
    if (ts.length === 0) return null;
    return new Date(Math.max(...ts)).toISOString();
  }, [cases]);

  const runningCount = useMemo(
    () => cases.filter((c) => c.workflowState === 'running').length,
    [cases]
  );
  const doneCount = useMemo(
    () => cases.filter((c) => c.workflowState === 'done').length,
    [cases]
  );

  const filteredCases = useMemo(() => {
    let list = [...cases];
    const q = caseSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          String(c.id).toLowerCase().includes(q) ||
          String(c.title).toLowerCase().includes(q) ||
          String(c.analyst).toLowerCase().includes(q)
      );
    }
    if (caseAnalystFilter !== 'all')
      list = list.filter((c) => c.analyst === caseAnalystFilter);
    list.sort((a, b) => {
      if (caseSort === 'titleAsc') return a.title.localeCompare(b.title, 'ko');
      if (caseSort === 'activityDesc') {
        const aa = new Date(a.lastActivityAt ?? a.date).getTime() || 0;
        const bb = new Date(b.lastActivityAt ?? b.date).getTime() || 0;
        return bb - aa;
      }
      const da = new Date(a.date).getTime() || 0;
      const db = new Date(b.date).getTime() || 0;
      return caseSort === 'dateAsc' ? da - db : db - da;
    });
    return list;
  }, [cases, caseSearchQuery, caseAnalystFilter, caseSort]);

  /* ── 외부 클릭 시 메뉴 닫기 ── */
  useEffect(() => {
    if (!caseFilterMenu) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as Element).closest?.('[data-case-filter-root]'))
        setCaseFilterMenu(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [caseFilterMenu, setCaseFilterMenu]);

  const isFiltered = filteredCases.length !== cases.length;

  /* ── 하위 컴포넌트 ── */
  const DropMenu = ({
    menuKey,
    label,
    children,
  }: {
    menuKey: string;
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          setCaseFilterMenu(caseFilterMenu === menuKey ? null : menuKey)
        }
        className={`h-7 px-3 bg-f-surface border rounded-md flex items-center gap-1.5 text-[11px] font-medium tracking-wide cursor-pointer transition-all
          ${
            caseFilterMenu === menuKey
              ? 'border-f-accent text-f-accent shadow-[0_0_0_2px_theme(colors.f.accent-light)]'
              : 'border-f-border text-f-t2 hover:border-f-border2 hover:text-f-t1'
          }`}
      >
        {label}
        <ChevronDown
          size={10}
          className={`transition-transform duration-150 ${
            caseFilterMenu === menuKey ? 'rotate-180' : ''
          }`}
        />
      </button>
      {caseFilterMenu === menuKey && (
        <div className="absolute top-full left-0 mt-1.5 min-w-[160px] bg-f-surface border border-f-border rounded-lg shadow-modal z-[80] py-1 max-h-56 overflow-y-auto animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );

  const Opt = ({
    active,
    label,
    onPick,
  }: {
    active: boolean;
    label: string;
    onPick: () => void;
  }) => (
    <button
      type="button"
      onClick={() => {
        onPick();
        setCaseFilterMenu(null);
      }}
      className={`flex items-center w-full text-left px-3 py-1.5 text-[12px] border-none cursor-pointer gap-2
        ${
          active
            ? 'bg-f-accent-light text-f-accent font-medium'
            : 'bg-transparent text-f-t2 hover:bg-f-surface2'
        }`}
    >
      <span
        className={`w-3.5 h-3.5 flex items-center justify-center shrink-0 ${active ? '' : 'opacity-0'}`}
      >
        <Check size={10} />
      </span>
      {label}
    </button>
  );

  const StateBadge = ({ state }: { state?: WorkflowState }) => {
    const meta = STATE_BADGE[state ?? 'idle'];
    const tone = TONE_CLASS[meta.tone];
    const pulse = meta.tone === 'progress' || meta.tone === 'thinking';
    return (
      <span
        className={`inline-flex items-center gap-1 h-5 px-1.5 rounded border text-[10px] font-medium tracking-wide ${tone}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full bg-current ${pulse ? 'animate-pulse2d' : ''}`}
          aria-hidden
        />
        {meta.label}
      </span>
    );
  };

  /* ── 메인 렌더 ── */
  return (
    <div className="flex-1 flex flex-col bg-f-bg overflow-hidden">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO STAT BAR — 압축형 (py-3, 32px 숫자)
          전체 케이스 수 + 보조 스탯 (실행중/완료 추가)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="bg-f-surface border-b border-f-border shrink-0 px-6 py-3">
        <div className="flex items-end justify-between">
          {/* 좌: 큰 숫자 + 레이블 */}
          <div className="flex items-end gap-5">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-f-t4 mb-0.5">
                케이스 인벤토리
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-bold leading-none text-f-t1 font-mono tabular-nums">
                  {filteredCases.length}
                </span>
                {isFiltered && (
                  <span className="text-[14px] text-f-t4 font-mono">
                    /{cases.length}
                  </span>
                )}
              </div>
            </div>

            {/* 구분선 */}
            <div className="w-px h-9 bg-f-border mb-0.5" aria-hidden />

            {/* 보조 스탯 — 실행중/완료/분석관/최근활동 */}
            <dl className="flex gap-5 mb-0.5">
              {[
                { label: '실행 중', value: String(runningCount), tone: runningCount > 0 ? 'text-f-warn' : 'text-f-t3' },
                { label: '완료', value: String(doneCount), tone: 'text-f-success' },
                { label: '분석관', value: String(uniqueAnalysts.length), tone: 'text-f-t2' },
                { label: '최근 활동', value: recentDate ? fmtRelative(recentDate) : '—', tone: 'text-f-t2' },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5">
                  <dt className="text-[10px] text-f-t4 tracking-[0.1em] uppercase font-medium">
                    {s.label}
                  </dt>
                  <dd className={`text-[15px] font-semibold font-mono tabular-nums leading-none ${s.tone}`}>
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          필터 툴바 — 검색 통합 (h-12)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div
        data-case-filter-root
        className={`bg-f-bg border-b border-f-border h-12 flex items-center px-6 gap-2 shrink-0 ${
          caseFilterMenu ? 'z-40 relative' : 'z-[1]'
        }`}
      >
        <span className="text-[10px] text-f-t4 tracking-[0.1em] uppercase font-medium mr-1">
          필터
        </span>

        <DropMenu
          menuKey="analyst"
          label={caseAnalystFilter === 'all' ? '분석관' : caseAnalystFilter}
        >
          <Opt
            active={caseAnalystFilter === 'all'}
            label="전체"
            onPick={() => setCaseAnalystFilter('all')}
          />
          {uniqueAnalysts.map((name) => (
            <Opt
              key={name}
              active={caseAnalystFilter === name}
              label={name}
              onPick={() => setCaseAnalystFilter(name)}
            />
          ))}
        </DropMenu>

        <DropMenu menuKey="sort" label={SORT_LABEL[caseSort]}>
          <Opt
            active={caseSort === 'dateDesc'}
            label="최신순"
            onPick={() => setCaseSort('dateDesc')}
          />
          <Opt
            active={caseSort === 'dateAsc'}
            label="오래된순"
            onPick={() => setCaseSort('dateAsc')}
          />
          <Opt
            active={caseSort === 'activityDesc'}
            label="활동순"
            onPick={() => setCaseSort('activityDesc')}
          />
          <Opt
            active={caseSort === 'titleAsc'}
            label="제목순"
            onPick={() => setCaseSort('titleAsc')}
          />
        </DropMenu>

        {(caseAnalystFilter !== 'all' || caseSearchQuery.trim()) && (
          <button
            type="button"
            onClick={() => {
              setCaseAnalystFilter('all');
              setCaseSearchQuery('');
            }}
            className="ml-1 h-5 px-2 text-[10px] text-f-t3 border border-f-border rounded hover:text-f-danger hover:border-f-danger transition-colors"
          >
            초기화
          </button>
        )}

        {/* 검색 — 우측 정렬 */}
        <div className="ml-auto relative w-72">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-f-t4 pointer-events-none"
          />
          <input
            type="search"
            placeholder="검색 (ID · 제목 · 분석관)"
            value={caseSearchQuery}
            onChange={(e) => setCaseSearchQuery(e.target.value)}
            className="w-full h-7 bg-f-surface border border-f-border rounded-md pl-7 pr-2 text-[12px] text-f-t1 placeholder:text-f-t4 outline-none focus:border-f-accent transition-colors"
          />
        </div>

        {/* 상시 카운트 */}
        <span className="text-[11px] text-f-t3 tabular-nums font-mono whitespace-nowrap">
          <span className="text-f-t1 font-semibold">{filteredCases.length}</span>
          <span className="text-f-t4"> / {cases.length}</span>
          <span className="text-f-t4 mx-1.5">·</span>
          <span className="text-f-t3">{SORT_LABEL[caseSort]}</span>
        </span>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          리치 리스트 — 각 행 h-14, 상태 뱃지 + 아바타 + 활동시간
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex-1 overflow-auto">
        {filteredCases.length === 0 ? (
          /* ── 빈 상태 ── */
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-f-t4">
            <FolderOpen size={40} strokeWidth={1.2} />
            <p className="text-[13px]">
              {caseSearchQuery || caseAnalystFilter !== 'all'
                ? '검색·필터 조건에 맞는 케이스가 없습니다.'
                : '케이스가 없습니다.'}
            </p>
          </div>
        ) : (
          <>
            <ul role="list" className="divide-y divide-f-border">
              {filteredCases.map((c, idx) => (
                <li key={c.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`케이스 ${c.id} ${c.title} 열기`}
                    onClick={() => onRowClick({ id: c.id, title: c.title })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onRowClick({ id: c.id, title: c.title });
                      }
                    }}
                    className="group flex items-center gap-4 px-6 h-14 cursor-pointer bg-f-surface hover:bg-f-surface2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f-accent focus-visible:ring-inset"
                  >
                    {/* ① 시퀀스 번호 */}
                    <span
                      className="w-7 text-right text-[11px] font-mono text-f-t4 tabular-nums shrink-0 group-hover:text-f-t3 transition-colors select-none"
                      aria-hidden
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>

                    {/* ② 분석관 이니셜 아바타 */}
                    <span
                      className="w-7 h-7 shrink-0 rounded-full bg-f-accent-light text-f-accent text-[11px] font-semibold flex items-center justify-center select-none"
                      title={c.analyst}
                      aria-hidden
                    >
                      {initials(c.analyst)}
                    </span>

                    {/* ③ 메인 콘텐츠 — 제목 + 메타 row */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[14px] font-semibold text-f-t1 leading-tight truncate group-hover:text-f-accent transition-colors">
                          {c.title}
                        </p>
                        <StateBadge state={c.workflowState} />
                      </div>

                      {/* 메타: ID · 분석관 · 생성일 */}
                      <div className="flex items-center gap-2 text-[11px] text-f-t4">
                        <span className="font-mono text-f-t3">{c.id}</span>
                        <span className="text-f-border">·</span>
                        <span className="text-f-t3">{c.analyst}</span>
                        <span className="text-f-border">·</span>
                        <span className="font-mono">생성 {fmtDate(c.date)}</span>
                      </div>
                    </div>

                    {/* ④ 우측: 마지막 활동 + 삭제 */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-f-t4 tracking-[0.08em] uppercase mb-0.5">
                          마지막 활동
                        </p>
                        <p className="text-[12px] font-mono tabular-nums text-f-t2">
                          {fmtRelative(c.lastActivityAt ?? c.date)}
                        </p>
                      </div>

                      {/* 삭제 — 상시 dim, hover 시 강조 */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(c.id);
                        }}
                        aria-label={`${c.id} 삭제`}
                        tabIndex={0}
                        className="w-8 h-8 rounded-md flex items-center justify-center border border-transparent text-f-t4 opacity-30 group-hover:opacity-100 hover:text-f-danger hover:bg-f-surface hover:border-f-border focus-visible:opacity-100 transition-all shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* 케이스 적을 때 하단 빈 영역 — 점선 "새 케이스 추가" 행 */}
            {onCreate && filteredCases.length <= 8 && (
              <button
                type="button"
                onClick={onCreate}
                className="w-full h-14 flex items-center justify-center gap-2 border-t border-dashed border-f-border bg-f-bg text-f-t4 text-[12px] hover:text-f-accent hover:bg-f-accent-light/40 hover:border-f-accent transition-colors"
              >
                <Plus size={14} />
                새 케이스 추가
              </button>
            )}

            {/* 하단 도트 패턴 채움 — 시각적 마무리 */}
            <div
              className="h-full min-h-[80px] bg-f-bg"
              style={{
                backgroundImage:
                  'radial-gradient(circle, var(--f-dot) 1px, transparent 1px)',
                backgroundSize: '14px 14px',
                opacity: 0.35,
              }}
              aria-hidden
            />
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useMemo, useEffect } from 'react';
import { Check, ChevronDown, Trash2, FolderOpen, Search } from 'lucide-react';
import type { Case, CaseSort, ActiveCase } from '@/types';

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
}

const SORT_LABEL: Record<string, string> = {
  dateDesc: '최신순',
  dateAsc: '오래된순',
  titleAsc: '제목순',
};

/** 케이스 ID에서 숫자 시퀀스만 추출 (예: DF-2026-0425 → 0425) */
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
      .map((c) => new Date(c.date).getTime())
      .filter((n) => Number.isFinite(n) && n > 0);
    if (ts.length === 0) return null;
    return new Date(Math.max(...ts)).toISOString().slice(0, 10);
  }, [cases]);

  const filteredCases = useMemo(() => {
    let list = [...cases];
    const q = caseSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          String(c.id).toLowerCase().includes(q) ||
          String(c.title).toLowerCase().includes(q) ||
          String(c.analyst).toLowerCase().includes(q) ||
          String(c.size || '').toLowerCase().includes(q)
      );
    }
    if (caseAnalystFilter !== 'all')
      list = list.filter((c) => c.analyst === caseAnalystFilter);
    list.sort((a, b) => {
      if (caseSort === 'titleAsc') return a.title.localeCompare(b.title, 'ko');
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

  /* ── 메인 렌더 ── */
  return (
    <div className="flex-1 flex flex-col bg-f-bg overflow-hidden">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO STAT BAR
          전체 케이스 수를 크게 노출하는 상단 배너.
          테이블 헤더나 카드 그리드가 아닌
          "운영 대시보드" 느낌의 단일 수평 띠.
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="bg-f-surface border-b border-f-border shrink-0 px-6 py-4">
        <div className="flex items-end justify-between">
          {/* 좌: 큰 숫자 + 레이블 */}
          <div className="flex items-end gap-5">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-f-t4 mb-0.5">
                케이스 인벤토리
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-[40px] font-bold leading-none text-f-t1 font-mono tabular-nums">
                  {filteredCases.length}
                </span>
                {isFiltered && (
                  <span className="text-[16px] text-f-t4 font-mono">
                    /{cases.length}
                  </span>
                )}
              </div>
            </div>

            {/* 구분선 */}
            <div className="w-px h-10 bg-f-border mb-0.5" aria-hidden />

            {/* 보조 스탯 */}
            <dl className="flex gap-5 mb-0.5">
              {[
                { label: '분석관', value: String(uniqueAnalysts.length) },
                { label: '최근 갱신', value: recentDate ? fmtDate(recentDate) : '—' },
                { label: '총 용량', value: (() => {
                  const gb = cases.reduce((acc, c) => {
                    const m = c.size.match(/([\d.]+)\s*(GB|MB|TB)/i);
                    if (!m) return acc;
                    const n = parseFloat(m[1]);
                    const u = m[2].toUpperCase();
                    return acc + (u === 'TB' ? n * 1024 : u === 'MB' ? n / 1024 : n);
                  }, 0);
                  return gb >= 1024
                    ? `${(gb / 1024).toFixed(1)} TB`
                    : `${gb % 1 === 0 ? gb : gb.toFixed(1)} GB`;
                })() },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5">
                  <dt className="text-[10px] text-f-t4 tracking-[0.1em] uppercase font-medium">
                    {s.label}
                  </dt>
                  <dd className="text-[18px] font-semibold text-f-t2 font-mono tabular-nums leading-none">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* 우: 검색 — 히어로 레벨로 배치 */}
          <div className="relative w-80">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-f-t4 pointer-events-none"
            />
            <input
              type="search"
              placeholder="검색 (ID · 제목 · 분석관 · 용량)"
              value={caseSearchQuery}
              onChange={(e) => setCaseSearchQuery(e.target.value)}
              className="w-full h-9 bg-f-bg border border-f-border rounded-lg pl-9 pr-3 text-[13px] text-f-t1 placeholder:text-f-t4 outline-none focus:border-f-accent focus:bg-f-surface transition-colors"
            />
          </div>
        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          필터 툴바 — 히어로 아래 얇은 띠
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div
        data-case-filter-root
        className={`bg-f-bg border-b border-f-border h-10 flex items-center px-6 gap-2 shrink-0 ${
          caseFilterMenu ? 'z-40 relative' : 'z-[1]'
        }`}
      >
        <span className="text-[10px] text-f-t4 tracking-[0.1em] uppercase font-medium mr-1">
          필터
        </span>

        <DropMenu
          menuKey="analyst"
          label={
            caseAnalystFilter === 'all' ? '분석관' : caseAnalystFilter
          }
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

        {isFiltered && (
          <span className="ml-auto text-[11px] text-f-t4 tabular-nums font-mono">
            <span className="text-f-t2 font-semibold">{filteredCases.length}</span>
            {' '}/ {cases.length}
          </span>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          리치 리스트 — 각 행 80px, 타이포 계층화
          ① 좌측: 시퀀스 인덱스 (모노 / 희미)
          ② 가운데: 큰 제목(16px) + 메타 chip row
          ③ 우측: 날짜 + 삭제 버튼
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
                  className="group flex items-center gap-5 px-6 h-16 cursor-pointer bg-f-surface hover:bg-f-surface2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f-accent focus-visible:ring-inset"
                >
                  {/* ① 시퀀스 번호 */}
                  <span
                    className="w-8 text-right text-[11px] font-mono text-f-t4 tabular-nums shrink-0 group-hover:text-f-t3 transition-colors select-none"
                    aria-hidden
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  {/* ② 메인 콘텐츠 — 제목 + 메타 chip row */}
                  <div className="flex-1 min-w-0">
                    {/* 제목 */}
                    <p className="text-[15px] font-semibold text-f-t1 leading-snug truncate mb-1.5 group-hover:text-f-accent transition-colors">
                      {c.title}
                    </p>

                    {/* 메타 chip row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* ID chip */}
                      <span className="inline-flex items-center h-5 px-2 rounded bg-f-surface2 border border-f-border text-[10px] font-mono text-f-t3 tracking-wide group-hover:border-f-border2 transition-colors">
                        {c.id}
                      </span>

                      <span className="w-px h-3 bg-f-border" aria-hidden />

                      {/* 분석관 */}
                      <span className="text-[11px] text-f-t3 font-medium">
                        {c.analyst}
                      </span>

                      <span className="w-px h-3 bg-f-border" aria-hidden />

                      {/* 용량 */}
                      <span className="text-[11px] text-f-t4 font-mono tabular-nums">
                        {c.size}
                      </span>
                    </div>
                  </div>

                  {/* ③ 우측: 날짜 + 삭제 */}
                  <div className="flex items-center gap-4 shrink-0">
                    {/* 날짜 — 2줄 표현 */}
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-f-t4 tracking-[0.08em] uppercase mb-0.5">
                        생성일
                      </p>
                      <p className="text-[12px] font-mono tabular-nums text-f-t3">
                        {c.date}
                      </p>
                    </div>

                    {/* 삭제 버튼 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(c.id);
                      }}
                      aria-label={`${c.id} 삭제`}
                      tabIndex={0}
                      className="w-8 h-8 rounded-md flex items-center justify-center border border-transparent text-f-t4 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-f-danger hover:bg-f-surface hover:border-f-border transition-all shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

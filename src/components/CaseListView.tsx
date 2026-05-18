'use client';

import { useMemo, useEffect } from 'react';
import { Check, ChevronDown, Trash2 } from 'lucide-react';
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
  dateDesc: '최신순', dateAsc: '오래된순', titleAsc: '제목 (가나다)',
};

export default function CaseListView({
  cases, caseSearchQuery, setCaseSearchQuery,
  caseAnalystFilter, setCaseAnalystFilter,
  caseSort, setCaseSort,
  caseFilterMenu, setCaseFilterMenu,
  onRowClick, onDelete,
}: Props) {
  const uniqueAnalysts = useMemo(
    () => [...new Set(cases.map(c => c.analyst))].sort((a, b) => a.localeCompare(b, 'ko')),
    [cases]
  );

  const recentCase = useMemo(() => {
    const sorted = [...cases].sort((a, b) => {
      const da = new Date(a.date).getTime() || 0;
      const db = new Date(b.date).getTime() || 0;
      return db - da;
    });
    return sorted[0] ?? null;
  }, [cases]);

  const filteredCases = useMemo(() => {
    let list = [...cases];
    const q = caseSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(c =>
        String(c.id).toLowerCase().includes(q) ||
        String(c.title).toLowerCase().includes(q) ||
        String(c.analyst).toLowerCase().includes(q) ||
        String(c.size || '').toLowerCase().includes(q)
      );
    }
    if (caseAnalystFilter !== 'all') list = list.filter(c => c.analyst === caseAnalystFilter);
    list.sort((a, b) => {
      if (caseSort === 'titleAsc') return a.title.localeCompare(b.title, 'ko');
      const da = new Date(a.date).getTime() || 0;
      const db = new Date(b.date).getTime() || 0;
      return caseSort === 'dateAsc' ? da - db : db - da;
    });
    return list;
  }, [cases, caseSearchQuery, caseAnalystFilter, caseSort]);

  useEffect(() => {
    if (!caseFilterMenu) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as Element).closest?.('[data-case-filter-root]')) setCaseFilterMenu(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [caseFilterMenu, setCaseFilterMenu]);

  const DropMenu = ({ menuKey, label, children }: { menuKey: string; label: string; children: React.ReactNode }) => (
    <div className="relative">
      <button
        type="button"
        onClick={() => setCaseFilterMenu(caseFilterMenu === menuKey ? null : menuKey)}
        className={`h-7 px-2.5 bg-f-surface border rounded-[5px] flex items-center gap-1 text-[11px] text-f-t3 cursor-pointer
          ${caseFilterMenu === menuKey ? 'border-f-accent' : 'border-f-border'}`}
      >
        {label}
        <ChevronDown
          size={11}
          style={{ transform: caseFilterMenu === menuKey ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        />
      </button>
      {caseFilterMenu === menuKey && (
        <div className="absolute top-full left-0 mt-1 min-w-[168px] bg-f-surface border border-f-border rounded-md shadow-lg z-[80] py-1 max-h-60 overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );

  const Opt = ({ active, label, onPick }: { active: boolean; label: string; onPick: () => void }) => (
    <button
      type="button"
      onClick={() => { onPick(); setCaseFilterMenu(null); }}
      className={`block w-full text-left px-3 py-2 text-xs border-none cursor-pointer
        ${active ? 'bg-f-accent-light text-f-accent' : 'bg-transparent text-f-t2 hover:bg-f-surface2'}`}
    >
      {active && <Check size={11} className="inline mr-1.5 align-middle" />}
      {label}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col bg-f-bg overflow-hidden">
      <div className="bg-f-surface border-b border-f-border px-4 py-3 shrink-0">
        <div className="flex flex-wrap gap-3">
          <div className="min-w-[360px] flex-[2_1_460px]">
            <div className="text-[10px] font-semibold text-f-t4 tracking-wider uppercase mb-2">
              케이스 인벤토리
            </div>
            <div className="grid grid-cols-3 border border-f-border rounded-md overflow-hidden bg-f-surface2">
              <div className="min-w-0 h-[64px] px-3 py-2.5 bg-f-surface border-r border-f-border">
                <span className="block text-[10px] text-f-t4 mb-1 whitespace-nowrap">전체 케이스</span>
                <span className="block text-xl font-semibold text-f-accent">{cases.length}</span>
              </div>
              <div className="min-w-0 h-[64px] px-3 py-2.5 bg-f-surface border-r border-f-border">
                <span className="block text-[10px] text-f-t4 mb-1 whitespace-nowrap">등록 유형</span>
                <span className="block text-[13px] font-semibold text-f-t1 pt-1">디스크 이미지</span>
              </div>
              <div className="min-w-0 h-[64px] px-3 py-2.5 bg-f-surface">
                <span className="block text-[10px] text-f-t4 mb-1 whitespace-nowrap">분석관</span>
                <span className="block text-xl font-semibold text-f-t1">{uniqueAnalysts.length}</span>
              </div>
            </div>
          </div>

          <div className="min-w-[240px] flex-[1_1_260px] border border-f-border rounded-md bg-f-surface2 px-3 py-2.5">
            <div className="text-[10px] font-semibold text-f-t4 tracking-wider uppercase mb-2">
              분석관
            </div>
            {uniqueAnalysts.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {uniqueAnalysts.map(name => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 rounded border border-f-border bg-f-surface px-2 py-1 text-[11px] text-f-t2"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-f-t4 pt-3">등록된 분석관이 없습니다.</div>
            )}
          </div>

          <div className="min-w-[220px] flex-[1_1_240px] border border-f-border rounded-md bg-f-surface2 px-3 py-2.5">
            <div className="text-[10px] font-semibold text-f-t4 tracking-wider uppercase mb-2">
              최근 케이스
            </div>
            {recentCase ? (
              <button
                type="button"
                onClick={() => onRowClick({ id: recentCase.id, title: recentCase.title })}
                className="block w-full text-left"
              >
                <span className="block text-[13px] font-medium text-f-t1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {recentCase.title}
                </span>
                <span className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-[11px] font-mono text-f-t4">{recentCase.id}</span>
                  <span className="text-[11px] text-f-t3">{recentCase.size}</span>
                </span>
                <span className="block text-[11px] text-f-t4 mt-2">{recentCase.date}</span>
              </button>
            ) : (
              <div className="text-xs text-f-t4 pt-3">등록된 케이스가 없습니다.</div>
            )}
          </div>
        </div>
      </div>

      <div
        data-case-filter-root
        className={`h-11 bg-f-surface border-b border-f-border flex items-center px-4 gap-2.5 shrink-0 relative ${caseFilterMenu ? 'z-40' : 'z-[1]'}`}
      >
        <div className="relative w-72">
          <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
            className="absolute left-2 top-1/2 -translate-y-1/2"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="케이스 검색 (ID·제목·분석관·용량)…"
            value={caseSearchQuery}
            onChange={e => setCaseSearchQuery(e.target.value)}
            className="w-full h-7 bg-f-surface2 border border-f-border rounded-[5px] pl-7 pr-2 text-xs text-f-t1 outline-none focus:border-f-accent"
          />
        </div>

        <DropMenu menuKey="analyst" label={`분석관: ${caseAnalystFilter === 'all' ? '전체' : caseAnalystFilter}`}>
          <Opt active={caseAnalystFilter === 'all'} label="전체" onPick={() => setCaseAnalystFilter('all')} />
          {uniqueAnalysts.map(name => (
            <Opt key={name} active={caseAnalystFilter === name} label={name} onPick={() => setCaseAnalystFilter(name)} />
          ))}
        </DropMenu>

        <DropMenu menuKey="sort" label={`정렬: ${SORT_LABEL[caseSort]}`}>
          <Opt active={caseSort === 'dateDesc'} label="최신순 (생성일)" onPick={() => setCaseSort('dateDesc')} />
          <Opt active={caseSort === 'dateAsc'} label="오래된순 (생성일)" onPick={() => setCaseSort('dateAsc')} />
          <Opt active={caseSort === 'titleAsc'} label="제목 (가나다)" onPick={() => setCaseSort('titleAsc')} />
        </DropMenu>

        <div className="ml-auto text-[11px] text-f-t4">
          {cases.length}건 중 <span className="text-f-t2 font-medium">{filteredCases.length}</span>건 표시
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-f-surface border-b border-f-border sticky top-0 z-10">
              {['케이스 ID', '제목', '용량', '분석관', '생성일', ''].map((h, i) => (
                <th
                  key={i}
                  className="h-[34px] px-3.5 text-[10px] font-semibold text-f-t4 tracking-wider uppercase whitespace-nowrap"
                  style={{ width: i === 0 ? 148 : i === 2 ? 90 : i === 3 ? 88 : i === 4 ? 100 : i === 5 ? 44 : 'auto' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-9 px-3.5 text-center text-sm text-f-t4">
                  검색·필터 조건에 맞는 케이스가 없습니다.
                </td>
              </tr>
            ) : (
              filteredCases.map(c => (
                <tr
                  key={c.id}
                  onClick={() => onRowClick({ id: c.id, title: c.title })}
                  className="h-12 border-b border-f-border cursor-pointer bg-f-surface hover:bg-f-surface2 transition-colors"
                >
                  <td className="px-3.5 font-mono text-[11px] text-f-accent font-medium">{c.id}</td>
                  <td className="px-3.5 text-[13px] text-f-t1 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">{c.title}</td>
                  <td className="px-3.5 text-xs text-f-t4">{c.size}</td>
                  <td className="px-3.5 text-xs text-f-t3">{c.analyst}</td>
                  <td className="px-3.5 text-xs text-f-t4">{c.date}</td>
                  <td className="px-2">
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(c.id); }}
                      className="w-7 h-7 border-none bg-transparent rounded-[5px] flex items-center justify-center cursor-pointer text-f-t4 hover:text-f-danger hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

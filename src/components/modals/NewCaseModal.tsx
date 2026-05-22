'use client';

import { FileText, User } from 'lucide-react';

interface Props {
  newCaseTitle: string;
  setNewCaseTitle: (v: string) => void;
  newCaseAnalyst: string;
  setNewCaseAnalyst: (v: string) => void;
  onCreate: () => void;
  onCancel: () => void;
}

export default function NewCaseModal({
  newCaseTitle,
  setNewCaseTitle,
  newCaseAnalyst,
  setNewCaseAnalyst,
  onCreate,
  onCancel,
}: Props) {
  const titleOk = !!newCaseTitle.trim();
  const analystOk = !!newCaseAnalyst.trim();
  const canSubmit = titleOk && analystOk;

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && canSubmit) onCreate();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[301] flex items-center justify-center"
      onClick={onCancel}
    >
      <div
        className="w-[440px] bg-f-surface rounded-xl shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-6 pt-6 pb-4 border-b border-f-border">
          <div className="text-[16px] font-semibold text-f-t1 mb-1">새 케이스 생성</div>
          <p className="text-[12px] text-f-t3 leading-relaxed">
            케이스 ID는 자동 부여됩니다.{' '}
            <span className="text-f-t4">분석 의도와 디스크 이미지는 생성 후 빌더 채팅창에서 입력합니다.</span>
          </p>
        </div>

        {/* 폼 */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* 제목 */}
          <Field label="케이스 제목" required icon={<FileText size={12} />} hint="목록에서 한눈에 식별할 수 있는 제목">
            <input
              type="text"
              value={newCaseTitle}
              onChange={e => setNewCaseTitle(e.target.value)}
              onKeyDown={handleEnter}
              placeholder="예) 2026년 4월 김OO 랜섬웨어 감염 분석"
              autoFocus
              maxLength={255}
              className="w-full h-9 bg-f-surface2 border border-f-border rounded-md px-2.5 text-[13px] text-f-t1 outline-none focus:border-f-accent focus:bg-f-surface transition-colors"
            />
          </Field>

          {/* 분석관 */}
          <Field label="담당 분석관" required icon={<User size={12} />} hint="목록·필터·아바타에 노출">
            <input
              type="text"
              value={newCaseAnalyst}
              onChange={e => setNewCaseAnalyst(e.target.value)}
              onKeyDown={handleEnter}
              placeholder="예) 김수사"
              maxLength={64}
              className="w-full h-9 bg-f-surface2 border border-f-border rounded-md px-2.5 text-[13px] text-f-t1 outline-none focus:border-f-accent focus:bg-f-surface transition-colors"
            />
          </Field>
        </div>

        {/* 푸터 액션 */}
        <div className="px-6 py-4 border-t border-f-border flex items-center justify-between gap-2 bg-f-bg/40">
          <div className="text-[10px] text-f-t4 tracking-wide">
            {canSubmit ? (
              <span className="text-f-success">생성할 준비가 되었습니다</span>
            ) : (
              <span>
                필수:{' '}
                <span className={titleOk ? 'text-f-success' : 'text-f-warn'}>제목</span>
                {' · '}
                <span className={analystOk ? 'text-f-success' : 'text-f-warn'}>분석관</span>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="h-[34px] px-3.5 bg-f-surface2 border border-f-border2 rounded-md text-f-t2 text-xs cursor-pointer hover:bg-f-border transition-colors"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={onCreate}
              disabled={!canSubmit}
              className={`h-[34px] px-4 rounded-md text-white text-xs font-medium transition-colors
                ${canSubmit ? 'bg-f-accent cursor-pointer hover:bg-blue-700 dark:hover:bg-blue-400' : 'bg-f-border2 cursor-not-allowed'}`}
            >
              생성
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  icon,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon && <span className="text-f-t4">{icon}</span>}
        <label className="text-[11px] font-semibold text-f-t2 tracking-wide">
          {label}
          {required && <span className="text-f-danger ml-0.5">*</span>}
        </label>
        {hint && <span className="text-[10px] text-f-t4 truncate">— {hint}</span>}
      </div>
      {children}
    </div>
  );
}

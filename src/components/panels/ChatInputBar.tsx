'use client';

import { useRef, useState } from 'react';
import { Paperclip, ArrowUp } from 'lucide-react';
import { useWorkflowContext } from '@/contexts/WorkflowContext';

export default function ChatInputBar() {
  const {
    workflowState, pathStepDone, diskImageReady,
    chatInputText, setChatInputText, onIntakeSubmit, onEvidenceFilePick,
  } = useWorkflowContext();

  const evidenceFileInputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const enabled = workflowState !== 'idle' || (pathStepDone && diskImageReady);
  const canSubmit = chatInputText.trim() && pathStepDone && diskImageReady;

  return (
    <>
      <input
        ref={evidenceFileInputRef}
        type="file"
        accept=".e01,.dd,.raw,.img,.001"
        className="hidden"
        onChange={onEvidenceFilePick}
      />

      <div className="px-3 pt-2 pb-3 border-t border-f-border bg-f-surface shrink-0">
        <div
          className={[
            'flex items-center gap-1 bg-f-surface border rounded-[10px] px-1.5 h-10 transition-all duration-150',
            focused
              ? 'border-f-t2 shadow-[0_0_0_3px_rgba(17,24,39,0.04)]'
              : 'border-f-border hover:border-f-border2',
            enabled ? 'opacity-100' : 'opacity-50 pointer-events-none',
          ].join(' ')}
        >
          <button
            type="button"
            onClick={() => evidenceFileInputRef.current?.click()}
            aria-label="증거 파일 첨부"
            title="증거 파일 첨부"
            className="w-7 h-7 rounded-[6px] text-f-t4 bg-transparent border-0 cursor-pointer flex items-center justify-center hover:text-f-t1 hover:bg-f-surface2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f-accent"
          >
            <Paperclip size={14} strokeWidth={1.8} />
          </button>
          <input
            type="text"
            value={chatInputText}
            onChange={e => setChatInputText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (workflowState === 'idle' && pathStepDone && diskImageReady) onIntakeSubmit();
              }
            }}
            placeholder="메시지를 입력하세요"
            className="flex-1 bg-transparent border-none outline-none text-[12.5px] text-f-t1 placeholder:text-f-t4 px-1.5 tracking-[-0.005em]"
          />
          <button
            onClick={() => { if (workflowState === 'idle' && pathStepDone && diskImageReady) onIntakeSubmit(); }}
            aria-label="전송"
            disabled={!canSubmit}
            className={[
              'w-7 h-7 rounded-[6px] border-0 flex items-center justify-center shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f-accent',
              canSubmit
                ? 'bg-f-invert-bg text-f-invert-fg cursor-pointer hover:bg-f-invert-bg-hover shadow-flat'
                : 'bg-f-surface2 text-f-t4 cursor-default',
            ].join(' ')}
          >
            <ArrowUp size={14} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </>
  );
}

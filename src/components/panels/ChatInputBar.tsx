'use client';

import { useRef } from 'react';
import { useWorkflowContext } from '@/contexts/WorkflowContext';

export default function ChatInputBar() {
  const {
    workflowState, pathStepDone, diskImageReady,
    chatInputText, setChatInputText, onIntakeSubmit, onEvidenceFilePick,
  } = useWorkflowContext();

  const evidenceFileInputRef = useRef<HTMLInputElement>(null);
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

      <div className="px-3.5 py-2 border-t border-f-border bg-f-surface shrink-0">
        <div
          className={`flex items-center bg-f-surface2 border border-f-border rounded-md p-1 transition-opacity
            ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}
        >
          <button
            type="button"
            onClick={() => evidenceFileInputRef.current?.click()}
            className="px-1.5 py-1 text-f-t4 bg-none border-none cursor-pointer flex items-center hover:text-f-t2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input
            type="text"
            value={chatInputText}
            onChange={e => setChatInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (workflowState === 'idle' && pathStepDone && diskImageReady) onIntakeSubmit();
              }
            }}
            placeholder="메시지"
            className="flex-1 bg-transparent border-none outline-none text-xs text-f-t1 px-1.5"
          />
          <button
            onClick={() => { if (workflowState === 'idle' && pathStepDone && diskImageReady) onIntakeSubmit(); }}
            className={`w-[26px] h-[26px] rounded-full border-none flex items-center justify-center text-white shrink-0 transition-colors
              ${canSubmit ? 'bg-f-accent cursor-pointer hover:bg-blue-700' : 'bg-f-border cursor-default'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 1 }}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

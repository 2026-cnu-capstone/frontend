/**
 * 분석 패널 스레드의 발화 주체 라벨.
 * Linear 톤: 좌측 dot + 작은 라벨, 위쪽 여백 통일.
 */
interface Props {
  kind: 'agent' | 'system' | 'user';
}

const PRESET = {
  agent:  { dot: 'bg-f-accent',  label: 'Agent',  text: 'text-f-t3' },
  system: { dot: 'bg-f-danger',  label: '시스템',  text: 'text-f-danger' },
  user:   { dot: 'bg-f-t3',      label: '분석관',  text: 'text-f-t3' },
} as const;

export default function MessageLabel({ kind }: Props) {
  const p = PRESET[kind];
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} aria-hidden />
      <span className={`text-[10px] font-semibold tracking-wider uppercase ${p.text}`}>
        {p.label}
      </span>
    </div>
  );
}

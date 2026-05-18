interface Props {
  label: string;
}

export default function PulseLoader({ label }: Props) {
  return (
    <div className="bg-f-surface border border-f-border rounded-md p-3 flex items-center gap-2">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full bg-f-accent ${
              i === 0 ? 'animate-pulse2' : i === 1 ? 'animate-pulse2d' : 'animate-pulse2e'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-f-t3">{label}</span>
    </div>
  );
}

import { getDiskImageMetaRows } from '@/lib/utils';

interface Props {
  path: string;
  check: { ok: boolean; format: string };
}

export default function MetaBlock({ path, check }: Props) {
  const rows = getDiskImageMetaRows(path, check);
  if (!rows.length) return null;
  return (
    <div className="mt-2.5 bg-f-surface border border-f-border rounded-md px-3 py-2.5">
      <div className="text-[9px] font-bold tracking-widest uppercase text-f-t4 mb-2">
        디스크 이미지 메타데이터
      </div>
      <dl className="flex flex-col gap-1.5">
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="grid gap-2 text-[11px] items-start"
            style={{ gridTemplateColumns: '118px 1fr' }}
          >
            <dt className="text-f-t4 font-medium">{label}</dt>
            <dd className="text-f-t2 leading-snug break-words" title={value}>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

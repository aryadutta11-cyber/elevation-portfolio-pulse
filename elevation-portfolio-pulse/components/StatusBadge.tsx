import { STATUS_COLORS, type Status } from '../lib/status';

const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string; pulse: boolean }
> = {
  hot: { label: 'Hot', color: STATUS_COLORS.hot, pulse: true },
  watch: { label: 'Watch', color: STATUS_COLORS.watch, pulse: false },
  stable: { label: 'Stable', color: STATUS_COLORS.stable, pulse: false },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
      style={{
        backgroundColor: `${config.color}1a`,
        borderColor: `${config.color}33`,
        color: config.color,
      }}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full${config.pulse ? ' status-dot-pulse' : ''}`}
        style={
          {
            backgroundColor: config.color,
            '--pulse-color': `${config.color}73`,
          } as React.CSSProperties
        }
      />
      {config.label}
    </span>
  );
}

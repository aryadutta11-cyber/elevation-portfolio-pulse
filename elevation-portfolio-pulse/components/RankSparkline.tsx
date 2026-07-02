import type { AppRank } from '../lib/types';

const PLATFORM_LABEL: Record<AppRank['platform'], string> = {
  ios: 'App Store',
  android: 'Google Play',
};

/**
 * Per-platform app-store standing tiles.
 *
 * Mirrors the dashboard's null-vs-zero convention: `ranks === null` means the
 * signal has never been fetched (em dash / "awaiting refresh" framing), while
 * a fetched-but-null rating renders as "—" inside its tile.
 */
export function RankSparkline({ ranks }: { ranks: AppRank[] | null }) {
  if (ranks === null) {
    return (
      <p className="text-sm text-ec-glass-1/60">
        &mdash; App-store data hasn&rsquo;t been fetched yet. It will appear
        after the next data refresh.
      </p>
    );
  }

  if (ranks.length === 0) {
    return (
      <p className="text-sm text-ec-glass-1/60">
        No app-store listing tracked for this company.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {ranks.map((r) => (
        <div
          key={r.platform}
          className="glass-card glass-sheen rounded-2xl px-5 py-4"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ec-glass-1/60">
            {PLATFORM_LABEL[r.platform]}
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <p className="text-3xl font-semibold tabular-nums tracking-tight text-ec-cream">
              {r.rating !== null ? (
                <>
                  <span aria-hidden className="mr-1 text-xl text-ec-blue">
                    &#9733;
                  </span>
                  {r.rating.toFixed(1)}
                </>
              ) : (
                <span className="text-ec-glass-1/50">&mdash;</span>
              )}
            </p>
            {r.rank !== null && (
              <p className="text-sm text-ec-glass-1/60">
                #{r.rank} in category
              </p>
            )}
          </div>
          <p className="mt-2 text-xs text-ec-glass-1/40">
            {r.rating !== null || r.rank !== null
              ? 'Store rating'
              : 'No rating reported'}
          </p>
        </div>
      ))}
    </div>
  );
}

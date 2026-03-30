import type { RouteSummary as RouteSummaryType } from "@/types/route";

type RouteSummaryProps = {
  summary: RouteSummaryType;
};

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${meters}m`;
}

export function RouteSummary({ summary }: RouteSummaryProps) {
  return (
    <div>
      <div className="route-stats-grid">
        <div className="route-stat">
          <div className="route-stat-value">
            {formatDistance(summary.distanceMeters)}
          </div>
          <div className="route-stat-label">総距離</div>
        </div>
        <div className="route-stat">
          <div className="route-stat-value">{summary.estimatedMinutes}分</div>
          <div className="route-stat-label">推定時間</div>
        </div>
        <div className="route-stat">
          <div className="route-stat-value">{summary.sceneryScore}</div>
          <div className="route-stat-label">景観スコア</div>
        </div>
        <div className="route-stat">
          <div className="route-stat-value">{summary.trafficLightScore}</div>
          <div className="route-stat-label">信号回避</div>
        </div>
      </div>
    </div>
  );
}

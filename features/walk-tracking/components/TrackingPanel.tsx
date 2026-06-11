"use client";

import { SectionCard } from "@/components/ui/SectionCard";
import { Button } from "@/components/ui/Button";
import { formatDistance, formatDuration, formatPace } from "@/lib/format/walk";
import type { GpsTracking } from "../hooks/useGpsTracking";

type TrackingPanelProps = {
  tracking: GpsTracking;
};

/** これより精度（メートル）が悪いと現在地が不正確な旨を注意表示する */
const POOR_ACCURACY_THRESHOLD_METERS = 30;

export function TrackingPanel({ tracking }: TrackingPanelProps) {
  const {
    isTracking,
    walkedMeters,
    elapsedSeconds,
    accuracyMeters,
    isScreenLockHeld,
    error,
    startTracking,
    stopTracking,
  } = tracking;

  const pace = formatPace(walkedMeters, elapsedSeconds);
  const hasPoorAccuracy =
    accuracyMeters !== null && accuracyMeters > POOR_ACCURACY_THRESHOLD_METERS;

  return (
    <SectionCard title="散歩トラッキング">
      {!isTracking ? (
        <div className="tracking-idle">
          <p className="form-hint">
            現在地を追跡して、歩いた軌跡と距離をこの画面に記録します。
          </p>
          <Button onClick={startTracking} fullWidth>
            ▶ 散歩をスタート
          </Button>
        </div>
      ) : (
        <div className="tracking-active">
          <div className="tracking-stats">
            <div className="tracking-stat">
              <div className="tracking-stat-value">
                {formatDistance(walkedMeters)}
              </div>
              <div className="tracking-stat-label">歩行距離</div>
            </div>
            <div className="tracking-stat">
              <div className="tracking-stat-value">
                {formatDuration(elapsedSeconds)}
              </div>
              <div className="tracking-stat-label">経過時間</div>
            </div>
            <div className="tracking-stat">
              <div className="tracking-stat-value">{pace ?? "—"}</div>
              <div className="tracking-stat-label">平均ペース</div>
            </div>
          </div>

          {accuracyMeters !== null && (
            <p className="tracking-accuracy" role="status">
              現在地の精度: 約{Math.round(accuracyMeters)}m
              {hasPoorAccuracy && "（精度が低下しています）"}
            </p>
          )}

          {!isScreenLockHeld && (
            <p className="form-hint">
              ※ 画面が消えると記録が止まります。画面はつけたままにしてください。
            </p>
          )}

          <Button variant="secondary" onClick={stopTracking} fullWidth>
            ■ 散歩を終了
          </Button>
        </div>
      )}

      {error !== null && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </SectionCard>
  );
}

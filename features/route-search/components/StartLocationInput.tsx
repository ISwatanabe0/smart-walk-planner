"use client";

import { useEffect, useRef } from "react";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import type { Coordinate } from "@/types/map";

type StartLocationInputProps = {
  coordinate: Coordinate | null;
  onCoordinateChange: (coordinate: Coordinate | null) => void;
};

export function StartLocationInput({
  coordinate,
  onCoordinateChange,
}: StartLocationInputProps) {
  const {
    coordinate: gpsCoordinate,
    isLocating: gpsIsLocating,
    error: gpsError,
    getCurrentLocation,
  } = useCurrentLocation();

  // onCoordinateChange は親の再レンダーごとに識別子が変わるため、
  // 同一のGPS座標で通知を繰り返さないよう最後に通知した座標を記録する
  const lastNotifiedRef = useRef<Coordinate | null>(null);

  useEffect(() => {
    if (gpsCoordinate !== null && lastNotifiedRef.current !== gpsCoordinate) {
      lastNotifiedRef.current = gpsCoordinate;
      onCoordinateChange(gpsCoordinate);
    }
  }, [gpsCoordinate, onCoordinateChange]);

  return (
    <div className="start-location">
      <button
        type="button"
        className="btn btn-primary btn-full"
        onClick={getCurrentLocation}
        disabled={gpsIsLocating}
      >
        {gpsIsLocating ? "現在地を取得中..." : "📍 現在地を使う"}
      </button>

      <p className="form-hint">または、地図をタップして出発地点を選べます</p>

      {coordinate !== null ? (
        <div className="location-status" role="status">
          <span>
            ✅ 出発地点を設定しました（地図のピンをドラッグすると微調整できます）
          </span>
          <button
            type="button"
            className="location-clear"
            onClick={() => onCoordinateChange(null)}
          >
            解除
          </button>
        </div>
      ) : (
        <p className="location-status-empty">出発地点はまだ設定されていません</p>
      )}

      {gpsError !== null && (
        <p className="field-error" role="alert">
          {gpsError}
        </p>
      )}
    </div>
  );
}

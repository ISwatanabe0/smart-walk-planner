"use client";

import type { Coordinate } from "@/types/map";

type EndLocationInputProps = {
  coordinate: Coordinate | null;
  onCoordinateChange: (coordinate: Coordinate | null) => void;
};

export function EndLocationInput({
  coordinate,
  onCoordinateChange,
}: EndLocationInputProps) {
  return (
    <div className="start-location">
      <p className="form-hint">地図をタップしてゴール地点を選べます</p>

      {coordinate !== null ? (
        <div className="location-status" role="status">
          <span>
            🏁 ゴール地点を設定しました（地図のピンをドラッグすると微調整できます）
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
        <p className="location-status-empty">
          ゴール地点はまだ設定されていません
        </p>
      )}
    </div>
  );
}

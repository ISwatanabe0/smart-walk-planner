"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { WALKING_SPEED_METERS_PER_MINUTE } from "@/constants/defaultValues";

type DistanceTimeInputProps = {
  distanceMeters: number;
  durationMinutes: number | null;
  onDistanceChange: (distanceMeters: number) => void;
  onDurationChange: (durationMinutes: number | null) => void;
  errors: string[];
};

/** メートルを km 入力欄用の文字列へ（3000 → "3"、2500 → "2.5"） */
function metersToKmString(meters: number): string {
  if (meters <= 0) {
    return "";
  }
  const km = meters / 1000;
  return String(Math.round(km * 10) / 10);
}

/**
 * 距離(km)と時間(分)の入力欄。
 * どちらか一方を入力すると、徒歩速度（80m/分）でもう一方を自動計算する。
 * 入力中の空文字を許容するため、表示はローカルの文字列stateで管理する
 * （number型のcontrolled inputだと「0」が消せず入力しづらいため）。
 */
export function DistanceTimeInput({
  distanceMeters,
  durationMinutes,
  onDistanceChange,
  onDurationChange,
  errors,
}: DistanceTimeInputProps) {
  const [distanceStr, setDistanceStr] = useState(
    metersToKmString(distanceMeters)
  );
  const [durationStr, setDurationStr] = useState(
    durationMinutes !== null
      ? String(durationMinutes)
      : distanceMeters > 0
        ? String(Math.round(distanceMeters / WALKING_SPEED_METERS_PER_MINUTE))
        : ""
  );

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDistanceStr(raw);
    const km = parseFloat(raw);
    if (isNaN(km) || km <= 0) {
      setDurationStr("");
      onDistanceChange(0);
      onDurationChange(null);
      return;
    }
    const meters = Math.round(km * 1000);
    const minutes = Math.round(meters / WALKING_SPEED_METERS_PER_MINUTE);
    setDurationStr(String(minutes));
    onDistanceChange(meters);
    onDurationChange(minutes);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDurationStr(raw);
    const minutes = parseInt(raw, 10);
    if (isNaN(minutes) || minutes <= 0) {
      setDistanceStr("");
      onDistanceChange(0);
      onDurationChange(null);
      return;
    }
    const meters = minutes * WALKING_SPEED_METERS_PER_MINUTE;
    setDistanceStr(metersToKmString(meters));
    onDistanceChange(meters);
    onDurationChange(minutes);
  };

  return (
    <div>
      <div className="inline-inputs">
        <Input
          id="distanceMeters"
          label="目標距離 (km)"
          type="number"
          value={distanceStr}
          onChange={handleDistanceChange}
          placeholder="例: 3"
          min={0.1}
          step={0.1}
        />
        <Input
          id="durationMinutes"
          label="目標時間 (分)"
          type="number"
          value={durationStr}
          onChange={handleDurationChange}
          placeholder="例: 40"
          min={1}
        />
      </div>
      <p className="form-hint">
        どちらか一方を入力すると、もう一方は徒歩の速さ（分速80m）で自動計算されます
      </p>
      {errors.length > 0 && (
        <p className="field-error">{errors[0]}</p>
      )}
    </div>
  );
}

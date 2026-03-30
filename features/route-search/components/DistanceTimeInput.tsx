"use client";

import { Input } from "@/components/ui/Input";

type DistanceTimeInputProps = {
  distanceMeters: number;
  durationMinutes: number | null;
  onDistanceChange: (distanceMeters: number) => void;
  onDurationChange: (durationMinutes: number | null) => void;
  errors: string[];
};

export function DistanceTimeInput({
  distanceMeters,
  durationMinutes,
  onDistanceChange,
  onDurationChange,
  errors,
}: DistanceTimeInputProps) {
  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onDistanceChange(isNaN(value) ? 0 : value);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onDurationChange(isNaN(value) ? null : value);
  };

  return (
    <div>
      <div className="inline-inputs">
        <Input
          id="distanceMeters"
          label="目標距離 (m)"
          type="number"
          value={distanceMeters}
          onChange={handleDistanceChange}
          placeholder="3000"
          min={1}
        />
        <Input
          id="durationMinutes"
          label="目標時間 (分)"
          type="number"
          value={durationMinutes ?? ""}
          onChange={handleDurationChange}
          placeholder="任意"
          min={1}
        />
      </div>
      {errors.length > 0 && (
        <p className="field-error">{errors[0]}</p>
      )}
    </div>
  );
}

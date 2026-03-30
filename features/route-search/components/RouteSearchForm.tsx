"use client";

import { StartLocationInput } from "./StartLocationInput";
import type { RouteSearchCondition, ValidationError } from "@/types/preferences";
import type { Coordinate } from "@/types/map";

type RouteSearchFormProps = {
  value: RouteSearchCondition;
  onChange: (condition: RouteSearchCondition) => void;
  onSubmit: () => void;
  isLoading: boolean;
  errors: ValidationError[];
};

export function RouteSearchForm({
  value,
  onChange,
  onSubmit,
  isLoading,
  errors,
}: RouteSearchFormProps) {
  const startError = errors.find((e) => e.field === "start");
  const distanceError = errors.find((e) => e.field === "distanceMeters");

  const handleCoordinateChange = (coordinate: Coordinate | null) => {
    onChange({ ...value, start: coordinate });
  };

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const distanceMeters = parseInt(e.target.value, 10);
    if (!isNaN(distanceMeters)) {
      onChange({ ...value, distanceMeters });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <StartLocationInput
        coordinate={value.start}
        onCoordinateChange={handleCoordinateChange}
      />
      {startError !== undefined && <p>{startError.message}</p>}
      <div>
        <label htmlFor="distanceMeters">距離 (m)</label>
        <input
          id="distanceMeters"
          type="number"
          value={value.distanceMeters}
          onChange={handleDistanceChange}
        />
        {distanceError !== undefined && <p>{distanceError.message}</p>}
      </div>
      <button type="submit" disabled={isLoading}>
        ルートを検索
      </button>
    </form>
  );
}

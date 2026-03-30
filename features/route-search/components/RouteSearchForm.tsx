"use client";

import { StartLocationInput } from "./StartLocationInput";
import { DistanceTimeInput } from "./DistanceTimeInput";
import { PreferenceSelector } from "./PreferenceSelector";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
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
  const distanceError = errors.find((e) => e.field === "distanceMeters");

  const handleCoordinateChange = (coordinate: Coordinate | null) => {
    onChange({ ...value, start: coordinate });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <SectionCard title="出発地点">
        <StartLocationInput
          coordinate={value.start}
          onCoordinateChange={handleCoordinateChange}
        />
        {errors.find((e) => e.field === "start") !== undefined && (
          <p className="field-error">
            {errors.find((e) => e.field === "start")?.message}
          </p>
        )}
      </SectionCard>

      <SectionCard title="目標距離・時間">
        <DistanceTimeInput
          distanceMeters={value.distanceMeters}
          durationMinutes={value.durationMinutes}
          onDistanceChange={(distanceMeters) =>
            onChange({ ...value, distanceMeters })
          }
          onDurationChange={(durationMinutes) =>
            onChange({ ...value, durationMinutes })
          }
          errors={distanceError !== undefined ? [distanceError.message] : []}
        />
      </SectionCard>

      <SectionCard title="ルートの条件">
        <PreferenceSelector
          preferences={value.preferences}
          onChange={(preferences) => onChange({ ...value, preferences })}
        />
      </SectionCard>

      <Button type="submit" disabled={isLoading} fullWidth>
        {isLoading ? "生成中..." : "ルートを生成"}
      </Button>
    </form>
  );
}

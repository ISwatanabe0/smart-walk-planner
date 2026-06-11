"use client";

import { StartLocationInput } from "./StartLocationInput";
import { EndLocationInput } from "./EndLocationInput";
import { DistanceTimeInput } from "./DistanceTimeInput";
import { PreferenceSelector } from "./PreferenceSelector";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import type {
  RouteSearchCondition,
  RouteType,
  ValidationError,
} from "@/types/preferences";
import type { Coordinate } from "@/types/map";

type RouteSearchFormProps = {
  value: RouteSearchCondition;
  onChange: (condition: RouteSearchCondition) => void;
  onSubmit: () => void;
  isLoading: boolean;
  errors: ValidationError[];
};

const ROUTE_TYPE_OPTIONS: { type: RouteType; label: string }[] = [
  { type: "loop", label: "周回（出発地点に戻る）" },
  { type: "oneway", label: "片道（ゴールを指定）" },
];

export function RouteSearchForm({
  value,
  onChange,
  onSubmit,
  isLoading,
  errors,
}: RouteSearchFormProps) {
  const distanceError = errors.find((e) => e.field === "distanceMeters");
  const startError = errors.find((e) => e.field === "start");
  const endError = errors.find((e) => e.field === "end");

  const handleStartChange = (coordinate: Coordinate | null) => {
    onChange({ ...value, start: coordinate });
  };

  const handleEndChange = (coordinate: Coordinate | null) => {
    onChange({ ...value, end: coordinate });
  };

  const handleRouteTypeChange = (routeType: RouteType) => {
    onChange({ ...value, routeType });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <SectionCard title="ルートタイプ">
        <div className="route-type-toggle" role="radiogroup" aria-label="ルートタイプ">
          {ROUTE_TYPE_OPTIONS.map(({ type, label }) => (
            <label
              key={type}
              className={
                value.routeType === type
                  ? "route-type-option selected"
                  : "route-type-option"
              }
            >
              <input
                type="radio"
                name="routeType"
                value={type}
                checked={value.routeType === type}
                onChange={() => handleRouteTypeChange(type)}
              />
              {label}
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="出発地点">
        <StartLocationInput
          coordinate={value.start}
          onCoordinateChange={handleStartChange}
        />
        {startError !== undefined && (
          <p className="field-error">{startError.message}</p>
        )}
      </SectionCard>

      {value.routeType === "oneway" && (
        <SectionCard title="ゴール地点">
          <EndLocationInput
            coordinate={value.end}
            onCoordinateChange={handleEndChange}
          />
          {endError !== undefined && (
            <p className="field-error">{endError.message}</p>
          )}
        </SectionCard>
      )}

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

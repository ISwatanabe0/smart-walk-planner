"use client";

import { Checkbox } from "@/components/ui/Checkbox";
import type { RoutePreferences } from "@/types/preferences";

type PreferenceSelectorProps = {
  preferences: RoutePreferences;
  onChange: (preferences: RoutePreferences) => void;
};

const PREFERENCE_OPTIONS: {
  key: keyof RoutePreferences;
  label: string;
}[] = [
  { key: "scenery", label: "景観重視" },
  { key: "avoidTrafficLights", label: "信号回避" },
  { key: "avoidMainRoads", label: "大通り回避" },
  { key: "includeSightseeing", label: "観光名所経由" },
  { key: "loopRoute", label: "周回ルート" },
];

export function PreferenceSelector({
  preferences,
  onChange,
}: PreferenceSelectorProps) {
  const handleChange = (key: keyof RoutePreferences, checked: boolean) => {
    onChange({ ...preferences, [key]: checked });
  };

  return (
    <div className="preferences-grid">
      {PREFERENCE_OPTIONS.map(({ key, label }) => (
        <Checkbox
          key={key}
          id={`pref-${key}`}
          label={label}
          checked={preferences[key]}
          onChange={(checked) => handleChange(key, checked)}
        />
      ))}
    </div>
  );
}

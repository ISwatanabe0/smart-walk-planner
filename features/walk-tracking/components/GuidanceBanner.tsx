"use client";

import { formatDistance } from "@/lib/format/walk";
import type { TurnDirection } from "@/lib/geo/guidance";
import type { WalkGuidance } from "../hooks/useWalkGuidance";

type GuidanceBannerProps = {
  guidance: WalkGuidance;
};

const TURN_LABEL: Record<TurnDirection, { icon: string; text: string }> = {
  straight: { icon: "⬆️", text: "このまま直進" },
  "slight-right": { icon: "↗️", text: "ゆるやかに右へ" },
  right: { icon: "➡️", text: "右に曲がる" },
  "slight-left": { icon: "↖️", text: "ゆるやかに左へ" },
  left: { icon: "⬅️", text: "左に曲がる" },
  "u-turn": { icon: "🔄", text: "Uターン" },
};

/**
 * 散歩中に画面上部へ常時表示する進行方向ガイド。
 * 「どっちに進めばいいか分かりづらい」を解消するための大きな矢印＋残り距離。
 */
export function GuidanceBanner({ guidance }: GuidanceBannerProps) {
  if (!guidance.isActive) {
    return null;
  }

  if (guidance.isOffRoute) {
    return (
      <div className="guidance-banner guidance-off-route" role="status">
        <span className="guidance-icon">⚠️</span>
        <div className="guidance-body">
          <div className="guidance-text">ルートから外れています</div>
          <div className="guidance-sub">青い線（ルート）に戻りましょう</div>
        </div>
      </div>
    );
  }

  const turn =
    guidance.turn !== null ? TURN_LABEL[guidance.turn] : null;
  const remaining =
    guidance.distanceToGoalMeters !== null
      ? formatDistance(guidance.distanceToGoalMeters)
      : null;

  return (
    <div className="guidance-banner" role="status">
      <span className="guidance-icon">{turn?.icon ?? "🧭"}</span>
      <div className="guidance-body">
        <div className="guidance-text">
          {turn?.text ?? "ルートに沿って進みましょう"}
        </div>
        {remaining !== null && (
          <div className="guidance-sub">ゴールまで残り {remaining}</div>
        )}
      </div>
    </div>
  );
}

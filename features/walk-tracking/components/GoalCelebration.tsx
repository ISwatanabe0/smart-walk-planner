"use client";

import type { GoalPhase } from "@/lib/geo/guidance";

type GoalCelebrationProps = {
  phase: GoalPhase;
  distanceToGoalMeters: number | null;
};

/**
 * ゴール接近〜到着時の演出。
 *  - approaching: 画面上部に「もうすぐゴール」バナー
 *  - arrived: 全画面の達成演出（紙吹雪＋お祝いメッセージ）
 */
export function GoalCelebration({
  phase,
  distanceToGoalMeters,
}: GoalCelebrationProps) {
  if (phase === "approaching") {
    return (
      <div className="goal-approaching" role="status">
        <span className="goal-approaching-icon">🏁</span>
        <span>
          もうすぐゴール！
          {distanceToGoalMeters !== null &&
            ` 残り約${Math.round(distanceToGoalMeters)}m`}
        </span>
      </div>
    );
  }

  if (phase === "arrived") {
    return (
      <div className="goal-arrived-overlay" role="alert">
        <div className="confetti-layer" aria-hidden="true">
          {Array.from({ length: 28 }).map((_, i) => (
            <span
              key={i}
              className={`confetti confetti-${i % 6}`}
              style={{
                left: `${(i * 37) % 100}%`,
                animationDelay: `${(i % 7) * 0.22}s`,
              }}
            />
          ))}
        </div>
        <div className="goal-arrived-card">
          <div className="goal-arrived-emoji">🎉</div>
          <div className="goal-arrived-title">ゴール到着！</div>
          <div className="goal-arrived-sub">おつかれさまでした 🚶‍♂️</div>
        </div>
      </div>
    );
  }

  return null;
}

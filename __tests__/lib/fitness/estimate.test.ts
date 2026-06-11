import {
  estimateSteps,
  estimateCaloriesKcal,
  AVERAGE_STRIDE_METERS,
} from "@/lib/fitness/estimate";

describe("estimateSteps", () => {
  it("距離0以下は0歩", () => {
    expect(estimateSteps(0)).toBe(0);
    expect(estimateSteps(-100)).toBe(0);
  });

  it("距離 ÷ 平均歩幅で歩数を推定する", () => {
    // 700m ÷ 0.7m = 1000歩
    expect(estimateSteps(700)).toBe(Math.round(700 / AVERAGE_STRIDE_METERS));
    expect(estimateSteps(700)).toBe(1000);
  });

  it("3kmで概ね4000歩台になる", () => {
    const steps = estimateSteps(3000);
    expect(steps).toBeGreaterThan(4000);
    expect(steps).toBeLessThan(4400);
  });
});

describe("estimateCaloriesKcal", () => {
  it("距離0以下は0kcal", () => {
    expect(estimateCaloriesKcal(0)).toBe(0);
    expect(estimateCaloriesKcal(-50, 100)).toBe(0);
  });

  it("経過時間が長いほど消費カロリーが増える", () => {
    const fast = estimateCaloriesKcal(2000, 1200); // 20分
    const slow = estimateCaloriesKcal(2000, 2400); // 40分
    expect(slow).toBeGreaterThan(fast);
  });

  it("経過時間未指定なら徒歩速度から所要時間を推定して計算する", () => {
    // 3km → 標準だと約37.5分。正の値が返る
    const kcal = estimateCaloriesKcal(3000);
    expect(kcal).toBeGreaterThan(0);
  });

  it("3km・約38分の散歩で常識的な範囲（80〜200kcal）に収まる", () => {
    const kcal = estimateCaloriesKcal(3000, 38 * 60);
    expect(kcal).toBeGreaterThanOrEqual(80);
    expect(kcal).toBeLessThanOrEqual(200);
  });
});

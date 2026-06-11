import { WALKING_SPEED_METERS_PER_MINUTE } from "@/constants/defaultValues";

/** 平均歩幅（メートル）。成人の平均的な値 */
export const AVERAGE_STRIDE_METERS = 0.7;

/** カロリー計算に使う標準体重（kg）。将来は設定で変更できるようにする想定 */
export const DEFAULT_WEIGHT_KG = 60;

/** 普通の速さのウォーキング（約4.8km/h）の運動強度（METs） */
const WALKING_METS = 3.5;

/** 歩行距離から歩数を推定する */
export function estimateSteps(distanceMeters: number): number {
  if (distanceMeters <= 0) {
    return 0;
  }
  return Math.round(distanceMeters / AVERAGE_STRIDE_METERS);
}

/**
 * 消費カロリー（kcal）を推定する。
 * METs方式: kcal = METs × 体重(kg) × 時間(h) × 1.05
 * @param distanceMeters 歩行距離
 * @param elapsedSeconds 経過秒数（省略時は標準の徒歩速度から推定）
 */
export function estimateCaloriesKcal(
  distanceMeters: number,
  elapsedSeconds?: number
): number {
  if (distanceMeters <= 0) {
    return 0;
  }
  const hours =
    elapsedSeconds !== undefined && elapsedSeconds > 0
      ? elapsedSeconds / 3600
      : distanceMeters / WALKING_SPEED_METERS_PER_MINUTE / 60;
  return Math.round(WALKING_METS * DEFAULT_WEIGHT_KG * hours * 1.05);
}

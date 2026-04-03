import type { Coordinate } from "@/types/map";

const EARTH_RADIUS_METERS = 6371000;

/**
 * 出発点から指定の方位・距離にある座標を計算する（Haversine公式）
 * @param origin 出発座標
 * @param bearingDeg 方位角（度）: 0=北, 90=東, 180=南, 270=西
 * @param distanceMeters 距離（メートル）
 */
export function destinationPoint(
  origin: Coordinate,
  bearingDeg: number,
  distanceMeters: number
): Coordinate {
  const δ = distanceMeters / EARTH_RADIUS_METERS;
  const θ = (bearingDeg * Math.PI) / 180;
  const φ1 = (origin.lat * Math.PI) / 180;
  const λ1 = (origin.lng * Math.PI) / 180;

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    );

  return {
    lat: (φ2 * 180) / Math.PI,
    lng: (λ2 * 180) / Math.PI,
  };
}

/**
 * 2点間の直線距離をメートルで計算する（Haversine公式）
 */
export function haversineDistance(a: Coordinate, b: Coordinate): number {
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;

  const h =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

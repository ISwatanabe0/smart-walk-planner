"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { haversineDistance, initialBearing } from "@/lib/geo/destination";
import type { Coordinate } from "@/types/map";

export type GpsTracking = {
  /** トラッキング中かどうか */
  isTracking: boolean;
  /** 直近で取得した現在地（未取得なら null） */
  currentPosition: Coordinate | null;
  /** 現在地の測位精度（メートル、未取得なら null） */
  accuracyMeters: number | null;
  /** 進行方位（北=0°、時計回り。移動するまでは null） */
  headingDeg: number | null;
  /** 歩いた軌跡の座標列 */
  trail: Coordinate[];
  /** 累計歩行距離（メートル） */
  walkedMeters: number;
  /** トラッキング開始からの経過秒数 */
  elapsedSeconds: number;
  /** 画面消灯防止（Wake Lock）が有効か */
  isScreenLockHeld: boolean;
  /** 位置情報エラーのメッセージ（なければ null） */
  error: string | null;
  startTracking: () => void;
  stopTracking: () => void;
};

/**
 * これ未満の移動はGPSのゆらぎ（ノイズ）とみなし軌跡・距離に加えない。
 * 静止中も精度内で座標が揺れて距離が増え続けるのを防ぐ。
 */
const MIN_MOVE_METERS = 5;

/** これより測位精度が悪い（数値が大きい）点は軌跡に採用しない */
const MAX_ACCURACY_METERS = 50;

// Wake Lock API はブラウザの lib 型に含まれないことがあるため最小限の型を定義する
type WakeLockSentinelLike = {
  release: () => Promise<void>;
  addEventListener?: (type: "release", listener: () => void) => void;
};
type WakeLockNavigator = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
};

function geolocationErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "位置情報の使用が許可されていません。ブラウザの設定から許可してください。";
    case err.POSITION_UNAVAILABLE:
      return "現在地を取得できませんでした。電波やGPSの状況を確認してください。";
    case err.TIMEOUT:
      return "現在地の取得がタイムアウトしました。";
    default:
      return "位置情報の取得中にエラーが発生しました。";
  }
}

/**
 * watchPosition で現在地を継続取得し、軌跡・歩行距離・経過時間を記録するフック。
 * トラッキング中は Wake Lock で画面の消灯を抑止する（対応ブラウザのみ）。
 */
export function useGpsTracking(): GpsTracking {
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<Coordinate | null>(null);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [headingDeg, setHeadingDeg] = useState<number | null>(null);
  const [trail, setTrail] = useState<Coordinate[]>([]);
  const [walkedMeters, setWalkedMeters] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isScreenLockHeld, setIsScreenLockHeld] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastPointRef = useRef<Coordinate | null>(null);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current !== null) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // 解放失敗は無視（ページ離脱時などブラウザが自動解放する）
      }
      wakeLockRef.current = null;
    }
    setIsScreenLockHeld(false);
  }, []);

  const acquireWakeLock = useCallback(async () => {
    const nav = navigator as WakeLockNavigator;
    if (nav.wakeLock === undefined) {
      return;
    }
    try {
      const sentinel = await nav.wakeLock.request("screen");
      wakeLockRef.current = sentinel;
      setIsScreenLockHeld(true);
      // OSがロックを解放したら状態を同期する
      sentinel.addEventListener?.("release", () => {
        setIsScreenLockHeld(false);
      });
    } catch {
      // Wake Lock の取得失敗はトラッキング自体には影響しないため握りつぶす
    }
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startTimeRef.current = null;
    void releaseWakeLock();
    setIsTracking(false);
  }, [releaseWakeLock]);

  const startTracking = useCallback(() => {
    if (
      typeof navigator === "undefined" ||
      navigator.geolocation === undefined
    ) {
      setError("このブラウザでは位置情報を利用できません。");
      return;
    }

    setError(null);
    setTrail([]);
    setWalkedMeters(0);
    setElapsedSeconds(0);
    setCurrentPosition(null);
    setAccuracyMeters(null);
    setHeadingDeg(null);
    lastPointRef.current = null;
    startTimeRef.current = Date.now();
    setIsTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coord: Coordinate = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        const accuracy = pos.coords.accuracy;
        setCurrentPosition(coord);
        setAccuracyMeters(accuracy);

        // 精度の悪い測位は軌跡・距離に反映しない（現在地表示には使う）
        if (accuracy > MAX_ACCURACY_METERS) {
          return;
        }

        const last = lastPointRef.current;
        if (last === null) {
          lastPointRef.current = coord;
          setTrail([coord]);
          return;
        }

        const moved = haversineDistance(last, coord);
        if (moved < MIN_MOVE_METERS) {
          return;
        }
        lastPointRef.current = coord;
        setTrail((prev) => [...prev, coord]);
        setWalkedMeters((prev) => prev + moved);
        // 直前の採用点からの移動方向を進行方位とする
        setHeadingDeg(initialBearing(last, coord));
      },
      (err) => {
        setError(geolocationErrorMessage(err));
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );

    timerRef.current = setInterval(() => {
      if (startTimeRef.current !== null) {
        setElapsedSeconds(
          Math.floor((Date.now() - startTimeRef.current) / 1000)
        );
      }
    }, 1000);

    void acquireWakeLock();
  }, [acquireWakeLock]);

  // タブが再表示されたとき、OSに解放された Wake Lock を取り直す
  useEffect(() => {
    if (!isTracking) {
      return;
    }
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void acquireWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isTracking, acquireWakeLock]);

  // アンマウント時に watch・タイマー・Wake Lock を確実に後始末する
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
      void releaseWakeLock();
    };
  }, [releaseWakeLock]);

  return {
    isTracking,
    currentPosition,
    accuracyMeters,
    headingDeg,
    trail,
    walkedMeters,
    elapsedSeconds,
    isScreenLockHeld,
    error,
    startTracking,
    stopTracking,
  };
}

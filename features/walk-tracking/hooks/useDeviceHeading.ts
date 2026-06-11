"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type HeadingPermission =
  | "unknown"
  | "granted"
  | "denied"
  | "unsupported";

export type DeviceHeading = {
  /** 端末が向いている方位（北=0°、時計回り）。未取得なら null */
  heading: number | null;
  /** 方位センサーの利用許可状態 */
  permission: HeadingPermission;
  /** iOS等で許可ダイアログを出す。ユーザー操作（タップ）の中から呼ぶこと */
  requestPermission: () => Promise<void>;
};

// iOS Safari の DeviceOrientationEvent には requestPermission が生える
type DeviceOrientationEventIOS = {
  requestPermission?: () => Promise<"granted" | "denied">;
};

type CompassEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};

/** 角度を最短経路で滑らかに補間し、コンパスのジッターを抑える */
function smoothAngle(prev: number | null, next: number, factor = 0.3): number {
  if (prev === null) {
    return next;
  }
  const diff = ((next - prev + 540) % 360) - 180;
  return (prev + diff * factor + 360) % 360;
}

/** 状態更新の間隔（ミリ秒）。再レンダー過多を防ぐためコンパスを間引く */
const UPDATE_INTERVAL_MS = 150;

/**
 * 端末のコンパス方位を取得するフック。
 * Google マップのナビのように「向いている方角」へ地図を回す用途に使う。
 */
export function useDeviceHeading(): DeviceHeading {
  const [heading, setHeading] = useState<number | null>(null);
  const [permission, setPermission] = useState<HeadingPermission>("unknown");

  const smoothedRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);
  const listeningRef = useRef(false);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    const compass = event as CompassEvent;
    let raw: number | null = null;

    if (typeof compass.webkitCompassHeading === "number") {
      // iOS: 既に「北=0、時計回り」の方位
      raw = compass.webkitCompassHeading;
    } else if (event.absolute && typeof event.alpha === "number") {
      // Android(absolute): alpha は反時計回りなので方位へ変換
      raw = (360 - event.alpha) % 360;
    }

    if (raw === null) {
      return;
    }

    const now = Date.now();
    if (now - lastUpdateRef.current < UPDATE_INTERVAL_MS) {
      return;
    }
    lastUpdateRef.current = now;

    const smoothed = smoothAngle(smoothedRef.current, raw);
    smoothedRef.current = smoothed;
    setHeading(smoothed);
  }, []);

  const startListening = useCallback(() => {
    if (listeningRef.current) {
      return;
    }
    listeningRef.current = true;
    // absolute イベントが取れる端末はそちら優先、無ければ通常イベント
    window.addEventListener(
      "deviceorientationabsolute",
      handleOrientation as EventListener
    );
    window.addEventListener("deviceorientation", handleOrientation);
  }, [handleOrientation]);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      setPermission("unsupported");
      return;
    }

    const orientationApi =
      DeviceOrientationEvent as unknown as DeviceOrientationEventIOS;

    // iOS 13+ は明示的な許可が必要（ユーザー操作起点でのみ成功する）
    if (typeof orientationApi.requestPermission === "function") {
      try {
        const result = await orientationApi.requestPermission();
        if (result === "granted") {
          setPermission("granted");
          startListening();
        } else {
          setPermission("denied");
        }
      } catch {
        setPermission("denied");
      }
      return;
    }

    // Android 等は許可不要。そのまま購読する
    setPermission("granted");
    startListening();
  }, [startListening]);

  useEffect(() => {
    return () => {
      window.removeEventListener(
        "deviceorientationabsolute",
        handleOrientation as EventListener
      );
      window.removeEventListener("deviceorientation", handleOrientation);
      listeningRef.current = false;
    };
  }, [handleOrientation]);

  return { heading, permission, requestPermission };
}

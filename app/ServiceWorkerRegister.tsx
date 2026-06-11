"use client";

import { useEffect } from "react";

/**
 * Service Worker を登録するクライアントコンポーネント。
 * 開発時はキャッシュによる混乱を避けるため本番ビルドでのみ登録する。
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // 登録失敗はアプリ動作に影響しないため握りつぶす
      });
    };

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}

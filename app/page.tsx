"use client";

import { useState } from "react";
import { RouteSearchForm } from "@/features/route-search/components/RouteSearchForm";
import { RouteResultPanel } from "@/features/route-result/components/RouteResultPanel";
import { MapView } from "@/components/map/MapView";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useRouteSearch } from "@/features/route-search/hooks/useRouteSearch";
import { buildGoogleMapsUrl } from "@/features/walk-planner/services/googleMapsLinkBuilder";
import type { WalkRoute } from "@/types/route";
import type { Coordinate } from "@/types/map";

type PageView = "search" | "result" | "error";

export default function HomePage() {
  const { condition, isLoading, errors, updateCondition, submitSearch } =
    useRouteSearch();

  const [view, setView] = useState<PageView>("search");
  const [routes, setRoutes] = useState<WalkRoute[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDialogRoute, setConfirmDialogRoute] =
    useState<WalkRoute | null>(null);

  const mapCenter: Coordinate | null = condition.start;
  const selectedRoute = routes[0] ?? null;
  // 地点の選択（地図タップ／ピンのドラッグ）は検索画面でのみ有効にする
  const canSelectPoint = view === "search" && !isLoading;
  const isOneway = condition.routeType === "oneway";

  // タップ位置の振り分け: 出発地点が未設定なら出発地点、
  // 片道モードで出発地点設定済みならゴール地点を設定・更新する
  const handleMapClick = (coordinate: Coordinate) => {
    if (condition.start === null || !isOneway) {
      updateCondition({ start: coordinate });
      return;
    }
    updateCondition({ end: coordinate });
  };

  const mapHint = !canSelectPoint
    ? null
    : condition.start === null
      ? "地図をタップして出発地点を選択"
      : isOneway
        ? "地図をタップしてゴール地点を選択"
        : null;

  const handleSubmit = async () => {
    setErrorMessage(null);
    try {
      const results = await submitSearch();
      if (results.length > 0) {
        setRoutes(results);
        setView("result");
      }
      // validation errors → stay on search view, errors shown in form
    } catch {
      setErrorMessage(
        "ルート情報の取得に失敗しました。時間をおいて再試行してください。"
      );
      setView("error");
    }
  };

  const handleRetry = async () => {
    setView("search");
    await handleSubmit();
  };

  const handleOpenGoogleMaps = (route: WalkRoute) => {
    setConfirmDialogRoute(route);
  };

  const handleConfirmGoogleMaps = () => {
    if (confirmDialogRoute === null) {
      return;
    }
    const url = buildGoogleMapsUrl(confirmDialogRoute);
    if (url === null) {
      return;
    }
    window.open(url, "_blank");
    setConfirmDialogRoute(null);
  };

  return (
    <>
      <header className="app-header">SmartWalk</header>
      <main className="app-main">
        <div className="map-area">
          <MapView
            center={mapCenter}
            startMarker={condition.start}
            endMarker={isOneway ? condition.end : null}
            waypoints={selectedRoute?.waypoints ?? []}
            routeGeometry={
              view === "result" ? selectedRoute?.geometry ?? null : null
            }
            onMapClick={canSelectPoint ? handleMapClick : undefined}
            onMoveStart={
              canSelectPoint
                ? (coordinate) => updateCondition({ start: coordinate })
                : undefined
            }
            onMoveEnd={
              canSelectPoint
                ? (coordinate) => updateCondition({ end: coordinate })
                : undefined
            }
            hint={mapHint}
          />
        </div>

        <aside className="sidebar">
          <div className="sidebar-inner">
            {isLoading && (
              <LoadingSpinner
                message="ルートを作成中です..."
                subMessage="道路情報や景観ポイントを確認しています"
              />
            )}

            {!isLoading && view === "search" && (
              <RouteSearchForm
                value={condition}
                onChange={(c) => updateCondition(c)}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                errors={errors}
              />
            )}

            {!isLoading && view === "result" && (
              <RouteResultPanel
                routes={routes}
                onOpenGoogleMaps={handleOpenGoogleMaps}
                onChangeCondition={() => setView("search")}
                onRetry={handleRetry}
              />
            )}

            {!isLoading && view === "error" && (
              <ErrorMessage
                title="ルートを取得できませんでした"
                message={
                  errorMessage ??
                  "条件に合うルートが見つかりませんでした。条件を緩めて再検索してください。"
                }
                onRetry={handleRetry}
                onBack={() => setView("search")}
              />
            )}
          </div>
        </aside>
      </main>

      <ConfirmDialog
        isOpen={confirmDialogRoute !== null}
        title="Google Maps で開く"
        message="Google Maps アプリ（またはブラウザ）でルートを開きます。SmartWalk のルートと完全に一致しない場合があります。"
        confirmLabel="開く"
        cancelLabel="キャンセル"
        onConfirm={handleConfirmGoogleMaps}
        onCancel={() => setConfirmDialogRoute(null)}
      />
    </>
  );
}

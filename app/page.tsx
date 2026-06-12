"use client";

import { useEffect, useRef, useState } from "react";
import { RouteSearchForm } from "@/features/route-search/components/RouteSearchForm";
import { RouteResultPanel } from "@/features/route-result/components/RouteResultPanel";
import { MapView } from "@/components/map/MapView";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useRouteSearch } from "@/features/route-search/hooks/useRouteSearch";
import { useGpsTracking } from "@/features/walk-tracking/hooks/useGpsTracking";
import { useDeviceHeading } from "@/features/walk-tracking/hooks/useDeviceHeading";
import { useWalkGuidance } from "@/features/walk-tracking/hooks/useWalkGuidance";
import { TrackingPanel } from "@/features/walk-tracking/components/TrackingPanel";
import { GuidanceBanner } from "@/features/walk-tracking/components/GuidanceBanner";
import { GoalCelebration } from "@/features/walk-tracking/components/GoalCelebration";
import { buildGoogleMapsUrl } from "@/features/walk-planner/services/googleMapsLinkBuilder";
import type { WalkRoute } from "@/types/route";
import type { Coordinate } from "@/types/map";

type PageView = "search" | "result" | "error";

export default function HomePage() {
  const { condition, isLoading, errors, updateCondition, submitSearch } =
    useRouteSearch();
  const tracking = useGpsTracking();
  const deviceHeading = useDeviceHeading();

  const [view, setView] = useState<PageView>("search");
  const [routes, setRoutes] = useState<WalkRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const selectedRoute =
    routes.find((r) => r.routeId === selectedRouteId) ?? routes[0] ?? null;
  const guidance = useWalkGuidance(tracking, selectedRoute);

  // 散歩スタート時に、現在地取得と方位センサー許可（iOSはユーザー操作必須）を同時に行う
  const handleStartTracking = () => {
    tracking.startTracking();
    void deviceHeading.requestPermission();
  };
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDialogRoute, setConfirmDialogRoute] =
    useState<WalkRoute | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  // 散歩の開始/終了に合わせて地図の全画面表示を自動で切り替える
  // （散歩中でも手動トグルで解除・再開できる）
  useEffect(() => {
    setIsMapFullscreen(tracking.isTracking);
  }, [tracking.isTracking]);

  // 起動時に現在地を取得し、未設定なら出発地点として自動設定する
  // （拒否・失敗時は従来どおり地図タップ／ボタンで手動設定）
  const startConditionRef = useRef(condition.start);
  startConditionRef.current = condition.start;
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // GPS取得を待つ間にユーザーが地点を選んでいたら上書きしない
        if (startConditionRef.current === null) {
          updateCondition({
            start: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
        }
      },
      () => {
        // 何もしない（手動選択にフォールバック）
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
    // 初回マウント時のみ実行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mapCenter: Coordinate | null = condition.start;
  // 地点の選択（地図タップ／ピンのドラッグ）は検索画面かつ非トラッキング時のみ有効
  const canSelectPoint = view === "search" && !isLoading && !tracking.isTracking;
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
        setSelectedRouteId(results[0].routeId);
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

  const panelContent = (
    <>
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
        <>
          <TrackingPanel
            tracking={tracking}
            onStart={handleStartTracking}
            compassPermission={deviceHeading.permission}
          />
          <RouteResultPanel
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
            onOpenGoogleMaps={handleOpenGoogleMaps}
            onChangeCondition={() => setView("search")}
            onRetry={handleRetry}
          />
        </>
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
    </>
  );

  return (
    <>
      <header className="app-header">SmartWalk</header>
      <main className={isMapFullscreen ? "app-main map-fullscreen" : "app-main"}>
        <div className="map-area">
          <MapView
            center={mapCenter}
            startMarker={condition.start}
            endMarker={isOneway ? condition.end : null}
            waypoints={selectedRoute?.waypoints ?? []}
            routeGeometry={
              view === "result" ? selectedRoute?.geometry ?? null : null
            }
            userPosition={tracking.isTracking ? tracking.currentPosition : null}
            userTrail={tracking.isTracking ? tracking.trail : []}
            userHeadingDeg={
              tracking.isTracking
                ? deviceHeading.heading ?? tracking.headingDeg
                : null
            }
            navMode={tracking.isTracking}
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
          {tracking.isTracking && <GuidanceBanner guidance={guidance} />}

          {(view === "result" || isMapFullscreen) && (
            <button
              type="button"
              className="map-fullscreen-toggle"
              aria-label={
                isMapFullscreen ? "全画面表示を終了" : "地図を全画面表示"
              }
              onClick={() => setIsMapFullscreen((prev) => !prev)}
            >
              {isMapFullscreen ? "✕" : "⛶"}
            </button>
          )}
        </div>

        {!isMapFullscreen && (
          <aside className="sidebar">
            <div className="sidebar-inner">{panelContent}</div>
          </aside>
        )}
      </main>

      {isMapFullscreen && <BottomSheet>{panelContent}</BottomSheet>}

      {tracking.isTracking && (
        <GoalCelebration
          phase={guidance.goalPhase}
          distanceToGoalMeters={guidance.distanceToGoalMeters}
        />
      )}

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

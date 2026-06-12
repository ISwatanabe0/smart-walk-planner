"use client";

import { useRef, useState } from "react";

type BottomSheetProps = {
  children: React.ReactNode;
  /** 折りたたみ時に見せておく高さ（つまみ＋ひと目情報） */
  peekHeightPx?: number;
};

/** この距離（px）以上ドラッグしたらスナップ位置を切り替える */
const SNAP_THRESHOLD_PX = 60;

/** この距離（px）未満の動きはタップとみなして開閉トグル */
const TAP_THRESHOLD_PX = 8;

/**
 * 地図の上に重ねる、スワイプで開閉できるボトムシート。
 * つまみを上にスワイプ（またはタップ）で展開、下にスワイプで折りたたみ。
 */
export function BottomSheet({
  children,
  peekHeightPx = 96,
}: BottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState<number | null>(null);

  const startYRef = useRef(0);
  const startExpandedRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    startYRef.current = e.clientY;
    startExpandedRef.current = isExpanded;
    setDragOffsetPx(0);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragOffsetPx === null) {
      return;
    }
    setDragOffsetPx(e.clientY - startYRef.current);
  };

  const handlePointerEnd = () => {
    if (dragOffsetPx === null) {
      return;
    }
    if (Math.abs(dragOffsetPx) < TAP_THRESHOLD_PX) {
      // ほぼ動いていなければタップ扱いで開閉を切り替える
      setIsExpanded((prev) => !prev);
    } else if (startExpandedRef.current) {
      // 展開中: 下へ大きくスワイプで折りたたむ
      setIsExpanded(dragOffsetPx < SNAP_THRESHOLD_PX);
    } else {
      // 折りたたみ中: 上へ大きくスワイプで展開する
      setIsExpanded(dragOffsetPx < -SNAP_THRESHOLD_PX);
    }
    setDragOffsetPx(null);
  };

  // 折りたたみ時は「全高 − peek」だけ下げる。ドラッグ中はその位置から指に追従
  const baseTranslate = isExpanded ? "0px" : `calc(100% - ${peekHeightPx}px)`;
  const clampedOffset =
    dragOffsetPx === null
      ? 0
      : startExpandedRef.current
        ? Math.max(0, dragOffsetPx) // 展開中はこれ以上引き上げられない
        : Math.min(0, dragOffsetPx); // 折りたたみ中はこれ以上引き下げられない
  const transform =
    dragOffsetPx !== null
      ? `translateY(calc(${baseTranslate} + ${clampedOffset}px))`
      : `translateY(${baseTranslate})`;

  return (
    <div
      className={
        dragOffsetPx !== null ? "bottom-sheet dragging" : "bottom-sheet"
      }
      style={{ transform }}
      role="region"
      aria-label="散歩情報パネル"
    >
      <button
        type="button"
        className="bottom-sheet-handle"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "パネルを閉じる" : "パネルを開く"}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <span className="bottom-sheet-grip" aria-hidden="true" />
      </button>
      <div className="bottom-sheet-content">{children}</div>
    </div>
  );
}

# SmartWalk コンポーネント設計書

## 1. 概要
本書は SmartWalk における React / Next.js コンポーネントの役割、責務、入出力を定義する。

本システムは以下の考え方でコンポーネントを設計する。

- UI表示に専念するコンポーネント
- 画面ロジックを持つコンテナ寄りコンポーネント
- 地図表示専用コンポーネント
- ルート情報表示専用コンポーネント

---

## 2. コンポーネント設計方針

### 2.1 基本方針
- 1コンポーネント1責務を基本とする
- 地図描画ロジックと入力フォームロジックを分離する
- ビジネスロジックは hooks / services に逃がす
- props によるデータ受け渡しを明確にする
- 再利用性の高いものは `components` に配置する
- 機能固有のものは `features` 配下に配置する

### 2.2 コンポーネント分類
- ページコンポーネント
- 機能コンポーネント
- 汎用UIコンポーネント
- 地図系コンポーネント
- ルート表示系コンポーネント

---

## 3. コンポーネント一覧

| コンポーネント名 | 配置想定 | 役割 |
|---|---|---|
| HomePage | app/page.tsx | 画面全体の組み立て |
| RouteSearchForm | features/route-search/components | 検索条件入力 |
| StartLocationInput | features/route-search/components | 出発地点入力 |
| DistanceTimeInput | features/route-search/components | 距離・時間入力 |
| PreferenceSelector | features/route-search/components | 条件チェックボックス群 |
| MapView | components/map | 地図表示本体 |
| MapMarker | components/map | 地点マーカー表示 |
| RoutePolyline | components/map | ルート線表示 |
| CurrentLocationButton | components/map | 現在地取得操作 |
| RouteResultPanel | features/route-result/components | ルート結果全体表示 |
| RouteSummary | components/route | 距離・時間・特徴表示 |
| RouteTags | components/route | タグ表示 |
| RouteSpotList | components/route | 経由スポット一覧 |
| GoogleMapsButton | components/route | Google Maps 遷移 |
| RouteCandidateList | features/route-result/components | 候補ルート一覧 |
| RouteDetailCard | features/route-result/components | 候補ルート詳細カード |
| LoadingSpinner | components/ui | ローディング表示 |
| ErrorMessage | components/ui | エラー表示 |
| Button | components/ui | 汎用ボタン |
| Input | components/ui | 汎用入力欄 |
| Checkbox | components/ui | 汎用チェックボックス |
| SectionCard | components/ui | セクション囲みUI |

---

## 4. 画面全体コンポーネント

# 4.1 HomePage

## 4.1.1 役割
トップ画面および結果表示を束ねるページコンポーネント。

## 4.1.2 主な責務
- 検索条件 state 管理
- ルート検索実行
- ローディング制御
- エラー制御
- 検索フォームと結果表示の配置

## 4.1.3 主な使用コンポーネント
- RouteSearchForm
- MapView
- RouteResultPanel
- LoadingSpinner
- ErrorMessage

## 4.1.4 保持する state 例
- 出発地点
- 検索条件
- 検索中フラグ
- 検索結果
- エラー情報
- 選択中ルート

---

## 5. 検索条件入力系コンポーネント

# 5.1 RouteSearchForm

## 5.1.1 役割
散歩ルート生成条件をまとめて入力するフォーム。

## 5.1.2 主な責務
- 各入力部品の統合
- 入力値変更の通知
- submit イベント通知
- バリデーションエラー表示

## 5.1.3 props 例

| props名 | 型 | 内容 |
|---|---|---|
| value | RouteSearchCondition | 入力中の検索条件 |
| onChange | function | 条件変更時コールバック |
| onSubmit | function | ルート生成実行 |
| isLoading | boolean | 検索中状態 |
| errors | ValidationError[] | 入力エラー一覧 |

## 5.1.4 使用子コンポーネント
- StartLocationInput
- DistanceTimeInput
- PreferenceSelector
- Button

---

# 5.2 StartLocationInput

## 5.2.1 役割
出発地点の入力と現在地取得を扱う。

## 5.2.2 主な責務
- 手動入力欄表示
- 現在地取得ボタン表示
- 現在地取得結果を親へ通知

## 5.2.3 props 例

| props名 | 型 | 内容 |
|---|---|---|
| locationText | string | 入力文字列 |
| coordinate | Coordinate \| null | 確定座標 |
| onLocationTextChange | function | 入力変更 |
| onCurrentLocationClick | function | 現在地取得開始 |
| error | string \| null | エラー表示 |

---

# 5.3 DistanceTimeInput

## 5.3.1 役割
目標距離と目標時間の入力を扱う。

## 5.3.2 主な責務
- 距離入力欄表示
- 時間入力欄表示
- 数値入力制御

## 5.3.3 props 例

| props名 | 型 | 内容 |
|---|---|---|
| distanceMeters | number \| null | 目標距離 |
| durationMinutes | number \| null | 目標時間 |
| onDistanceChange | function | 距離変更 |
| onDurationChange | function | 時間変更 |
| errors | string[] | 関連エラー |

---

# 5.4 PreferenceSelector

## 5.4.1 役割
散歩条件の選択肢を表示する。

## 5.4.2 主な責務
- チェックボックス群表示
- 条件変更通知

## 5.4.3 表示対象
- 景観重視
- 信号回避
- 大通り回避
- 観光名所経由
- 周回ルート

## 5.4.4 props 例

| props名 | 型 | 内容 |
|---|---|---|
| preferences | RoutePreferences | 条件情報 |
| onChange | function | 条件変更 |

---

## 6. 地図系コンポーネント

# 6.1 MapView

## 6.1.1 役割
Leaflet を用いて地図全体を表示する。

---

## 10. state 管理方針

### 10.1 ページで持つ state
- 検索条件、現在地、検索結果、検索中状態、エラー情報、選択中ルートなどは HomePage や機能フックで保持する。

### 10.2 子コンポーネントに持たせる state
- 最小限のUI状態（入力フォーカス、一時入力文字列、開閉状態など）のみとし、非同期データは親が保持する。

### 10.3 原則
- ルート探索結果の正本はページ側で管理。
- 地図表示部品に業務判断を持たせすぎない。
- フォーム部品は入力補助に集中させる。

---

## 11. props 設計方針

### 11.1 原則
- props は必要最小限にし、boolean の乱立を避ける。
- 関連項目はオブジェクト化を検討し、コールバック名は `onXxx` で統一。

### 11.2 例
- `onSubmit`
- `onSelectRoute`
- `onCurrentLocationClick`
- `onOpenGoogleMaps`

---

## 12. hooks / services への分離方針

### 12.1 hooks に分離するもの
- 現在地取得処理、ルート検索API呼び出し状態管理、Google Maps URL 生成状態管理。

### 12.2 services に分離するもの
- Overpass API 呼び出し、グラフ生成、ルート探索、スコア計算、類似ルート除外など純粋ロジック。

### 12.3 分離理由
- テストしやすさ、再利用性、画面と業務ロジックの疎結合を保つため。

---

## 13. テスト観点

### 13.1 UIコンポーネント
- 表示崩れがないか。
- props に応じて表示が変化するか。
- `disabled` や `loading` 状態が適切か。

### 13.2 フォーム系
- 入力変更が親へ伝播するか。
- 必須エラーが正しく表示されるか。
- submit 時に多重送信が発生しないか。

### 13.3 地図系
- マーカーが正しい位置に表示されるか。
- ルート線が正しく描画されるか。
- 候補切替で表示が更新されるか。

### 13.4 結果表示系
- 候補選択で概要・地図が切り替わるか。
- Google Maps ボタンが動作するか。
- 経由スポット一覧が表示されるか。

---

## 14. 今後の拡張候補
- `SavedRouteCard`
- `ShareRouteButton`
- `RouteFilterPanel`
- `ThemeSelector`
- `MobileBottomSheet`
- `EmptyState`

---

## 15. まとめ
- 検索入力、地図表示、結果表示の責務を分離し、UI と業務ロジックを切り離す。
- props と state の持ち方を明確化し、再利用しやすい共通部品へ落とし込む。
- 特に `MapView` と `RouteResultPanel` は肥大化しやすいため、内部を小さな部品へ分割する設計を維持する。

## 6.1.2 主な責務
- 地図初期化
- 地図中心座標制御
- マーカー描画
- ルート線描画
- 表示範囲調整

## 6.1.3 props 例

| props名 | 型 | 内容 |
|---|---|---|
| center | Coordinate | 地図中心 |
| zoom | number | ズーム値 |
| startMarker | Coordinate \| null | 出発地点 |
| endMarker | Coordinate \| null | 終点 |
| waypoints | Waypoint[] | 経由地点 |
| routeGeometry | RouteGeometry \| null | 表示ルート |
| onMapClick | function | 地図クリック時 |

## 6.1.4 使用子コンポーネント
- MapMarker
- RoutePolyline

## 6.1.5 注意事項
- Leaflet はクライアントサイド依存が強いため、必要に応じて dynamic import を検討する
- SSR 時の window 参照に注意する

---

# 6.2 MapMarker

## 6.2.1 役割
地図上の単一地点を表示する。

## 6.2.2 主な責務
- マーカー表示
- ラベル / Popup 表示

## 6.2.3 props 例

| props名 | 型 | 内容 |
|---|---|---|
| position | Coordinate | 座標 |
| label | string | 表示名 |
| markerType | string | start / end / waypoint / poi |

---

# 6.3 RoutePolyline

## 6.3.1 役割
ルート線を地図上に描画する。

## 6.3.2 主な責務
- ポリライン描画
- 候補ルートごとの表示切替

## 6.3.3 props 例

| props名 | 型 | 内容 |
|---|---|---|
| coordinates | Coordinate[] | 線の座標列 |
| selected | boolean | 選択中かどうか |
| routeId | string | ルート識別子 |

---

# 6.4 CurrentLocationButton

## 6.4.1 役割
現在地取得操作を行うボタン。

## 6.4.2 主な責務
- クリック通知
- 処理中表示

## 6.4.3 props 例

| props名 | 型 | 内容 |
|---|---|---|
| onClick | function | 現在地取得開始 |
| isLoading | boolean | 取得中 |
| disabled | boolean | 無効化制御 |

---

## 7. ルート結果表示系コンポーネント

# 7.1 RouteResultPanel

## 7.1.1 役割
ルート検索結果エリア全体を構成する。

## 7.1.2 主な責務
- 選択中ルートの表示
- 候補一覧表示
- Google Maps 連携ボタン表示
- 再検索導線表示

## 7.1.3 props 例

| props名 | 型 | 内容 |
|---|---|---|
| routes | WalkRoute[] | 候補ルート一覧 |
| selectedRouteId | string \| null | 選択中ルートID |
| onSelectRoute | function | 候補選択 |
| onOpenGoogleMaps | function | Google Maps 起動 |
| onRetry | function | 再検索 |

## 7.1.4 使用子コンポーネント
- RouteSummary
- RouteTags
- RouteSpotList
- GoogleMapsButton
- RouteCandidateList

---

# 7.2 RouteSummary

## 7.2.1 役割
選択中ルートの概要情報を表示する。

## 7.2.2 表示項目
- 総距離
- 推定時間
- 景観スコア
- 信号回避スコア
- 大通り回避スコア

## 7.2.3 props 例

| props名 | 型 | 内容 |
|---|---|---|
| distanceMeters | number | 総距離 |
| estimatedMinutes | number | 推定時間 |
| sceneryScore | number | 景観評価 |
| trafficLightScore | number | 信号回避評価 |
| mainRoadAvoidanceScore | number | 幹線道路回避評価 |

---

# 7.3 RouteTags

## 7.3.1 役割
ルートの特徴タグを一覧表示する。

## 7.3.2 表示例
- 景観重視
- 信号少なめ
- 大通り回避
- 公園あり

## 7.3.3 props 例

| props名 | 型 | 内容 |
|---|---|---|
| tags | string[] | 表示タグ |

---

# 7.4 RouteSpotList

## 7.4.1 役割
経由スポットの一覧を表示する。

## 7.4.2 表示内容
- スポット名
- 種別
- 必要に応じて説明文

## 7.4.3 props 例

| props名 | 型 | 内容 |
|---|---|---|
| spots | Waypoint[] | 経由地点一覧 |

---

# 7.5 GoogleMapsButton

## 7.5.1 役割
Google Maps を開く操作ボタン。

## 7.5.2 主な責務
- ボタンクリック通知
- URLが未生成時の無効化

## 7.5.3 props 例

| props名 | 型 | 内容 |
|---|---|---|
| url | string \| null | Google Maps URL |
| onClick | function | クリック時処理 |
| disabled | boolean | 無効化制御 |

---

# 7.6 RouteCandidateList

## 7.6.1 役割
複数候補ルートを一覧表示し、切り替え可能にする。

## 7.6.2 主な責務
- 候補リスト表示
- 選択中候補の強調
- 候補選択通知

## 7.6.3 props 例

| props名 | 型 | 内容 |
|---|---|---|
| routes | WalkRoute[] | 候補一覧 |
| selectedRouteId | string \| null | 選択中ルート |
| onSelect | function | 候補選択時 |

---

# 7.7 RouteDetailCard

## 7.7.1 役割
候補ルート1件分の詳細カードを表示する。

## 7.7.2 表示内容
- ルート名または候補番号
- 距離
- 推定時間
- 特徴タグ
- スコア概要

## 7.7.3 props 例

| props名 | 型 | 内容 |
|---|---|---|
| route | WalkRoute | 候補ルート |
| selected | boolean | 選択中か |
| onClick | function | 選択時処理 |

---

## 8. 汎用UIコンポーネント

# 8.1 Button
共通ボタン部品。

### props 例
- children
- onClick
- disabled
- variant

---

# 8.2 Input
共通入力欄部品。

### props 例
- value
- onChange
- placeholder
- type
- error

---

# 8.3 Checkbox
共通チェックボックス部品。

### props 例
- checked
- onChange
- label
- disabled

---

# 8.4 LoadingSpinner
ローディング表示部品。

### 用途
- ルート生成中
- 現在地取得中
- API通信中

---

# 8.5 ErrorMessage
エラー文言表示部品。

### 用途
- 入力エラー
- APIエラー
- 現在地取得失敗

---

# 8.6 SectionCard
セクション単位の囲み表示部品。

### 用途
- 検索条件エリア
- 結果概要エリア
- 候補一覧エリア

---

## 9. コンポーネント間の関係

### 9.1 構成イメージ
```text
HomePage
├─ RouteSearchForm
│  ├─ StartLocationInput
│  ├─ DistanceTimeInput
│  ├─ PreferenceSelector
│  └─ Button
├─ MapView
│  ├─ MapMarker
│  └─ RoutePolyline
├─ RouteResultPanel
│  ├─ RouteSummary
│  ├─ RouteTags
│  ├─ RouteSpotList
│  ├─ GoogleMapsButton
│  └─ RouteCandidateList
│     └─ RouteDetailCard
├─ LoadingSpinner
└─ ErrorMessage

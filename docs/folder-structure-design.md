# SmartWalk フォルダ構成設計書

## 1. 概要
本書は SmartWalk のソースコード構成を定義する。

SmartWalk は Next.js / TypeScript を用いた Web アプリケーションであり、以下の方針でディレクトリを構成する。

- 画面、UI部品、業務ロジックを分離する
- 地図表示やルート探索など責務ごとに整理する
- 保守性と拡張性を重視する
- DBを利用しない前提で、永続化を伴う層は持たない
- API呼び出し、外部連携、ルーティングロジックを明確に分離する

---

## 2. 構成方針

### 2.1 基本方針
- **app**: 画面ルーティング、ページ定義
- **components**: 再利用可能なUI部品
- **features**: 画面単位・機能単位のまとまり
- **lib**: 外部APIアクセスや共通処理
- **types**: 型定義
- **constants**: 定数
- **utils**: 汎用関数
- **hooks**: カスタムフック
- **docs**: 設計書

### 2.2 分離したい責務
以下は明確に分離する。

- 画面表示責務
- ユーザー入力責務
- 地図描画責務
- ルート探索責務
- Overpass API 通信責務
- Google Maps URL 生成責務
- バリデーション責務

---

## 3. 推奨フォルダ構成

```text
smart-walk-planner/
├─ app/
│  ├─ page.tsx
│  ├─ layout.tsx
│  ├─ globals.css
│  └─ api/
│     ├─ routes/
│     │  ├─ generate/route.ts
│     │  └─ google-maps-link/route.ts
│     ├─ pois/
│     │  └─ search/route.ts
│     └─ health/
│        └─ route.ts
│
├─ components/
│  ├─ ui/
│  │  ├─ Button.tsx
│  │  ├─ Input.tsx
│  │  ├─ Checkbox.tsx
│  │  ├─ LoadingSpinner.tsx
│  │  ├─ ErrorMessage.tsx
│  │  └─ SectionCard.tsx
│  │
│  ├─ map/
│  │  ├─ MapView.tsx
│  │  ├─ RoutePolyline.tsx
│  │  ├─ MapMarker.tsx
│  │  └─ CurrentLocationButton.tsx
│  │
│  └─ route/
│     ├─ RouteSummary.tsx
│     ├─ RouteTags.tsx
│     ├─ RouteSpotList.tsx
│     └─ GoogleMapsButton.tsx
│
├─ features/
│  ├─ route-search/
│  │  ├─ components/
│  │  │  ├─ RouteSearchForm.tsx
│  │  │  ├─ PreferenceSelector.tsx
│  │  │  ├─ DistanceTimeInput.tsx
│  │  │  └─ StartLocationInput.tsx
│  │  ├─ hooks/
│  │  │  └─ useRouteSearch.ts
│  │  ├─ services/
│  │  │  └─ routeSearchService.ts
│  │  └─ validators/
│  │     └─ routeSearchValidator.ts
│  │
│  ├─ route-result/
│  │  ├─ components/
│  │  │  ├─ RouteResultPanel.tsx
│  │  │  ├─ RouteCandidateList.tsx
│  │  │  └─ RouteDetailCard.tsx
│  │  └─ hooks/
│  │     └─ useRouteResult.ts
│  │
│  └─ walk-planner/
│     ├─ services/
│     │  ├─ graphBuilder.ts
│     │  ├─ routeGenerator.ts
│     │  ├─ loopRouteGenerator.ts
│     │  ├─ routeScorer.ts
│     │  ├─ similarityFilter.ts
│     │  └─ googleMapsLinkBuilder.ts
│     ├─ scoring/
│     │  ├─ edgeCostCalculator.ts
│     │  ├─ sceneryScorer.ts
│     │  ├─ trafficPenaltyCalculator.ts
│     │  └─ mainRoadPenaltyCalculator.ts
│     └─ models/
│        ├─ graph.ts
│        ├─ node.ts
│        ├─ edge.ts
│        └─ route.ts
│
├─ hooks/
│  ├─ useCurrentLocation.ts
│  ├─ useMapCenter.ts
│  └─ useGoogleMapsLink.ts
│
├─ lib/
│  ├─ api/
│  │  ├─ overpassClient.ts
│  │  ├─ routeApiClient.ts
│  │  └─ poiApiClient.ts
│  │
│  ├─ osm/
│  │  ├─ overpassQueryBuilder.ts
│  │  ├─ osmNormalizer.ts
│  │  └─ osmTagMapper.ts
│  │
│  └─ geo/
│     ├─ distance.ts
│     ├─ coordinate.ts
│     ├─ boundingBox.ts
│     └─ polyline.ts
│
├─ constants/
│  ├─ routePreferences.ts
│  ├─ roadTypes.ts
│  ├─ osmTags.ts
│  ├─ apiPaths.ts
│  └─ defaultValues.ts
│
├─ types/
│  ├─ api.ts
│  ├─ route.ts
│  ├─ map.ts
│  ├─ osm.ts
│  └─ preferences.ts
│
├─ utils/
│  ├─ formatDistance.ts
│  ├─ formatDuration.ts
│  ├─ clamp.ts
│  ├─ safeJsonParse.ts
│  └─ logger.ts
│
├─ public/
│  ├─ icons/
│  └─ images/
│
├─ docs/
│  ├─ screen-design.md
│  ├─ api-design.md
│  ├─ route-logic-design.md
│  ├─ folder-structure-design.md
│  └─ component-design.md
│
├─ package.json
├─ tsconfig.json
├─ next.config.js
└─ README.md

---

## 4. 各ディレクトリの役割

### 4.1 `app`
- **配置対象**: Next.js App Router のページコンポーネント、共通レイアウト、API Route。
- **役割**: URLと画面の対応づけ、サーバ側APIエンドポイント公開、アプリ全体のレイアウト定義。
- **注意事項**: 業務ロジックは `features` や `lib` に寄せ、`app` には画面やAPI入口のみを置く。

### 4.2 `components`
- **役割**: 再利用可能なプレゼンテーション中心のUI部品。
- **配置例**: ボタン、入力欄、チェックボックス、地図部品、ルート表示部品。
- **方針**: 画面固有ロジックは持たず、見た目とイベント受け渡しに専念。

### 4.3 `features`
- **役割**: 機能単位でコンポーネント・フック・サービスを束ねる。
- **配置例**: ルート検索フォーム、ルート結果表示、ルート生成の中核処理。
- **方針**: 画面/業務に近いまとまりで構成し、機能ごとに依存を閉じる。

### 4.4 `hooks`
- **役割**: 複数画面や機能で再利用されるカスタムフック。
- **例**: 現在地取得、地図中心座標制御、Google Maps URL 管理。

### 4.5 `lib`
- **役割**: 外部API通信、地理計算、OSMデータ変換など共通基盤処理。
- **例**: Overpass API 呼び出し、OSM クエリ生成、緯度経度計算、データ正規化。
- **方針**: アプリ固有ロジックではなく土台となる処理のみを置く。

### 4.6 `constants`
- **役割**: 固定値や列挙的な情報の集約。
- **例**: OSMタグ一覧、既定距離、APIパス、道路種別区分。

### 4.7 `types`
- **役割**: TypeScript 型定義の集約。
- **例**: API入出力型、ルート情報型、OSMデータ型、地図描画用型。

### 4.8 `utils`
- **役割**: 副作用の少ない汎用関数。
- **例**: 距離/時間フォーマット、値の丸め、ログ補助。

---

## 5. API Route 配置方針

### 5.1 採用方針
- Next.js Route Handler を使用し、以下に配置する。
  - `app/api/routes/generate/route.ts`
  - `app/api/routes/google-maps-link/route.ts`
  - `app/api/pois/search/route.ts`
  - `app/api/health/route.ts`

### 5.2 方針
- エンドポイント入口は `app/api`。
- 実処理は `features` または `lib` に委譲し、`route.ts` 内を薄く保つ。

---

## 6. 命名規約

### 6.1 ファイル名
- Reactコンポーネント: `PascalCase.tsx`
- フック: `useXxx.ts`
- サービス/ユーティリティ: `camelCase.ts`
- 型定義: 用途単位で `xxx.ts`

### 6.2 例
- `RouteSearchForm.tsx`
- `useCurrentLocation.ts`
- `routeGenerator.ts`
- `edgeCostCalculator.ts`

---

## 7. import 依存ルール

### 7.1 依存の向き
```
app
 ↓
features
 ↓
components / hooks / lib / constants / types / utils
```

### 7.2 ルール
- `components` は `features` に過度依存しない。
- `lib` は UI 層へ依存しない。
- `types` は広く参照されるが逆依存を持たない。
- `features` は必要に応じて `components` を利用する。

---

## 8. DBなし構成での考慮事項

### 8.1 前提
- DBを利用しないため、ユーザー情報・検索履歴・お気に入り・永続セッションは保持しない。

### 8.2 代替方針
- 画面状態: React state / URL Query
- 一時保存: LocalStorage
- 外部共有: Google Maps URL

### 8.3 注意点
- 再読み込みで状態が消える可能性に留意。
- 共有URL生成時はクエリパラメータ設計を検討。

---

## 9. 初期実装で最低限必要なファイル

### 9.1 最小構成
- `app/page.tsx`, `app/layout.tsx`
- `app/api/routes/generate/route.ts`
- `app/api/routes/google-maps-link/route.ts`
- `components/map/MapView.tsx`
- `components/route/RouteSummary.tsx`
- `components/route/GoogleMapsButton.tsx`
- `features/route-search/components/RouteSearchForm.tsx`
- `features/route-search/hooks/useRouteSearch.ts`
- `features/route-search/services/routeSearchService.ts`
- `features/walk-planner/services/graphBuilder.ts`
- `features/walk-planner/services/routeGenerator.ts`
- `features/walk-planner/scoring/edgeCostCalculator.ts`
- `hooks/useCurrentLocation.ts`
- `lib/api/overpassClient.ts`
- `lib/osm/overpassQueryBuilder.ts`
- `lib/osm/osmNormalizer.ts`
- `lib/geo/distance.ts`
- `types/route.ts`
- `types/osm.ts`
- `types/preferences.ts`

---

## 10. 今後の拡張時の追加候補
- `features/share/`: 共有機能
- `features/history/`: 履歴機能
- `features/favorites/`: お気に入り機能
- `tests/`: 単体/結合テスト
- `mocks/`: APIモック

---

## 11. まとめ
- 画面、UI部品、業務ロジック、外部通信、共通処理を分離して保守性を確保。
- ルート探索ロジックは `features/walk-planner` に、地図表示は `components/map` に集約し疎結合化。
- 将来拡張（共有・履歴・お気に入り等）に備えたフォルダ構成を維持する。

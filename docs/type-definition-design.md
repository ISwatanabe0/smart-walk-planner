# SmartWalk 型定義設計書

## 1. 概要
本書は SmartWalk における TypeScript の型定義方針、および主要な型の仕様を定義する。SmartWalk では画面入力、API 入出力、地図表示、OSM 由来データ、ルート探索ロジック内部で異なる型を用いる。DB を利用しないため永続化エンティティ型は持たず、フロントエンド状態管理と API 通信、ルート計算処理に必要な型を中心に定義する。

---

## 2. 型定義方針

### 2.1 基本方針
- 画面入力型と API 入出力型を分離する
- 外部 API 由来の型とアプリ内部型を分離する
- 地図描画用型とルート探索用型を分離する
- 必須 / 任意を明確にする
- boolean の意味が曖昧にならないよう命名を明確にする

### 2.2 分離対象
- フォーム入力値
- API リクエスト / レスポンス
- OSM 生データ
- 正規化後の内部地図データ
- 地図描画用データ
- ルート候補データ

### 2.3 命名方針
- 型名は `PascalCase`
- 配列は `Xxx[]`
- Union 型は用途が分かる名称
- API 系は `Request` / `Response`
- 座標は `Coordinate`
- サマリは `Summary`

---

## 3. ファイル配置方針

```text
types/
├─ api.ts
├─ map.ts
├─ osm.ts
├─ preferences.ts
└─ route.ts
```

---

## 4. 型依存関係

```
preferences.ts
   ↓
route.ts
   ↓
api.ts
   ↓
components / hooks / services

osm.ts
   ↓
route.ts
   ↓
api.ts / walk-planner services

map.ts
   ↓
route.ts
   ↓
components/map
```

---

## 5. preferences.ts

### 5.1 役割
利用者の検索条件やルート生成条件を表す型を定義する。

### 5.2 `RoutePreferences`
```ts
export type RoutePreferences = {
  scenery: boolean;
  avoidTrafficLights: boolean;
  avoidMainRoads: boolean;
  includeSightseeing: boolean;
  loopRoute: boolean;
};
```

| 項目名 | 型 | 必須 | 内容 |
|---|---|---|---|
| scenery | boolean | ○ | 景観重視するか |
| avoidTrafficLights | boolean | ○ | 信号回避するか |
| avoidMainRoads | boolean | ○ | 大通り回避するか |
| includeSightseeing | boolean | ○ | 観光名所経由を優先するか |
| loopRoute | boolean | ○ | 周回ルートを優先するか |

### 5.3 `RouteSearchCondition`
```ts
import type { Coordinate } from "./map";
import type { RoutePreferences } from "./preferences";

export type RouteSearchCondition = {
  start: Coordinate | null;
  startLocationText: string;
  distanceMeters: number | null;
  durationMinutes: number | null;
  preferences: RoutePreferences;
};
```

| 項目名 | 型 | 必須 | 内容 |
|---|---|---|---|
| start | Coordinate \| null | △ | 出発地点座標 |
| startLocationText | string | ○ | 手動入力用出発地点文字列 |
| distanceMeters | number \| null | △ | 目標距離 |
| durationMinutes | number \| null | △ | 目標時間 |
| preferences | RoutePreferences | ○ | 検索条件 |

※ `distanceMeters` と `durationMinutes` はどちらか一方を基本とし、`startLocationText` で住所入力中も表現する。

### 5.4 `ValidationError`
```ts
export type ValidationError = {
  field: string;
  message: string;
};
```

---

## 6. map.ts

### 6.1 役割
地図表示、座標、描画に関する型を定義する。

### 6.2 `Coordinate`
```ts
export type Coordinate = {
  lat: number;
  lng: number;
};
```

### 6.3 `BoundingBox`
```ts
export type BoundingBox = {
  north: number;
  south: number;
  east: number;
  west: number;
};
```

### 6.4 `MapMarkerType`
```ts
export type MapMarkerType = "start" | "end" | "waypoint" | "poi";
```

### 6.5 `MapMarkerData`
```ts
export type MapMarkerData = {
  id: string;
  position: Coordinate;
  label?: string;
  type: MapMarkerType;
};
```

### 6.6 `RouteGeometry`
```ts
export type RouteGeometry = {
  type: "LineString";
  coordinates: Coordinate[];
};
```
GeoJSON は `[lng, lat]` だが、内部では `Coordinate[]` に揃え、変換レイヤを設置する。

### 6.7 `MapViewport`
```ts
export type MapViewport = {
  center: Coordinate;
  zoom: number;
};
```

---

## 7. route.ts

### 7.1 役割
散歩ルートおよび探索処理で使用する内部型を定義する。

### 7.2 `WaypointType`
```ts
export type WaypointType =
  | "park"
  | "tourism"
  | "waterfront"
  | "landmark"
  | "generic";
```

### 7.3 `Waypoint`
```ts
import type { Coordinate } from "./map";

export type Waypoint = {
  id: string;
  name: string;
  position: Coordinate;
  type: WaypointType;
  description?: string;
};
```

### 7.4 `RouteTag`
```ts
export type RouteTag =
  | "景観重視"
  | "信号少なめ"
  | "大通り回避"
  | "観光名所あり"
  | "周回ルート";
```

### 7.5 `RouteSummary`
```ts
export type RouteSummary = {
  distanceMeters: number;
  estimatedMinutes: number;
  sceneryScore: number;
  trafficLightScore: number;
  mainRoadAvoidanceScore: number;
  overlapRate?: number;
};
```

### 7.6 `WalkRoute`
```ts
import type { RouteGeometry, Coordinate } from "./map";
import type { RouteSummary, RouteTag, Waypoint } from "./route";

export type WalkRoute = {
  routeId: string;
  name?: string;
  summary: RouteSummary;
  geometry: RouteGeometry;
  start: Coordinate;
  end: Coordinate;
  waypoints: Waypoint[];
  tags: RouteTag[];
};
```

### 7.7 `RouteCandidate`
```ts
import type { WalkRoute } from "./route";

export type RouteCandidate = WalkRoute & {
  score: number;
  distanceGap: number;
  similarityScore?: number;
};
```

### 7.8 `GraphNode`
```ts
import type { Coordinate } from "./map";

export type GraphNode = {
  id: string;
  position: Coordinate;
  tags: Record<string, string>;
  trafficSignal: boolean;
  poiScore: number;
};
```

### 7.9 `HighwayType`
```ts
export type HighwayType =
  | "footway"
  | "path"
  | "pedestrian"
  | "residential"
  | "service"
  | "living_street"
  | "secondary"
  | "primary"
  | "trunk"
  | "unknown";
```

### 7.10 `GraphEdge`
```ts
import type { HighwayType } from "./route";

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  distance: number;
  highwayType: HighwayType;
  sceneryScore: number;
  trafficPenalty: number;
  mainRoadPenalty: number;
  sightseeingBonus: number;
  walkabilityScore: number;
};
```

### 7.11 `Graph`
```ts
import type { GraphNode, GraphEdge } from "./route";

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};
```

---

## 8. osm.ts

### 8.1 役割
Overpass API から取得する生データと正規化前構造を表す型を定義する。

### 8.2–8.7 生データ型
```ts
export type OsmTagMap = Record<string, string>;

export type OsmNodeElement = {
  type: "node";
  id: number;
  lat: number;
  lon: number;
  tags?: OsmTagMap;
};

export type OsmWayElement = {
  type: "way";
  id: number;
  nodes: number[];
  tags?: OsmTagMap;
  geometry?: Array<{ lat: number; lon: number }>;
};

export type OsmRelationElement = {
  type: "relation";
  id: number;
  members: Array<{
    type: "node" | "way" | "relation";
    ref: number;
    role: string;
  }>;
  tags?: OsmTagMap;
};

export type OsmElement =
  | OsmNodeElement
  | OsmWayElement
  | OsmRelationElement;

export type OverpassResponse = {
  version: number;
  generator: string;
  osm3s?: {
    timestamp_osm_base: string;
    copyright?: string;
  };
  elements: OsmElement[];
};
```

### 8.8–8.10 正規化後
```ts
import type { Coordinate } from "./map";

export type NormalizedOsmNode = {
  id: string;
  position: Coordinate;
  tags: OsmTagMap;
};

export type NormalizedOsmWay = {
  id: string;
  nodeIds: string[];
  tags: OsmTagMap;
};

export type NormalizedOsmData = {
  nodes: NormalizedOsmNode[];
  ways: NormalizedOsmWay[];
};
```

---

## 9. api.ts

### 9.1 役割
フロントエンドと API Route 間の入出力型を定義する。

### 9.2–9.6 共通レスポンス型
```ts
export type ApiErrorCode =
  | "INVALID_PARAMETER"
  | "ROUTE_NOT_FOUND"
  | "OVERPASS_UNAVAILABLE"
  | "MAP_DATA_EMPTY"
  | "INTERNAL_SERVER_ERROR";

export type ApiError = {
  code: ApiErrorCode;
  message: string;
};

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  error: ApiError;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

### 9.7 `GenerateRouteRequest`
```ts
import type { Coordinate } from "./map";
import type { RoutePreferences } from "./preferences";

export type GenerateRouteRequest = {
  start: Coordinate;
  distanceMeters?: number;
  durationMinutes?: number;
  preferences: RoutePreferences;
  options?: {
    candidateCount?: number;
    searchRadiusMeters?: number;
  };
};
```

### 9.8–9.9 `GenerateRouteResponse`
```ts
import type { WalkRoute } from "./route";

export type GenerateRouteResponseData = {
  routes: WalkRoute[];
  searchArea: {
    radiusMeters: number;
  };
};

export type GenerateRouteResponse = ApiResponse<GenerateRouteResponseData>;
```

### 9.10–9.14 その他
```ts
export type GoogleMapsLinkRequest = {
  origin: Coordinate;
  destination: Coordinate;
  waypoints?: Coordinate[];
  travelMode?: "walk";
};

export type GoogleMapsLinkResponse = ApiResponse<{ url: string }>;

export type HealthResponse = ApiResponse<{
  status: "ok";
  timestamp: string;
}>;
```

---

## 10. 型の使い分け方針
- フォーム入力値: `RouteSearchCondition`, `ValidationError`
- API 通信: `GenerateRouteRequest/Response`, `GoogleMapsLinkRequest/Response`
- 地図表示: `Coordinate`, `MapMarkerData`, `RouteGeometry`, `MapViewport`
- ルート表示: `WalkRoute`, `RouteSummary`, `Waypoint`, `RouteTag`
- 探索ロジック内部: `Graph`, `GraphNode`, `GraphEdge`, `RouteCandidate`
- 外部データ受信: `OverpassResponse`, `OsmElement`, `NormalizedOsmData`

---

## 11. 実装上の注意点

### 11.1 外部APIの生データを直接UIで使わない
Overpass の生データは不安定要素があるため、`NormalizedOsmData` へ変換してから扱う。

### 11.2 `Coordinate` の表現を統一
アプリ内部では `lat` / `lng` に統一し、`lon` は変換レイヤのみで利用する。

### 11.3 `RouteGeometry` の座標形式を固定
Leaflet と連携しやすい形式を維持し、GeoJSON を直接使う場合は別型を用意する。

### 11.4 `RouteTag` の多言語化
初期は文字列 Union だが、多言語化や名称変更が必要な場合はコード値 (`RouteTagCode`) を導入する。

---

## 12. 将来拡張時の追加候補型
- LocalStorage: `SavedSearchCondition`, `RecentRouteSummary`
- 共有機能: `ShareRoutePayload`, `ShareRouteQuery`
- お気に入り機能: `FavoriteRoute`, `FavoriteRouteListItem`

---

## 13. まとめ
型層を `preferences.ts`（検索条件）、`map.ts`（地図・座標）、`route.ts`（ルート情報・探索内部）、`osm.ts`（Overpass/OSM 生データ）、`api.ts`（API 入出力）で分離し、画面・API・探索ロジック・外部データの責務を型定義段階で切り分ける。これにより見通しと保守性を高め、将来的な拡張にも対応しやすい構成を目指す。

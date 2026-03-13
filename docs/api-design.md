# SmartWalk API設計書

## 1. 概要
本書は SmartWalk のフロントエンドとバックエンド間、および外部サービス連携を行う API の仕様を定義する。

本システムは Next.js を利用して構築し、API Route または Route Handler によりバックエンド機能を提供することを想定する。

---

## 2. API一覧

| API ID | メソッド | パス | 概要 |
|---|---|---|---|
| API-001 | POST | /api/routes/generate | 散歩ルート生成 |
| API-002 | POST | /api/routes/google-maps-link | Google Maps 用URL生成 |
| API-003 | GET | /api/health | ヘルスチェック |
| API-004 | GET | /api/pois/search | 周辺POI取得（拡張） |

---

## 3. 共通仕様

### 3.1 リクエスト形式
- Content-Type: `application/json`

### 3.2 レスポンス形式
- JSON

### 3.3 ステータスコード方針

| ステータスコード | 内容 |
|---|---|
| 200 | 正常終了 |
| 400 | リクエスト不正 |
| 404 | データなし |
| 429 | 外部API制限超過 |
| 500 | サーバ内部エラー |
| 503 | 外部API利用不可 |

### 3.4 共通レスポンス構造

#### 正常時
```json
{
  "success": true,
  "data": {}
}
```

#### 異常時
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "distance must be greater than 0"
  }
}
```

---

## 4. API詳細

### 4.1 API-001 散歩ルート生成

#### 4.1.1 概要
利用者の出発地点および条件に基づき、散歩ルートを生成する。

#### 4.1.2 エンドポイント
- `POST /api/routes/generate`

#### 4.1.3 リクエスト項目

| 項目名 | 型 | 必須 | 内容 |
|---|---|---|---|
| start.lat | number | ○ | 出発地点緯度 |
| start.lng | number | ○ | 出発地点経度 |
| distanceMeters | number | △ | 目標距離（m） |
| durationMinutes | number | △ | 目標時間（分） |
| preferences.scenery | boolean | - | 景観重視 |
| preferences.avoidTrafficLights | boolean | - | 信号回避 |
| preferences.avoidMainRoads | boolean | - | 大通り回避 |
| preferences.includeSightseeing | boolean | - | 観光名所経由 |
| preferences.loopRoute | boolean | - | 周回ルート |
| options.candidateCount | number | - | 候補ルート件数 |
| options.searchRadiusMeters | number | - | 探索半径 |

#### 4.1.4 リクエスト例
```json
{
  "start": {
    "lat": 43.0618,
    "lng": 141.3545
  },
  "distanceMeters": 4000,
  "durationMinutes": 60,
  "preferences": {
    "scenery": true,
    "avoidTrafficLights": true,
    "avoidMainRoads": true,
    "includeSightseeing": false,
    "loopRoute": true
  },
  "options": {
    "candidateCount": 3,
    "searchRadiusMeters": 2500
  }
}
```

#### 4.1.5 バリデーション

| 項目 | 条件 |
|---|---|
| start.lat | -90 ～ 90 |
| start.lng | -180 ～ 180 |
| distanceMeters | 1 以上 |
| durationMinutes | 1 以上 |
| candidateCount | 1 ～ 5 |
| searchRadiusMeters | 100 ～ 10000 |

- `distanceMeters` と `durationMinutes` はどちらか一方必須またはデフォルト値を適用。
- 両方指定時は `distanceMeters` を優先し、`durationMinutes` は補助情報として扱う。

#### 4.1.6 処理概要
1. 入力バリデーション
2. 探索範囲算出
3. Overpass API から道路/POI 情報取得
4. OSMデータをグラフ構造へ変換
5. 重み付きコスト関数による A* 探索
6. 候補ルート整形
7. レスポンス返却

#### 4.1.7 正常レスポンス例
```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "routeId": "route-001",
        "summary": {
          "distanceMeters": 4180,
          "estimatedMinutes": 57,
          "sceneryScore": 82,
          "trafficLightScore": 74,
          "mainRoadAvoidanceScore": 88
        },
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [141.3545, 43.0618],
            [141.3551, 43.0622],
            [141.3564, 43.0630]
          ]
        },
        "waypoints": [
          {
            "name": "大通公園",
            "lat": 43.0606,
            "lng": 141.3508,
            "type": "park"
          }
        ],
        "tags": [
          "景観重視",
          "信号少なめ",
          "大通り回避"
        ]
      }
    ],
    "searchArea": {
      "radiusMeters": 2500
    }
  }
}
```

#### 4.1.8 異常レスポンス例
- **パラメータ不正**
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_PARAMETER",
      "message": "start.lat is required"
    }
  }
  ```
- **条件に合うルートなし**
  ```json
  {
    "success": false,
    "error": {
      "code": "ROUTE_NOT_FOUND",
      "message": "No route matched the given conditions"
    }
  }
  ```
- **外部API失敗**
  ```json
  {
    "success": false,
    "error": {
      "code": "OVERPASS_UNAVAILABLE",
      "message": "Failed to fetch map data from Overpass API"
    }
  }
  ```

### 4.2 API-002 Google Maps 用URL生成

#### 4.2.1 概要
生成済みルート情報を Google Maps で開くための URL を生成する。

#### 4.2.2 エンドポイント
- `POST /api/routes/google-maps-link`

#### 4.2.3 リクエスト項目

| 項目名 | 型 | 必須 | 内容 |
|---|---|---|---|
| origin.lat | number | ○ | 出発地点緯度 |
| origin.lng | number | ○ | 出発地点経度 |
| destination.lat | number | ○ | 到着地点緯度 |
| destination.lng | number | ○ | 到着地点経度 |
| waypoints | array | - | 経由地点一覧 |
| travelMode | string | - | 移動手段。`walk` 固定想定 |

#### 4.2.4 リクエスト例
```json
{
  "origin": {
    "lat": 43.0618,
    "lng": 141.3545
  },
  "destination": {
    "lat": 43.0618,
    "lng": 141.3545
  },
  "waypoints": [
    {
      "lat": 43.0606,
      "lng": 141.3508
    },
    {
      "lat": 43.0589,
      "lng": 141.3532
    }
  ],
  "travelMode": "walk"
}
```

#### 4.2.5 正常レスポンス例
```json
{
  "success": true,
  "data": {
    "url": "https://www.google.com/maps/dir/?api=1&origin=43.0618,141.3545&destination=43.0618,141.3545&travelmode=walking&waypoints=43.0606,141.3508|43.0589,141.3532"
  }
}
```

#### 4.2.6 注意事項
- Google Maps 側で経路が再計算されるため、SmartWalk のルート形状と完全一致しない可能性がある。
- 経由地点数には Google Maps 側の制約があるため、必要に応じて間引く。

### 4.3 API-003 ヘルスチェック

#### 4.3.1 概要
アプリケーションおよび外部依存先の生存確認を行う。

#### 4.3.2 エンドポイント
- `GET /api/health`

#### 4.3.3 正常レスポンス例
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-03-09T10:00:00Z"
  }
}
```

### 4.4 API-004 周辺POI取得（拡張）

#### 4.4.1 概要
指定地点周辺の POI を取得する。将来的な候補スポット表示やルート説明補足に使用。

#### 4.4.2 エンドポイント
- `GET /api/pois/search`

#### 4.4.3 クエリパラメータ

| 項目名 | 型 | 必須 | 内容 |
|---|---|---|---|
| lat | number | ○ | 中心緯度 |
| lng | number | ○ | 中心経度 |
| radiusMeters | number | - | 検索半径 |
| category | string | - | `park` / `tourism` / `cafe` など |

#### 4.4.4 正常レスポンス例
```json
{
  "success": true,
  "data": {
    "pois": [
      {
        "name": "中島公園",
        "lat": 43.0442,
        "lng": 141.3541,
        "category": "park"
      }
    ]
  }
}
```

---

## 5. 外部API連携仕様

### 5.1 Overpass API 連携

#### 5.1.1 用途
- 道路情報取得
- 信号情報取得
- 観光スポット / 公園 / 水辺情報取得

#### 5.1.2 取得対象例
```
way["highway"]
node["highway"="traffic_signals"]
node["tourism"]
way["leisure"="park"]
way["natural"="water"]
```

#### 5.1.3 実装上の注意
- 探索範囲を必要最小限に抑える
- タイムアウト設定を設ける
- キャッシュ戦略を導入する
- 一時障害時は代替エンドポイント検討
- 公開Overpassは429が発生しやすいため、`lib/api/overpassClient.ts` で Exponential Backoff 付き再試行と商用OSMプロバイダへ切り替えやすい抽象化を行う

---

## 6. エラーコード定義

| コード | 内容 |
|---|---|
| INVALID_PARAMETER | 入力値不正 |
| ROUTE_NOT_FOUND | ルートが見つからない |
| OVERPASS_UNAVAILABLE | Overpass API 利用不可 |
| MAP_DATA_EMPTY | 地図データ取得結果なし |
| INTERNAL_SERVER_ERROR | サーバ内部エラー |

---

## 7. セキュリティ・運用方針
- API レート制限を導入
- 不正な巨大半径検索を制限
- ログには個人位置情報を必要最小限のみ記録
- エラーメッセージは内部構造を露出しすぎない形にする

---

## 8. 今後の拡張
- 認証付きAPI
- お気に入り保存API
- 履歴参照API
- 候補ルート比較API

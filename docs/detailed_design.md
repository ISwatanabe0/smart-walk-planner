## 詳細設計書：SmartWalk ルート生成システム

### 1. データ構造設計
道路ネットワークはグラフ理論に基づき、ノードとエッジで構成する。

#### 1.1 ノード（Node）構造
- `id`: OSM ID（string）
- `lat`: 緯度（number）
- `lon`: 経度（number）
- `tags`: 付随情報（信号機、歩道橋など）

#### 1.2 エッジ（Edge）構造
- `id`: OSM ID（string）
- `source`: 始点ノードID
- `target`: 終点ノードID
- `length`: 実距離（m）
- `road_type`: 道路種別（primary/residential/footway 等）
- `cost`: A* の重み計算後の値

### 2. 外部API連携詳細

#### 2.1 Overpass API クエリ仕様
現在地を中心に目標距離 \(D\) をベースにしたバウンディングボックス（BBox）を計算し、以下のクエリで道路とPOIを取得する。

```
[out:json][timeout:25];
(
  way["highway"](south, west, north, east);
  node["highway"="traffic_signals"](south, west, north, east);
  node["tourism"~"attraction|museum"](south, west, north, east);
);
out body;
>;
out skel qt;
```

### 3. ルート算出アルゴリズム詳細（A* Search）

#### 3.1 評価関数の定義
各ステップで以下の評価関数 \(f(n)\) を最小化するノードを選択する。
\[
f(n) = g(n) + h(n)
\]
- \(g(n)\): 出発点から現在ノードまでの累積コスト
- \(h(n)\): 現在ノードから目標地点（または折り返し地点）までの推定コスト（直線距離）

#### 3.2 独自のコスト計算（重み付け）
エッジ \(e\) のコストを以下で算出する。
\[
Cost(e) = Length(e) \times W_{road\_type} \times W_{scenery} + P_{signal}
\]
- \(W_{road\_type}\): 例) ユーザーが「裏道」選択時、`primary` は 3.0
- \(W_{scenery}\): 公園隣接なら 0.7
- \(P_{signal}\): 信号機ノードを含む場合 50（メートル換算）を加算

### 4. 観光名所（POI）フォールバック仕様
- **検索フェーズ**: BBox 内の `tourism` タグをスキャン。
- **有効性判定**: 現在地から \(D \times 0.5\) 以内のPOIを抽出。
- **分岐**:
  - POIあり: タグ数などのスコアが最も高いものを Waypoint に設定し、経路探索を再実行。
  - POIなし: フロントエンドへ `NO_POI_FOUND` を返却。
- **補正**: 目標距離 \(D\) を維持しつつ、景観優先モードでルートを再生成。

### 5. Google Maps URL エクスポート仕様

#### 5.1 ウェイポイント抽出（道なり補正）
Googleマップでの再計算を防ぐため、以下の地点をWaypointsに含める。
- 起点・終点（同一座標）
- 角度差30度以上の右左折ノード
- 経由設定された観光名所
- 1km ごとの長距離直線補助点

#### 5.2 出力フォーマット
```
https://www.google.com/maps/dir/?api=1&origin={lat,lon}&destination={lat,lon}&waypoints={lat1,lon1|lat2,lon2|...}&travelmode=walking
```

### 6. 画面遷移とステータス定義
1. 初期状態: ユーザー位置情報の取得待ち。
2. 条件設定: 距離・好みを入力。
3. 計算中: プログレスバーまたはローディング（Overpass 通信）。
4. 完了:
   - 正常系: 観光地を含むルートを表示。
   - 準正常系: 名所未検出通知と通常ルート表示。
5. 外部遷移: Google マップへのエクスポート確認ダイアログ。

### 7. 非機能仕様
- **メモリ管理**: ブラウザ内でノード数が10,000を超える場合は間引きしてハングアップを防止。
- **キャッシュ戦略**: 同一座標・距離の検索は5分間はローカル結果を再利用してAPI呼び出しを抑制。

# SmartWalk ルート探索ロジック詳細設計書

## 1. 概要
本書は SmartWalk における散歩ルート生成ロジックの詳細を定義する。

本システムでは、OpenStreetMap から取得した道路ネットワークおよび POI 情報をもとに、利用者の好みに応じたルートを生成する。  
単純な最短経路ではなく、「歩いて楽しい」「歩きやすい」ことを重視したカスタム重み付き探索を行う。

---

## 2. 設計方針

### 2.1 基本方針
- 最短距離のみを最適化しない
- 景観・信号・道路種別・観光スポットを評価軸に含める
- ルートの「散歩らしさ」を重視する
- 周回ルート生成に対応する

### 2.2 探索アルゴリズム
- 基本探索: **A* アルゴリズム**
- 周回ルート時: 単純な往復ではなく、候補中継点を含むループ生成ロジックを併用する
- 候補複数提示時: スコア上位かつ類似度の低いルートを返す

---

## 3. 入力データ

## 3.1 ユーザー条件
| 項目 | 内容 |
|---|---|
| 出発地点 | 現在地または手動指定地点 |
| 目標距離 | 希望する散歩距離 |
| 目標時間 | 希望する散歩時間 |
| 景観重視 | 景観スコアの高い経路を優先 |
| 信号回避 | 信号交差点の多い経路を避ける |
| 大通り回避 | 幹線道路の利用を避ける |
| 観光名所経由 | 観光スポット近辺を優先 |
| 周回ルート | 出発地点へ戻るルートを優先 |

## 3.2 地図データ
OpenStreetMap / Overpass API から以下のデータを取得する。

### 道路データ
- `highway=*`
- `footway=*`
- `path=*`
- `sidewalk=*`

### 信号関連
- `highway=traffic_signals`
- `crossing=*`

### 景観候補
- `leisure=park`
- `tourism=*`
- `natural=*`
- `waterway=*`
- `landuse=forest`

### 回避対象候補
- `highway=trunk`
- `highway=primary`
- `highway=secondary`

---

## 4. データモデル

# 4.1 グラフ構造

## ノード
交差点、道路端点、POI近接点などをノードとして扱う。

| 項目名 | 型 | 内容 |
|---|---|---|
| id | string | ノードID |
| lat | number | 緯度 |
| lng | number | 経度 |
| tags | object | OSMタグ |
| poiScore | number | POI近接スコア |
| trafficSignal | boolean | 信号ノードか |

## エッジ
道路区間をエッジとして扱う。

| 項目名 | 型 | 内容 |
|---|---|---|
| from | string | 開始ノードID |
| to | string | 終了ノードID |
| distance | number | 区間距離 |
| highwayType | string | 道路種別 |
| baseCost | number | 基本コスト |
| sceneryScore | number | 景観評価 |
| trafficPenalty | number | 信号ペナルティ |
| mainRoadPenalty | number | 幹線道路ペナルティ |
| sightseeingBonus | number | 観光地近接ボーナス |
| walkabilityScore | number | 歩行適性 |

---

## 5. 全体処理フロー

```text
1. ユーザー条件受領
2. 探索半径算出
3. Overpass API から道路/POI取得
4. OSMデータ正規化
5. グラフ生成
6. 各ノード/エッジにスコア付与
7. A* 探索実行
8. 目標距離との近似判定
9. 候補ルート生成
10. 候補ルートのスコアリング
11. 重複度の高いルート除外
12. 上位候補を返却
```

---

## 6. 探索範囲設計

### 6.1 探索半径算出
目標距離をもとに探索範囲半径を決定する。
- 例: 2km 散歩 → 半径 1.0km ～ 1.5km
- 例: 4km 散歩 → 半径 2.0km ～ 2.5km
- 周回ルート時は目標距離の 30% ～ 40% を中継点探索範囲に利用

### 6.2 算出式例
```
searchRadius = min(max(distanceMeters * 0.6, 500), 5000)
```
- 極端に狭すぎる・広すぎる探索を防止するため上下限を設ける。

---

## 7. グラフ生成設計

### 7.1 ノード生成
- `way` の始点・終点・交差点をノード化
- 信号ノードを抽出し属性付与
- POI 近接判定のため代表点を保持

### 7.2 エッジ生成
- `way` を隣接ノード間に分割
- 緯度経度から区間距離を算出
- 一方通行は歩行者では通常無視するが、OSMタグ次第で考慮余地あり

### 7.3 歩行可能道路フィルタ
- 以下は原則除外: motorways / private access / 歩行不可タグ付き道路
- 除外例: `highway=motorway`, `access=private`, `foot=no`

---

## 8. スコアリング設計

### 8.1 基本コスト
- 各エッジには距離ベースの基本コストを設定: `baseCost = distance`

### 8.2 加点・減点要素

#### 8.2.1 景観スコア
- 公園・川/水辺・観光地・森林/緑地が近いほど高得点
- 例: `sceneryScore = parkBonus + waterBonus + tourismBonus + greenBonus`

#### 8.2.2 信号ペナルティ
- 信号交差点を通過するエッジにペナルティ
- 例: `trafficPenalty = trafficSignalCount * trafficPenaltyWeight`

#### 8.2.3 大通りペナルティ
- 幹線道路は散歩快適性を下げるためコスト増加
```
if highwayType in [trunk, primary]:
    mainRoadPenalty = high
elif highwayType in [secondary]:
    mainRoadPenalty = medium
else:
    mainRoadPenalty = low
```

#### 8.2.4 観光名所ボーナス
- 観光名所経由が有効な場合、近接エッジにボーナス
- `sightseeingBonus = nearbyTourismCount * sightseeingWeight`

---

## 9. コスト関数

### 9.1 通常時コスト関数
```
edgeCost =
    baseCost
  + trafficPenalty * w1
  + mainRoadPenalty * w2
  - sceneryScore * w3
  - sightseeingBonus * w4
```

### 9.2 重み例

| 条件 | w1 信号 | w2 大通り | w3 景観 | w4 観光 |
|---|---|---|---|---|
| デフォルト | 1.0 | 1.0 | 0.8 | 0.5 |
| 景観重視 | 0.8 | 1.0 | 1.5 | 0.8 |
| 信号回避 | 2.0 | 1.0 | 0.8 | 0.5 |
| 大通り回避 | 1.0 | 2.0 | 0.8 | 0.5 |
| 観光名所経由 | 1.0 | 1.0 | 0.8 | 1.5 |

### 9.3 備考
- 複数条件が同時指定された場合は重みを合成
- 極端な値で探索が偏らないよう上下限を設定
- 景観ボーナスなどの調整値も内部的には正の加算コストとして扱い、A* の最適性を損なわないようにする（減算はコストの減衰係数で表現）

---

## 10. ヒューリスティック設計（A*）

### 10.1 基本
- A* では、現在ノードから目標ノードまでの推定距離をヒューリスティックとして使用
- `h(n) = straightLineDistance(currentNode, goalNode)`

### 10.2 注意点
- 景観や信号ペナルティはヒューリスティックに含めず実コストで制御し、過大評価を避ける

---

## 11. 目標距離への近似設計

### 11.1 課題
- 通常の A* は最短距離を求めるが、散歩では「ちょうどよい距離」が重要

### 11.2 対応方針
- **方式A: 仮目的地方式**
  - 出発地点から一定半径上に仮想目標候補点を複数生成
  - 候補への経路を探索し、目標距離に近いものを採用
- **方式B: 中継点方式**
  - 景観スコアの高い中継候補を選定
  - 出発地 → 中継地 → 終点の分割探索
- **方式C: 周回ループ方式**
  - 周回時は出発地点へ戻る条件のもと外周方向候補を探索
  - 行きと戻りが同じ経路になりにくいよう復路コスト補正

### 11.3 採用方針
- 非周回: 仮目的地方式
- 周回: 中継点方式 + 復路重複ペナルティ

---

## 12. 周回ルート生成設計

### 12.1 概要
- 出発地点へ戻るルートを生成する際、単純往復ではなくループ形状を目指す

### 12.2 手順
1. 出発地点から一定距離離れた候補中継点を複数抽出
2. 各中継点について
   - 出発地点 → 中継点
   - 中継点 → 出発地点 を個別に探索
3. 往路と復路の重複率を算出し、低重複かつ目標距離に近いものを採用

### 12.3 重複率
- `overlapRate = sharedEdgeDistance / totalRouteDistance`

### 12.4 ペナルティ
- `loopPenalty = overlapRate * overlapWeight`

### 12.5 Waypoint 上限制御
- Google Maps URL で利用できる `waypoints` には上限（10〜15件程度）があるため、曲がり角やPOI抜粋後に優先度の低い地点を間引く。
- 優先度は起点/終点 > 大きな曲がり角 > 観光名所 > 直線補助点の順で評価し、上限超過時に低優先度から削除する。

---

## 13. 候補ルートの比較・選別

### 13.1 候補数
- 初期実装では最大3件返却

### 13.2 評価指標
- 総合スコア
- 目標距離との差分
- 景観スコア
- 信号回避スコア
- 大通り回避スコア
- 重複率

### 13.3 総合スコア例
```
totalScore =
    routePreferenceScore
  - distanceGapPenalty
  - overlapPenalty
```

### 13.4 類似ルート除外
- ポリラインや共有エッジ率により類似度を算出し、一定以上似ている候補は除外

---

## 14. 擬似コード

### 14.1 ルート生成処理
```pseudo
function generateRoute(request):
    validate(request)

    radius = calculateSearchRadius(request.distanceMeters)
    osmData = fetchMapData(request.start, radius)

    graph = buildGraph(osmData)
    enrichGraphScores(graph, request.preferences)

    if request.preferences.loopRoute:
        candidates = generateLoopRoutes(graph, request)
    else:
        candidates = generateOneWayRoutes(graph, request)

    ranked = rankRoutes(candidates, request)
    uniqueRoutes = removeSimilarRoutes(ranked)

    return top(uniqueRoutes, request.options.candidateCount)
```

### 14.2 エッジコスト計算
```pseudo
function calculateEdgeCost(edge, preferences):
    cost = edge.distance

    if preferences.avoidTrafficLights:
        cost += edge.trafficPenalty * 2.0
    else:
        cost += edge.trafficPenalty * 1.0

    if preferences.avoidMainRoads:
        cost += edge.mainRoadPenalty * 2.0
    else:
        cost += edge.mainRoadPenalty * 1.0

    if preferences.scenery:
        cost -= edge.sceneryScore * 1.5
    else:
        cost -= edge.sceneryScore * 0.8

    if preferences.includeSightseeing:
        cost -= edge.sightseeingBonus * 1.5
    else:
        cost -= edge.sightseeingBonus * 0.5

    return max(cost, minimumCostThreshold)
```

---

## 15. 性能設計

### 15.1 想定課題
- Overpass API レスポンス遅延
- 探索範囲拡大時のノード増大
- 候補複数生成による計算量増加

### 15.2 対策
- 取得範囲の上限設定
- キャッシュ導入
- グラフ簡略化
- 景観 / POI スコア事前計算
- 候補点数制限
- 周回ルート等の重い探索は Web Worker などで並列化し、ブラウザUIスレッドのフリーズを防ぐ

---

## 16. 例外処理

| ケース | 処理 |
|---|---|
| 地図データ0件 | ルートなしを返却 |
| 歩行可能道路なし | 条件緩和メッセージを返却 |
| 候補ルート不足 | 取得できた範囲のみ返却 |
| APIタイムアウト | エラーコード返却 |
| 重みが偏りすぎる | デフォルト値へ補正 |

---

## 17. テスト観点

### 17.1 正常系
- 現在地からルート生成できる
- 景観重視で公園付近を通る
- 信号回避で信号交差点が少ない
- 周回指定で開始地点へ戻る

### 17.2 異常系
- 入力座標不正
- Overpass API 利用不可
- 地図データなし
- ルート候補なし

### 17.3 品質観点
- 目標距離との乖離が大きすぎないか
- 類似候補ばかり返していないか
- 幹線道路回避が反映されているか
- 体感上「散歩したくなる」ルートか

---

## 18. 今後の拡張
- 時間帯による混雑推定
- 天候考慮
- 夜道回避
- 坂道回避
- バリアフリー経路考慮
- 利用履歴からの推薦

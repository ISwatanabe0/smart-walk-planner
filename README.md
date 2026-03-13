# smart-walk-planner
# SmartWalk 🚶‍♂️
現在地から「景観が良い」「信号が少ない」などの好みに合わせた散歩ルートを生成するWebアプリ。

## 特徴
- **無料API完結**: Google Maps APIを使わず、OpenStreetMap(Overpass API)でコストを抑えた開発。
- **こだわり検索**: 大通り回避、信号回避、観光名所経由のカスタマイズ。
- **Google Maps連携**: 作成したルートをスマホのGoogleマップへ同期。

## 技術スタック
- **Frontend**: Next.js / TypeScript
- **Map**: Leaflet / OpenStreetMap
- **Algorithm**: A* (A-star) search with custom weighting

## ドキュメント
詳細は `/docs` フォルダ内の設計書を参照してください。

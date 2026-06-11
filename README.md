# smart-walk-planner
# SmartWalk 🚶‍♂️
現在地から「景観が良い」「信号が少ない」などの好みに合わせた散歩ルートを生成するWebアプリ。

## 特徴
- **無料API完結**: Google Maps APIを使わず、OpenStreetMap(Overpass API)でコストを抑えた開発。
- **こだわり検索**: 大通り回避、信号回避、観光名所経由のカスタマイズ。
- **周回／片道ルート**: 出発地点に戻る周回、またはゴール地点を指定する片道を選択。地図タップで地点を設定。
- **サイト内GPSトラッキング**: Google Mapsに遷移せず、ブラウザの Geolocation API で散歩中の現在地・軌跡・歩行距離・経過時間を地図上に記録（トラッキング中は Wake Lock で画面消灯を抑止）。
- **Google Maps連携**: 作成したルートをスマホのGoogleマップへ同期。

## スマホアプリ化に向けて
現在はWebアプリですが、トラッキングのロジック（`features/walk-tracking/`）はそのままネイティブアプリへ流用できる構成です。
モバイルWebでは画面ロック中のバックグラウンド位置取得ができないため、将来的には Capacitor で本Webアプリをラップし、
バックグラウンド位置取得プラグインを追加することで「画面を消したままの記録」に対応する想定です。

## 技術スタック
- **Frontend**: Next.js / TypeScript
- **Map**: Leaflet / OpenStreetMap
- **Algorithm**: A* (A-star) search with custom weighting

## ドキュメント
詳細は `/docs` フォルダ内の設計書を参照してください。

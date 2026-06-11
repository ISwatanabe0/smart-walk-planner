import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SmartWalk - 散歩ルートプランナー",
    short_name: "SmartWalk",
    description:
      "現在地から距離を指定して周回・片道の散歩ルートを作成し、GPSで歩行を記録できるアプリ",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "ja",
    background_color: "#f8f9fa",
    theme_color: "#1a7f5a",
    categories: ["health", "navigation", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

"use client";

import { useState } from "react";
import type { Coordinate } from "@/types/map";

type UseCurrentLocationReturn = {
  coordinate: Coordinate | null;
  isLocating: boolean;
  error: string | null;
  getCurrentLocation: () => void;
};

export function useCurrentLocation(): UseCurrentLocationReturn {
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("このブラウザでは現在地の取得ができません");
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinate({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        setError("現在地の取得に失敗しました");
        setIsLocating(false);
      }
    );
  };

  return { coordinate, isLocating, error, getCurrentLocation };
}

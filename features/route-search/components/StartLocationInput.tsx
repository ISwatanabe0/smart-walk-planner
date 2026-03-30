"use client";

import { useState, useEffect } from "react";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import type { Coordinate } from "@/types/map";

type StartLocationInputProps = {
  coordinate: Coordinate | null;
  onCoordinateChange: (coordinate: Coordinate | null) => void;
};

export function StartLocationInput({
  coordinate,
  onCoordinateChange,
}: StartLocationInputProps) {
  const [latInput, setLatInput] = useState(
    coordinate !== null ? String(coordinate.lat) : ""
  );
  const [lngInput, setLngInput] = useState(
    coordinate !== null ? String(coordinate.lng) : ""
  );

  const {
    coordinate: gpsCoordinate,
    isLocating: gpsIsLocating,
    error: gpsError,
    getCurrentLocation,
  } = useCurrentLocation();

  useEffect(() => {
    if (gpsCoordinate !== null) {
      setLatInput(String(gpsCoordinate.lat));
      setLngInput(String(gpsCoordinate.lng));
      onCoordinateChange(gpsCoordinate);
    }
  }, [gpsCoordinate, onCoordinateChange]);

  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setLatInput(rawValue);
    const lat = parseFloat(rawValue);
    const lng = parseFloat(lngInput);
    if (isNaN(lat) || isNaN(lng)) {
      onCoordinateChange(null);
      return;
    }
    onCoordinateChange({ lat, lng });
  };

  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setLngInput(rawValue);
    const lat = parseFloat(latInput);
    const lng = parseFloat(rawValue);
    if (isNaN(lat) || isNaN(lng)) {
      onCoordinateChange(null);
      return;
    }
    onCoordinateChange({ lat, lng });
  };

  return (
    <div>
      <label htmlFor="lat">緯度</label>
      <input
        id="lat"
        type="number"
        step="0.0001"
        value={latInput}
        onChange={handleLatChange}
      />
      <label htmlFor="lng">経度</label>
      <input
        id="lng"
        type="number"
        step="0.0001"
        value={lngInput}
        onChange={handleLngChange}
      />
      <button type="button" onClick={getCurrentLocation} disabled={gpsIsLocating}>
        現在地を取得
      </button>
      {gpsError !== null && <p>{gpsError}</p>}
    </div>
  );
}

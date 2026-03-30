export type Coordinate = {
  lat: number;
  lng: number;
};

export type BoundingBox = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type MapMarkerType = "start" | "end" | "waypoint" | "poi";

export type MapMarkerData = {
  id: string;
  position: Coordinate;
  label?: string;
  type: MapMarkerType;
};

export type RouteGeometry = {
  type: "LineString";
  coordinates: Coordinate[];
};

export type MapViewport = {
  center: Coordinate;
  zoom: number;
};

import type { WalkRoute } from "@/types/route";

export function buildGoogleMapsUrl(route: WalkRoute | null): string | null {
  if (route === null) {
    return null;
  }

  const origin = `${route.start.lat},${route.start.lng}`;
  const destination = `${route.end.lat},${route.end.lng}`;

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "walking",
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

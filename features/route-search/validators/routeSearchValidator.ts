import type { RouteSearchCondition, ValidationError } from "@/types/preferences";

export function validateRouteSearchCondition(
  condition: RouteSearchCondition
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (condition.start === null) {
    errors.push({ field: "start", message: "出発地点を設定してください" });
  }

  if (condition.routeType === "oneway") {
    if (condition.end === null) {
      errors.push({ field: "end", message: "ゴール地点を設定してください" });
    } else if (
      condition.start !== null &&
      condition.start.lat === condition.end.lat &&
      condition.start.lng === condition.end.lng
    ) {
      errors.push({
        field: "end",
        message: "出発地点とゴール地点が同じです。別の地点を選択してください",
      });
    }
  }

  if (condition.distanceMeters < 1) {
    errors.push({
      field: "distanceMeters",
      message: "距離は1m以上を指定してください",
    });
  }

  return errors;
}

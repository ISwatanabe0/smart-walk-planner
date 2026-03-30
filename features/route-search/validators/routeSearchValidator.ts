import type { RouteSearchCondition, ValidationError } from "@/types/preferences";

export function validateRouteSearchCondition(
  condition: RouteSearchCondition
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (condition.start === null) {
    errors.push({ field: "start", message: "出発地点を入力してください" });
  }

  if (condition.distanceMeters < 1) {
    errors.push({
      field: "distanceMeters",
      message: "距離は1m以上を指定してください",
    });
  }

  return errors;
}

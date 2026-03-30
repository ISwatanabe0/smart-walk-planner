"use client";

import { useState } from "react";
import { DEFAULT_DISTANCE_METERS } from "@/constants/defaultValues";
import { validateRouteSearchCondition } from "@/features/route-search/validators/routeSearchValidator";
import { searchRoutes } from "@/features/route-search/services/routeSearchService";
import type { RouteSearchCondition, ValidationError } from "@/types/preferences";
import type { WalkRoute } from "@/types/route";

type UseRouteSearchReturn = {
  condition: RouteSearchCondition;
  isLoading: boolean;
  errors: ValidationError[];
  updateCondition: (partial: Partial<RouteSearchCondition>) => void;
  submitSearch: () => Promise<WalkRoute[]>;
};

const initialCondition: RouteSearchCondition = {
  start: null,
  distanceMeters: DEFAULT_DISTANCE_METERS,
  durationMinutes: null,
  preferences: {
    scenery: false,
    avoidTrafficLights: false,
    avoidMainRoads: false,
    includeSightseeing: false,
    loopRoute: false,
  },
};

export function useRouteSearch(): UseRouteSearchReturn {
  const [condition, setCondition] = useState<RouteSearchCondition>(initialCondition);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const updateCondition = (partial: Partial<RouteSearchCondition>) => {
    setCondition((prev) => ({ ...prev, ...partial }));
  };

  const submitSearch = async (): Promise<WalkRoute[]> => {
    const validationErrors = validateRouteSearchCondition(condition);
    setErrors(validationErrors);
    if (validationErrors.length > 0) {
      return [];
    }
    setIsLoading(true);
    try {
      return await searchRoutes(condition);
    } finally {
      setIsLoading(false);
    }
  };

  return { condition, isLoading, errors, updateCondition, submitSearch };
}

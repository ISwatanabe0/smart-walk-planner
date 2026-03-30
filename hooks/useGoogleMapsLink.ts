"use client";

import { useState } from "react";
import type { WalkRoute } from "@/types/route";
import { buildGoogleMapsUrl } from "@/features/walk-planner/services/googleMapsLinkBuilder";

type UseGoogleMapsLinkReturn = {
  googleMapsUrl: string | null;
  isConfirmDialogOpen: boolean;
  openConfirmDialog: () => void;
  closeConfirmDialog: () => void;
  confirmAndNavigate: () => void;
};

export function useGoogleMapsLink(
  route: WalkRoute | null
): UseGoogleMapsLinkReturn {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const googleMapsUrl = buildGoogleMapsUrl(route);

  const openConfirmDialog = () => {
    if (googleMapsUrl === null) {
      return;
    }
    setIsConfirmDialogOpen(true);
  };

  const closeConfirmDialog = () => {
    setIsConfirmDialogOpen(false);
  };

  const confirmAndNavigate = () => {
    if (googleMapsUrl === null) {
      return;
    }
    setIsConfirmDialogOpen(false);
    window.open(googleMapsUrl, "_blank");
  };

  return {
    googleMapsUrl,
    isConfirmDialogOpen,
    openConfirmDialog,
    closeConfirmDialog,
    confirmAndNavigate,
  };
}

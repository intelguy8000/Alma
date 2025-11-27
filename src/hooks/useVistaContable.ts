"use client";

import { useState, useEffect, useCallback } from "react";
import { SETTINGS_KEYS } from "@/types/settings";

export function useVistaContable() {
  const [isVistaContable, setIsVistaContable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVistaContableSetting = useCallback(async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        // Keep using the same internal key for backwards compatibility
        const vistaContableValue = data.settings?.[SETTINGS_KEYS.REAL_MODE];
        setIsVistaContable(vistaContableValue === "true");
      }
    } catch (error) {
      console.error("Error fetching vista contable setting:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVistaContableSetting();
  }, [fetchVistaContableSetting]);

  return { isVistaContable, isLoading, refetch: fetchVistaContableSetting };
}

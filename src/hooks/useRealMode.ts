"use client";

import { useState, useEffect, useCallback } from "react";
import { SETTINGS_KEYS } from "@/types/settings";

export function useRealMode() {
  const [isRealMode, setIsRealMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRealModeSetting = useCallback(async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        const realModeValue = data.settings?.[SETTINGS_KEYS.REAL_MODE];
        setIsRealMode(realModeValue === "true");
      }
    } catch (error) {
      console.error("Error fetching real mode setting:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRealModeSetting();
  }, [fetchRealModeSetting]);

  return { isRealMode, isLoading, refetch: fetchRealModeSetting };
}

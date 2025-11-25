"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { SETTINGS_KEYS } from "@/types/settings";

interface InactivityTimeoutProps {
  timeoutMinutes?: number;
}

export function InactivityTimeout({ timeoutMinutes }: InactivityTimeoutProps) {
  const [settingsTimeout, setSettingsTimeout] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  // Fetch timeout from settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          const timeout = data.settings?.[SETTINGS_KEYS.SESSION_TIMEOUT];
          if (timeout && timeout !== "never") {
            setSettingsTimeout(parseInt(timeout, 10));
          } else {
            setSettingsTimeout(null);
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const effectiveTimeout = timeoutMinutes ?? settingsTimeout;

  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    setShowWarning(false);

    // Don't set timer if no timeout configured
    if (!effectiveTimeout) return;

    const timeoutMs = effectiveTimeout * 60 * 1000;
    const warningMs = timeoutMs - 60000; // 1 minute warning

    // Show warning 1 minute before logout
    if (warningMs > 0) {
      warningRef.current = setTimeout(() => {
        setShowWarning(true);
      }, warningMs);
    }

    // Logout after timeout
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutMs);
  }, [effectiveTimeout, handleLogout]);

  useEffect(() => {
    if (!effectiveTimeout) return;

    // Events that reset the timer
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];

    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Initial timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [effectiveTimeout, resetTimer]);

  const handleStayLoggedIn = () => {
    setShowWarning(false);
    resetTimer();
  };

  if (!effectiveTimeout || !showWarning) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4">
        <h3 className="text-lg font-semibold text-[#2D3D35] mb-2">
          Sesión por expirar
        </h3>
        <p className="text-[#5C7A6B] mb-4">
          Tu sesión se cerrará en 1 minuto por inactividad.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-2 border border-[#CCE3DE] rounded-lg text-[#5C7A6B] hover:bg-gray-50 transition-colors"
          >
            Cerrar sesión
          </button>
          <button
            onClick={handleStayLoggedIn}
            className="flex-1 px-4 py-2 bg-[#6B9080] text-white rounded-lg hover:bg-[#5A7A6B] transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

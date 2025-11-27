"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

// Color palette - same as GeneralSettings
export const colorPalette = [
  { value: "#6B9080", name: "Verde Sage" },
  { value: "#84A98C", name: "Verde Menta" },
  { value: "#A7C4BC", name: "Verde Agua" },
  { value: "#8FBCBB", name: "Turquesa" },
  { value: "#B48EAD", name: "Lavanda" },
  { value: "#D4A5A5", name: "Rosa Dusty" },
  { value: "#E8C07D", name: "Durazno" },
  { value: "#94B49F", name: "Verde Oliva" },
];

// Helper to generate color variants from a base color
function generateColorVariants(baseColor: string) {
  // Convert hex to RGB
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);

  // Generate lighter version (for hover states)
  const lighter = `rgb(${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 20)})`;

  // Generate darker version (for active states)
  const darker = `rgb(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)})`;

  return { lighter, darker };
}

interface ThemeColorContextType {
  primaryColor: string;
  setPrimaryColor: (color: string) => Promise<void>;
  isLoading: boolean;
}

const ThemeColorContext = createContext<ThemeColorContextType | undefined>(undefined);

export function ThemeColorProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [primaryColor, setPrimaryColorState] = useState("#6B9080");
  const [isLoading, setIsLoading] = useState(true);

  // Apply color to CSS variables
  const applyColor = useCallback((color: string) => {
    const root = document.documentElement;
    const variants = generateColorVariants(color);

    // Main primary color
    root.style.setProperty("--primary", color);
    root.style.setProperty("--ring", color);
    root.style.setProperty("--chart-1", color);

    // Sidebar colors
    root.style.setProperty("--sidebar", color);
    root.style.setProperty("--sidebar-bg", color);
    root.style.setProperty("--sidebar-primary-foreground", color);

    // FullCalendar colors
    root.style.setProperty("--fc-button-bg-color", color);
    root.style.setProperty("--fc-button-border-color", color);
    root.style.setProperty("--fc-button-hover-bg-color", variants.darker);
    root.style.setProperty("--fc-button-hover-border-color", variants.darker);
    root.style.setProperty("--fc-now-indicator-color", color);
  }, []);

  // Fetch user preference on mount
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.user) {
      const fetchPreference = async () => {
        try {
          const response = await fetch("/api/users/preferences");
          if (response.ok) {
            const data = await response.json();
            const color = data.preferredColor || "#6B9080";
            setPrimaryColorState(color);
            applyColor(color);
          }
        } catch (error) {
          console.error("Error fetching color preference:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPreference();
    } else {
      setIsLoading(false);
    }
  }, [session, status, applyColor]);

  // Function to update color (saves to DB and applies immediately)
  const setPrimaryColor = useCallback(async (color: string) => {
    // Apply immediately for instant feedback
    setPrimaryColorState(color);
    applyColor(color);

    // Save to database
    try {
      const response = await fetch("/api/users/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredColor: color }),
      });

      if (!response.ok) {
        console.error("Error saving color preference");
      }
    } catch (error) {
      console.error("Error saving color preference:", error);
    }
  }, [applyColor]);

  return (
    <ThemeColorContext.Provider value={{ primaryColor, setPrimaryColor, isLoading }}>
      {children}
    </ThemeColorContext.Provider>
  );
}

export function useThemeColor() {
  const context = useContext(ThemeColorContext);
  if (!context) {
    throw new Error("useThemeColor must be used within a ThemeColorProvider");
  }
  return context;
}

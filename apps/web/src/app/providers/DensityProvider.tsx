import React, { createContext, useContext, useEffect } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage.js";

export type DensityMode = "comfortable" | "compact";

interface DensityContextType {
  density: DensityMode;
  setDensity: (mode: DensityMode) => void;
  toggleDensity: () => void;
}

const DensityContext = createContext<DensityContextType | undefined>(undefined);

export function DensityProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensity] = useLocalStorage<DensityMode>("campuscare-density", "comfortable");

  useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
  }, [density]);

  const toggleDensity = () => {
    setDensity((prev) => (prev === "comfortable" ? "compact" : "comfortable"));
  };

  return (
    <DensityContext.Provider value={{ density, setDensity, toggleDensity }}>
      {children}
    </DensityContext.Provider>
  );
}

export function useDensity(): DensityContextType {
  const context = useContext(DensityContext);
  if (!context) {
    throw new Error("useDensity must be used within a DensityProvider");
  }
  return context;
}

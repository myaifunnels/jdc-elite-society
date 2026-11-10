"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  defaultDesignSystem,
  designSystemStorageKey,
  DesignSystemSettings,
  getDesignSystemCssVariables,
} from "@/lib/design-system";

type DesignSystemContextValue = {
  settings: DesignSystemSettings;
  updateSetting: <K extends keyof DesignSystemSettings>(
    key: K,
    value: DesignSystemSettings[K],
  ) => void;
  resetSettings: () => void;
};

const DesignSystemContext = createContext<DesignSystemContextValue | null>(null);

export function DesignSystemProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<DesignSystemSettings>(() => {
    if (typeof window === "undefined") {
      return defaultDesignSystem;
    }

    const stored = window.localStorage.getItem(designSystemStorageKey);

    if (!stored) {
      return defaultDesignSystem;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<DesignSystemSettings>;
      return { ...defaultDesignSystem, ...parsed };
    } catch {
      window.localStorage.removeItem(designSystemStorageKey);
      return defaultDesignSystem;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    const variables = getDesignSystemCssVariables(settings);

    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    window.localStorage.setItem(designSystemStorageKey, JSON.stringify(settings));
  }, [settings]);

  const value = useMemo<DesignSystemContextValue>(
    () => ({
      settings,
      updateSetting: (key, value) =>
        setSettings((current) => ({ ...current, [key]: value })),
      resetSettings: () => setSettings(defaultDesignSystem),
    }),
    [settings],
  );

  return (
    <DesignSystemContext.Provider value={value}>
      {children}
    </DesignSystemContext.Provider>
  );
}

export function useDesignSystem() {
  const context = useContext(DesignSystemContext);

  if (!context) {
    throw new Error("useDesignSystem must be used within DesignSystemProvider");
  }

  return context;
}
